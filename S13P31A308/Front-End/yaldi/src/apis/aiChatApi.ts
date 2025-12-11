import type {
  AiChatRequest,
  AiChatResponse,
  AiChatHistoryResponse,
} from '../types/aiChat';
import { apiController } from './apiController';

/**
 * AI Chat 메시지 전송 API
 * @param data AI Chat 요청 데이터
 * @returns AI 응답 메시지
 */
export const sendAiChatMessage = async (
  data: AiChatRequest,
): Promise<AiChatResponse> => {
  console.log('AI Chat API 호출 데이터:', data);

  try {
    const response = await apiController({
      url: `/api/v1/consultation`,
      method: 'post',
      data,
      timeout: 60000,
    });

    console.log('AI Chat 응답 성공:', response.data.result);
    return response.data.result;
  } catch (error) {
    console.error('AI Chat API 호출 실패:', error);
    throw error;
  }
};

/**
 * AI Chat 히스토리 조회 API
 * @param projectKey 프로젝트 키
 * @returns 채팅 히스토리
 */
export const getAiChatHistory = async (
  projectKey: number,
): Promise<AiChatHistoryResponse> => {
  console.log('AI Chat 히스토리 API 호출:', projectKey);

  try {
    const response = await apiController({
      url: `/api/v1/consultation/projects/${projectKey}/history`,
      method: 'get',
    });

    console.log('AI Chat 히스토리 응답 성공:', response.data.result);
    return response.data.result;
  } catch (error) {
    console.error('AI Chat 히스토리 API 호출 실패:', error);
    throw error;
  }
};
