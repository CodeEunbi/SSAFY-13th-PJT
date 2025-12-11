// src/pages/mypage/ReservationList.tsx
import { useState, useEffect } from 'react';
import ReservationCard from './ReservationCard';
import apiController from '../../api/apiController';
import type { ReservationInfo } from '../../types/interfaces/mypage';
import WithdrawModal from '../../components/common/WithdrawModal';
import {
  futureOnlyReservations,
  sortReservationsByTime,
} from '../../utils/roomUtils';

const formatKoreanDateTime = (isoString: string): string => {
  const date = new Date(isoString);
  return date.toLocaleString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
};

export default function ReservationList() {
  const [reservations, setReservations] = useState<ReservationInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 모달 상태
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState('확인');
  const [targetId, setTargetId] = useState<number | null>(null);
  const [confirmText, setConfirmText] = useState('예');

  useEffect(() => {
    const fetchReservations = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await apiController({
          method: 'GET' as const,
          url: '/users/reservations',
        });

        const reservationsData: ReservationInfo[] =
          response.data?.result?.simpleInfoList ?? [];

        const futureOnly = futureOnlyReservations(reservationsData);
        const sorted = sortReservationsByTime(futureOnly);

        setReservations(sorted);
      } catch {
        setError('예약 목록을 불러오는데 실패했습니다.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchReservations();
  }, []);

  // 카드에서 "취소" 누르면 확인 모달 오픈
  const handleAskCancel = (id: number) => {
    setTargetId(id);
    setModalTitle('예약을 취소할까요?');
    setConfirmText('확인');
    setIsModalOpen(true);
  };

  // 모달 확인 → 실제 취소 API 호출
  const handleConfirmCancel = async () => {
    if (targetId == null) return;
    try {
      setConfirmText('처리 중...');
      await apiController({
        method: 'DELETE' as const,
        url: `/reservations/cancel/${targetId}`,
      });
      setReservations((prev) => prev.filter((res) => res.id !== targetId));
    } catch (err) {
      console.error('예약 취소 실패:', err);
    } finally {
      setConfirmText('취소');
      setIsModalOpen(false);
      setTargetId(null);
    }
  };

  // 카드에서 사라질 때 리스트에서도 제거
  const handleHide = (id: number) => {
    setReservations((prev) => prev.filter((res) => res.id !== id));
  };

  if (isLoading) {
    return (
      <div className="flex flex-col h-full">
        <h2 className="text-xl font-semibold mb-4">내 예약</h2>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-my-white">로딩 중...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col h-full">
        <h2 className="text-xl font-semibold mb-4">내 예약</h2>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-my-white">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <h2 className="text-xl font-semibold mb-4">내 예약</h2>
      <div className="flex-1 overflow-y-auto pr-2 space-y-4">
        {reservations.length === 0 ? (
          <div className="h-[380px] flex items-center justify-center text-gray-500">
            예약된 방이 없습니다.
          </div>
        ) : (
          reservations.map((res) => (
            <ReservationCard
              key={res.id}
              id={res.id}
              date={formatKoreanDateTime(res.scheduledTime)}
              job={res.jobCategory}
              title={res.title}
              scheduledTime={res.scheduledTime}
              onCancel={() => handleAskCancel(res.id)}
              onHide={handleHide}
            />
          ))
        )}
      </div>

      {/* 확인 모달 */}
      <WithdrawModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleConfirmCancel}
        title={modalTitle}
        confirmText={confirmText}
        cancelText="아니오"
      />
    </div>
  );
}
