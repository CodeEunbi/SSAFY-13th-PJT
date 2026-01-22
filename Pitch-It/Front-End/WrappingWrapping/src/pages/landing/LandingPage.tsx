import { FC, useEffect } from 'react';
import Header from '../../components/layout/header/Header';
import HeroSection from './HeroSection';
import UserStorySection from './UserStorySection';
import FeatureSection from './FeatureSection';
import CallToActionSection from './CallToActionSection';
import { useNicknameStore } from '../../stores/useNicknameStore';
import { AuthUtils } from '../../utils/authUtils';
import apiController from '../../api/apiController';

const LandingPage: FC = () => {
  const { nickname, setNickname } = useNicknameStore();

  // 메인페이지와 동일한 사용자 정보 가져오기 로직
  useEffect(() => {
    const fetchUserData = async () => {
      // 로그인된 경우에만 API 호출
      if (AuthUtils.isLoggedIn()) {
        try {
          const response = await apiController({
            method: 'GET',
            url: '/users',
          });

          if (response.data.isSuccess && response.data.result?.nickname) {
            setNickname(response.data.result.nickname);
          }
        } catch (error) {
          // console.error('사용자 정보 가져오기 실패:', error);
        }
      }
      // 비로그인 시에는 API 호출하지 않음 (기존 store 값 사용)
    };

    fetchUserData();
  }, [setNickname]);

  return (
    <div>
      <Header nickname={nickname} />
      <div>
        <HeroSection />
        <UserStorySection />
        <FeatureSection />
        <CallToActionSection />
      </div>
    </div>
  );
};

export default LandingPage;
