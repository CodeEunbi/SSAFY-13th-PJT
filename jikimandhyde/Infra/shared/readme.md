# 🔒 SSL 인증서 설정 가이드

## 📋 사전 준비사항

### 1. 도메인 DNS 설정
Route53 또는 도메인 제공업체에서 A 레코드 설정
A Record: your-domain.com → 보조EC2-Public-IP
text

### 2. 방화벽 설정 확인
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw reload
sudo ufw status

text

### 3. 기존 웹 서비스 중지 (일시적)
80번 포트 사용 중인 서비스 확인
sudo netstat -tuln | grep :80

Docker Compose 서비스 중지 (필요시)
cd /home/ubuntu/app
docker-compose -f docker-compose.support.yml stop nginx-ssl

text

## 🚀 SSL 인증서 발급

### 스크립트 실행 권한 부여
chmod +x Infra/shared/ssl-init.sh

text

### 인증서 발급 실행
기본 사용법
./Infra/shared/ssl-init.sh your-domain.com admin@company.com

실제 예시
./Infra/shared/ssl-init.sh ai-extension.mycompany.com devops@mycompany.com

text

### 도움말 확인
./Infra/shared/ssl-init.sh --help

text

## 🔍 발급 후 확인사항

### 1. 인증서 파일 확인
Docker 볼륨에서 인증서 확인
docker run --rm -it -v certbot-data:/certs alpine ls -la /certs/live/

인증서 내용 확인
docker run --rm -it -v certbot-data:/certs alpine
openssl x509 -in /certs/live/your-domain.com/fullchain.pem -text -noout

text

### 2. Nginx 설정 업데이트
Infra/support-ec2/nginx/ssl.conf에서 도메인명 변경
server_name your-actual-domain.com; # 실제 도메인으로 변경
ssl_certificate /etc/letsencrypt/live/your-actual-domain.com/fullchain.pem;
ssl_certificate_key /etc/letsencrypt/live/your-actual-domain.com/privkey.pem;

text

### 3. 서비스 재시작
cd /home/ubuntu/app
docker-compose -f docker-compose.support.yml up -d

text

### 4. HTTPS 접속 테스트
인증서 체인 확인
curl -I https://your-domain.com

SSL Labs 테스트 (웹브라우저에서)
https://www.ssllabs.com/ssltest/analyze.html?d=your-domain.com
text

## 🔄 자동 갱신 확인

### Certbot 컨테이너가 자동 갱신 중인지 확인
Certbot 컨테이너 로그 확인
docker logs support-certbot

수동 갱신 테스트 (dry-run)
docker run --rm -it
-v certbot-data:/etc/letsencrypt
-v certbot-webroot:/var/www/certbot
certbot/certbot renew --dry-run

text

## ⚠️ 문제 해결

### 발급 실패 시
1. DNS 전파 확인
nslookup your-domain.com
dig your-domain.com

2. 포트 80 접근 확인
curl -I http://your-domain.com

3. 방화벽 설정 재확인
sudo ufw status numbered

4. 도메인 소유권 확인 (웹훅 방식)
docker run --rm -it -v certbot-webroot:/var/www/certbot
-p 80:80 nginx:alpine

text

### 인증서 강제 재발급
기존 인증서 삭제 후 재발급
docker run --rm -it -v certbot-data:/etc/letsencrypt certbot/certbot
delete --cert-name your-domain.com

다시 발급
./Infra/shared/ssl-init.sh your-domain.com admin@company.com

text

## 📝 참고사항

- **인증서 유효기간**: 90일 (자동 갱신됨)
- **갱신 주기**: 매 12시간마다 확인
- **백업**: certbot-data 볼륨을 정기적으로 백업 권장
- **모니터링**: 인증서 만료 30일 전 이메일 알림 발송