"""
Intent Router Agent

사용자 질문을 분석하여 어떤 Expert Agent를 실행할지 결정
"""
from langchain_openai import ChatOpenAI
from langchain_core.messages import SystemMessage, HumanMessage
from typing import Dict, List
from config.settings import settings
import json
import logging
from utils.prompt_loader import prompt_loader
from utils.json_parser import parse_llm_json

logger = logging.getLogger(__name__)


class IntentRouterAgent:
    """
    Intent 분류 전문 Agent

    역할:
    - 사용자 질문을 10개 카테고리로 분류
    - 각 카테고리별 확신도 계산
    - Multi-Label Classification (여러 카테고리 동시 탐지)
    """

    # 10개 Expert Agent 카테고리
    CATEGORIES = [
        "Normalization",      # 정규화
        "PKSelection",        # PK 선택
        "Relationship",       # 관계 설정
        "DataType",          # 데이터 타입
        "Constraint",        # 제약 조건
        "Directionality",    # 방향성
        "ManyToMany",        # N:M 관계
        "IndexStrategy",     # 인덱스 전략
        "Scalability",       # 확장성
        "BestPractice"       # 베스트 프랙티스
    ]

    CONFIDENCE_THRESHOLD = 0.6  # 이 값 이상만 실행

    def __init__(self):
        self.llm = ChatOpenAI(
            base_url=settings.GMS_BASE_URL,
            api_key=settings.GMS_API_KEY,
            model=settings.OPENAI_MODEL,
            temperature=0.0  # 분류는 deterministic하게
        )

    async def route(
        self,
        user_question: str,
        conversation_history: List[Dict] = None
    ) -> Dict:
        """
        Intent 분류 수행

        Args:
            user_question: 사용자 질문
            conversation_history: 대화 히스토리 (맥락 파악용)

        Returns:
            {
                "categories": ["Normalization", "IndexStrategy"],
                "confidence": {
                    "Normalization": 0.92,
                    "IndexStrategy": 0.88,
                    "Scalability": 0.55,  # threshold 미만
                    ...
                },
                "is_general": False,  # True면 GeneralAdviceAgent만 실행
                "reasoning": "이 질문은 정규화와 인덱스에 관한 것입니다..."
            }
        """
        try:
            logger.info(f"[IntentRouter] Analyzing question: {user_question[:50]}...")

            # System Prompt 로드
            system_prompt = prompt_loader.load("consultation/intent_router_system")

            # User Prompt 구성
            context = ""
            if conversation_history:
                recent = conversation_history[-3:]  # 최근 3턴만
                context = "\\n\\n=== 최근 대화 ===\\n"
                for msg in recent:
                    context += f"{msg['role']}: {msg['content']}\\n"

            user_prompt_template = prompt_loader.load("consultation/intent_router_user")
            user_prompt = user_prompt_template.format(
                user_question=user_question,
                context=context
            )

            # LLM 호출
            messages = [
                SystemMessage(content=system_prompt),
                HumanMessage(content=user_prompt)
            ]

            response = await self.llm.ainvoke(messages)
            logger.info(f"[IntentRouter] LLM response: {response.content[:500]}")
            result = parse_llm_json(response.content)

            # 카테고리 필터링 (threshold 이상만)
            selected_categories = [
                cat for cat, conf in result["confidence"].items()
                if conf >= self.CONFIDENCE_THRESHOLD
            ]

            logger.info(f"[IntentRouter] Selected categories: {selected_categories}")

            return {
                "categories": selected_categories,
                "confidence": result["confidence"],
                "is_general": result.get("is_general", False),
                "reasoning": result.get("reasoning", "")
            }

        except json.JSONDecodeError as e:
            logger.error(f"[IntentRouter] JSON parsing error: {e}")
            # Fallback: GeneralAdviceAgent
            return {
                "categories": [],
                "confidence": {},
                "is_general": True,
                "reasoning": "Intent 분류 실패 - General Agent로 폴백"
            }
        except Exception as e:
            logger.error(f"[IntentRouter] Error: {str(e)}", exc_info=True)
            raise
