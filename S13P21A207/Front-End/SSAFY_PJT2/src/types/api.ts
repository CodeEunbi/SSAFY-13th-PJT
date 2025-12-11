// src/types/interfaces/api.ts

// DEV = true : npm run dev 실행 시
// DEV = false : npm run build 실행 시
export const API_BASE_URL: string =
  import.meta.env?.VITE_API_BASE_URL?.replace(/\/+$/, '') ||
  (import.meta.env.DEV ? 'http://127.0.0.1:8000' : 'https://j13a207.p.ssafy.io');

export const SOCKET_IO_BASE: string =
  import.meta.env?.VITE_SOCKET_IO_BASE?.replace(/\/+$/, '') ||
  (import.meta.env.DEV ? 'http://127.0.0.1:9092' : 'https://j13a207.p.ssafy.io');

console.log("[API] SOCKET_IO_BASE =", SOCKET_IO_BASE);

export const SOCKET_IO_PATH: string =
  import.meta.env?.VITE_SOCKET_IO_PATH || '/socket.io';

// API 응답 타입 정의
export interface ApiResponse<T = unknown> {
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

// WebSocket URL (환경별 자동 선택)
export const wsUrl = import.meta.env.DEV
  ? 'ws://127.0.0.1:9092/ws'
  : 'wss://j13a207.p.ssafy.io/ws';

// Socket.IO URL (환경별 자동 선택)
export const socketIOUrl = SOCKET_IO_BASE;

// 로컬 fallback URLs
export const LOCAL_API_BASE_URL = 'http://127.0.0.1:8000';
export const LOCAL_SOCKET_IO_BASE = 'http://127.0.0.1:9092';