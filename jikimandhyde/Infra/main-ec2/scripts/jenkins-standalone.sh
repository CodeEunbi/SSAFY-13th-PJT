#!/bin/bash
# =============================================================================
# Jenkins 독립 실행 스크립트 (재실행용, Bash-quote 안전 버전)
# =============================================================================

set -e

echo "🔧 Jenkins 컨테이너 설정 중..."

NETWORK_NAME="s13p21a207_main-network"

# Docker 네트워크 존재 확인 및 생성
if ! docker network ls | grep -q "$NETWORK_NAME"; then
    echo "📡 네트워크 생성: $NETWORK_NAME"
    docker network create "$NETWORK_NAME"
fi

# 기존 Jenkins 컨테이너 정리
echo "🔄 기존 Jenkins 정리 중..."
docker stop main-jenkins 2>/dev/null || true
docker rm main-jenkins 2>/dev/null || true

# Jenkins 데이터 디렉토리 권한 설정
sudo chown -R 1000:1000 /home/ubuntu/cicd/jenkins-data 2>/dev/null || true

# Jenkins 컨테이너 실행
echo "🚀 Jenkins 컨테이너 실행 중..."
docker run -d \
  --name main-jenkins \
  --network "$NETWORK_NAME" \
  -p 9090:8080 \
  -p 50000:50000 \
  -e TZ=Asia/Seoul \
  -e JAVA_OPTS="-Duser.timezone=Asia/Seoul -Xmx2G -Xms1G" \
  -e JENKINS_OPTS="--httpPort=8080" \
  -v /home/ubuntu/cicd/jenkins-data:/var/jenkins_home \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -v /home/ubuntu/ssh-keys:/var/jenkins_home/.ssh:ro \
  -v /home/ubuntu/app:/home/ubuntu/app \
  --user root \
  --restart unless-stopped \
  jenkins/jenkins:lts

# 컨테이너 시작 대기
echo "⏳ Jenkins 컨테이너 시작 대기 중...(30초)"
sleep 30

# Jenkins 컨테이너 내부에 필수 도구 설치
echo "🔧 Jenkins 컨테이너 내부 도구 설치 중..."
docker exec -u root main-jenkins bash -c "
  set -e

  echo '📦 패키지 업데이트 및 필수 도구 설치'
  apt-get update -qq
  apt-get install -y -qq curl wget git

  echo '🐳 Docker CLI 설치'
  curl -fsSL https://get.docker.com -o get-docker.sh
  sh get-docker.sh
  rm get-docker.sh

  echo '🛠 Docker Compose 설치'
  DOCKER_COMPOSE_VERSION=\$(curl -s https://api.github.com/repos/docker/compose/releases/latest | grep 'tag_name' | cut -d'\"' -f4)
  curl -L \"https://github.com/docker/compose/releases/download/\$DOCKER_COMPOSE_VERSION/docker-compose-\$(uname -s)-\$(uname -m)\" -o /usr/local/bin/docker-compose
  chmod +x /usr/local/bin/docker-compose

  echo '👤 Jenkins 사용자 docker 그룹에 추가'
  usermod -aG docker jenkins

  echo '🐙 GitHub CLI 설치 (선택사항)'
  curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg
  chmod go+r /usr/share/keyrings/githubcli-archive-keyring.gpg
  echo 'deb [arch=\$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main' | tee /etc/apt/sources.list.d/github-cli.list > /dev/null
  apt-get update -qq
  apt-get install -y -qq gh

  echo '✅ 설치된 도구 버전 확인'
  docker --version
  docker-compose --version
  git --version
  gh --version
"

# Jenkins 초기 패스워드 대기
echo "🔑 Jenkins 초기 설정 준비 중..."
sleep 10

# Jenkins 상태 확인
if docker ps | grep -q main-jenkins; then
    echo ""
    echo "🎉 Jenkins 실행 완료!"
    echo "📌 접속 URL: http://$(curl -s ifconfig.me):9090"
    echo "📌 내부 접속: http://localhost:9090"
    echo "📌 네트워크: $NETWORK_NAME"
    echo ""
    echo "🔑 Jenkins 초기 관리자 패스워드:"
    docker exec main-jenkins cat /var/jenkins_home/secrets/initialAdminPassword 2>/dev/null || echo "  (패스워드 생성 중... 1-2분 후 다시 확인하세요)"
    echo ""
    echo "📋 유용한 명령어:"
    echo "  Jenkins 로그: docker logs main-jenkins"
    echo "  Jenkins 재시작: docker restart main-jenkins"
    echo "  Jenkins 정지: docker stop main-jenkins"
    echo "  초기 패스워드: docker exec main-jenkins cat /var/jenkins_home/secrets/initialAdminPassword"
    echo ""
    echo "🔧 Jenkins 설정 가이드:"
    echo "1. 위 URL 접속"
    echo "2. 초기 패스워드 입력"
    echo "3. 'Install suggested plugins' 선택"
    echo "4. 관리자 계정 생성"
    echo "5. Credentials에서 GitLab 토큰 및 SSH 키 설정"
    echo "6. Pipeline 프로젝트 생성"
else
    echo "❌ Jenkins 시작 실패. 로그를 확인하세요:"
    echo "docker logs main-jenkins"
    exit 1
fi
