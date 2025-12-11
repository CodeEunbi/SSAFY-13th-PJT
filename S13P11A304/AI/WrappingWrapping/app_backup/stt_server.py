# stt api -> 이거 부터 실행해야함!!
import whisper
import torch
import os
import tempfile
import glob
from fastapi import FastAPI, File, UploadFile, HTTPException

## ffmpeg 설치(로컬에서 설치가 안돼서!!!!! EC2는 ffmpeg설치하고 이 코드 삭제하면 됨
# 압축 해제된 디렉토리 이름 가져오기
folder_name = glob.glob("ffmpeg-*")[0]

# 실행 파일이 있는 폴더를 PATH에 추가 (bin 디렉토리 없음, 바로 이 폴더에 ffmpeg 있음)
exec_path = os.path.join(os.getcwd(), folder_name)
os.environ["PATH"] = exec_path + ":" + os.environ["PATH"]

# 확인
# !ffmpeg -version

# CPU GPU 선택
def load_whisper_model():
    model_size = os.getenv("WHISPER_MODEL", "base")

    if torch.cuda.is_available():
        device = "cuda"
        print(f"GPU: {torch.cuda.get_device_name()}")
    else:
        device = "cpu"
        print("CPU 사용")

    model = whisper.load_model(model_size, device=device)
    return model, device

app = FastAPI()

# 서버 시작시 모델 로드
try:
    model, device = load_whisper_model()
except Exception as e:
    print(f"[ERROR] 모델 로드 실패: {e}")
    model, device = None, None

@app.get("/api/v1/test")
def api_test():
    return {"status": "ok", "device": device}

@app.post("/api/v1/transcribe")
async def analyze_audio(audio: UploadFile = File(...)):
    if model is None:
        raise HTTPException(status_code=500, detail="STT 모델이 로드되지 않았습니다")
    
    # 확장자 처리
    file_extension = audio.filename.split('.')[-1] if '.' in audio.filename else 'wav'
    
    with tempfile.NamedTemporaryFile(delete=False, suffix=f".{file_extension}") as tmp:
        content = await audio.read()
        tmp.write(content)
        tmp_path = tmp.name
    
    try:
        # STT 처리
        stt_result = model.transcribe(
            tmp_path,
            language="ko",
            fp16=False,
            verbose=False,
            temperature=0.0,
            no_speech_threshold=0.6,
            logprob_threshold=-1.0
        )
        text = stt_result["text"]
        print(f"[LOG] 변환 완료: {text[:50]}...")
        
        return text
        
    except Exception as e:
        print(f"[ERROR] 변환 실패: {e}")
        raise HTTPException(status_code=500, detail=f"음성 변환 실패: {str(e)}")
        
    finally:
        os.unlink(tmp_path)