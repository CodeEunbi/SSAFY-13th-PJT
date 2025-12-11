// src/pages/main/MainPage.tsx

import Header from '../../components/layout/header/Header';
import Banner from './Banner';
import Filters from './Filters';
import RoomLists from './RoomLists';
import { useApi } from '../../hooks/useApi';
import { useNicknameStore } from '../../stores/useNicknameStore';
import { UserData } from '../../types/interfaces/mainPage';
import { useEffect } from 'react';
import Loading from '../Loading';
import { useFilterStore } from '../../stores/useFilterStore';

const MainPage = () => {
  // Zustand store 사용
  const { nickname, setNickname } = useNicknameStore();
  const { clearSelectedDate, clearAllJobs } = useFilterStore();

  // 페이지 로드 시 필터 초기화
  useEffect(() => {
    clearSelectedDate();
    clearAllJobs();
  }, []);

  // API 호출: 사용자 정보 가져오기
  const config = {
    method: 'GET' as const,
    url: '/users',
  };

  const { data: userData, loading } = useApi<UserData>(config);

  // 사용자 정보가 있다면 nickname 설정
  useEffect(() => {
    if (userData) {
      setNickname(userData.nickname);
    }
  }, [userData]);

  if (loading) return <Loading />;

  return (
    <div>
      <Header nickname={nickname} />
      {/* <Header nickname={'사용자'} /> */}
      <div>
        <Banner />
      </div>
      <div
        className="mt-6 p-8 grid gap-8 grid-cols-1 lg:grid-cols-[360px_1fr]
        mx-8 mb-8 lg:mx-10 lg:gap-16
      "
      >
        <div className="flex justify-center">
          <Filters />
        </div>
        <div className="">
          <RoomLists />
        </div>
      </div>
    </div>
  );
};

export default MainPage;
