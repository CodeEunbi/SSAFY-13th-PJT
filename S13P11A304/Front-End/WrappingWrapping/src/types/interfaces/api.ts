// src/types/interfaces/api.ts

// API 기본 URL
export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'https://pitch-it.co.kr/api/v1';

// API 응답 타입 정의
export interface ApiResponse<T = any> {
  isSuccess: true;
  code: string;
  message: string;
  result: T;
}

// API 에러 응답 타입 정의
export interface ApiErrorResponse {
  isSuccess: false; // false가 들어오면 자동으로 ApiErrorResponse 타입으로 인식
  code: string;
  message: string;
  result?: null;
}

// 토큰 발급 응답 타입
export interface TokenResponse {
  accessToken: string;
  refreshToken?: string;
}

export interface UseApiReturn<T> {
  data: T | null; // result 부분 (주로 사용)
  response: ApiResponse<T> | null; // 전체 응답 (code, message 확인용)
  loading: boolean; // 로딩 상태 (UI 표시용)
  error: string | null; // 에러 메시지 (에러 표시용)
}

export const scheme = window.location.protocol === 'https:' ? 'wss' : 'ws';
export const wsUrl = `${scheme}://${window.location.host}/ws`;
