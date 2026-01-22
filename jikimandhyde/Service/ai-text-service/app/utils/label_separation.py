# =============================================================================
# 다중 라벨 데이터 조합별 분리 스크립트 (단일/다중 라벨 혼합 처리)
# =============================================================================

import pandas as pd
import numpy as np
import os

def load_and_classify_data(csv_file_path):
    """CSV 파일을 로드하고 단일/다중 라벨 데이터를 분류"""
    
    try:
        df = pd.read_csv(csv_file_path, encoding='utf-8-sig')
        print(f"데이터 로드 완료: {len(df)}개 샘플")
    except Exception as e:
        print(f"파일 로드 실패: {e}")
        return None
    
    # 라벨 컬럼 정의
    label_columns = ['CLEAN', 'IN', 'SE', 'AD', 'VI', 'PO']
    
    # 컬럼 확인
    missing_cols = [col for col in label_columns if col not in df.columns]
    if missing_cols:
        print(f"누락된 라벨 컬럼: {missing_cols}")
        return None
    
    print(f"컬럼 확인 완료: {df.columns.tolist()}")
    
    # 데이터 샘플 확인
    print(f"\n데이터 샘플 5개:")
    for i in range(min(5, len(df))):
        row = df.iloc[i]
        label_values = [f"{col}:{row[col]}" for col in label_columns]
        print(f"Row {i}: {' '.join(label_values)}")
    
    # 각 라벨 컬럼의 고유값 확인
    print(f"\n라벨 컬럼별 고유값:")
    for col in label_columns:
        unique_vals = df[col].dropna().unique()  # NaN 제거
        try:
            sorted_vals = sorted(unique_vals)
        except:
            sorted_vals = list(unique_vals)
        print(f"{col}: {sorted_vals} (타입: {df[col].dtype})")
    
    # 다중 라벨과 단일 라벨 데이터 분리
    multilabel_indices = []
    single_label_indices = []
    
    for idx, row in df.iterrows():
        # 라벨 컬럼들이 모두 숫자(0 또는 1)인지 확인
        is_multilabel = True
        
        for label in label_columns:
            value = row[label]
            # NaN이면 단일 라벨로 분류
            if pd.isna(value):
                is_multilabel = False
                break
            
            # 문자열인 경우 '0' 또는 '1'인지 확인
            if isinstance(value, str):
                if value not in ['0', '1']:
                    is_multilabel = False
                    break
            # 숫자인 경우 0 또는 1인지 확인
            elif isinstance(value, (int, float)):
                if value not in [0, 1, 0.0, 1.0]:
                    is_multilabel = False
                    break
            else:
                # 문자열도 숫자도 아니면 단일 라벨
                is_multilabel = False
                break
        
        if is_multilabel:
            multilabel_indices.append(idx)
        else:
            single_label_indices.append(idx)
    
    multilabel_df = df.loc[multilabel_indices].copy()
    single_label_df = df.loc[single_label_indices].copy()
    
    print(f"\n데이터 분류 결과:")
    print(f"다중 라벨 데이터: {len(multilabel_df)}개")
    print(f"단일 라벨 데이터: {len(single_label_df)}개")
    
    # 다중 라벨 샘플 확인
    if len(multilabel_df) > 0:
        print(f"\n다중 라벨 샘플:")
        for i in range(min(3, len(multilabel_df))):
            row = multilabel_df.iloc[i]
            label_values = [f"{col}:{row[col]}" for col in label_columns]
            print(f"  {' '.join(label_values)}")
    
    return multilabel_df, single_label_df, label_columns

def get_label_combination(row, label_columns):
    """다중 라벨 행에서 활성화된 라벨 조합 추출"""
    active_labels = [col for col in label_columns if row[col] == 1]
    
    if not active_labels:
        return "NO_LABEL"
    
    return "_".join(sorted(active_labels))

def analyze_multilabel_combinations(df, label_columns):
    """다중 라벨 데이터의 조합 분석"""
    
    # 라벨 컬럼들을 숫자로 변환
    for col in label_columns:
        df[col] = pd.to_numeric(df[col], errors='coerce').fillna(0).astype(int)
    
    # 조합 생성
    df['combination'] = df.apply(lambda row: get_label_combination(row, label_columns), axis=1)
    
    # 조합별 개수
    combination_counts = df['combination'].value_counts()
    
    print(f"\n다중 라벨 조합 분석:")
    print(f"총 조합 수: {len(combination_counts)}")
    print(f"총 샘플 수: {len(df)}")
    
    print(f"\n조합별 분포:")
    for combination, count in combination_counts.items():
        percentage = (count / len(df)) * 100
        print(f"{combination:15s}: {count:4d}개 ({percentage:5.1f}%)")
    
    # 개별 라벨 빈도
    print(f"\n개별 라벨 출현 빈도:")
    for label in label_columns:
        count = int(df[label].sum())  # int() 변환 추가
        percentage = (count / len(df)) * 100
        print(f"{label:6s}: {count:4d}개 ({percentage:5.1f}%)")
    
    return df, combination_counts

