#!/bin/bash
# =====================================================================
# 윈도우 로컬 환경에서 Spring을 제외하고 컨테이너를 띄우기 위한 셸 스크립트 (Git Bash 용)
# =====================================================================

# --- 설정 ---
# 실행할 서비스 목록 (common-backend와 nginx 제외)
SERVICES_TO_RUN="fastapi-ai-image-service fastapi-ai-text-service redis"

# --- 스크립트 시작 ---
echo -e "\033[32m로컬 개발 환경을 위한 Docker 컨테이너를 시작합니다...\033[0m"

# 윈도우 경로 자동 변환 설정
# Git Bash는 이 설정이 기본적으로 잘 동작하는 경우가 많지만, 명시적으로 설정하여 안정성을 높입니다.
export COMPOSE_CONVERT_WINDOWS_PATHS=1

# Docker Compose 명령어 실행
# -f 옵션을 사용하여 두 개의 파일을 순서대로 지정합니다.
# 1. 기준이 되는 main.yml 파일을 먼저 지정 (중요!)
# 2. 덮어쓸 dev.yml 파일을 두 번째로 지정
docker-compose -f ../Infra/main-ec2/docker-compose.main.yml -f docker-compose.dev.yml up -d $SERVICES_TO_RUN

echo -e "\n\033[36m아래 서비스들이 백그라운드에서 실행되었습니다:\033[0m"
echo "$SERVICES_TO_RUN"
echo -e "\033[32mIntelliJ에서 'common-backend'를 실행해 주세요.\033[0m"
