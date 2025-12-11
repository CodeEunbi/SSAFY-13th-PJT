// src/utils/authUtils.ts

import type { TokenResponse } from '../types/api';
import { jwtDecode } from 'jwt-decode';

const ACCESS_TOKEN_KEY = 'accessToken';
const REFRESH_TOKEN_KEY = 'refreshToken';
const USER_KEY = 'user';

export class AuthUtils {
  // Token 저장
  static setTokens(tokens: TokenResponse): void {
    localStorage.setItem(ACCESS_TOKEN_KEY, tokens.accessToken);
    if (tokens.refreshToken) {
      localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);
    }
  }

  // Token 가져오기
  static getAccessToken(): string | null {
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  }

  static getRefreshToken(): string | null {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  }

  // 로그인 상태 확인
  static isLoggedIn(): boolean {
    return !!this.getAccessToken();
  }

  // 토큰 삭제
  static clearTokens(): void {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  }

  // 인증 정보 삭제
  static clearAuth(): void {
    this.clearTokens();
    localStorage.removeItem(USER_KEY);
  }

  // 구글 로그인 리다이렉트
  static redirectToGoogleLogin(googleLoginUrl: string): void {
    window.location.href = googleLoginUrl;
  }

  // 토큰에서 사용자 정보 추출
  static extractUserFromToken(): string {
    const token = this.getAccessToken();
    if (!token) {
      throw new Error('No access token found');
    }
    const decoded: { sub: string } = jwtDecode(token);
    return decoded.sub;
  }
}
