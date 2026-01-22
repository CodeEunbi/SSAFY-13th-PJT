# app/main.py
# ---------------------------------------------------------------------
# FastAPI 앱 엔트리포인트
#  - lifespan에서 모델/클래스/임계값 로드 후 app.state에 주입(요청마다 재사용)
#  - predict 라우터 등록
# ---------------------------------------------------------------------
from __future__ import annotations

from contextlib import asynccontextmanager
from fastapi import FastAPI

from app.config import (
    MODEL_PATH, CLASSMAP_PATH, THRESH_PATH,
    IMG_SIZE, TOPK, ALLOWED_MIME, infer_model_version,
)
from app.utils.predict import load_model_bundle
from app.routers import router as predict_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # 모델/리소스 로드 + 워밍업
    model, class_names, class_thresh = load_model_bundle(
        model_path=MODEL_PATH,
        class_map_path=CLASSMAP_PATH,
        img_size=IMG_SIZE,
        thresh_path=THRESH_PATH if THRESH_PATH.exists() else None,
    )

    # 전역 상태에 주입
    app.state.MODEL         = model
    app.state.CLASS_NAMES   = class_names
    app.state.CLASS_THRESH  = class_thresh
    app.state.MODEL_VERSION = infer_model_version(MODEL_PATH)

    # 운영 파라미터도 공유
    app.state.ALLOWED_MIME  = ALLOWED_MIME
    app.state.IMG_SIZE      = IMG_SIZE
    app.state.TOPK          = TOPK

    yield  # 앱 실행 구간

    # 종료시 정리 필요하면 추가

app = FastAPI(title="AI Image Service", lifespan=lifespan)
app.include_router(predict_router, tags=["inference"])
