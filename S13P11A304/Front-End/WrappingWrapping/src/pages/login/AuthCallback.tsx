// src\pages\login\AuthCallback.tsx

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiController from '../../api/apiController';
import { AuthUtils } from '../../utils/authUtils';
import Loading from '../Loading';
import { useNicknameStore } from '../../stores/useNicknameStore';

const AuthCallback = () => {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { setNickname } = useNicknameStore();

  useEffect(() => {
    const handleAuthCallback = async () => {
      setLoading(true);
      setError(null);

      try {
        // URL에서 인증 코드 추출
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');

        if (!code) {
          navigate('/login');
          return;
        }

        // 서버에 코드 전송
        const response = await apiController({
          method: 'GET' as const,
          url: '/auth/google/callback',
          params: { code },
        });

        const result = response.data;

        // 회원가입이 필요한 경우
        if (result.code === 'MEMBER4002') {
          navigate('/signup', {
            state: {
              email: result.result?.email,
            },
          });
          return;
        }

        // 토큰 저장
        if (result.result.accessToken && result.result.refreshToken) {
          AuthUtils.setTokens({
            accessToken: result.result.accessToken,
            refreshToken: result.result.refreshToken,
          });
        }

        // 로그인 성공
        if (result.isSuccess) {
          navigate('/main', { replace: true });

          // 사용자 정보 저장
          const userResponse = await apiController({
            method: 'GET',
            url: '/users',
          });

          if (
            userResponse.data.isSuccess &&
            userResponse.data.result?.nickname
          ) {
            setNickname(userResponse.data.result.nickname);
          } else {
            // console.error(
            //   '사용자 정보 가져오기 실패:',
            //   userResponse.data.message,
            // );
          }

          setNickname(userResponse.data.result?.nickname || '');
          return;
        }

        // 로그인 실패
        setError(result.message || '로그인에 실패했습니다.');
        navigate('/login');
      } catch (e: any) {
        // console.error('인증 콜백 처리 중 오류 발생:', e);
        setError('인증 처리 실패: ' + (e as Error).message);
        navigate('/login');
      }
    };

    handleAuthCallback();
  }, [navigate]); // 사실 한 번만 실행되긴 함

  if (loading) {
    return <Loading />;
  }

  // 에러 상태일 때
  if (error) {
    return <div>error...</div>;
  }

  return null;
};

export default AuthCallback;
