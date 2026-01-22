import pandas as pd
import os

def remove_multilabel_from_original(csv_file_path):
    """원본 파일에서 다중 라벨 데이터만 제거하고 단일 라벨 데이터만 남김"""
    
    # 데이터 로드\
    try:
        df = pd.read_csv(csv_file_path, encoding='utf-8-sig')
        print(f"원본 데이터 로드: {len(df)}개 샘플")
    except Exception as e:
        print(f"파일 로드 실패: {e}")
        return
    
    # 라벨 컬럼
    label_columns = ['CLEAN', 'IN', 'SE', 'AD', 'VI', 'PO']
    
    # 백업 파일 생성
    backup_path = csv_file_path.replace('.csv', '_backup.csv')
    df.to_csv(backup_path, index=False, encoding='utf-8-sig')
    print(f"백업 파일 생성: {backup_path}")
    
    # 단일 라벨 데이터만 필터링
    single_label_rows = []
    
    for idx, row in df.iterrows():
        is_single_label = False
        
        for label in label_columns:
            value = row[label]
            
            # NaN이면 단일 라벨
            if pd.isna(value):
                is_single_label = True
                break
            
            # 문자열이고 라벨명이면 단일 라벨
            if isinstance(value, str) and value in ['CLEAN', 'IN', 'SE', 'AD', 'VI', 'PO']:
                is_single_label = True
                break
            
            # 문자열이고 '0', '1'이 아니면 단일 라벨
            if isinstance(value, str) and value not in ['0', '1']:
                is_single_label = True
                break
        
        if is_single_label:
            single_label_rows.append(idx)
    
    # 단일 라벨 데이터만 추출
    single_label_df = df.loc[single_label_rows].copy()
    
    # 원본 파일 덮어쓰기
    single_label_df.to_csv(csv_file_path, index=False, encoding='utf-8-sig')
    
    print(f"원본 파일 업데이트 완료!")
    print(f"제거된 다중 라벨 데이터: {len(df) - len(single_label_df)}개")
    print(f"남은 단일 라벨 데이터: {len(single_label_df)}개")
    
    return single_label_df

# 실행
if __name__ == "__main__":
    csv_path = "complete_dataset.csv"
    
    # 확인 메시지
    print("=" * 50)
    print("다중 라벨 데이터 제거 스크립트")
    print("=" * 50)
    print(f"대상 파일: {csv_path}")
    
    response = input("원본 파일에서 다중 라벨 데이터를 제거하시겠습니까? (y/N): ")
    
    if response.lower() in ['y', 'yes']:
        result = remove_multilabel_from_original(csv_path)
        if result is not None:
            print("작업 완료!")
    else:
        print("작업 취소됨")

print("스크립트 로드 완료")
print("실행: remove_multilabel_from_original('파일경로.csv')")