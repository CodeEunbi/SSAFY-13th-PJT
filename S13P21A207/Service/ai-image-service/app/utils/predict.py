# app/utils/predict.py
# ---------------------------------------------------------------------
# 후처리 + 로딩 유틸 모음:
#  - softmax_np: logits → 확률(합=1). 수치 안정화 포함
#  - apply_threshold_policy: 임계값 정책(정렬 없이 O(C) 한 번 순회로 Top-1 선택)
#  - load_model_bundle: 모델 로드 + 워밍업 + class_names + class_thresh 세팅
# ---------------------------------------------------------------------
from __future__ import annotations

import json, os
import numpy as np
import tensorflow as tf
from tensorflow import keras
from pathlib import Path

def softmax_np(logits: np.ndarray) -> np.ndarray:
    """수치안정 softmax: 마지막 축(C) 기준 확률화(합=1)."""
    z = logits - np.max(logits, axis=-1, keepdims=True)
    e = np.exp(z)
    return e / np.sum(e, axis=-1, keepdims=True)

def apply_threshold_policy(
    probs: np.ndarray,
    class_names: list[str],
    class_thresh: dict[str, float],
) -> dict:
    """
    정렬 없이 O(C)로 임계 통과 Top-1 라벨만 선택(빠른 버전).
    - probs: (C,) 확률 벡터(softmax 권장; logits 그대로 넣지 말 것)
    - class_names: 인덱스→라벨 리스트 (probs와 인덱스 일치)
    - class_thresh: {"라벨": threshold} (보통 normal 제외: 폴백 용도)
    """
    assert len(probs) == len(class_names), "probs와 class_names 길이가 다릅니다."
    if not np.all(np.isfinite(probs)):
        raise ValueError("probs에 NaN/inf 값이 포함되어 있습니다.")

    best_name, best_prob = None, -1.0
    for i, name in enumerate(class_names):
        thr = class_thresh.get(name)  # normal 등은 None
        if thr is None:
            continue
        pi = float(probs[i])
        if pi >= thr and pi > best_prob:
            best_name, best_prob = name, pi

    if best_name is None:
        # 모든 위험 클래스가 임계 미달 → 안전 폴백
        if "normal" in class_names:
            idx = class_names.index("normal")
        else:
            idx = int(np.argmax(probs))
        return {"label": class_names[idx], "prob": float(probs[idx])}

    return {"label": best_name, "prob": best_prob}

def load_model_bundle(
    model_path: str | Path,
    class_map_path: str | Path,
    img_size: int,
    thresh_path: str | Path | None = None,
):
    """
    모델/라벨/임계값을 한 번에 로드.
    반환: (model, class_names, class_thresh)
    - model: keras.Model (compile=False 로 추론 전용 로드)
    - class_names: 인덱스 순 라벨 리스트
    - class_thresh: 위험 클래스 임계값 딕셔너리(기본 0.5, normal 제외) + (선택) override
    """
    model = keras.models.load_model(str(model_path), compile=False)

    # 첫 호출 지연을 줄이기 위한 워밍업 predict 1회
    _ = model.predict(tf.zeros([1, img_size, img_size, 3], dtype=tf.float32), verbose=0)

    # 클래스 매핑 로드: {"0":"crime","1":"disaster",...}
    with open(class_map_path, "r", encoding="utf-8") as f:
        idx2name = json.load(f)

    # 간단 버전(연속 인덱스 전제)
    class_names = [idx2name[str(i)] for i in range(len(idx2name))]

    # 기본 임계값: 0.5 (normal 제외)
    class_thresh = {c: 0.5 for c in class_names if c != "normal"}

    # override 파일이 있으면 해당 키만 덮어쓰기
    if thresh_path and Path(thresh_path).exists():
        with open(thresh_path, "r", encoding="utf-8") as f:
            class_thresh.update(json.load(f))

    return model, class_names, class_thresh
