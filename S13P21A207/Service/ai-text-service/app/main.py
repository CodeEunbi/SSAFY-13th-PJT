# File: Service/ai-text-service/app/main.py

"""
FastAPI 기반 다중 라벨 텍스트 필터링 서버
"""

import time
import asyncio
import torch
import logging
from typing import List, Dict, Any
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException

from .services.ml_service import ml_service
from .models.schemas import (
    PageRequest, FilterResult, FilteredText, FilteredElement,
    PredictionResponse, BatchPredictionResponse
)
from .utils.config import LABEL_DESCRIPTIONS
from kss import split_sentences
from .utils.text_split import segment_with_spans

log = logging.getLogger("uvicorn")

# 분리 기준 (200자)
SPLIT_TRIGGER = 200

async def _warmup_in_thread(batch_size: int = 8, max_len: int = 512):
    """CPU 블로킹 워밍업을 쓰레드에서 돌리고 완료까지 대기"""
    def _do():
        if not ml_service.is_loaded():
            raise RuntimeError("Model not loaded for warmup")
        dummy_batch = ["워밍업 텍스트입니다."] * batch_size
        inputs = ml_service.tokenizer(
            dummy_batch,
            return_tensors="pt",
            truncation=True,
            padding=True,
            max_length=max_len
        )
        inputs = {k: v.to(ml_service.device) for k, v in inputs.items()}
        with torch.inference_mode():
            _ = ml_service.model(**inputs)
    loop = asyncio.get_running_loop()
    # 이벤트 루프를 막지 않도록 executor에서 실행하고, 여기서 '기다린다'
    await loop.run_in_executor(None, _do)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # 1) 모델 로드
    from app.utils.config import MODEL_PATH
    ml_service.load_model(MODEL_PATH)
    log.info("[startup] model load done (device=%s)", ml_service.get_device_info()["device"])

    # 2) 모델 더미 추론 워밍업(실제 요청과 동일한 토크나이즈 옵션)
    try:
        await _warmup_in_thread(batch_size=8, max_len=512)
        log.info("[startup] model warmup done")
    except Exception as e:
        log.exception("[startup] model warmup failed: %s", e)

    # 3) KSS 워밍업
    try:
        _ = split_sentences("주요셉 반동성애기독시민연대대표가 2년4개월 전인 2023년 5월25일 인권위에 낸 이 진정은 이충상 전 상임위원을 피해자로, 송두환 전 위원장을 피진정인으로 한 것이었다. 진정의 내용은 이충상 상임위원이 ‘군 신병 훈련소 인권상황 개선 권고의 건’과 관련 해병대 훈련병의 두발 기준에 관한 다수의견 반대 이유를 설명한다며 적었다가 뺀 “자의로 기저귀를 차며 성관계를 하는 게이(남성 동성애자)가 인권침해를 당하고 있다는 사실을…”이라는 내용이 외부(언론)에 공개돼 인격권이 침해됐다는 것이다. 2023년 5월19일 제19차 상임위원회에서 남규선 상임위원은 구체적인 내용은 언급하지 않고 해당 표현의 재고를 간곡히 요청했고, 이충상 상임위원은 회의 뒤 이를 삭제하기로 했다. 그러나 내부망 자유게시판에 직원이 그 내용을 올리면서 언론에 보도됐다. 이충상 전 상임위원은 해당 언론 보도로 자신의 명예가 훼손됐다며 한겨레를 상대로 소송을 내기도 했으나, 2024년 진행된 1·2심에서 모두 패소했다. 대법원은 지난 1월 패소 판결을 최종 확정했다.")
        log.info("[startup] KSS warmup done")
    except Exception as e:
        log.exception("[startup] KSS warmup failed: %s", e)

    # 여기까지 ‘모든 워밍업’이 끝나기 전에는 yield 안 함
    yield
    # 종료 훅 필요시 여기에
    # log.info("[shutdown] bye")
    

app = FastAPI(
    title="Text Filter API",
    description="다중 라벨 텍스트 분류 기반 필터링 시스템",
    version="1.0.0",
    lifespan=lifespan
)

@app.get("/")
async def root():
    """헬스 체크"""
    device_info = ml_service.get_device_info()
    return {
        "status": "healthy",
        "model_loaded": device_info["is_loaded"],
        **device_info
    }

@app.get("/health")
async def health_check():
    """상세 헬스 체크"""
    if not ml_service.is_loaded():
        raise HTTPException(status_code=503, detail="Model not loaded")
    
    device_info = ml_service.get_device_info()
    return {
        "status": "healthy",
        "model_status": "loaded",
        **device_info
    }

@app.post("/predict", response_model=PredictionResponse)
async def predict_single(text: str, threshold: float = 0.5):
    """단일 텍스트 예측"""
    if not ml_service.is_loaded():
        raise HTTPException(status_code=503, detail="Model not loaded")
    
    start_time = time.time()
    result = ml_service.predict_single(text, threshold)
    processing_time = time.time() - start_time
    
    return PredictionResponse(
        text=text,
        predicted_labels=result["predicted_labels"],
        confidence=result["confidence"],
        processing_time=processing_time
    )

