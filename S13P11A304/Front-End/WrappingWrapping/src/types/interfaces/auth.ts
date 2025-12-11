// src/types/interfaces/auth.ts

import { TokenResponse } from './api';

// Google OAuth 관련 타입 정의
export interface GoogleLoginResponse extends TokenResponse {
  user: {
    id: number;
    nickname: string;
    email: string;
    profileImage: string;
  };
}

export interface UseGoogleLogin {
  loginWithGoogle: () => Promise<void>; // Google 로그인 함수
  loading: boolean;
  error: string | null;
}
