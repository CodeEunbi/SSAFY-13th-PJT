// MyPage.tsx
import { useState, useEffect } from 'react';
import Header from '../../components/layout/header/Header';
import NicknameBox from './NickNameBox';
import ReservationList from './ReservationList';
import ReportList from './ReportList';
import WithdrawModal from '../../components/common/WithdrawModal';
import { AuthUtils } from '../../utils/authUtils';
import { useNicknameStore } from '../../stores/useNicknameStore';
import apiController from '../../api/apiController';
import { useNavigate } from 'react-router-dom';
import type { UserInfo } from '../../types/interfaces/mypage';
import Loading from '../Loading';

export default function MyPage() {
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);

  const { nickname, setNickname } = useNicknameStore();
  const email = userInfo?.email || '';

  const navigate = useNavigate();

  // 사용자 정보 조회
  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await apiController({
          method: 'GET' as const,
          url: '/users',
        });

        const userData = response.data.result;
        setUserInfo(userData);
        setNickname(userData.nickname);
      } catch (err) {
        setError('사용자 정보를 불러오는데 실패했습니다.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserInfo();
  }, [setNickname]);

  // ReportList 렌더링 확인용
  // useEffect(() => {
  //   console.log('🔍 MyPage에서 ReportList 렌더링됨, nickname:', nickname);
  //   console.log('🔍 nickname 타입:', typeof nickname);
  //   console.log('🔍 nickname 값:', nickname);
  // }, [nickname]);

  // ReportList 렌더링 시점 확인
  // useEffect(() => {
  //   console.log('🔍 MyPage 렌더링 상태:', { isLoading, error, nickname });
  // }, [isLoading, error, nickname]);

  // ✅ 닉네임 변경 후 email이 사라지지 않도록 기존 userInfo와 병합해서 갱신
  const handleSetNickname = async (newNickname: string) => {
    try {
      const response = await apiController({
        method: 'PATCH' as const,
        url: '/users',
        data: { nickname: newNickname },
      });

      // 어떤 백엔드는 전체 유저가 아니라 { nickname: '...' }만 주기도 함
      const result = response?.data?.result ?? {};
      const patchedNickname = result?.nickname ?? newNickname;

      // 전역 스토어 닉네임 갱신
      setNickname(patchedNickname);

      // 기존 userInfo 유지 + 닉네임만 교체 (email 등 다른 필드 보존)
      setUserInfo((prev) =>
        prev ? { ...prev, nickname: patchedNickname } : prev,
      );
    } catch (err) {
      setError('닉네임 수정에 실패했습니다.');
    }
  };

  const handleWithdraw = () => {
    setIsWithdrawModalOpen(true);
  };

  const handleConfirmWithdraw = async () => {
    try {
      const withdrawResponse = await apiController({
        method: 'DELETE' as const,
        url: '/users',
      });

      const data = withdrawResponse.data;

      if (data.isSuccess) {
        AuthUtils.clearAuth(); // 인증 정보 삭제
        navigate('/'); // 홈(또는 로그인)으로 이동
      }
    } catch (e: any) {
      // console.log('탈퇴 실패:', e);
    }
  };

  const handleCloseWithdrawModal = () => {
    setIsWithdrawModalOpen(false);
  };

  if (isLoading) {
    return <Loading />;
  }

  if (error) {
    return (
      <div className="bg-my-black min-h-screen flex items-center justify-center">
        <div className="text-my-white">{error}</div>
      </div>
    );
  }

  return (
    <>
      <Header nickname={nickname} />
      <div className="bg-my-black min-h-screen p-8 text-my-white">
        <div className="max-w-6xl mx-auto">
          <NicknameBox
            nickname={nickname}
            setNickname={handleSetNickname}
            email={email}
            onWithdraw={handleWithdraw}
          />
          <div className="flex flex-col md:flex-row gap-8 w-full h-full mt-8">
            <div className="w-full md:max-w-[300px] flex flex-col h-full">
              <ReservationList />
            </div>
            <div className="flex-1 flex flex-col h-full">
              <ReportList nickname={nickname} />
            </div>
          </div>
        </div>
      </div>

      <WithdrawModal
        isOpen={isWithdrawModalOpen}
        onClose={handleCloseWithdrawModal}
        onConfirm={handleConfirmWithdraw}
        title="탈퇴하시겠습니까?"
        message="이 작업은 되돌릴 수 없습니다."
        confirmText="예"
        cancelText="아니오"
      />
    </>
  );
}
