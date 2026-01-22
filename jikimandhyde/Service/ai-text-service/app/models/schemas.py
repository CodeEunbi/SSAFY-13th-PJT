from typing import List, Dict, Optional
from pydantic import BaseModel

class Text(BaseModel):
    text: str
    sIdx: int
    eIdx: int
    labels: Optional[List[str]] = None

class TextElement(BaseModel):
    elementId: str
    texts: List[Text]

class PageRequest(BaseModel):
    pageUrl: str
    textElements: List[TextElement]
    textFilterCategory: Dict[str, bool]

class FilteredText(BaseModel):
    text: str
    sIdx: int
    eIdx: int
    detectedLabels: List[str]
    confidence: Optional[Dict[str, float]] = None

class FilteredElement(BaseModel):
    elementId: str
    filteredTexts: List[FilteredText]

class FilterResult(BaseModel):
    pageUrl: str
    filteredElements: List[FilteredElement]
    processingTime: float
    totalTexts: int

class PredictionResponse(BaseModel):
    text: str
    predicted_labels: List[str]
    confidence: Dict[str, float]
    processing_time: float

class BatchPredictionResponse(BaseModel):
    results: List[Dict]
    processing_time: float
    total_texts: int
    avg_time_per_text: float