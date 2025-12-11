!/bin/bash
# =============================================================================
# Infra/shared/ssl-init.sh
# Let's Encrypt SSL 인증서 초기 발급 스크립트
# =============================================================================

# 도움말 함수
show_help() {
    cat << EOF
🔒 SSL 인증서 초기 발급 도구

사용법:
    $0 <도메인> <이메일>

인자:
    도메인     발급받을 도메인명 (예: example.com)
    이메일     Let's Encrypt 계정용 이메일 주소

예시:
    $0 ai-extension.com admin@company.com
    $0 my-domain.co.kr devops@example.org

주의사항:
    - 도메인은 현재 서버 IP로 DNS가 설정되어 있어야 합니다
    - 80번 포트가 사용 가능해야 합니다 (다른 서비스 중지 필요)
    - 이메일은 인증서 만료 알림을 받을 주소입니다

EOF
}

# 인자 검증
if [ $# -eq 0 ]; then
    echo "❌ 오류: 인자가 제공되지 않았습니다."
    echo ""
    show_help
    exit 1
fi

if [ "$1" = "-h" ] || [ "$1" = "--help" ]; then
    show_help
    exit 0
fi

if [ $# -ne 2 ]; then
    echo "❌ 오류: 정확히 2개의 인자가 필요합니다. ($# 개 제공됨)"
    echo ""
    show_help
    exit 1
fi

# 인자 할당 ($1은 첫 번째 인자, $2는 두 번째 인자)
DOMAIN=$1
EMAIL=$2

# 도메인 형식 검증 (기본적인 검증)
if ! echo "$DOMAIN" | grep -qE '^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}$|^[a-zA-Z0-9]{1,63}\.[a-zA-Z]{2,}$'; then
    echo "❌ 오류: 올바른 도메인 형식이 아닙니다: $DOMAIN"
    echo "   예시: example.com, my-site.co.kr"
    exit 1
fi

# 이메일 형식 검증 (기본적인 검증)
if ! echo "$EMAIL" | grep -qE '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'; then
    echo "❌ 오류: 올바른 이메일 형식이 아닙니다: $EMAIL"
    echo "   예시: admin@company.com"
    exit 1
fi

echo "🔒 SSL 인증서 발급 시작"
echo "   도메인: $DOMAIN"
echo "   이메일: $EMAIL"
echo ""

# Docker가 실행 중인지 확인
if ! docker info >/dev/null 2>&1; then
    echo "❌ 오류: Docker가 실행되지 않았거나 접근할 수 없습니다."
    echo "   sudo systemctl start docker"
    exit 1
fi

# 80번 포트 사용 여부 확인
if netstat -tuln 2>/dev/null | grep -q ':80 '; then
    echo "⚠️  경고: 80번 포트가 사용 중입니다."
    echo "   다른 웹 서버를 일시 중지하고 다시 실행하세요."
    echo "   예: docker-compose down (다른 서비스 중지 후)"
    read -p "계속 진행하시겠습니까? (y/N): " confirm
    if [ "$confirm" != "y" ] && [ "$confirm" != "Y" ]; then
        echo "작업이 취소되었습니다."
        exit 1
    fi
fi

# Let's Encrypt 인증서 발급
echo "📝 Let's Encrypt 인증서 발급 중..."
docker run -it --rm \
    -v certbot-data:/etc/letsencrypt \
    -v certbot-webroot:/var/www/certbot \
    -p 80:80 \
    certbot/certbot certonly \
    --standalone \
    --email "$EMAIL" \
    --agree-tos \
    --no-eff-email \
    --non-interactive \
    -d "$DOMAIN"

# 발급 결과 확인
if [ $? -eq 0 ]; then
    echo ""
    echo "✅ SSL 인증서 발급 완료!"
    echo "   인증서 위치: /etc/letsencrypt/live/$DOMAIN/"
    echo "   유효기간: 90일 (자동 갱신 설정됨)"
    echo ""
    echo "📋 다음 단계:"
    echo "   1. nginx 설정에서 인증서 경로 확인"
    echo "   2. docker-compose로 서비스 재시작"
    echo "   3. https://$DOMAIN 접속 테스트"
else
    echo ""
    echo "❌ SSL 인증서 발급 실패!"
    echo "   - 도메인 DNS 설정 확인: $DOMAIN → 현재 서버 IP"
    echo "   - 방화벽 80번 포트 열기: sudo ufw allow 80"
    echo "   - 도메인 소유권 확인"
    exit 1
fi
