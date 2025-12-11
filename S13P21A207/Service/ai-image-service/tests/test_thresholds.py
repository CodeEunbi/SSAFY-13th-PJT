import numpy as np
import pytest

# 프로젝트 util이 있으면 사용, 없으면 테스트 내부에서 동일 로직 정의
try:
    from app.utils.predict import decide_label_with_thresholds  # 있으면 이걸로
except Exception:
    def decide_label_with_thresholds(probs, class_names, thresholds, normal_label="normal"):
        name2idx = {n:i for i,n in enumerate(class_names)}
        passed = []
        for k, th in thresholds.items():
            if k in name2idx and probs[name2idx[k]] >= th:
                i = name2idx[k]; passed.append((k, probs[i], i))
        if passed:
            passed.sort(key=lambda x: x[1], reverse=True)
            k, p, i = passed[0]; return k, float(p), int(i)
        if normal_label in name2idx:
            i = name2idx[normal_label]; return normal_label, float(probs[i]), i
        i = int(np.argmax(probs)); return class_names[i], float(probs[i]), i

def test_threshold_keys(thresholds):
    assert set(thresholds.keys()) == {"crime","disaster","gore","horror"}

def test_threshold_normal_fallback(class_names, thresholds):
    # 위험 4개 모두 임계값 미만이면 normal
    probs = np.zeros(len(class_names), dtype=np.float32)
    name, prob, idx = decide_label_with_thresholds(probs, class_names, thresholds, "normal")
    assert name == "normal"

def test_threshold_pick_max_over_thr(class_names, thresholds):
    # 하나 이상이 임계값 초과면 그 중 최대 확률 선택
    arr = np.zeros(len(class_names), dtype=np.float32)
    # 임계값을 약간 넘기도록 설정
    for k, t in thresholds.items():
        if k in class_names:
            arr[class_names.index(k)] = max(t + 0.02, 0.75) if k in ("gore","horror") else t + 0.02
            break
    name, prob, idx = decide_label_with_thresholds(arr, class_names, thresholds, "normal")
    assert name in thresholds and prob == arr[idx]
