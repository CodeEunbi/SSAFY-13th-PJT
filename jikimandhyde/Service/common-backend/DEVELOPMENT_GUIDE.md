# 개발 가이드 - 동기 처리 아키텍처

## 📋 개요

Socket.IO 이벤트 처리를 기존 비동기 방식에서 동기 방식으로 변경하고, 4명의 개발자가 병렬로 개발할 수 있도록 유닛별로 분업합니다.

## 🏗️ 전체 아키텍처

```
Socket.IO 이벤트 → 핸들러 (동기)
    ↓
처리전 유즈케이스 (캐시 조회)
    ↓
동기 처리 스케줄러 (우선순위 큐 + 락)
    ↓
AI 분석 클라이언트 (HTTP 동기)
    ↓
처리후 유즈케이스 (캐시 저장 + 개인설정 적용)
    ↓
Socket.IO 응답 전송
```

## 👥 개발자별 담당 유닛

### 🔴 개발자 A: 캐시 & 설정 관리
**📂 담당 파일:**
- `infrastructure/cache/RedisCacheService.java`
- `infrastructure/cache/RedisUserSettingsService.java`
- `test/infrastructure/cache/RedisCacheServiceTest.java`

**🎯 핵심 구현 사항:**
1. Redis 연결 및 설정 관리
2. 캐시 키 네이밍 전략 (`image:hash`, `text:hash`)
3. TTL 관리 (기본 1시간, 설정 가능)
4. 캐시 통계 수집 (히트율, 키 수)
5. 사용자 설정 CRUD 및 검증

**🧪 테스트 전략:**
- TestContainers Redis 사용
- 캐시 만료, 동시성, 대용량 데이터 테스트

---

### 🔵 개발자 B: AI 통신 클라이언트
**📂 담당 파일:**
- `infrastructure/ai/ImageAIClient.java`
- `infrastructure/ai/TextAIClient.java`
- `test/infrastructure/ai/ImageAIClientTest.java`
- `test/infrastructure/ai/TextAIClientTest.java`
- `domain/imagefilter/dto/ImageAIRequest.java`
- `domain/imagefilter/dto/ImageAIResponse.java`
- `domain/textfilter/dto/TextAIRequest.java`
- `domain/textfilter/dto/TextAIResponse.java`
- `domain/imagefilter/converter/ImageAnalysisConverter.java`
- `domain/textfilter/converter/TextAnalysisConverter.java`
- `infrastructure/ai/converter/ImageAnalysisConverterImpl.java`
- `infrastructure/ai/converter/TextAnalysisConverterImpl.java`

**🎯 핵심 구현 사항:**
1. HTTP 클라이언트 설정 (RestTemplate/WebClient)
2. **외부 AI 컨테이너 통신 DTO 구현**
   - 이미지: Form-data 배치 전송 (/predict/batch)
   - 텍스트: JSON 배치 전송 (/filter_page)
3. **AI 응답을 AnalysisResult로 변환**
   - 혐오 카테고리 표준화 (CR→CRIME, IN→INSULT 등)
   - 배치 분석 결과를 통합 AnalysisResult로 변환
4. 타임아웃 및 재시도 로직
5. AI 컨테이너 헬스체크
6. 에러 처리 및 예외 매핑

**🧪 테스트 전략:**
- WireMock으로 AI 컨테이너 Mock
- 타임아웃, 재시도, 배치 처리 테스트
- 응답 변환 로직 단위 테스트

---

### 🟡 개발자 C: 스케줄러 & 처리 로직
**📂 담당 파일:**
- `application/scheduler/SynchronousProcessingScheduler.java`
- `test/application/scheduler/SynchronousProcessingSchedulerTest.java`

**🎯 핵심 구현 사항:**
1. PriorityQueue 기반 요청 스케줄링
2. 뷰포트 컨텐츠 우선순위 알고리즘
3. AI 컨테이너별 ReentrantLock 관리
4. 처리 시간 모니터링 및 통계
5. 요청 취소 및 타임아웃 처리

**🧪 테스트 전략:**
- 멀티스레드 동시성 테스트
- 우선순위 큐 정렬 테스트
- 락 데드락 방지 테스트

---

### 🟢 개발자 D: 핸들러 & 유즈케이스
**📂 담당 파일:**
- `adapter/api/socketio/ImageFilterHandler.java` (리팩토링)
- `adapter/api/socketio/TextFilterHandler.java` (리팩토링)
- `application/usecase/PreProcessingUseCase.java`
- `application/usecase/PostProcessingUseCase.java`
- `application/ProcessingOrchestrator.java`

**🎯 핵심 구현 사항:**
1. Socket.IO 핸들러 동기 처리 변경
2. 처리 전/후 유즈케이스 구현
3. 전체 플로우 오케스트레이션
4. 클라이언트 응답 형식 변환
5. 통합 테스트 및 E2E 테스트

**🧪 테스트 전략:**
- 모든 의존성 Mock 테스트
- Socket.IO 클라이언트 통합 테스트

## 🚀 개발 진행 순서

### Phase 1 (1-2일): 기반 설정
1. **공통 작업** - 모든 개발자
   - 인터페이스 및 DTO 검토
   - 개발 환경 설정
   - Mock 구현체 확인

### Phase 2 (3-7일): 병렬 개발
- **개발자 A, B, C**: 각자 유닛 개발
- **개발자 D**: 기존 코드 분석 및 설계 준비

### Phase 3 (8-10일): 통합 & 테스트
- **개발자 D**: 전체 통합 및 E2E 테스트
- **전체**: 버그 수정 및 성능 최적화

## 📝 공통 개발 규칙

### 코딩 컨벤션
- 로깅: 주요 단계마다 INFO 레벨 로그
- 예외: 구체적인 예외 타입 및 에러 코드 사용

### 테스트 규칙
- 커버리지: 최소 80% 이상
- 통합 테스트: 실제 외부 의존성 사용
- Mock 테스트: 빠른 피드백을 위한 단위 테스트

## 🔍 디버깅 팁

### 로그 레벨 설정
```yaml
logging:
  level:
    backend.SSAFY_PTJ2.infrastructure.cache: DEBUG
    backend.SSAFY_PTJ2.infrastructure.ai: DEBUG
    backend.SSAFY_PTJ2.application.scheduler: DEBUG
    backend.SSAFY_PTJ2.adapter.api.socketio: INFO
```

### 성능 모니터링
- 각 유닛의 처리 시간 측정
- 캐시 히트율 모니터링
- 메모리 사용량 추적

## 🚨 주의사항

### 의존성 관리
- 인터페이스 변경 시 즉시 공유
- 새로운 의존성 추가 시 사전 협의

### 성능 고려사항
- 동기 처리로 인한 응답 시간 증가 주의
- 메모리 누수 방지 (큐 크기 제한)
- 데드락 방지 (락 순서 일관성)

### 보안 주의사항
- Redis 연결 정보 암호화
- AI 컨테이너 통신 시 API 키 관리
- 사용자 데이터 로깅 시 개인정보 마스킹