// src/utils/authUtils.ts

import type { TokenResponse } from '../types/interfaces/api';
import type { UserDataSimple } from '../types/interfaces/mainPage';

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

  // 사용자 정보 저장
  static setUserData(user: UserDataSimple): void {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }

  // 사용자 정보 가져오기
  static getUserData(): UserDataSimple | null {
    const user = localStorage.getItem(USER_KEY);
    return user ? JSON.parse(user) : null;
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
}
