// src/hooks/useGoogleLogin.ts

import { useState } from 'react';
import { GoogleAuthService } from '../api/service/googleAuthService';
import { AuthUtils } from '../utils/authUtils';
import { UseGoogleLogin } from '../types/interfaces/auth';

export const useGoogleLogin = (): UseGoogleLogin => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loginWithGoogle = async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      // Google 로그인 URL 가져오기
      const googleLoginUrl = await GoogleAuthService.getGoogleLoginUrl();

      // 리다이렉트
      AuthUtils.redirectToGoogleLogin(googleLoginUrl);
    } catch (e: any) {
      // console.error('Google login error:', e);
      setError(e.message || 'Google 로그인에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return {
    loginWithGoogle,
    loading,
    error,
  };
};
