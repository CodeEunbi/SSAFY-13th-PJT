"""데이터베이스 서비스 - MySQL 연결 및 리포트 저장"""
import logging
import aiomysql
import json
from typing import Optional
from core.models import ReportData
from core.config import get_settings

# 로거 설정
logger = logging.getLogger(__name__)


class DatabaseService:
    """MySQL 데이터베이스 서비스"""
    
    def __init__(self):
        """데이터베이스 서비스 초기화"""
        self.settings = get_settings()
        self.pool: Optional[aiomysql.Pool] = None
    
    async def create_pool(self):
        """MySQL 연결 풀 생성"""
        try:
            self.pool = await aiomysql.create_pool(
                host=self.settings.db_host,
                port=self.settings.db_port,
                user=self.settings.db_user,
                password=self.settings.db_password,
                db=self.settings.db_name,
                charset='utf8mb4',
                autocommit=True,
                maxsize=10,
                minsize=1
            )
            logger.info("MySQL 연결 풀 생성 완료")
        except Exception as e:
            logger.error(f"MySQL 연결 풀 생성 실패: {e}")
            self.pool = None
    
    async def close_pool(self):
        """MySQL 연결 풀 종료"""
        if self.pool:
            self.pool.close()
            await self.pool.wait_closed()
            logger.info("MySQL 연결 풀 종료")
    
    async def save_report(self, report_data: ReportData) -> bool:
        """
        면접 평가 리포트를 DB에 저장
        
        Args:
            report_data: 저장할 리포트 데이터
            
        Returns:
            bool: 저장 성공 여부
        """
        if not self.pool:
            await self.create_pool()
        
        if not self.pool:
            logger.error("DB 연결 실패로 리포트 저장 불가")
            return False
        
        try:
            # content에 저장할 JSON 데이터 (scores, key_points, star_method, additional_questions 등)
            content_data = {
                "summary": report_data.summary,
                "key_points": report_data.key_points,
                "star_method": report_data.star_method,
                "additional_questions": report_data.additional_questions,
                "pros_and_cons": report_data.pros_and_cons,
                "scores": report_data.scores
            }
            content_json = json.dumps(content_data, ensure_ascii=False)
            
            async with self.pool.acquire() as conn:
                async with conn.cursor() as cursor:
                    # INSERT 쿼리 실행 (스키마에 맞게)
                    query = """
                    INSERT INTO report (
                        user_id, meeting_at, job, mode, title, 
                        situation, requirements, question, content, 
                        created_at, updated_at
                    ) VALUES (
                        %s, %s, %s, %s, %s, 
                        %s, %s, %s, %s, 
                        NOW(), NOW()
                    )
                    """
                    
                    await cursor.execute(query, (
                        report_data.userId,
                        report_data.meetingAt, 
                        report_data.job,
                        report_data.mode,
                        report_data.title,
                        report_data.situation,
                        report_data.requirements,  # 다시 문자열로 변경
                        report_data.question,
                        content_json  # JSON 데이터
                    ))
                    
                    # 삽입된 행의 ID 가져오기
                    report_id = cursor.lastrowid
                    
                    logger.info(f"리포트 DB 저장 완료 - ID: {report_id}, UserID: {report_data.userId}")
                    return True
                    
        except Exception as e:
            logger.error(f"리포트 DB 저장 실패: {e}")
            return False
    
    async def get_report(self, report_id: int) -> Optional[dict]:
        """
        리포트 조회
        
        Args:
            report_id: 리포트 ID
            
        Returns:
            dict: 리포트 데이터 (JSON 파싱된 상태)
        """
        if not self.pool:
            await self.create_pool()
        
        if not self.pool:
            return None
        
        try:
            async with self.pool.acquire() as conn:
                async with conn.cursor() as cursor:
                    query = """
                    SELECT id, user_id, content, created_at, updated_at 
                    FROM report 
                    WHERE id = %s
                    """
                    
                    await cursor.execute(query, (report_id,))
                    row = await cursor.fetchone()
                    
                    if row:
                        return {
                            'id': row[0],
                            'user_id': row[1],
                            'content': json.loads(row[2]),  # JSON 파싱
                            'created_at': row[3],
                            'updated_at': row[4]
                        }
                    
                    return None
                    
        except Exception as e:
            logger.error(f"리포트 조회 실패: {e}")
            return None