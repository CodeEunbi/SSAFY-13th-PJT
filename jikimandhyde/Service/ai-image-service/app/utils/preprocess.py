# app/utils/preprocess.py
# ---------------------------------------------------------------------
# 전처리 유틸:
#  - raw bytes → PIL 디코드(RGB) → 정사각 리사이즈(img_size) → [0,1] 정규화
#  - (1, H, W, 3) float32 로 반환하여 모델 입력과 일치시킴
#  - 종횡비 유지가 필요하면 letterbox/center-crop 로직으로 쉽게 교체 가능
# ---------------------------------------------------------------------
from __future__ import annotations

import io
import numpy as np
from PIL import Image

def load_and_preprocess(raw: bytes, img_size: int) -> np.ndarray:
    """
    입력: 이미지 원시 바이트(raw)
    출력: (1, img_size, img_size, 3) float32, 값 범위 [0,1]
    """
    # 1) 바이트 → 이미지 디코드 + RGB 통일
    img = Image.open(io.BytesIO(raw)).convert("RGB")

    # 2) 정사각 리사이즈 (가로세로 비율 중요 시 다른 전략으로 교체)
    img = img.resize((img_size, img_size), Image.BILINEAR)

    # 3) 넘파이 배열화 + [0,1] 정규화 + 배치 축 추가
    arr = np.asarray(img, dtype=np.float32) / 255.0
    return arr[None, ...]  # (1, H, W, 3)
