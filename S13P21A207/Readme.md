# 지킴앤하이드 - AI 기반 웹 혐오 콘텐츠 필터링 서비스

실시간 AI 기반 웹 콘텐츠 분석 및 필터링 Chrome Extension

## 프로젝트 개요

웹 페이지 열람 시 이미지와 텍스트를 실시간으로 분석하여 유해 콘텐츠를 자동으로 감지하고 필터링하는 Chrome 브라우저 익스텐션입니다. 딥러닝 기반 이미지 분류와 자연어 처리를 활용하여 범죄, 재해, 폭력, 혐오 표현 등 위해성 있는 콘텐츠를 식별하고 사용자 설정에 따라 흐림 처리합니다.

### 주요 특징

- **실시간 콘텐츠 분석**: Socket.IO 기반 양방향 통신으로 빠른 응답
- **AI 기반 필터링**: TensorFlow/Keras 이미지 분류 + Hugging Face Transformers 텍스트 분류
- **스마트 캐싱**: Redis 기반 분석 결과 캐싱으로 중복 분석 방지
- **우선순위 처리**: 뷰포트 내 콘텐츠 우선 분석으로 UX 최적화
- **마이크로서비스 아키텍처**: 독립적 배포 및 스케일링 가능

## 시스템 아키텍처

```
┌─────────────────────────────────────────────────────────────────┐
│                    Chrome Extension (Frontend)                  │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────────────┐   │
│  │ Content      │  │ Background   │  │ Offscreen Document │   │
│  │ Script       │◄─┤ Service      │◄─┤ (Socket.IO Client) │   │
│  │ (Scan/Blur)  │  │ Worker       │  └────────────────────┘   │
│  └──────────────┘  └──────────────┘                            │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ Socket.IO
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                  Backend (Spring Boot + Socket.IO)              │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │            ProcessingOrchestrator                        │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │  │
│  │  │ Pre-Process  │  │   Process    │  │ Post-Process │  │  │
│  │  │ (Cache)      │→ │ (AI Client)  │→ │ (Filter)     │  │  │
│  │  └──────────────┘  └──────────────┘  └──────────────┘  │  │
│  └──────────────────────────────────────────────────────────┘  │
│                              │                                  │
│  ┌──────────────┐           │          ┌──────────────┐       │
│  │    Redis     │           │          │  Socket.IO   │       │
│  │   (Cache)    │           │          │   Handlers   │       │
│  └──────────────┘           │          └──────────────┘       │
└─────────────────────────────┼──────────────────────────────────┘
                              │ HTTP
            ┌─────────────────┴─────────────────┐
            ▼                                   ▼
┌──────────────────────────┐    ┌──────────────────────────┐
│ AI Image Service         │    │ AI Text Service          │
│ (FastAPI + TensorFlow)   │    │ (FastAPI + Transformers) │
│                          │    │                          │
│ ┌──────────────────────┐ │    │ ┌──────────────────────┐ │
│ │ MobileNet (Student)  │ │    │ │ BERT Multi-Label     │ │
│ │ Knowledge Distilled  │ │    │ │ Classifier           │ │
│ │ from EfficientNet    │ │    │ │ (512 tokens)         │ │
│ │ (192x192 Image)      │ │    │ │                      │ │
│ │ Top-K Classification │ │    │ │                      │ │
│ └──────────────────────┘ │    │ └──────────────────────┘ │
└──────────────────────────┘    └──────────────────────────┘
```

## 기술 스택

