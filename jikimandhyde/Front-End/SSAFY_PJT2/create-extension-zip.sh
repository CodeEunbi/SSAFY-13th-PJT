#!/bin/sh
# =============================================================================
# 크롬 익스텐션 ZIP 패키지 생성 스크립트
# =============================================================================

# 변수 설정
EXTENSION_DIR="/var/www/html/extension"          # 익스텐션 소스 디렉토리
ZIP_DIR="/var/www/html/downloads"               # ZIP 파일 저장 디렉토리
VERSION=$(date +%Y%m%d_%H%M%S)                  # 버전명 (타임스탬프)
ZIP_NAME="chrome-extension-${VERSION}.zip"      # ZIP 파일명

# 디렉토리 생성
mkdir -p ${ZIP_DIR}

# 익스텐션 파일들을 ZIP으로 압축 (개발자가 바로 설치할 수 있도록)
cd ${EXTENSION_DIR}
zip -r "${ZIP_DIR}/${ZIP_NAME}" . -x "*.map" "*.ts" "node_modules/*" ".git/*"

# 최신 버전 심볼릭 링크 생성 (항상 최신 버전을 가리키도록)
ln -sf ${ZIP_NAME} ${ZIP_DIR}/latest.zip

# 다운로드 페이지 HTML 생성
cat > /var/www/html/index.html << EOF
<!DOCTYPE html>
<html>
<head>
    <title>Chrome Extension Download</title>
    <meta charset="UTF-8">
</head>
<body>
    <h1>🔗 Chrome Extension Download</h1>
    <p>최신 버전: ${ZIP_NAME}</p>
    <p>빌드 시간: $(date)</p>
    
    <h2>다운로드</h2>
    <a href="/downloads/${ZIP_NAME}" download>
        📥 최신 버전 다운로드
    </a>
    
    <h2>설치 방법</h2>
    <ol>
        <li>Chrome 브라우저에서 <code>chrome://extensions/</code> 접속</li>
        <li>우상단 '개발자 모드' 활성화</li>
        <li>'압축해제된 확장 프로그램을 로드합니다' 클릭</li>
        <li>다운로드 후 압축 해제한 폴더 선택</li>
    </ol>
</body>
</html>
EOF

echo "✅ 익스텐션 ZIP 패키지 생성 완료: ${ZIP_NAME}"
