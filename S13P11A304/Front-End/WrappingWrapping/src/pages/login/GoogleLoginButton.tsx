// components/GoogleLoginButton.tsx

import React, { useState } from 'react';
import { loginText } from '../../types/texts/LoginTexts';
import '../../styles/googleLogin.css';
import apiController from '../../api/apiController';
import type { ApiResponse } from '../../types/interfaces/api';

const GoogleLoginButton: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiController({
        method: 'GET' as const,
        url: '/auth/google/login',
      });

      const apiResponse: ApiResponse<string> = response.data;

      if (apiResponse.isSuccess) {
        const googleUrl = apiResponse.result;
        // 구글 로그인 페이지로 리다이렉트
        // 히스토리에 login을 남기지 않고 구글 로그인 페이지로 이동
        window.location.replace(googleUrl);
      } else {
        // API 응답은 받았지만 실패
        setError(
          apiResponse.message || '구글 로그인 URL을 가져올 수 없습니다.',
        );
        setLoading(false);
      }
    } catch (error: any) {
      // console.error('구글 로그인 요청 실패:', error);
      setError('구글 로그인 요청에 실패했습니다.');
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        className={`gsi-material-button ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
        onClick={handleGoogleLogin}
        disabled={loading}
      >
        <div className="gsi-material-button-state"></div>
        <div className="gsi-material-button-content-wrapper">
          <div className="gsi-material-button-icon">
            {loading ? (
              // 로딩 스피너
              <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
            ) : (
              // 구글 아이콘
              <svg
                version="1.1"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 48 48"
                xmlnsXlink="http://www.w3.org/1999/xlink"
                style={{ display: 'block' }}
              >
                <path
                  fill="#EA4335"
                  d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                />
                <path
                  fill="#4285F4"
                  d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                />
                <path
                  fill="#FBBC05"
                  d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                />
                <path
                  fill="#34A853"
                  d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                />
                <path fill="none" d="M0 0h48v48H0z" />
              </svg>
            )}
          </div>
          <span className="gsi-material-button-contents">
            {loading ? '로그인 준비 중...' : loginText.googleLogin}
          </span>
          <span style={{ display: 'none' }}>{loginText.googleLogin}</span>
        </div>
      </button>

      {/* TODO: 에러 발생 시 alert 띄우기,, */}
      {error && <div>{error}</div>}
    </div>
  );
};

export default GoogleLoginButton;
