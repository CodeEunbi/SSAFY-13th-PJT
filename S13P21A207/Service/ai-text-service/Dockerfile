FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    TF_CPP_MIN_LOG_LEVEL=2

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN python -m pip install --upgrade pip setuptools wheel
RUN pip install --no-cache-dir -r requirements.txt

COPY app ./app
COPY models ./models
COPY tests ./tests

# 텍스트 모델 환경변수
ENV MODEL_PATH=./models/final_multilabel_model/model.safetensors \
    CONFIG_PATH=./models/final_multilabel_model/config.json \
    TOKENIZER_PATH=./models/final_multilabel_model \
    VOCAB_PATH=./models/final_multilabel_model/vocab.txt \
    SPECIAL_TOKENS_PATH=./models/final_multilabel_model/special_tokens_map.json

EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]