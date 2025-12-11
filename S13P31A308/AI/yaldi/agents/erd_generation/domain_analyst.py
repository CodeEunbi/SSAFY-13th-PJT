"""
Domain Analyst Agent

사용자 요구사항에서 도메인 모델 추출
"""
from langchain_openai import ChatOpenAI
from langchain_core.messages import SystemMessage, HumanMessage
from typing import Dict
from config.settings import settings
import json
import logging
from utils.prompt_loader import prompt_loader

logger = logging.getLogger(__name__)


class DomainAnalystAgent:
    """
    도메인 분석 전문 Agent

    역할:
    - 사용자 입력에서 핵심 도메인 개념 추출
    - 비즈니스 엔티티 식별
    - 도메인 키워드 추출
    """

    def __init__(self):
        self.llm = ChatOpenAI(
            base_url=settings.GMS_BASE_URL,
            api_key=settings.GMS_API_KEY,
            model=settings.OPENAI_MODEL,
            temperature=0.1
        )

    async def analyze(
        self,
        project_name: str,
        description: str,
        user_prompt: str
    ) -> Dict:
        """
        도메인 분석 수행

        Args:
            project_name: 프로젝트명
            description: 프로젝트 설명
            user_prompt: 사용자 AI 초안 요청

        Returns:
            {
                "agent": "DomainAnalyst",
                "analysis": {
                    "core_entities": ["User", "Booking", ...],
                    "relationships": [...],
                    "keywords": ["reservation", "payment", ...],
                    "business_rules": [...]
                },
                "thought": "...",
                "confidence": 0.9
            }
        """
        try:
            logger.info(f"[DomainAnalyst] Starting domain analysis for project: {project_name}")
            
            # 프롬프트 로드 (이미 포맷팅됨)
            logger.debug("[DomainAnalyst] Loading prompts...")
            system_prompt = prompt_loader.load(
                "erd_generation/domain_analyst_system"
            )
            user_prompt_template = prompt_loader.load(
                "erd_generation/domain_analyst_user",
                project_name=project_name,
                description=description or "없음",
                user_prompt=user_prompt
            )
            
            # 메시지 직접 생성 (ChatPromptTemplate 사용 안 함)
            messages = [
                SystemMessage(content=system_prompt),
                HumanMessage(content=user_prompt_template)
            ]
            
            logger.info("[DomainAnalyst] Calling LLM for domain analysis...")
            response = await self.llm.ainvoke(messages)
            logger.debug(f"[DomainAnalyst] LLM response received (length: {len(response.content)} chars)")

            # JSON 파싱
            logger.debug("[DomainAnalyst] Parsing LLM response as JSON...")
            content = response.content

            # 마크다운 코드 블록 제거
            if "```json" in content:
                content = content.split("```json")[1].split("```")[0].strip()
            elif "```" in content:
                content = content.split("```")[1].split("```")[0].strip()

            analysis = json.loads(content)

            result = {
                "agent": "DomainAnalyst",
                "analysis": analysis,
                "thought": f"'{project_name}' 프로젝트의 도메인 분석 완료. {len(analysis.get('core_entities', []))}개 핵심 엔티티 식별",
                "confidence": 0.9
            }

            entities_count = len(analysis.get('core_entities', []))
            relationships_count = len(analysis.get('relationships', []))
            keywords_count = len(analysis.get('keywords', []))
            logger.info(f"[DomainAnalyst] COMPLETED - Entities: {entities_count}, Relationships: {relationships_count}, Keywords: {keywords_count}")
            return result

        except json.JSONDecodeError as e:
            logger.error(f"[DomainAnalyst] JSON parsing FAILED: {e}")
            logger.error(f"[DomainAnalyst] Response content (first 500 chars): {response.content[:500]}")

            # 폴백: 기본 구조 반환
            return {
                "agent": "DomainAnalyst",
                "analysis": {
                    "core_entities": ["User"],
                    "relationships": [],
                    "keywords": [kw.lower() for kw in user_prompt.split()[:5]],
                    "business_rules": []
                },
                "thought": "JSON 파싱 실패, 기본 분석 제공",
                "confidence": 0.3
            }

        except Exception as e:
            logger.error(f"[DomainAnalyst] FAILED with exception: {type(e).__name__}: {str(e)}", exc_info=True)
            raise
