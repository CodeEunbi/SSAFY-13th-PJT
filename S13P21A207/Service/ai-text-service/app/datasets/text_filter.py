"""
다중 라벨 텍스트 분류 모델 훈련 및 추론
Author: AI Text Classification System
Python 3.8+ required
"""

import os
import time
import warnings

# 환경 설정
os.environ['CUDA_VISIBLE_DEVICES'] = ''  # CPU 사용
os.environ['USE_TF'] = 'NO'
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'
os.environ["TOKENIZERS_PARALLELISM"] = "false"
warnings.filterwarnings("ignore")

import torch
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.metrics import (classification_report, multilabel_confusion_matrix, 
                            f1_score, accuracy_score, hamming_loss)
from transformers import (AutoTokenizer, AutoModelForSequenceClassification, 
                         TrainingArguments, Trainer)
from torch.utils.data import Dataset
import torch.nn as nn

class MultiLabelTextDataset(Dataset):
    """다중 라벨 텍스트 분류용 데이터셋"""
    
    def __init__(self, texts, labels, tokenizer, max_length=128):
        self.texts = texts
        self.labels = labels
        self.tokenizer = tokenizer
        self.max_length = max_length
    
    def __len__(self):
        return len(self.texts)
    
    def __getitem__(self, idx):
        text = str(self.texts[idx])
        labels = self.labels[idx]
        
        encoding = self.tokenizer(
            text,
            truncation=True,
            padding='max_length',
            max_length=self.max_length,
            return_tensors='pt'
        )
        
        return {
            'input_ids': encoding['input_ids'].flatten(),
            'attention_mask': encoding['attention_mask'].flatten(),
            'labels': torch.tensor(labels, dtype=torch.float)
        }

class MultiLabelTrainer(Trainer):
    """다중 라벨 분류용 커스텀 트레이너"""
    
    def compute_loss(self, model, inputs, return_outputs=False, **kwargs):
        labels = inputs.get("labels")
        outputs = model(**inputs)
        logits = outputs.get("logits")
        
        loss_fct = nn.BCEWithLogitsLoss()
        loss = loss_fct(logits, labels)
        
        return (loss, outputs) if return_outputs else loss

def compute_metrics(eval_pred):
    """평가 지표 계산"""
    predictions, labels = eval_pred
    
    sigmoid = torch.nn.Sigmoid()
    probs = sigmoid(torch.Tensor(predictions))
    y_pred = (probs > 0.5).float().numpy()
    y_true = labels
    
    subset_accuracy = accuracy_score(y_true, y_pred)
    hamming = hamming_loss(y_true, y_pred)
    f1_micro = f1_score(y_true, y_pred, average='micro')
    f1_macro = f1_score(y_true, y_pred, average='macro')
    
    return {
        'subset_accuracy': subset_accuracy,
        'hamming_loss': hamming,
        'f1_micro': f1_micro,
        'f1_macro': f1_macro
    }

def predict_multi_label(text, model, tokenizer, device, label_columns, threshold=0.5):
    """단일 텍스트 다중 라벨 예측"""
    
    inputs = tokenizer(
        text,
        truncation=True,
        padding=True,
        max_length=128,
        return_tensors='pt'
    )
    
    inputs = {k: v.to(device) for k, v in inputs.items()}
    
    model.eval()
    with torch.no_grad():
        outputs = model(**inputs)
        logits = outputs.logits
        
        probs = torch.sigmoid(logits)
        predictions = (probs > threshold).int()
        
        results = {}
        for i, label in enumerate(label_columns):
            results[label] = {
                'predicted': bool(predictions[0][i]),
                'probability': float(probs[0][i])
            }
    
    return {
        'text': text,
        'predictions': results,
        'predicted_labels': [label for label, info in results.items() if info['predicted']]
    }

