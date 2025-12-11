#!/bin/bash
# =============================================================================
# 메인 EC2 최초 설정 및 Jenkins 실행 스크립트
# GitLab에서 코드를 clone한 후 빈 EC2에서 실행하는 스크립트
# =============================================================================

set -e

echo "🚀 메인 EC2 최초 설정 시작..."

# 현재 경로 확인 및 설정
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
echo "📁 프로젝트 루트: $PROJECT_ROOT"

# 1. 시스템 패키지 업데이트 및 필수 도구 설치
echo "📦 시스템 패키지 업데이트 중..."
sudo apt-get update
sudo apt-get install -y curl git docker.io docker-compose

# 2. Docker 서비스 시작 및 활성화
echo "🐳 Docker 서비스 설정 중..."
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -aG docker ubuntu

# 3. 필수 디렉토리 생성
echo "📁 애플리케이션 디렉토리 구조 생성 중..."
sudo mkdir -p /home/ubuntu/app/{models,logs/{fastapi,nginx},extension-downloads,data}
sudo mkdir -p /home/ubuntu/cicd/jenkins-data
sudo mkdir -p /home/ubuntu/ssh-keys

# 권한 설정
sudo chown -R ubuntu:ubuntu /home/ubuntu/app
sudo chown -R ubuntu:ubuntu /home/ubuntu/cicd
sudo chmod -R 755 /home/ubuntu/app
sudo chmod -R 755 /home/ubuntu/cicd

# 4. Docker 네트워크 생성
echo "🌐 Docker 네트워크 생성 중..."
NETWORK_NAME="s13p21a207_main-network"
docker network create $NETWORK_NAME 2>/dev/null || echo "네트워크 이미 존재함: $NETWORK_NAME"

# 5. 프로젝트 파일을 app 디렉토리에 복사 (심볼릭 링크 생성)
echo "🔗 프로젝트 파일 링크 생성 중..."
if [ ! -L /home/ubuntu/app/AI ]; then
    ln -sf "$PROJECT_ROOT/AI" /home/ubuntu/app/AI
fi
if [ ! -L /home/ubuntu/app/Back-End ]; then
    ln -sf "$PROJECT_ROOT/Back-End" /home/ubuntu/app/Back-End
fi
if [ ! -L /home/ubuntu/app/Front-End ]; then
    ln -sf "$PROJECT_ROOT/Front-End" /home/ubuntu/app/Front-End
fi
if [ ! -L /home/ubuntu/app/Infra ]; then
    ln -sf "$PROJECT_ROOT/Infra" /home/ubuntu/app/Infra
fi

# 6. Jenkins 독립 실행
echo "🔧 Jenkins 컨테이너 실행 중..."
chmod +x "$SCRIPT_DIR/scripts/jenkins-standalone.sh"
bash "$SCRIPT_DIR/scripts/jenkins-standalone.sh"

# 7. 설정 완료 안내
echo ""
echo "🎉 설정 완료!"
echo "📌 Jenkins 접속: http://$(curl -s ifconfig.me):9090"
echo "📌 네트워크: $NETWORK_NAME"
echo "📌 애플리케이션 경로: /home/ubuntu/app"
echo ""
echo "다음 단계:"
echo "1. Jenkins 웹 UI에서 초기 설정 완료"
echo "2. GitLab Credentials 설정 (gitlab-token)"
echo "3. SSH Credentials 설정 (Support EC2 접근용)"
echo "4. Pipeline Job 생성 (Repository: $PROJECT_ROOT)"
echo "5. Build Now 실행"
echo ""
echo "📋 유용한 명령어:"
echo "  Jenkins 로그: docker logs main-jenkins"
echo "  Jenkins 재시작: $SCRIPT_DIR/scripts/jenkins-standalone.sh"
echo "  앱 정리: sudo docker-compose -f /home/ubuntu/app/Infra/main-ec2/docker-compose.main.yml down -v"