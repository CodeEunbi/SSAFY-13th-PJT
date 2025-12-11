import uvicorn

# 서버 실행 설정
if __name__ == "__main__":
    uvicorn.run(
        "main:app",  # 파일명이 main.py인 경우
        host="0.0.0.0",
        port=8000,
        reload=False,  # 프로덕션에서는 False
        workers=1      # CPU 모델이므로 단일 워커 권장
    )