def batch_predict_multi_label(texts, model, tokenizer, device, label_columns, threshold=0.5):
    """배치 멀티라벨 예측 (상세 로그 포함)"""
    
    results = []
    print(f"총 {len(texts)}개 텍스트 예측 시작...")
    print("=" * 80)
    
    for i, text in enumerate(texts):
        result = predict_multi_label(text, model, tokenizer, device, label_columns, threshold)
        results.append(result)
        
        print(f"[{i+1:2d}] {text[:50]}{'...' if len(text) > 50 else ''}")
        pred_labels = result['predicted_labels']
        if pred_labels:
            print(f"     예측: {', '.join(pred_labels)}")
            for label in pred_labels:
                prob = result['predictions'][label]['probability']
                print(f"       - {label}: {prob:.3f}")
        else:
            print(f"     예측: CLEAN (모든 라벨 해당 없음)")
        
        # 모든 라벨의 확률 표시 (낮은 것도)
        print(f"     전체 확률:")
        for label in label_columns:
            prob = result['predictions'][label]['probability']
            status = "✓" if result['predictions'][label]['predicted'] else " "
            print(f"       {status} {label}: {prob:.3f}")
        print("-" * 80)
    
    return results

def load_and_prepare_data(csv_path, label_columns):
    """데이터 로딩 및 전처리"""
    
    print(f"데이터 로딩: {csv_path}")
    try:
        df = pd.read_csv(csv_path)
        print(f"✅ 데이터 로드 완료: {len(df):,}개 샘플")
    except FileNotFoundError:
        print(f"❌ 파일을 찾을 수 없습니다: {csv_path}")
        return None, None, None, None
    
    # 라벨 분포 확인
    print("\n📊 라벨별 분포:")
    for col in label_columns:
        positive_count = df[col].sum()
        percentage = positive_count / len(df) * 100
        print(f"{col}: {positive_count}개 ({percentage:.1f}%)")
    
    # 데이터 분할
    y_labels = df[label_columns].values
    X_train, X_test, y_train, y_test = train_test_split(
        df['text'].values, y_labels, test_size=0.2, random_state=42
    )
    
    print(f"\n훈련 데이터: {len(X_train):,}개")
    print(f"테스트 데이터: {len(X_test):,}개")
    
    return X_train, X_test, y_train, y_test

def train_model(X_train, X_test, y_train, y_test, model_name="klue/bert-base", 
                label_columns=None, output_dir='./final_multilabel_model'):
    """모델 훈련"""
    
    print(f"\n모델 훈련 시작: {model_name}")
    
    # 토크나이저 로딩
    tokenizer = AutoTokenizer.from_pretrained(model_name)
    print("✅ 토크나이저 로딩 완료")
    
    # 모델 로딩
    model = AutoModelForSequenceClassification.from_pretrained(
        model_name,
        num_labels=len(label_columns),
        problem_type="multi_label_classification"
    )
    
    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    model = model.to(device)
    print(f"✅ 모델 로딩 완료 ({device})")
    
    # 데이터셋 생성
    train_dataset = MultiLabelTextDataset(X_train, y_train, tokenizer)
    test_dataset = MultiLabelTextDataset(X_test, y_test, tokenizer)
    
    # 훈련 설정
    training_args = TrainingArguments(
        output_dir='./results',
        num_train_epochs=2,
        per_device_train_batch_size=4,
        per_device_eval_batch_size=8,
        gradient_accumulation_steps=2,
        warmup_steps=200,
        weight_decay=0.01,
        logging_steps=50,
        eval_strategy="steps",
        eval_steps=200,
        save_strategy="steps",
        save_steps=200,
        load_best_model_at_end=True,
        metric_for_best_model="f1_macro",
        greater_is_better=True,
        save_total_limit=2,
        dataloader_pin_memory=False,
        fp16=torch.cuda.is_available(),
        report_to=None,
    )
    
    # 트레이너 초기화
    trainer = MultiLabelTrainer(
        model=model,
        args=training_args,
        train_dataset=train_dataset,
        eval_dataset=test_dataset,
        compute_metrics=compute_metrics,
    )
    
    # 훈련 실행
    print("🚀 훈련 시작...")
    start_time = time.time()
    
    trainer.train()
    
    training_time = time.time() - start_time
    print(f"✅ 훈련 완료! ({training_time//60:.0f}분 {training_time%60:.0f}초)")
    
    # 모델 저장
    trainer.save_model(output_dir)
    tokenizer.save_pretrained(output_dir)
    print(f"💾 모델 저장: {output_dir}")
    
    return trainer, model, tokenizer, device

