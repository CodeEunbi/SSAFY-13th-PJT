// src/api/service/googleAuthService.ts

import apiController from '../apiController';
import type { ApiResponse } from '../../types/interfaces/api';
import type { GoogleLoginResponse } from '../../types/interfaces/auth';
import type { TokenResponse } from '../../types/interfaces/api';

export class GoogleAuthService {
  // Google Login URL
  static async getGoogleLoginUrl(): Promise<string> {
    const response = await apiController({
      method: 'GET' as const,
      url: '/auth/google/login',
    });

    const data: ApiResponse<string> = response.data;

    if (data.isSuccess) {
      // url
      return data.result;
    } else {
      throw new Error(data.message);
    }
  }

  // Google Login Callback
  static async googleLoginCallback(code: string): Promise<TokenResponse> {
    const response = await apiController({
      method: 'GET' as const,
      url: '/auth/google/callback',
      data: { code },
    });

    const data: ApiResponse<GoogleLoginResponse> = response.data;

    if (data.isSuccess) {
      return data.result;
    } else {
      throw new Error(data.message);
    }
  }

  // Google Logout
  static async googleLogout(): Promise<void> {
    await apiController({
      method: 'POST' as const,
      url: '/auth/google/logout',
    });
  }

  // Google Reissue Token
  static async refreshGoogleToken(
    refreshToken: string,
  ): Promise<TokenResponse> {
    const response = await apiController({
      method: 'POST' as const,
      url: '/auth/google/reissue',
      data: { refresh: refreshToken },
    });

    const data: ApiResponse<TokenResponse> = response.data;

    if (data.isSuccess) {
      localStorage.setItem('accessToken', data.result.accessToken);
      if (data.result.refreshToken) {
        localStorage.setItem('refreshToken', data.result.refreshToken);
      }
      return data.result;
    } else {
      throw new Error(data.message);
    }
  }
}
