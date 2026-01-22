# app/routers/predict.py
# ---------------------------------------------------------------------
# 추론 라우터:
#  - GET /health: 헬스체크
#  - POST /predict: 단일 이미지 추론 (client_id 에코 지원)
#  - POST /predict/batch: 다중 이미지 추론 (폼 key=ID, value=파일)
# ---------------------------------------------------------------------
from __future__ import annotations

from typing import Optional
import numpy as np
from fastapi import APIRouter, UploadFile, File, Form, Request, HTTPException

from app.utils.preprocess import load_and_preprocess
from app.utils.predict import softmax_np, apply_threshold_policy

router = APIRouter()

# 헬스 체크
@router.get("/health")
def health():
    return {"status": "success"}

# 단일 이미지 (동적 key 지원 + 레거시 호환)
@router.post("/predict")
async def predict(request: Request):
    allowed_mime = request.app.state.ALLOWED_MIME
    img_size     = request.app.state.IMG_SIZE

    # form 파싱: 파일 1개만 사용 (첫 번째 파일 파트)
    form = await request.form()

    # 레거시 client_id도 지원 (있으면 최우선 사용)
    client_id = form.get("client_id")

    file_field = None
    rid_from_key = None
    for key, val in form.multi_items():
        if hasattr(val, "filename") and hasattr(val, "content_type"):
            file_field = val        # UploadFile
            rid_from_key = str(key) # ← 폼의 key를 그대로 ID로 사용
            break

    if file_field is None:
        raise HTTPException(status_code=422, detail="No image file found in form-data.")

    f = file_field

    if f.content_type not in allowed_mime:
        raise HTTPException(status_code=415, detail=f"Unsupported media type: {f.content_type}")

    raw = await f.read()
    try:
        x = load_and_preprocess(raw, img_size)  # (1,H,W,3)
    except Exception as e:
        raise HTTPException(status_code=415, detail=f"Invalid image file: {e}")

    model        = request.app.state.MODEL
    class_names  = request.app.state.CLASS_NAMES
    class_thresh = request.app.state.CLASS_THRESH

    logits = model.predict(x, verbose=0)  # (1,C) 또는 (1,*,C)

    # (1,C)로 정리
    if logits.ndim == 3 and 1 in logits.shape[1:]:
        squeeze_axes = tuple(i for i, s in enumerate(logits.shape[1:], start=1) if s == 1)
        logits = np.squeeze(logits, axis=squeeze_axes)
    elif logits.ndim != 2:
        raise HTTPException(status_code=500, detail=f"Unexpected logits shape: {logits.shape}")

    probs = softmax_np(logits.astype(float)).squeeze()  # (C,)
    pick  = apply_threshold_policy(probs, class_names, class_thresh)

    # ID 우선순위: client_id (있으면 최우선) > 폼 key > 파일명
    rid = client_id if client_id else (rid_from_key if rid_from_key else f.filename)

    return {
        "id": rid,
        "filename": f.filename,   # 참고용
        "label": pick["label"],
        "prob": float(pick["prob"]),
    }


# 다중 이미지 (동적 key 방식만 지원)
@router.post("/predict/batch")
async def predict_batch(request: Request):
    allowed_mime = request.app.state.ALLOWED_MIME
    img_size     = request.app.state.IMG_SIZE

    xs, id_list, filename_list = [], [], []

    # ✅ 단일 방식: "폼의 key = ID", value = 파일
    form = await request.form()
    for key, val in form.multi_items():
        # 업로드 파일만 취급
        if hasattr(val, "filename") and hasattr(val, "content_type"):
            rid = str(key)  # key 자체를 ID로 사용
            f: UploadFile = val

            if f.content_type not in allowed_mime:
                raise HTTPException(status_code=415, detail=f"Unsupported media type: {f.content_type}")

            raw = await f.read()
            try:
                x = load_and_preprocess(raw, img_size)
            except Exception as e:
                raise HTTPException(status_code=415, detail=f"Invalid image file: {f.filename}: {e}")

            xs.append(x)
            id_list.append(rid)
            filename_list.append(f.filename)

    if not xs:
        raise HTTPException(
            status_code=422,
            detail="No image files found. Send files as form-data where each field name is the image ID and the value is the file."
        )

    # ID 중복 방지
    if len(set(id_list)) != len(id_list):
        raise HTTPException(status_code=422, detail="Duplicate IDs (form keys) are not allowed.")

    X = np.concatenate(xs, axis=0)  # (B,H,W,3)

    model        = request.app.state.MODEL
    class_names  = request.app.state.CLASS_NAMES
    class_thresh = request.app.state.CLASS_THRESH

    logits = model.predict(X, verbose=0)  # (B,C) 또는 (B,*,C)
    if logits.ndim == 3 and 1 in logits.shape[1:]:
        squeeze_axes = tuple(i for i, s in enumerate(logits.shape[1:], start=1) if s == 1)
        logits = np.squeeze(logits, axis=squeeze_axes)
    elif logits.ndim != 2:
        raise HTTPException(status_code=500, detail=f"Unexpected logits shape: {logits.shape}")

    probs = softmax_np(logits.astype(float))  # (B,C)

    # 위험/안전 통계 집계
    risk_set = {c for c in class_names if c.lower() != "normal"}

    results = []
    processed_cnt = 0
    skipped_cnt = 0

    for i in range(probs.shape[0]):
        pick = apply_threshold_policy(probs[i], class_names, class_thresh)
        item = {
            "id": id_list[i],               # 프론트가 준 key 그대로
            "filename": filename_list[i],   # 참고용
            "label": pick["label"],
            "prob": float(pick["prob"]),
        }
        results.append(item)
        if item["label"] in risk_set:
            processed_cnt += 1     # 가릴 이미지 개수
        else:
            skipped_cnt += 1       # 안 가리는 이미지 개수

    return {
        "results": results,        # [{ id, filename, label, prob }, ...]
        "imageCount": {            # 요약 카운트
            "processedImages": processed_cnt,
            "skippedImages": skipped_cnt
        }
    }
