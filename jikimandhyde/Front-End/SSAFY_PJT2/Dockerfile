# =============================================================================
# 크롬 익스텐션 빌드용 Dockerfile - Node.js 기반 React/TypeScript
# =============================================================================

# Node.js 20 Alpine 이미지 사용 (Vite 요구사항 충족)
FROM node:20.18-alpine AS builder

# 캐시 무효화를 위한 더미 라인 (build-20250917-2154)
RUN echo "Force cache invalidation: build-20250917-2154"

# 빌드 작업 디렉토리 설정
WORKDIR /app

# Git 설치 (일부 npm 패키지에서 필요할 수 있음)
RUN apk add --no-cache git

# package.json과 package-lock.json 먼저 복사 (Docker 레이어 캐싱 최적화)
COPY package*.json ./

# npm 의존성 설치 (개발 의존성 포함, 빌드에 필요)
RUN npm ci --include=dev

# 소스코드 복사
COPY . .

# TypeScript 컴파일 및 Vite 빌드 실행 (익스텐션용 최적화)
RUN npm run build

# =============================================================================
# Stage 2: 익스텐션 패키징 및 배포 준비
# =============================================================================

# Alpine 이미지 사용 (빌드 전용)
FROM alpine:latest

# 빌드된 익스텐션 파일들을 최종 위치로 복사
COPY --from=builder /app/dist /var/www/html/extension

# 익스텐션 ZIP 파일 생성 스크립트 복사
COPY ./create-extension-zip.sh /usr/local/bin/

# 필요한 디렉토리 생성 및 ZIP 패키지 생성
RUN mkdir -p /var/www/html/downloads && \
    apk add --no-cache zip && \
    chmod +x /usr/local/bin/create-extension-zip.sh && \
    /usr/local/bin/create-extension-zip.sh && \
    ls -la /var/www/html/downloads/ && \
    echo "ZIP files created successfully"


# 빌드 완료 후 종료 (빌드 전용 컨테이너)
CMD ["echo", "Extension build completed successfully"]
