"""STT 텍스트 전처리 서비스 - 음성인식 오류 정정"""
import logging
import time
from openai import AsyncOpenAI
from tenacity import retry, stop_after_attempt, wait_exponential

from core.config import get_settings

# 로거 설정
logger = logging.getLogger(__name__)


class TextPreprocessor:
    #STT 결과 텍스트 전처리 서비스
    
    def __init__(self):
        try:
            self.settings = get_settings()
            self.client = AsyncOpenAI(
                api_key=self.settings.openai_api_key,
                base_url=self.settings.openai_base_url
            )
            logger.info("텍스트 전처리 서비스 초기화 완료")
        except Exception as e:
            logger.error(f"텍스트 전처리 서비스 초기화 실패: {str(e)}")
            self.client = None
    
    
    async def preprocess_text(self, rawText: str, context: str = "면접답변") -> str:
        """
        STT 결과 텍스트를 전처리하여 오타 및 음성인식 오류 정정
        
        Args:
            rawText: STT로 변환된 원본 텍스트
            context: 텍스트의 맥락 (면접답변)
            
        Returns:
            str: 전처리된 텍스트
        """
        if not self.client:
            logger.warning("OpenAI 클라이언트가 초기화되지 않았습니다. 원본 텍스트 반환")
            return rawText
            
        try:
            logger.info("STT 텍스트 전처리 시작...")
            startTime = time.time()
            
            # 전처리 프롬프트 생성
            prompt = self._create_preprocessing_prompt(rawText, context)
            
            # OpenAI API 호출
            processedText = await self._call_openai_api(prompt)
            
            processingTime = time.time() - startTime
            logger.info(f"텍스트 전처리 완료 (처리시간: {processingTime:.2f}초)")
            logger.info(f"원본 길이: {len(rawText)}자, 처리 후 길이: {len(processedText)}자")
            
            return processedText
            
        except Exception as e:
            logger.error(f"텍스트 전처리 실패: {str(e)}")
            logger.warning("원본 텍스트를 그대로 반환합니다")
            return rawText
    
    
    def _create_preprocessing_prompt(self, rawText: str, context: str) -> str:
        """텍스트 전처리 프롬프트 생성"""
        
        prompt = f"""
        당신은 음성인식(STT) 결과 텍스트를 정제하는 전문가입니다.

        다음은 {context} 내용을 음성인식한 결과입니다. 음성인식 과정에서 발생한 오류들을 수정해주세요.

        [원본 STT 텍스트]
        {rawText}

        수정 원칙:
        1. 문맥과 어순은 절대 변경하지 마세요 - 원본의 문장 구조와 순서 유지
        2. 단어만 정정하세요 - 음성인식 오류로 잘못 인식된 단어들을 올바른 맞춤법이 적용된 단어로 수정
        3. 창조하지 마세요 - 없는 내용을 추가하거나 의미를 바꾸지 않음
        4. 기술용어 정정 - IT/개발 관련 전문 용어들을 정확하게 수정

        일반적인 음성인식 오류 패턴 예시:
        - "제거" → "재고"
        - "담기대응" → "단기대응"  
        - "컬러물" → "컬럼들"
        - "프롼트 핸드" → "프론트엔드"
        - "마이 에스키" → "MySQL"
        - "테르픽" → "트래픽"
        - "인덱스" → "인덱스"
        - "커리" → "쿼리"
        - "디비" → "DB" (그대로 유지 가능)
        - "풍목" → "품목"
        - "문이터링" → "모니터링"

        수정된 텍스트만 출력하세요. 추가 설명이나 주석은 포함하지 마세요.
        """
        
        return prompt
    
    
    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=2, max=8)
    )
    async def _call_openai_api(self, prompt: str) -> str:
        """OpenAI API 호출 (재시도 로직 포함)"""
        try:
            response = await self.client.chat.completions.create(
                model=self.settings.openai_model,
                messages=[
                    {"role": "system", "content": "당신은 음성인식 결과 텍스트를 정제하는 전문가입니다. 문맥과 어순은 유지하되 잘못된 단어만 정확하게 수정합니다."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=self.settings.openai_max_tokens,
                temperature=0,  # 일관성을 위해 낮은 온도 설정
                timeout=self.settings.openai_timeout
            )
            return response.choices[0].message.content.strip()
            
        except Exception as e:
            logger.error(f"OpenAI API 호출 실패: {str(e)}")
            raise Exception(f"OpenAI API 호출 실패: {str(e)}")