import os
import time
import warnings
from typing import List, Dict
import torch
from transformers import AutoTokenizer, AutoModelForSequenceClassification
from ..utils.config import (
    MODEL_PATH, DEVICE, TORCH_THREADS, LABEL_COLUMNS, 
    DEFAULT_BATCH_SIZE, MAX_SEQUENCE_LENGTH
)

warnings.filterwarnings("ignore")

class MLService:
    """머신러닝 모델 서비스"""
    
    def __init__(self):
        self.model = None
        self.tokenizer = None
        self.device = None
        self._is_loaded = False
        # 실제 추론에 사용할 라벨 순서 (config.json의 id2label 우선, 없으면 LABEL_COLUMNS 폴백)
        self.labels = list(LABEL_COLUMNS)

    def _resolve_model_dir(self, model_path: str) -> str:
        """상대경로를 절대경로로 정규화하고 존재/디렉터리 여부를 보장"""
        # 환경변수 MODEL_DIR가 있으면 우선
        env_path = os.getenv("MODEL_DIR")
        path = env_path or model_path or MODEL_PATH
        resolved = os.path.abspath(os.path.normpath(path))
        if not os.path.isdir(resolved):
            raise FileNotFoundError(f"MODEL_DIR not found: {resolved}")
        return resolved

    def _load_id2label(self, model_dir: str):
        """config.json에서 id2label을 읽어 self.labels를 세팅 (없으면 유지)"""
        cfg_path = os.path.join(model_dir, "config.json")
        try:
            with open(cfg_path, encoding="utf-8") as f:
                cfg = json.load(f)
            id2label = cfg.get("id2label")
            if isinstance(id2label, dict) and len(id2label) > 0:
                # 키가 "0","1",... 일 수 있으니 인덱스 순서대로 정렬
                self.labels = [id2label[str(i)] for i in range(len(id2label))]
        except Exception:
            # 없거나 깨져 있으면 폴백 라벨 유지
            pass
    
    def load_model(self, model_path: str = MODEL_PATH):
        """모델 로딩 및 디바이스/스레드/워밍업 설정"""
        try:
            model_dir = self._resolve_model_dir(model_path)
            print(f"[ml_service] 모델 로딩 중: {model_dir}")

            # 로컬 파일만 사용해서 HF Hub 검증/다운로드 시도 차단
            self.tokenizer = AutoTokenizer.from_pretrained(
                model_dir, use_fast=True, local_files_only=True
            )
            self.model = AutoModelForSequenceClassification.from_pretrained(
                model_dir, local_files_only=True
            )

            # 라벨 동기화
            self._load_id2label(model_dir)
            print(f"[ml_service] labels: {self.labels}")

            # 디바이스 설정
            self.device = torch.device(DEVICE)  # "cuda" or "cpu" 가 config에 들어있다고 가정
            self.model.to(self.device)
            self.model.eval()

            # CPU 스레드 최적화
            try:
                torch.set_num_threads(int(TORCH_THREADS))
            except Exception:
                pass

            # 워밍업 추론 (첫 요청 지연 방지)
            with torch.inference_mode():
                dummy_inputs = self.tokenizer(
                    "warmup", truncation=True, max_length=16, return_tensors="pt"
                )
                dummy_inputs = {k: v.to(self.device) for k, v in dummy_inputs.items()}
                _ = self.model(**dummy_inputs)

            self._is_loaded = True
            print(f"[ml_service] 모델 로딩 완료 ({self.device})")

        except Exception as e:
            import traceback
            print(f"[ml_service] 모델 로딩 실패: {e}")
            traceback.print_exc()
            self._is_loaded = False
            self.device = None
            # 예외를 다시 던지지 않고 상태만 false로 두면 /health에서 503을 주도록 할 수도 있음
            # 필요하면 raise e
    
    def is_loaded(self) -> bool:
        """모델 로딩 상태 확인"""
        return self._is_loaded and self.model is not None and self.tokenizer is not None
    
    def predict_batch(self, texts: List[str], batch_size: int = DEFAULT_BATCH_SIZE, 
                        threshold: float = 0.5) -> List[Dict]:
        """효율적인 배치 예측"""
        
        if not self.is_loaded():
            raise RuntimeError("Model not loaded")
        
        if not texts:
            return []
        
        results = []
        
        for i in range(0, len(texts), batch_size):
            batch_texts = texts[i:i+batch_size]
            
            # 배치 토크나이징
            inputs = self.tokenizer(
                batch_texts,
                truncation=True,
                padding=True,
                max_length=MAX_SEQUENCE_LENGTH,
                return_tensors='pt'
            )
            
            inputs = {k: v.to(self.device) for k, v in inputs.items()}
            
            # 예측
            with torch.no_grad():
                outputs = self.model(**inputs)
                probs = torch.sigmoid(outputs.logits)
                predictions = (probs > threshold).cpu().numpy()
                probs_numpy = probs.cpu().numpy()
            
            # 배치 결과 처리
            for j, text in enumerate(batch_texts):
                pred_labels = [LABEL_COLUMNS[k] for k in range(len(LABEL_COLUMNS)) 
                                if predictions[j][k]]
                confidence = {LABEL_COLUMNS[k]: float(probs_numpy[j][k]) 
                                for k in range(len(LABEL_COLUMNS))}
                
                results.append({
                    'text': text,
                    'predicted_labels': pred_labels,
                    'confidence': confidence
                })
        
        return results
    
    def predict_single(self, text: str, threshold: float = 0.5) -> Dict:
        """단일 텍스트 예측"""
        results = self.predict_batch([text], batch_size=1, threshold=threshold)
        return results[0] if results else {}
    
    def get_device_info(self) -> Dict:
        """디바이스 정보 반환"""
        return {
            "device": str(self.device) if self.device else "not_loaded",
            "is_loaded": self.is_loaded(),
            "available_labels": LABEL_COLUMNS
        }

# 전역 서비스 인스턴스
ml_service = MLService()