# 폴더 구조 가이드

## 📁 프로젝트 구조

```
src/main/java/backend/SSAFY_PTJ2/
├─ adapter/                 # 외부 요청 처리 계층
│  └─ api/socketio/        # Socket.IO 이벤트 핸들러
│
├─ application/            # 비즈니스 로직 조합 계층
│  ├─ scheduler/          # 동기 처리 스케줄러
│  └─ usecase/           # 처리 전/후 유즈케이스
│
├─ domain/                # 도메인 비즈니스 로직
│  ├─ common/            # 공통 도메인 (DTO, 서비스)
│  ├─ imagefilter/       # 이미지 필터 도메인
│  └─ textfilter/        # 텍스트 필터 도메인
│
├─ infrastructure/        # 외부 시스템 연동
│  ├─ ai/               # AI 컨테이너 통신 클라이언트
│  ├─ cache/            # Redis 캐시 서비스
│  ├─ connector/        # 외부 시스템 커넥터
│  └─ websocket/        # Socket.IO 설정
│
└─ global/               # 전역 설정 및 공통 처리
   ├─ config/           # 설정 클래스
   └─ response/         # 공통 응답 처리
```

## 🔄 데이터 흐름

```
Socket.IO 클라이언트
       ↓
[adapter] ImageFilterHandler / TextFilterHandler
       ↓
[application] PreProcessingUseCase (캐시 조회)
       ↓
[application] SynchronousProcessingScheduler (우선순위 처리)
       ↓
[infrastructure] ImageAIClient / TextAIClient (AI 분석)
       ↓
[application] PostProcessingUseCase (캐시 저장 + 설정 적용)
       ↓
Socket.IO 응답 전송
```

## 📋 계층별 역할

- **Adapter**: Socket.IO 이벤트 수신 및 응답 전송
- **Application**: 비즈니스 로직 조합 및 처리 플로우 관리
- **Domain**: 핵심 비즈니스 규칙 및 도메인 로직
- **Infrastructure**: 외부 시스템(Redis, AI 컨테이너) 연동