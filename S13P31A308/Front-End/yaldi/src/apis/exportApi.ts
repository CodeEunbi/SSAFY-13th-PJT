import { apiController } from './apiController';

// SQL Dialect 타입 정의
export type SqlDialect = 'POSTGRESQL' | 'MYSQL';

/**
 * ERD SQL Export API
 * @param projectKey 프로젝트 키
 * @param dialect SQL dialect (POSTGRESQL | MYSQL)
 * @returns SQL DDL 문자열
 */
export const exportErdToSql = async (
  projectKey: number,
  dialect: SqlDialect = 'POSTGRESQL',
): Promise<string> => {
  console.log('ERD SQL Export API 호출:', { projectKey, dialect });

  try {
    const response = await apiController({
      url: `/api/v1/erd/projects/${projectKey}/export/sql`,
      method: 'get',
      params: { dialect },
    });

    console.log('ERD SQL Export 성공');
    return response.data.result;
  } catch (error) {
    console.error('ERD SQL Export API 호출 실패:', error);
    throw error;
  }
};

/**
 * SQL 클립보드 복사 헬퍼 함수
 * @param sql SQL DDL 문자열
 */
export const copySqlToClipboard = async (sql: string): Promise<void> => {
  await navigator.clipboard.writeText(sql);
};
