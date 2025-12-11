import os, io, json
import numpy as np
import pytest
from fastapi.testclient import TestClient

# FastAPI 앱 import
from app.main import app

# 실제 서버를 띄우지 않고도 HTTP 요청을 보낼 수 있는 테스트 클라이언트
client = TestClient(app)

# 테스트용 샘플 파일 경로
FIXTURE_IMG = os.path.join("tests", "fixtures", "sample1.jpg")

def test_health():
    """
    /health 엔드포인트 헬스체크:
    - 200 OK 반환 여부
    - JSON 바디에 {"status": "ok"} 포함 여부
    """
    r = client.get("/health")
    assert r.status_code == 200
    data = r.json()
    assert data.get("status") == "ok"


@pytest.mark.skipif(not os.path.exists(FIXTURE_IMG), reason="fixture image missing")
def test_predict_ok():
    """
    /predict 정상 흐름 테스트:
    - JPEG 이미지를 멀티파트로 업로드
    - 200 OK 응답
    - JSON 응답 스키마: "label", "prob", "topk" 키가 존재하고 타입/범위가 타당한지 확인
      * prob은 [0,1] 범위의 실수여야 함
      * topk는 리스트여야 함 (상위 k 클래스/확률 등)
    """
    with open(FIXTURE_IMG, "rb") as f:
        files = {"file": ("sample1.jpg", f, "image/jpeg")}
        r = client.post("/predict", files=files)
    assert r.status_code == 200
    data = r.json()
    assert "label" in data and "prob" in data
    assert 0.0 <= float(data["prob"]) <= 1.0
    assert "topk" in data and isinstance(data["topk"], list)


@pytest.mark.skipif(not os.path.exists(FIXTURE_IMG), reason="fixture image missing")
def test_predict_threshold_behavior_hint():
    """
    /predict 임계값(threshold) 로직 스모크 테스트:
    - 실제로 normal/위험 중 무엇이 나오는지는 데이터·모델에 의존하므로 '값'을 단정하지 않음
    - 대신 임계값 기반 분기 로직이 지나온 응답의 '형태(스키마)'만 확인
      * "label"은 문자열
      * "topk" 키 존재
    """
    with open(FIXTURE_IMG, "rb") as f:
        r = client.post("/predict", files={"file": ("sample1.jpg", f, "image/jpeg")})
    assert r.status_code == 200
    data = r.json()
    assert "label" in data and isinstance(data["label"], str)
    assert "topk" in data


def test_predict_missing_file():
    """
    /predict 에 파일을 아예 안 보낸 경우:
    - FastAPI 바디 검증에 걸려 400 Bad Request 또는 422 Unprocessable Entity 가 되어야 함
    """
    r = client.post("/predict", files={})
    assert r.status_code in (400, 422)  # 바디 검증 에러

