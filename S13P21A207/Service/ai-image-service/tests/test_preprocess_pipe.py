import os, pytest, tensorflow as tf

FIXTURE_IMG = os.path.join("tests", "fixtures", "sample1.jpg")

# 프로젝트 util이 있으면 사용, 없으면 스킵
try:
    from app.utils.preprocess import load_and_preprocess  # 함수명이 다르면 여기만 맞춰줘
except Exception:
    load_and_preprocess = None

@pytest.mark.skipif(load_and_preprocess is None, reason="load_and_preprocess() not available")
def test_preprocess_contract(load_and_preprocess, FIXTURE_IMG=FIXTURE_IMG):
    assert os.path.exists(FIXTURE_IMG), f"Add a small image at {FIXTURE_IMG}"
    x = load_and_preprocess(FIXTURE_IMG)  # (H,W,3) or (1,H,W,3)
    x = x if x.ndim == 4 else x[None, ...]
    assert x.dtype == tf.float32 and x.shape[-1] == 3
    mn = float(tf.reduce_min(x)); mx = float(tf.reduce_max(x))
    assert -1e-6 <= mn <= 1.0 and -1e-6 <= mx <= 1.0