# >>> 내부 유틸: 한 element의 본문을 chunk 목록으로 확장
def _expand_element_texts(element_id: str, raw_text: str) -> List[Dict[str, Any]]:
    """
    반환: [{'elementId', 'text', 'sIdx', 'eIdx'}...]
    - 200자 미만: sIdx=eIdx=0 단일 chunk
    - 200자 이상: utils.text_split.segment_with_spans 로 분리
    """
    if not raw_text:
        return []
    if len(raw_text) < SPLIT_TRIGGER:
        return [{"elementId": element_id, "text": raw_text, "sIdx": 0, "eIdx": 0}]
    # 장문 → 문장/의미 단위 분리 + 절대 오프셋 보존
    spans, *_ = segment_with_spans(raw_text, split_sentences)
    return [
        {"elementId": element_id, "text": s["text"], "sIdx": s["start"], "eIdx": s["end"]}
        for s in spans
    ]

@app.post("/filter_page", response_model=FilterResult)
async def filter_page(request: PageRequest, threshold: float = 0.5):
    """페이지 텍스트 필터링
    - 200자 기준으로 분리(sIdx/eIdx 부여)
    - 배치 분류
    - 요청의 textFilterCategory(True인 라벨)에 해당하는 결과만 반환
    """
    if not ml_service.is_loaded():
        raise HTTPException(status_code=503, detail="Model not loaded")
    
    start_time = time.time()

    t0 = time.perf_counter()
    
    try:
        # 0) 필터링할 카테고리 추출 (True만)
        filter_categories = [cat for cat, enabled in request.textFilterCategory.items() if enabled]
        if not filter_categories:
            return FilterResult(
                pageUrl=request.pageUrl,
                filteredElements=[],
                processingTime=time.time() - start_time,
                totalTexts=0
            )

        # 1) 입력 확장: 각 element마다 분리 규칙 적용
        # 기존 스키마를 바꾸지 않고, 내부적으로만 chunk 단위로 펼침
        chunks: List[Dict[str, Any]] = []
        for element in request.textElements:
            # element.texts: List[Text] (이미 분리돼 들어올 수도 있으니 모두 처리)
            for text_obj in element.texts:
                chunks.extend(_expand_element_texts(element.elementId, text_obj.text))

        if not chunks:
            return FilterResult(
                pageUrl=request.pageUrl,
                filteredElements=[],
                processingTime=time.time() - start_time,
                totalTexts=0
            )
        
        t1 = time.perf_counter()

        # 2) 배치 예측 (chunk 텍스트만 수집)
        all_texts = [c["text"] for c in chunks]
        predictions = ml_service.predict_batch(all_texts, threshold=threshold)

        t2 = time.perf_counter()

        # 3) 예측 라벨 병합
        # chunks[i]에 predictions[i]의 결과를 부여
        for c, pred in zip(chunks, predictions):
            c["labels"] = pred["predicted_labels"]
            c["confidence"] = pred.get("confidence")

        # 4) 활성 필터에 해당하는 chunk만 element별로 모음
        by_element: Dict[str, List[FilteredText]] = {}
        active = set(filter_categories)
        for c in chunks:
            labels = c.get("labels") or []
            if any(lbl in active for lbl in labels):
                ft = FilteredText(
                    text=c["text"],
                    sIdx=c["sIdx"],
                    eIdx=c["eIdx"],
                    detectedLabels=labels,
                    confidence=c.get("confidence")
                )
                by_element.setdefault(c["elementId"], []).append(ft)

        # 5) 응답 스키마 조립
        filtered_elements: List[FilteredElement] = [
            FilteredElement(elementId=eid, filteredTexts=fts)
            for eid, fts in by_element.items()
            if fts
        ]

        t3 = time.perf_counter()
        log.info("[trace] assemble: filtered_elements=%d, time=%.3fs",
            len(filtered_elements), t3 - t2)
        log.info("[trace] total: %.3fs (expand=%.3f, predict=%.3f, assemble=%.3f)",
                 t3 - t0, t1 - t0, t2 - t1, t3 - t2)

        processing_time = time.time() - start_time
        
        return FilterResult(
            pageUrl=request.pageUrl,
            filteredElements=filtered_elements,
            processingTime=t3-t0,
            totalTexts=len(all_texts)
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Processing error: {str(e)}")

@app.post("/batch_predict", response_model=BatchPredictionResponse)
async def batch_predict(texts: List[str], threshold: float = 0.5):
    """배치 텍스트 예측"""
    if not ml_service.is_loaded():
        raise HTTPException(status_code=503, detail="Model not loaded")
    
    start_time = time.time()
    results = ml_service.predict_batch(texts, threshold=threshold)
    processing_time = time.time() - start_time
    
    return BatchPredictionResponse(
        results=results,
        processing_time=processing_time,
        total_texts=len(texts),
        avg_time_per_text=processing_time / len(texts) if texts else 0
    )

@app.get("/labels")
async def get_labels():
    """사용 가능한 라벨 목록"""
    return {
        "labels": ml_service.get_device_info()["available_labels"],
        "descriptions": LABEL_DESCRIPTIONS
    }