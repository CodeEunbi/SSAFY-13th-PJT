// pages/login/Login.tsx (간단해진 버전)
import { useEffect } from 'react';
import { AuthUtils } from '../../utils/authUtils';
import GoogleLoginButton from './GoogleLoginButton';
import { useNavigate } from 'react-router-dom';

import LogoImage from '../../assets/images/logo_image.png';
import LogoText from '../../assets/images/logo_text.png';

const Login = () => {
  const navigate = useNavigate();

  useEffect(() => {
    if (AuthUtils.isLoggedIn()) {
      navigate('/main');
      return; // 이미 로그인된 경우 메인 페이지로 리다이렉트
    }
  }, []);

  return (
    <div className={`flex items-center justify-center h-full`}>
      <div
        className={`flex flex-col gap-12 items-center justify-center bg-black/20 w-full p-28`}
      >
        <div
          className="flex flex-col items-center gap-4 hover:cursor-pointer"
          onClick={() => navigate('/')}
        >
          <img src={LogoImage} alt="Pitch:It Logo" className="w-[120px]" />
          <img src={LogoText} alt="Pitch:It Logo Text" className="w-[150px]" />
        </div>

        <GoogleLoginButton />
      </div>
    </div>
  );
};

export default Login;