def evaluate_model(trainer, y_test, label_columns):
    """모델 평가"""
    
    print("\n📊 모델 평가 중...")
    
    # 예측
    predictions = trainer.predict(trainer.eval_dataset)
    sigmoid = torch.nn.Sigmoid()
    probs = sigmoid(torch.Tensor(predictions.predictions))
    y_pred = (probs > 0.5).numpy().astype(int)
    y_true = y_test.astype(int)
    
    # 전체 성능
    subset_accuracy = accuracy_score(y_true, y_pred)
    hamming = hamming_loss(y_true, y_pred)
    f1_micro = f1_score(y_true, y_pred, average='micro')
    f1_macro = f1_score(y_true, y_pred, average='macro')
    
    print(f"\n📈 전체 성능:")
    print(f"Subset Accuracy: {subset_accuracy:.4f} ({subset_accuracy*100:.2f}%)")
    print(f"Hamming Loss: {hamming:.4f}")
    print(f"F1 Micro: {f1_micro:.4f}")
    print(f"F1 Macro: {f1_macro:.4f}")
    
    # 라벨별 성능
    print(f"\n🏷️ 라벨별 성능:")
    for i, label in enumerate(label_columns):
        label_f1 = f1_score(y_true[:, i], y_pred[:, i])
        label_accuracy = accuracy_score(y_true[:, i], y_pred[:, i])
        
        true_pos = np.sum((y_true[:, i] == 1) & (y_pred[:, i] == 1))
        false_pos = np.sum((y_true[:, i] == 0) & (y_pred[:, i] == 1))
        false_neg = np.sum((y_true[:, i] == 1) & (y_pred[:, i] == 0))
        
        precision = true_pos / (true_pos + false_pos) if (true_pos + false_pos) > 0 else 0
        recall = true_pos / (true_pos + false_neg) if (true_pos + false_neg) > 0 else 0
        
        print(f"{label:6s}: F1={label_f1:.3f}, Acc={label_accuracy:.3f}, P={precision:.3f}, R={recall:.3f}")
    
    return y_pred, probs

def test_predictions(model, tokenizer, device, label_columns):
    """예측 테스트"""
    
    # 기본 테스트 텍스트들
    test_texts = [
        "이곳에 테스트 할 텍스트를",
        "배열의 형식으로",
        "넣어주세요"
    ]
    
    print("\n🔍 예측 테스트:")
    print("=" * 80)
    
    # batch_predict_multi_label 사용
    start_time = time.time() * 1000
    results = batch_predict_multi_label(test_texts, model, tokenizer, device, label_columns)
    end_time = time.time() * 1000 - start_time
    
    print(f"✅ 배치 예측 완료! 총 소요 시간: {end_time:.2f}ms")
    print(f"평균 예측 시간: {end_time/len(test_texts):.2f}ms/텍스트")
    
    return results

def main(csv_path='../dataset/merged_multilabel_data.csv', model_name="klue/bert-base"):
    """메인 실행 함수"""
    
    print("=" * 70)
    print("🤖 다중 라벨 텍스트 분류 모델 훈련")
    print("=" * 70)
    
    # 라벨 정의
    label_columns = ['IN', 'VI', 'SE', 'AD', 'PO', 'CLEAN']
    
    # 1. 데이터 로딩
    X_train, X_test, y_train, y_test = load_and_prepare_data(csv_path, label_columns)
    if X_train is None:
        return
    
    # 2. 모델 훈련
    trainer, model, tokenizer, device = train_model(
        X_train, X_test, y_train, y_test, 
        model_name=model_name, 
        label_columns=label_columns
    )
    
    # 3. 모델 평가
    y_pred, probs = evaluate_model(trainer, y_test, label_columns)
    
    # 4. 예측 테스트
    test_predictions(model, tokenizer, device, label_columns)
    
    print("\n🎉 모든 작업 완료!")
    print("모델이 './final_multilabel_model'에 저장되었습니다.")
    
    return trainer, model, tokenizer, device, label_columns

def quick_predict(text, model_path='./final_multilabel_model'):
    """저장된 모델로 빠른 예측"""
    
    label_columns = ['IN', 'VI', 'SE', 'AD', 'PO', 'CLEAN']
    
    tokenizer = AutoTokenizer.from_pretrained(model_path)
    model = AutoModelForSequenceClassification.from_pretrained(model_path)
    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    model.to(device)
    
    result = predict_multi_label(text, model, tokenizer, device, label_columns)
    return result

if __name__ == "__main__":
    # 기본 실행
    trainer, model, tokenizer, device, label_columns = main()
    
    # 사용 예시
    # result = quick_predict("이 바보야")
    # print(result)