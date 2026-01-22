"""면접 평가 리포트 생성 서비스 - OpenAI GPT 기반"""
import logging
import time
import json
from openai import AsyncOpenAI
from tenacity import retry, stop_after_attempt, wait_exponential

from core.models import ReportRequest, ReportData
from core.config import get_settings

# 로거 설정
logger = logging.getLogger(__name__)


class ReportGenerator:
    #면접 평가 리포트 생성 서비스
    
    def __init__(self):
        try:
            self.settings = get_settings()
            self.client = AsyncOpenAI(
                api_key=self.settings.openai_api_key,
                base_url=self.settings.openai_base_url
            )
            logger.info("리포트 생성 서비스 초기화 완료")
        except Exception as e:
            logger.error(f"리포트 생성 서비스 초기화 실패: {str(e)}")
            self.client = None
    
    
    async def generate_report(self, request: ReportRequest) -> ReportData:
        """
        전처리된 텍스트를 구조화된 면접 평가 리포트로 변환
        
        Args:
            request: 리포트 생성 요청 (전처리된 텍스트 포함)
            
        Returns:
            ReportData: 생성된 면접 평가 리포트
        """
        start_time = time.time()
        
        try:
            logger.info(f"면접 평가 리포트 생성 시작 - 사용자ID: {request.userId}, 직무: {request.job}, 유형: {request.mode}")
            
            # GPT 프롬프트 생성
            prompt = self._create_evaluation_prompt(request)
            
            # OpenAI API 호출
            gpt_response = await self._call_openai_api(prompt)
            
            # 응답 파싱
            report_data = self._parse_gpt_response(gpt_response, request)
            
            # 처리 시간 계산
            processing_time = time.time() - start_time
            
            logger.info(f"면접 평가 리포트 생성 완료 - 제목: {report_data.title} (처리시간: {processing_time:.2f}초)")
            return report_data
            
        except Exception as e:
            processing_time = time.time() - start_time
            logger.error(f"리포트 생성 실패: {str(e)}")
            raise Exception(f"리포트 생성 중 오류: {str(e)}")
    
    
    def _create_evaluation_prompt(self, request: ReportRequest) -> str:
        #면접 평가 프롬프트 생성
        # 면접 유형별 평가 기준 설정
        interview_criteria = {
            "PT": "발표 구성력, 논리적 전개력, 문제 분석 및 해결력",
            "기술": "기술적 정확성, 문제 해결 능력, 설계 사고력",
            "인성": "협업 능력, 리더십, 문제 상황 대처, 회사 적합성",
            "실무": "실무 경험, 프로젝트 이해도, 업무 수행 능력, 성과 창출",
        }
        
        # 면접 유형에 따른 평가 기준
        criteria = interview_criteria.get(request.mode, interview_criteria["PT"])
        
        # 문제 배경과 조건 섹션 구성
        background_section = f"""
            [문제 배경]
            {request.situation}
            
            [문제 조건] 
            {request.requirements}
            """

        prompt = f"""
            당신은 20년 경력의 면접 평가 전문가이자 인사 컨설턴트입니다.

            [면접 정보]
            - 면접 유형: {request.mode}
            - 직무: {request.job}
            - 문제 질문: {request.question}
            - 주요 평가 기준: {criteria}
            {background_section}
            
            위의 문제 배경과 문제 조건을 바탕으로 주어진 질문에 대한 지원자의 답변을 종합적으로 분석하여 면접 평가 리포트를 작성하세요.

            [지원자 답변] (전처리 완료)
            {request.text}

            다음 5개 영역을 각각 100점 만점으로 정량적 점수화하여 평가하세요:

            1. 논리력 (20점) - 사고의 구조, 문제 해결 과정의 타당성 평가
            2. 완성도 (20점) - 발표 내용의 깊이·충분성·정리 상태 확인
            3. 표현력 (20점) - 언어·비언어적 전달 능력(목소리, 제스처 포함)
            4. 창의성 (20점) - 독창적인 접근과 아이디어 제시 여부
            5. 적합성 (20점) - 주제·상황·청중·직무와의 연관성

            중요한 채점 규칙:
            - 평균적인 면접자는 각 영역에서 12-15점 범위를 받아야 합니다
            - 뛰어난 영역은 17-20점, 부족한 영역은 8-12점으로 차별화하여 평가하세요
            - 모든 영역에서 17점 이상을 받는 것은 매우 예외적인 경우에만 허용됩니다
            - 지원자의 강점이 있는 1-2개 영역을 높게 평가하고, 상대적으로 부족한 영역은 낮게 평가하여 명확한 강약점을 드러내세요
            - 개별 영역별 편차를 크게 두어 개성을 드러내세요

            다음 JSON 형식으로 정확히 응답해주세요:

            {{
                "총점": 총점 숫자,
                "영역별점수": {{
                    "논리력": 점수,
                    "완성도": 점수,
                    "표현력": 점수,
                    "창의성": 점수,
                    "적합성": 점수
                }},
                "영역별평가": {{
                    "논리력": "논리력에 대한 상세 평가",
                    "완성도": "완성도에 대한 상세 평가", 
                    "표현력": "표현력에 대한 상세 평가",
                    "창의성": "창의성에 대한 상세 평가",
                    "적합성": "적합성에 대한 상세 평가"
                }},
                "장점분석": "면접자의 주요 장점과 강점을 구체적으로 분석",
                "단점분석": "면접자의 주요 단점과 개선이 필요한 부분을 구체적으로 분석",
                "STAR분석": {{
                    "Situation": "상황 분석",
                    "Task": "과제 분석",
                    "Action": "행동 분석", 
                    "Result": "결과 분석"
                }},
                "추가예상질문": [
                    "심화 질문 1",
                    "심화 질문 2", 
                    "심화 질문 3"
                ]
            }}

            중요한 규칙:
            1. 총점은 각 영역 점수의 합계로 계산 (100점 만점)
            2. 각 영역 점수는 0~20 범위의 정수만 가능하며, 초과 불가
            3. 점수 차별화 원칙: 지원자마다 강점과 약점이 명확히 구분되도록 점수를 분산시켜야 함
            4. 모든 key 이름과 순서는 예시와 완전히 동일하게 작성
            5. 출력은 반드시 JSON 형식만 포함하고, 그 외 텍스트·설명은 절대 금지
            6. 모든 평가 문장은 반드시 한국어로 작성
            7. 문제 배경, 조건, 질문의 연관성을 반드시 고려하여 평가
            8. 정량 점수와 정성 평가가 반드시 일치해야 함
            9. 텍스트 기반 평가 제한: 제공된 텍스트만으로 평가하며, 비언어적 표현(목소리 톤, 제스처, 표정 등)에 대한 언급은 절대 금지
            10. 표현력 평가 시 언어적 표현력(논리적 구성, 명확성, 어휘 선택 등)만 평가하고 비언어적 요소는 평가 대상에서 제외
            
            """
        return prompt
    
    
    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=4, max=10)
    )
    async def _call_openai_api(self, prompt: str) -> str:
        #OpenAI API 호출 (재시도 로직 포함)
        try:
            response = await self.client.chat.completions.create(
                model=self.settings.openai_model,
                messages=[
                    {"role": "system", "content": "당신은 20년 경력의 면접 평가 전문가이자 인사 컨설턴트입니다. 면접 답변을 정확하고 전문적으로 평가하며, 지원자의 강점과 약점을 명확히 구분하여 차별화된 점수를 부여합니다. 평균 점수는 12-15점이며, 뛰어난 영역만 17-20점, 부족한 영역은 8-12점으로 엄격하게 평가합니다."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=self.settings.openai_max_tokens,
                temperature=self.settings.openai_temperature,
                timeout=self.settings.openai_timeout
            )
            return response.choices[0].message.content
            
        except Exception as e:
            logger.error(f"OpenAI API 호출 실패: {str(e)}")
            raise Exception(f"OpenAI API 호출 실패: {str(e)}")
    
    
    def _parse_gpt_response(self, gpt_response: str, request: ReportRequest) -> ReportData:
        #GPT 응답을 ReportData로 파싱 (정량화된 면접 평가 형식)
        try:
            # JSON 추출 
            json_start = gpt_response.find('{')
            json_end = gpt_response.rfind('}') + 1
            
            if json_start == -1 or json_end == 0:
                raise Exception("GPT 응답에서 JSON을 찾을 수 없습니다")
            
            json_content = gpt_response[json_start:json_end]
            parsed_data = json.loads(json_content)
            
            # 점수 정보
            total_score = parsed_data.get("총점", 0)
            scores_data = parsed_data.get("영역별점수", {})
            evaluations = parsed_data.get("영역별평가", {})
            
            # STAR 분석 데이터 처리
            star_data = parsed_data.get("STAR분석", {})
            star_formatted = [
                f"Situation: {star_data.get('Situation', 'N/A')}",
                f"Task: {star_data.get('Task', 'N/A')}", 
                f"Action: {star_data.get('Action', 'N/A')}",
                f"Result: {star_data.get('Result', 'N/A')}"
            ]
            
            # 점수를 key-value 객체로 구성 (total + 5개 영역)
            scores_object = {
                "total": total_score,
                "논리력": scores_data.get('논리력', 0),
                "완성도": scores_data.get('완성도', 0),
                "표현력": scores_data.get('표현력', 0),
                "창의성": scores_data.get('창의성', 0),
                "적합성": scores_data.get('적합성', 0)
            }
            
            # 영역별 상세 평가 구성
            detailed_evaluations = [
                f"논리력: {evaluations.get('논리력', 'N/A')}",
                f"완성도: {evaluations.get('완성도', 'N/A')}",
                f"표현력: {evaluations.get('표현력', 'N/A')}",
                f"창의성: {evaluations.get('창의성', 'N/A')}",
                f"적합성: {evaluations.get('적합성', 'N/A')}"
            ]
            
            summary = parsed_data.get('장점분석', '강점 분석 없음')
            
            # 장점/단점 분석 구성 (GPT 응답에 없으면 기본값 사용)
            pros_and_cons = {
                "장점": parsed_data.get('장점분석', '장점 분석 준비 중'),
                "단점": parsed_data.get('단점분석', '단점 분석 준비 중')
            }
            
            return ReportData(
                userId=request.userId,
                meetingAt=request.meetingAt,
                job=request.job,
                mode=request.mode,
                situation=request.situation,
                requirements=request.requirements,
                question=request.question,
                title=request.title,
                summary=summary,
                key_points=detailed_evaluations,
                star_method=star_formatted,
                additional_questions=parsed_data.get("추가예상질문", []),
                pros_and_cons=pros_and_cons,
                scores=scores_object
            )
            
        except json.JSONDecodeError as e:
            logger.error(f"JSON 파싱 실패: {str(e)}")
            logger.debug(f"GPT 응답: {gpt_response}")
            raise Exception("GPT 응답을 파싱할 수 없습니다")
        except Exception as e:
            logger.error(f"응답 처리 실패: {str(e)}")
            raise Exception(f"응답 처리 실패: {str(e)}")