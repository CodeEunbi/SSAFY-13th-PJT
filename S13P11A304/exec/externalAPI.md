# 외부 API

### 2-1. 인프라 / 배포

- **AWS EC2**
    - Ubuntu 기반 EC2 인스턴스 사용
    - **백엔드(Spring Boot)**, **프론트엔드(React)**는 각각 Docker 컨테이너로 배포
    - **STT 서버(Whisper 기반 FastAPI)** 역시 Docker 이미지로 빌드 후 EC2에서 컨테이너 실행
- **CI/CD 파이프라인**
    - GitLab CI/CD를 통해 빌드 및 배포 자동화
    - 파이프라인 단계:
        1. GitLab에서 소스 빌드
        2. Docker 이미지 빌드 및 Docker Hub 푸시
        3. EC2에서 해당 이미지를 Pull 후 컨테이너 실행

---

### 2-2. 웹 · 보안

- **Nginx**
    - Reverse Proxy 및 HTTPS 인증서 적용
    - Let’s Encrypt를 통해 무료 SSL 인증서 발급
    - 주요 라우팅:
        - `/` → 프론트엔드 (포트 3000)
        - `/api` → 백엔드 (포트 8080)
        - `/stt` → STT 서버 (포트 8000)
- **도메인**
    - 서비스 도메인: `pitch-it.co.kr`

---

### 2-3. 실시간 미디어

- **LiveKit + OpenVidu**
    - LiveKit이 실시간 미디어 중개자 역할 수행
    - OpenVidu 서버와 연동하여 화상회의 및 실시간 발표 기능 제공
    - EC2에서 Docker로 배포하여 운영

---

### 2-4. 음성 인식 (STT)

- **Whisper STT 서버**
    - FastAPI 기반 STT 서버를 Docker로 배포
    - 입력된 음성을 텍스트로 변환하여 DB(MySQL)에 저장
    - EC2 로컬 MySQL과 직접 연결

---

### 2-5. 인증 / 로그인

- **Google OAuth**
    - 사용자 로그인에 Google OAuth 2.0 활용
    - 발급받은 액세스 토큰 기반으로 사용자 인증 처리
- **JWT**
    - 로그인 완료 후 자체 JWT 토큰을 발급하여 세션 관리
    - 프론트엔드와 백엔드 간 인증에 사용

---

### 2-6. 메일 서비스

- **SMTP**
    - 사용자 알림(예: 회의 예약 안내, 발표 순서 공지 등)에 SMTP 메일 서버 사용
    - Spring Boot Mail 모듈 기반으로 발송 처리

---

### 2-7. AI API

- **ChatGPT API**
    - 발표 주제 자동 생성, 면접 분석 리포트 등 AI 기능 제공
    - OpenAI API Key를 환경 변수로 관리하여 백엔드에서 호출