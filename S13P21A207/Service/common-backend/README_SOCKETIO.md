# Socket.IO & FastAPI 통신 구조

## 개요
이 프로젝트는 Socket.IO를 통한 익스텐션과의 실시간 통신과 HTTP를 통한 FastAPI Docker 컨테이너와의 통신을 지원합니다.

## 아키텍처

```
익스텐션 (Socket.IO)
    ↓
카테고리별 핸들러들 (Adapter)
├── ConnectionHandler (기본 연결)
├── TextFilterHandler (텍스트 필터링)
├── ImageFilterHandler (이미지 필터링)
└── SettingsHandler (개인 설정)
    ↓
MessageApplicationService (Application)
    ↓
MessageService (Domain)
    ↓
DockerMessageClient (Infrastructure)
    ↓
FastAPI Docker Container (HTTP)
```

## 주요 컴포넌트

### 1. Socket.IO 설정 및 관리
- **SocketIOConfig**: Socket.IO 서버 설정
- **SocketIOServerManager**: 서버 생명주기 관리 (시작/종료)

### 2. 카테고리별 이벤트 핸들러 (adapter/api/socketio)
- **ConnectionHandler**: 기본 연결 관리 (connection-init, page-navigation, ping/pong)
- **TextFilterHandler**: 텍스트 필터링 (text-analysis → text-filter-result)
- **ImageFilterHandler**: 이미지 필터링 (image-analysis → image-filter-result)
- **SettingsHandler**: 개인 설정 (user-settings, settings-update)

### 3. 애플리케이션 서비스
- **MessageApplicationService**: 유스케이스 흐름 관리

### 4. 도메인 서비스
- **MessageService**: 비즈니스 로직 및 검증

### 5. 인프라스트럭처
- **DockerMessageClient**: FastAPI 컨테이너와의 HTTP 통신

## Socket.IO 이벤트 (Notion 명세 기준)

### 기본 연결 (ConnectionHandler)
#### 클라이언트 → 서버
- `connection-init`: 클라이언트 연결 초기화 및 사용자 인증
- `page-navigation`: 새로운 페이지로의 이동 알림
- `ping`: 연결 상태 확인을 위한 heartbeat

#### 서버 → 클라이언트
- `connection-init-ok`: connection-init에 대한 응답
- `pong`: ping에 대한 응답

### 텍스트 필터링 (TextFilterHandler)
#### 클라이언트 → 서버
- `text-analysis`: 텍스트 컨텐츠 AI 분석 요청

#### 서버 → 클라이언트
- `text-filter-result`: 텍스트 AI 분석 결과 응답

### 이미지 필터링 (ImageFilterHandler)
#### 클라이언트 → 서버
- `image-analysis`: 이미지 컨텐츠 AI 분석 요청

#### 서버 → 클라이언트
- `image-filter-result`: 이미지 AI 분석 결과 응답

### 개인 설정 (SettingsHandler)
#### 클라이언트 → 서버
- `user-settings`: 사용자 개인 필터링 설정 전송
- `settings-update`: 사용자 설정 변경 요청

#### 서버 → 클라이언트
- `settings-updated`: 설정 저장 완료 확인 응답
- `settings-saved`: 설정 업데이트 완료 확인 응답

### 공통 에러 응답
- `error`: 모든 카테고리에서 에러 발생 시 전송

## 메시지 형식 (MessageDto)

```json
{
  "messageId": "uuid",
  "type": "TEXT|IMAGE|GENERAL|FILTER_REQUEST|FILTER_RESPONSE",
  "content": "메시지 내용",
  "data": "Base64 인코딩된 데이터",
  "metadata": {},
  "timestamp": "2024-01-01T00:00:00",
  "senderId": "송신자ID",
  "status": "PENDING|PROCESSING|COMPLETED|FAILED",
  "errorMessage": "에러 메시지"
}
```

## FastAPI 엔드포인트

### 예상 FastAPI 엔드포인트
- `POST /api/message/process`: 일반 메시지 처리
- `POST /api/text/filter`: 텍스트 필터링
- `POST /api/image/filter`: 이미지 필터링
- `GET /health`: 컨테이너 상태 확인

## 설정

### application.yml
```yaml
socketio:
  server:
    host: localhost
    port: 9092

docker:
  fastapi:
    base-url: http://localhost:8000
```

## 사용 방법

1. **Spring Boot 애플리케이션 시작**
   ```bash
   ./gradlew bootRun
   ```

2. **Socket.IO 클라이언트 연결 및 초기화**
   ```javascript
   const socket = io('http://localhost:9092');

   socket.on('connect', () => {
     console.log('연결됨');

     // 연결 초기화
     socket.emit('connection-init', {
       extensionId: 'hyde-guard-v1.0',
       version: '1.0.0',
       userId: 'user123'
     });
   });

   // 연결 초기화 응답
   socket.on('connection-init-ok', (data) => {
     console.log('초기화 완료:', data);
   });

   // 텍스트 분석 요청
   socket.emit('text-analysis', {
     textElements: [
       { elementId: 'text1', content: '분석할 텍스트 내용' }
     ]
   });

   // 텍스트 분석 결과 수신
   socket.on('text-filter-result', (result) => {
     console.log('텍스트 분석 결과:', result);
   });
   ```

3. **FastAPI Docker 컨테이너 준비**
   - FastAPI 애플리케이션이 포트 8000에서 실행되어야 함
   - 위에 명시된 엔드포인트들을 구현해야 함

## 확장 가능한 구조

- **새로운 이벤트 카테고리 추가**: 새로운 핸들러 클래스를 `adapter.api.socketio` 패키지에 생성
- **기존 카테고리에 이벤트 추가**: 해당 핸들러 클래스에 새로운 리스너 메서드 추가
- **새로운 메시지 타입 추가**: `MessageDto.MessageType`에 추가
- **새로운 외부 서비스 연동**: `infrastructure.connector` 패키지에 클라이언트 추가

## 에러 코드 (Notion Failure Code 기준)
- **CL101**: 필수필드 누락 및 잘못된 JSON 형식
- **CL102**: 유효하지 않은 URL
- **CL103**: 요청한도 초과
- **SV101**: 외부서비스 연결 실패
- **SV102**: 서버 과부하 및 점검
- **AI301**: 이미지분석 중 오류
- **AI302**: 이미지 분석 또는 다운로드 타임 아웃