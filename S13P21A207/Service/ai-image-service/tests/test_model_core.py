# 파일 설명
# : 모델 그 자체만을 검증하는 핵심 유닛 테스트

import numpy as np
import pytest
import tensorflow as tf

# 테스트용 소프트맥스 함수
# - 모델이 내는 '로짓(logits)'을 확률(0~1, 합=1)로 변환해서
#   수치 안정성/정상 범위를 검증하기 위해 사용
def softmax_np(z):
    # 가장 큰 값으로 빼서 오버플로우 방지(수치 안정화)
    z = z - z.max(axis=-1, keepdims=True)
    e = np.exp(z)
    return e / e.sum(axis=-1, keepdims=True)

# ─────────────────────────────────────────────────────────────
# 모델이 제대로 로드됐는지(레이어가 존재하는지) 스모크 체크
#  - conftest.py의 model 픽스처가 .keras 모델을 로드해둠
# ─────────────────────────────────────────────────────────────
def test_model_loadable(model):
    assert len(model.layers) > 0

# ─────────────────────────────────────────────────────────────
# 입력/출력 규격 및 확률의 수치적 타당성 검사
#  - dummy_batch: (2, H, W, 3) 제로 텐서(모델 입력 크기에 맞춤)
#  - 기대 출력: (2, 5) → 클래스 5개
#  - softmax 합=1, 값이 [0,1] 범위, NaN/Inf 없음
# ─────────────────────────────────────────────────────────────
def test_io_shape_and_probs(model, dummy_batch):
    # 모델 전방향 실행(학습 아님)
    logits = model(dummy_batch, training=False).numpy()
    B, C = logits.shape

    # 배치 크기=2, 클래스 수=5인지 확인
    assert B == 2 and C == 5, f"Unexpected output shape: {logits.shape}"

    # 로짓을 확률로 변환
    p = softmax_np(logits)

    # 각 샘플 확률의 합=1.0 (오차 허용 1e-6)
    assert np.allclose(p.sum(axis=-1), 1.0, atol=1e-6)

    # 확률이 유한하고 [0,1] 범위인지 확인
    assert np.isfinite(p).all() and (p >= 0).all() and (p <= 1).all()

# ─────────────────────────────────────────────────────────────
# 잘못된 입력 모양에 대해 예외를 던지는지 검사
#  - (1) NCHW 텐서(채널 우선) → 우리 모델은 NHWC 기대 → 예외여야 정상
#  - (2) 배치 차원이 없는 (H, W, 3) 텐서 → 예외여야 정상
#  ※ 프레임워크/레이어에 따라 예외 타입은 다를 수 있어 broad Exception 사용
# ─────────────────────────────────────────────────────────────
def test_bad_shape_raises(model):
    # channel-first(NCHW) 잘못된 형태 → 실패해야 정상
    with pytest.raises(Exception):
        _ = model(tf.zeros([1, 3, 224, 224], tf.float32), training=False)

    # 배치 차원이 없는 입력 → 실패해야 정상
    with pytest.raises(Exception):
        _ = model(tf.zeros([224, 224, 3], tf.float32), training=False)