| 분류 | 기술 스택 |
|------|----------|
| **Frontend** | ![React 19.1.1](https://img.shields.io/badge/React%2019.1.1-61DAFB?style=for-the-badge&logo=react&logoColor=black) ![TypeScript 5.8.3](https://img.shields.io/badge/TypeScript%205.8.3-3178C6?style=for-the-badge&logo=typescript&logoColor=white) ![Vite 7.1.2](https://img.shields.io/badge/Vite%207.1.2-646CFF?style=for-the-badge&logo=vite&logoColor=white) ![Tailwind CSS 3.4.17](https://img.shields.io/badge/Tailwind%20CSS%203.4.17-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white) ![Socket.io 2.4.0](https://img.shields.io/badge/Socket.io%202.4.0-010101?style=for-the-badge&logo=socket.io&logoColor=white) ![Axios 1.11.0](https://img.shields.io/badge/Axios%201.11.0-5A29E4?style=for-the-badge&logo=axios&logoColor=white) |
| **Backend** | ![Spring Boot 3.3.4](https://img.shields.io/badge/Spring%20Boot%203.3.4-6DB33F?style=for-the-badge&logo=springboot&logoColor=white) ![Java 17](https://img.shields.io/badge/Java%2017-007396?style=for-the-badge&logo=openjdk&logoColor=white) ![Gradle 8.x](https://img.shields.io/badge/Gradle%208.x-02303A?style=for-the-badge&logo=gradle&logoColor=white)
| **AI Image** | ![FastAPI 0.116.2](https://img.shields.io/badge/FastAPI%200.116.2-009688?style=for-the-badge&logo=fastapi&logoColor=white) ![TensorFlow 2.20.0](https://img.shields.io/badge/TensorFlow%202.20.0-FF6F00?style=for-the-badge&logo=tensorflow&logoColor=white) ![Keras 3.11.3](https://img.shields.io/badge/Keras%203.11.3-D00000?style=for-the-badge&logo=keras&logoColor=white)
| **AI Text** | ![FastAPI 0.104.1](https://img.shields.io/badge/FastAPI%200.104.1-009688?style=for-the-badge&logo=fastapi&logoColor=white) ![PyTorch 2.5.0](https://img.shields.io/badge/PyTorch%202.5.0-EE4C2C?style=for-the-badge&logo=pytorch&logoColor=white) ![Transformers 4.35.2](https://img.shields.io/badge/Transformers%204.35.2-FFD21E?style=for-the-badge&logo=huggingface&logoColor=black) |
| **Database** | ![Redis 7.0](https://img.shields.io/badge/Redis%207.0-DC382D?style=for-the-badge&logo=redis&logoColor=white)
| **Infrastructure** | ![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white) ![Nginx](https://img.shields.io/badge/Nginx%20Alpine-009639?style=for-the-badge&logo=nginx&logoColor=white) ![Jenkins](https://img.shields.io/badge/Jenkins-D24939?style=for-the-badge&logo=jenkins&logoColor=white) ![GitLab](https://img.shields.io/badge/GitLab-FC6D26?style=for-the-badge&logo=gitlab&logoColor=white) |

## 디렉토리 구조

```
S13P21A207/
├── Front-End/
│   └── SSAFY_PJT2/                 # Chrome Extension
│       ├── src/
│       │   ├── apis/               # API 통신 모듈
│       │   ├── components/         # React 컴포넌트
│       │   ├── content/            # Content Script (이미지/텍스트 스캔 및 블러)
│       │   ├── pages/              # 팝업, 설정, 옵션 페이지
│       │   ├── offscreen/          # Offscreen Document (WebSocket)
│       │   └── stores/             # 상태 관리
│       └── dist/                   # 빌드 결과물
│
├── Service/
│   ├── common-backend/             # Spring Boot 백엔드
│   │   └── src/main/java/backend/SSAFY_PTJ2/
│   │       ├── adapter/api/        # Socket.IO 핸들러, DTO
│   │       ├── application/        # UseCase, Orchestrator
│   │       ├── domain/             # 도메인 로직
│   │       └── global/             # 설정, 예외 처리
│   │
│   ├── ai-image-service/           # 이미지 분석 AI 서비스
│   │   ├── app/
│   │   │   ├── main.py             # FastAPI 엔트리포인트
│   │   │   ├── routers/            # API 라우터
│   │   │   └── utils/              # 전처리, 예측 로직
│   │   └── models/                 # 학습된 Keras 모델
│   │
│   └── ai-text-service/            # 텍스트 분석 AI 서비스
│       ├── app/
│       │   ├── main.py             # FastAPI 엔트리포인트
│       │   ├── services/           # ML 서비스
│       │   └── utils/              # 텍스트 전처리
│       └── models/                 # Hugging Face 모델 체크포인트
│
├── Infra/                          # 인프라 설정
│   ├── main-ec2/
│   │   ├── docker-compose.main.yml # Docker Compose 설정
│   │   └── nginx/                  # Nginx 리버스 프록시
│   └── support-ec2/
│
├── Docs/                           # 문서
├── local-dev/                      # 로컬 개발 환경 설정
└── jenkinsfile                     # Jenkins CI/CD 파이프라인
```

## 주요 기능

### 1. 이미지 필터링

- 페이지 내 모든 이미지 자동 감지
- **지식 증류 기반 경량 모델**: EfficientNet(Teacher) → MobileNet(Student) 지식 증류로 학습
- Keras 모델 기반 이미지 분류 (192x192 입력 크기)
- 높은 정확도와 빠른 추론 속도를 동시에 달성
- 감지 카테고리: 범죄, 재해, 폭력, 음란물 등
- 뷰포트 기반 우선순위 처리 (최대 동시성 12)
- Base64/ArrayBuffer 변환 후 Socket.IO로 전송
- 분석 결과에 따른 자동 흐림 처리

**처리 흐름**:
```
이미지 감지 → Blob 변환 → ArrayBuffer 변환 → Socket.IO 전송
→ 백엔드 캐시 조회 → AI 분석 → 결과 반환 → 흐림 처리 적용
```

### 2. 텍스트 필터링

- MutationObserver 기반 동적 콘텐츠 감지
- Hugging Face Transformers 다중 라벨 분류
- 감지 카테고리: 혐오 표현, 욕설, 부적절한 콘텐츠 등
- 200자 단위 청크 분리 및 배치 처리
- KSS 한국어 문장 분리기 활용
- 사용자 설정 기반 필터 적용

**처리 흐름**:
```
텍스트 노드 추출 → 200자 청크 분리 → Socket.IO 배치 전송
→ 백엔드 캐시 조회 → AI 배치 분석 → 결과 반환 → 스타일 변경
```

### 3. 캐싱 최적화

- Redis 기반 분석 결과 캐싱
- 콘텐츠 해시를 캐시 키로 사용
- TTL: 24시간 (세션 단위)
- Hit/Miss 통계 수집
- 중복 분석 방지로 응답 속도 향상

### 4. 사용자 설정 관리

- 필터 카테고리별 활성화/비활성화
- 세션 기반 설정 저장
- 설정 페이지 UI 제공
- 실시간 설정 적용

## 설치 및 실행

### 로컬 개발 환경

#### Prerequisites
- Node.js 18+
- Java 17+
- Python 3.10+
- Docker & Docker Compose
- Redis

#### 1. Frontend (Chrome Extension)

```bash
cd Front-End/SSAFY_PJT2

# 의존성 설치
npm install

# 개발 모드 실행
npm run dev

# 프로덕션 빌드
npm run build
```

**Chrome Extension 로드**:
1. Chrome에서 `chrome://extensions/` 열기
2. "개발자 모드" 활성화
3. "압축해제된 확장 프로그램을 로드합니다" 클릭
4. `Front-End/SSAFY_PJT2/dist` 폴더 선택

#### 2. Backend (Spring Boot)

```bash
cd Service/common-backend

# Gradle 빌드
./gradlew clean build

# 실행
./gradlew bootRun

# 또는 JAR 실행
java -jar build/libs/common-backend-0.0.1-SNAPSHOT.jar
```

**환경 변수**:
```bash
# application.yml에서 설정 또는 환경 변수로 오버라이드
export SOCKETIO_PORT=9092
export REDIS_HOST=localhost
export REDIS_PORT=6380
export AI_IMAGE_URL=http://localhost:8001
export AI_TEXT_URL=http://localhost:8002
```

#### 3. AI Image Service

```bash
cd Service/ai-image-service

# 가상환경 생성
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 의존성 설치
pip install -r requirements.txt

# 실행
uvicorn app.main:app --host 0.0.0.0 --port 8001
```

#### 4. AI Text Service

```bash
cd Service/ai-text-service

# 가상환경 생성
python -m venv venv
source venv/bin/activate

# 의존성 설치
pip install -r requirements.txt

# 실행
uvicorn app.main:app --host 0.0.0.0 --port 8002
```

#### 5. Redis

```bash
# Docker로 Redis 실행
docker run -d -p 6380:6379 --name redis redis:7-alpine \
  redis-server --appendonly yes --maxmemory 512mb --maxmemory-policy allkeys-lru
```

### Docker Compose 배포

```bash
cd Infra/main-ec2

# 환경 변수 설정 (.env 파일 생성)
# MODEL_PATH, REDIS_HOST 등 설정

# 빌드 및 시작
docker-compose -f docker-compose.main.yml up -d --build

# 로그 확인
docker-compose -f docker-compose.main.yml logs -f

# 중지
docker-compose -f docker-compose.main.yml down
```