def save_combinations_to_files(df, output_dir='separated_labels'):
    """조합별로 파일 저장 (기존 파일에 추가)"""
    
    os.makedirs(output_dir, exist_ok=True)
    
    print(f"\n파일 분리 시작 (출력: {output_dir})")
    
    grouped = df.groupby('combination')
    file_info = []
    
    for combination, group in grouped:
        filename = f"{combination}.csv"
        filepath = os.path.join(output_dir, filename)
        
        # combination 컬럼 제거
        group_to_save = group.drop('combination', axis=1)
        
        if os.path.exists(filepath):
            # 기존 파일에 추가
            existing_df = pd.read_csv(filepath, encoding='utf-8-sig')
            combined_df = pd.concat([existing_df, group_to_save], ignore_index=True)
            
            # 중복 제거 (텍스트 기준)
            deduplicated_df = combined_df.drop_duplicates(subset=['text'], keep='first')
            
            added_count = len(deduplicated_df) - len(existing_df)
            deduplicated_df.to_csv(filepath, index=False, encoding='utf-8-sig')
            
            print(f"{combination:15s} -> {filename:20s} (기존:{len(existing_df):3d} + 신규:{added_count:3d} = 총:{len(deduplicated_df):3d})")
            
            file_info.append({
                'combination': combination,
                'filename': filename,
                'added_count': added_count,
                'total_count': len(deduplicated_df)
            })
        else:
            # 새 파일 생성
            group_to_save.to_csv(filepath, index=False, encoding='utf-8-sig')
            
            print(f"{combination:15s} -> {filename:20s} (신규:{len(group_to_save):3d})")
            
            file_info.append({
                'combination': combination,
                'filename': filename,
                'added_count': len(group_to_save),
                'total_count': len(group_to_save)
            })
    
    total_added = sum(info['added_count'] for info in file_info)
    print(f"\n총 {total_added}개 데이터가 조합별 파일로 분리되었습니다.")
    
    return file_info

def update_original_file(original_file_path, single_label_df):
    """원본 파일을 단일 라벨 데이터만으로 업데이트"""
    
    # 백업 생성
    backup_path = original_file_path.replace('.csv', '_backup.csv')
    
    # 원본 파일 읽어서 백업
    original_df = pd.read_csv(original_file_path, encoding='utf-8-sig')
    original_df.to_csv(backup_path, index=False, encoding='utf-8-sig')
    print(f"백업 파일 생성: {backup_path}")
    
    # 단일 라벨 데이터만 원본에 저장
    single_label_df.to_csv(original_file_path, index=False, encoding='utf-8-sig')
    print(f"원본 파일 업데이트: {original_file_path}")
    print(f"남은 단일 라벨 데이터: {len(single_label_df)}개")

def main(csv_file_path, output_dir='separated_labels', remove_multilabel=False):
    """메인 실행 함수"""
    
    print("=" * 60)
    print("다중 라벨 조합별 분리 스크립트")
    print("=" * 60)
    
    # 1. 데이터 로드 및 분류
    result = load_and_classify_data(csv_file_path)
    if result is None:
        return None
    
    multilabel_df, single_label_df, label_columns = result
    
    if len(multilabel_df) == 0:
        print("다중 라벨 데이터가 없습니다.")
        return None
    
    # 2. 다중 라벨 조합 분석
    multilabel_df, combination_counts = analyze_multilabel_combinations(multilabel_df, label_columns)
    
    # 3. 조합별 파일 저장
    file_info = save_combinations_to_files(multilabel_df, output_dir)
    
    # 4. 원본 파일에서 다중 라벨 제거 (선택사항)
    if remove_multilabel:
        response = input("\n원본 파일에서 다중 라벨 데이터를 제거하시겠습니까? (y/N): ")
        if response.lower() in ['y', 'yes']:
            update_original_file(csv_file_path, single_label_df)
            print("원본 파일 업데이트 완료!")
        else:
            print("원본 파일 업데이트 취소")
    
    print(f"\n작업 완료! 다중 라벨 데이터는 {output_dir}에 조합별로 분리되었습니다.")
    print(f"단일 라벨 데이터 {len(single_label_df)}개는 원본에 유지됩니다.")
    
    return multilabel_df, file_info

# 실행
if __name__ == "__main__":
    csv_path = "complete_dataset.csv"
    
    # 기본 실행 (원본 파일 유지)
    result = main(csv_path)
    
    # 원본에서 다중 라벨 제거하고 싶다면
    # result = main(csv_path, remove_multilabel=True)

print("스크립트 로드 완료")
print("실행: main('파일경로.csv')")