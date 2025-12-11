# 파일 설명
# : pytest가 공용으로 쓰는 픽스터(테스트 준비물) 정의 파일
# : 각 테스트에서 반복되는 "모델 로드, 입력 크기 추출, 클래스/임계값 로드"를 한 군데에 모아둔 것

import os, json, pytest
import numpy as np
import tensorflow as tf
from tensorflow import keras

MODEL_PATH = os.path.join("models", "student_ft_best.keras")
THRESH_PATH = os.path.join("models", "thresholds.json")
CLASS_PATH = os.path.join("models", "class_mapping.json")

# --------------------------------------------------------------------------
# @pytest.fixture
# : pytest 테스트 프레임워크의 핵심 기능 중 하나
# : 테스트에 필요한 데이터나 객체를 미리 준비하고 재사용할 수 있게 해주는 데코레이터
# --------------------------------------------------------------------------

# --------------------------------------------------------------------------
# 모델 로딩 fixture
# scope="session": 테스트 세션 전체에서 한 번만 로드하여 재사용
# compile=False: 컴파일 없이 로드(추론만 필요한 경우)
# --------------------------------------------------------------------------
@pytest.fixture(scope="session")
def model():
    assert os.path.exists(MODEL_PATH), f"Missing model: {MODEL_PATH}"
    m = keras.models.load_model(MODEL_PATH, compile=False)
    return m

# --------------------------------------------------------------------------
# 입력 이미지 크기 추출 fixture
# 용도: 모델이 기대하는 입력 이미지의 높이(H)와 너비(W) 추출
# 다중 입력 처리: 모델에 여러 입력이 있는 경우 첫 번째 입력의 shape 사용
# --------------------------------------------------------------------------
@pytest.fixture(scope="session")
def input_hw(model):
    ishape = model.input_shape
    if isinstance(ishape[0], (tuple, list)):  # 다중 입력 처리
        ishape = ishape[0]
    H, W = int(ishape[-3]), int(ishape[-2])
    return H, W

# --------------------------------------------------------------------------
# 클래스 이름 로딩 fixture
# 용도: 클래스 ID를 클래스 이름으로 매핑하는 정보 로드
# --------------------------------------------------------------------------
@pytest.fixture(scope="session")
def class_names():
    assert os.path.exists(CLASS_PATH), f"Missing: {CLASS_PATH}"
    with open(CLASS_PATH, "r", encoding="utf-8") as f:
        id2name = json.load(f)
    return [id2name[str(i)] for i in range(len(id2name))]

# --------------------------------------------------------------------------
# 임계값 설정 로딩 fixture
# 용도: 분류 결정을 위한 임계값들을 로드
# 활용: 예측 확률을 클래스로 변환할 때 사용되는 임계값 설정
# --------------------------------------------------------------------------
@pytest.fixture(scope="session")
def thresholds():
    assert os.path.exists(THRESH_PATH), f"Missing: {THRESH_PATH}"
    with open(THRESH_PATH, "r", encoding="utf-8") as f:
        return json.load(f)
    

# --------------------------------------------------------------------------

# --------------------------------------------------------------------------
@pytest.fixture
def dummy_batch(input_hw):
    H, W = input_hw
    x = tf.zeros([2, H, W, 3], tf.float32)
    return x