# File: Service/ai-text-service/app/utils/config.py

import os

# 모델 설정
MODEL_PATH = "models/text/final_multilabel_model"
DEVICE = 'cpu'
TORCH_THREADS = 4

# 예측 설정
DEFAULT_THRESHOLD = 0.5
DEFAULT_BATCH_SIZE = 8
MAX_SEQUENCE_LENGTH = 128

# 라벨 정의
LABEL_COLUMNS = ['IN', 'VI', 'SE', 'AD', 'PO', 'CLEAN']

LABEL_DESCRIPTIONS = {
    "IN": "욕설/모욕/비난",
    "VI": "폭력적 내용",
    "SE": "선정적 내용", 
    "AD": "광고/스팸",
    "PO": "정치적 내용",
    "CLEAN": "정상 텍스트"
}

# 환경 설정
os.environ["TOKENIZERS_PARALLELISM"] = "false"