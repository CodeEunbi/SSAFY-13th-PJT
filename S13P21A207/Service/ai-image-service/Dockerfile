# ai-image-service/Dockerfile
FROM python:3.11-slim

# 기본 환경
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    TF_CPP_MIN_LOG_LEVEL=2

WORKDIR /app

# Pillow 등 이미지 디코드 필수 라이브러리 (AVIF 지원 포함)
RUN apt-get update && apt-get install -y --no-install-recommends \
    libjpeg62-turbo-dev zlib1g-dev libpng-dev libavif-dev \
    && rm -rf /var/lib/apt/lists/*

# 파이썬 패키지
COPY requirements.txt .
RUN python -m pip install --upgrade pip setuptools wheel
RUN pip install --no-cache-dir -r requirements.txt

# 앱 소스 & 모델(간단히 이미지 안에 포함; 운영에서는 볼륨 마운트 권장)
COPY app ./app
COPY models ./models

# 기본 환경값
ENV MODEL_PATH=./models/student_ft_best.keras \
    CLASSMAP_PATH=./models/class_mapping.json \
    THRESH_PATH=./models/thresholds.json \
    IMG_SIZE=192 \
    TOPK=3 \
    ALLOWED_MIME="image/jpeg,image/png,image/webp,image/avif"

EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]