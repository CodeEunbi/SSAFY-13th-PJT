// AI Chat 컬럼 타입
export interface AiChatColumn {
  name: string;
  type: string;
  isPrimaryKey: boolean;
  isNullable: boolean;
  comment: string;
}

// AI Chat 테이블 타입
export interface AiChatTable {
  physicalName: string;
  logicalName: string;
  columns: AiChatColumn[];
}

// AI Chat 스키마 데이터 타입
export interface AiChatSchemaData {
  tables: AiChatTable[];
  relationships: unknown[];
}

// AI Chat 요청 타입
export interface AiChatRequest {
  projectKey: number;
  message: string;
  schemaData: AiChatSchemaData;
}

// AI Chat 메시지 역할 타입
export type ConsultationMessageRole = 'USER' | 'ASSISTANT';

// AI Chat 응답 타입
export interface AiChatResponse {
  messageKey: number;
  role: ConsultationMessageRole;
  message: string;
  schemaModifications: Record<string, unknown>[];
  confidence: number;
  agentsUsed: string[];
  warnings: string[];
  createdAt: string;
}

// AI Chat 히스토리 응답 타입
export interface AiChatHistoryResponse {
  projectKey: number;
  totalCount: number;
  messages: AiChatHistoryMessage[];
}

// AI Chat 히스토리 메시지 타입
export interface AiChatHistoryMessage {
  messageKey: number;
  role: ConsultationMessageRole;
  message: string;
  // AI 응답인 경우: 적용 가능한 스키마 수정사항
  schemaModifications: Record<string, unknown>[] | null;
  // AI 응답인 경우: 확신도 (0.0 ~ 1.0)
  confidence: number | null;
  // AI 응답인 경우: 사용된 Agent 목록
  agentsUsed: string[] | null;
  // AI 응답인 경우: 경고 사항
  warnings: string[] | null;
  // 요청 시점의 스키마 스냅샷
  schemaSnapshot: Record<string, unknown> | null;
  createdAt: string;
}
