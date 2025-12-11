// src/pages/login/SignUp.tsx

import Input from '../../components/common/Input';
import FilledButton from '../../components/common/FilledButton';
import { useNavigate, useLocation } from 'react-router-dom';
import { AuthUtils } from '../../utils/authUtils';
import apiController from '../../api/apiController';
import { useState } from 'react';
import { theme } from '../../styles/theme';

import LogoText from '../../assets/images/logo_text.png';
import Profile from '../../assets/icons/profile.svg';
import Email from '../../assets/icons/email.svg';

interface LocationState {
  email: string;
}

const SignUp = () => {
  const navigate = useNavigate();
  const location = useLocation(); // navigate를 통해 전달된 상태 가져오기
  const email = (location.state as LocationState)?.email || '';

  // 닉네임 중복
  const [duplicatedNickname, setDuplicatedNickname] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // 폼 데이터 가져오기
    const formData = new FormData(e.currentTarget);
    const formDataConfig = {
      name: formData.get('name') as string,
      nickname: formData.get('nickname') as string,
      email: formData.get('email') as string,
    };

    const config = {
      method: 'POST' as const,
      url: '/auth/google/join',
      data: {
        name: formDataConfig.name,
        nickname: formDataConfig.nickname,
        email: formDataConfig.email,
      },
    };

    // API 호출
    try {
      const response = await apiController(config);
      const responseData = response.data;

      // 성공
      if (responseData.isSuccess) {
        AuthUtils.setUserData({
          email: email,
          nickname: responseData.result.nickname,
        });

        AuthUtils.setTokens(responseData.result.tokenDto);
      }

      navigate('/');
    } catch (e: any) {
      console.log('회원가입 실패:', e);

      if (e.data.code === 'MEMBER4003') {
        setDuplicatedNickname(true);
        setTimeout(() => {
          setDuplicatedNickname(false);
        }, 2000);
      }
    }
  };

  return (
    <div className={`flex items-center justify-center h-full`}>
      <div className={`flex bg-black/20 w-full py-24 px-16 justify-center`}>
        <div className="flex flex-col gap-4 items-center justify-center w-[300px]">
          {/* Logo */}
          <img
            src={LogoText}
            alt="Logo"
            className="w-[180px] mb-8 hover:cursor-pointer"
            onClick={() => navigate('/')}
          />

          {/* Sign Up Form */}
          <form onSubmit={handleSubmit} className="w-full flex flex-col">
            {/* 이름 */}
            <div className="mb-6">
              <Input
                icon={
                  <img src={Profile} alt="Profile Icon" className="w-[24px]" />
                }
                placeholder="이름"
                className="w-full"
                name="name"
                id="name"
                required
              />
            </div>

            {/* 닉네임 */}
            <div className="mb-1">
              <Input
                icon={
                  <img src={Profile} alt="Nickname Icon" className="w-[24px]" />
                }
                placeholder="닉네임"
                className={`w-full ${duplicatedNickname ? 'bg-watermelon/20 ring-1 ring-watermelon' : ''}`}
                name="nickname"
                id="nickname"
                required
              />

              {/* 닉네임 중복 확인 메시지 */}
              <div
                className={`mx-2 mt-1 text-${theme.primary} text-sm ${!duplicatedNickname ? 'invisible' : ''}`}
              >
                중복된 닉네임입니다.
              </div>
            </div>

            {/* 이메일 */}
            <div className="mb-6">
              <Input
                icon={<img src={Email} alt="Email Icon" className="w-[24px]" />}
                placeholder="이메일"
                className="w-full"
                name="email"
                id="email"
                type="email"
                value={email}
                readonly
              />
            </div>

            {/* Submit Button */}
            <FilledButton
              label="회원가입"
              type="submit"
              size="w-full h-12 px-4 mt-2"
            />
          </form>
        </div>
      </div>
    </div>
  );
};

export default SignUp;
