# app/config.py
# ---------------------------------------------------------------------
# 전역 설정/경로를 한 곳에서 관리
#  - 환경변수로 덮어쓸 수 있게 하고, 기본값은 ./models 아래 파일을 사용
#  - Path를 써서 OS/실행 위치에 덜 민감하게 구성
# ---------------------------------------------------------------------
from __future__ import annotations

import os
from pathlib import Path

# 프로젝트 루트(= app/ 의 상위 디렉터리)
BASE_DIR = Path(__file__).resolve().parent.parent

# 모델/클래스맵/임계값 파일 경로 (컨테이너 환경에서는 /app/models에서 찾기)
MODEL_PATH    = Path(os.getenv("MODEL_PATH", "/app/models/image/student_ft_best.keras"))
CLASSMAP_PATH = Path(os.getenv("CLASSMAP_PATH", "/app/models/image/class_mapping.json"))
THRESH_PATH   = Path(os.getenv("THRESH_PATH", "/app/models/image/thresholds.json"))

# 추론 하이퍼파라미터
IMG_SIZE = int(os.getenv("IMG_SIZE", "192"))
TOPK     = int(os.getenv("TOPK", "3"))

# 허용 MIME 타입
ALLOWED_MIME = set(os.getenv("ALLOWED_MIME", "image/jpeg,image/png,image/webp,image/avif").split(","))

def infer_model_version(path: Path) -> str:
    """파일 수정시각을 섞어 간단 버전 문자열 생성 (로그/응답에 표시용)."""
    try:
        return f"{path.name}@{int(path.stat().st_mtime)}"
    except Exception:
        return path.name
