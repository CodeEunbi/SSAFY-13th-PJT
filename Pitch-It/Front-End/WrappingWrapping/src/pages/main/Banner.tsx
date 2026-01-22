import { useState } from 'react';
import { bannerTexts } from '../../types/texts/MainTexts';
import FilledButton from '../../components/common/FilledButton';
import { useNavigate } from 'react-router-dom';
import apiController from '../../api/apiController';
import type { ReservationInfo } from '../../types/interfaces/mypage';
import {
  futureOnlyReservations,
  sortReservationsByTime,
} from '../../utils/roomUtils';
import WithdrawModal from '../../components/common/WithdrawModal';

const Banner = () => {
  const navigate = useNavigate();

  // alert 대체용 모달 상태 (확인 버튼만)
  const [limitModalOpen, setLimitModalOpen] = useState(false);

  const handleOnClick = async () => {
    const response = await apiController({
      method: 'GET' as const,
      url: '/users/reservations',
    });

    const reservationsData: ReservationInfo[] =
      response.data?.result?.simpleInfoList ?? [];

    console.log('예약 정보:', reservationsData);

    const futureOnly = futureOnlyReservations(reservationsData);
    const sorted = sortReservationsByTime(futureOnly);

    if (sorted.length < 3) navigate('/room/reservation');
    else setLimitModalOpen(true); // alert 대신 모달 오픈
  };

  return (
    <div
      className={`flex flex-col justify-center items-center bg-black bg-opacity-15 px-16 py-8`}
    >
      <div className="w-fit flex flex-col items-end">
        {bannerTexts.bannerMessage}
        <FilledButton
          label="회의 만들기"
          onClick={handleOnClick}
          size="mt-6 px-6 py-2"
        />
      </div>

      {/* 최대 개수 안내 모달: 확인 1개 */}
      <WithdrawModal
        isOpen={limitModalOpen}
        onClose={() => setLimitModalOpen(false)}
        onConfirm={() => setLimitModalOpen(false)}
        title="알림"
        message="회의는 최대 3개까지만 만들 수 있습니다."
        confirmText="확인"
        hideCancel={true}
      />
    </div>
  );
};

export default Banner;
