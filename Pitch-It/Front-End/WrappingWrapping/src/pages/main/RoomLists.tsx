import { useState, useEffect, useCallback } from 'react';
import RoomListsHeader from './RoomListsHeader';
import RoomList from './RoomList';
import {
  formatToKoreanDate,
  formatToKoreanTime,
} from '../../utils/dateUtils.ts';
import RoomListMobileView from './RoomListMobileView.tsx';
import Pagination from '../../components/layout/Pagination.tsx';
import { useSearchParams } from 'react-router-dom';
import apiController from '../../api/apiController';
import { validatePageNumber } from '../../utils/paginationUtils.ts';
import { useFilterStore } from '../../stores/useFilterStore.ts';
import { RoomData } from '../../types/interfaces/mainPage.ts';
import { findLabelByValue } from '../../utils/roomUtils.ts';
import WithdrawModal from '../../components/common/WithdrawModal';

const RoomLists = () => {
  // 페이지네이션 설정
  const [searchParams] = useSearchParams();
  const [rooms, setRooms] = useState<RoomData[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const itemsPerPage = 12;
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  const pageParam = parseInt(searchParams.get('page') || '1');
  const currentPage = validatePageNumber(pageParam, totalPages);

  const selectedJobs = useFilterStore((state) => state.selectedJobs);
  const selectedDate = useFilterStore((state) => state.selectedDate);

  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [alertTitle, setAlertTitle] = useState('알림');
  const [alertMessage, setAlertMessage] = useState('');
  const [alertOnConfirm, setAlertOnConfirm] = useState<() => void>(
    () => () => {},
  );

  const openAlert = (
    message: string,
    onConfirm?: () => void,
    title = '알림',
  ) => {
    setAlertTitle(title);
    setAlertMessage(message);
    setAlertOnConfirm(() => () => {
      setIsAlertOpen(false);
      onConfirm?.();
    });
    setIsAlertOpen(true);
  };

  // API 호출 함수 (서버 사이드 페이지네이션)
  const fetchRooms = useCallback(
    async (filters?: { jobs?: string[]; date?: string }, page = 0) => {
      setError(null);

      try {
        const params: any = {
          page: page,
          size: itemsPerPage,
        };

        if (filters?.jobs && filters.jobs.length > 0) {
          params.jobs = filters.jobs;
        }
        if (filters?.date) {
          params.date = filters.date;
        }

        const response = await apiController({
          method: 'GET' as const,
          url: '/reservations',
          params,
          paramsSerializer: {
            indexes: null, // jobs[]=Research&jobs[]=Sales 형태로 전송
          },
        });

        const data = response.data.result;
        console.log('방 리스트:', data);

        setRooms(data.detailInfoList);
        setTotalItems(data.totalElements); // 서버에서 전체 개수 받기
      } catch (error: any) {
        setError('방 리스트를 불러오는데 실패했습니다.');
      }
    },
    [],
  );

  // 필터 변경 시 데이터 재로드 (첫 페이지로 이동)
  useEffect(() => {
    const filters = {
      jobs: selectedJobs.length > 0 ? selectedJobs : undefined,
      date: selectedDate || undefined,
    };

    if (filters.jobs || filters.date) {
      fetchRooms(filters, 0); // 필터 변경 시 첫 페이지로
    } else {
      // 필터가 모두 제거된 경우 전체 데이터 다시 로드
      fetchRooms(undefined, 0);
    }
  }, [selectedJobs, selectedDate, fetchRooms]);

  // 페이지 변경 시 데이터 재로드
  useEffect(() => {
    const filters = {
      jobs: selectedJobs.length > 0 ? selectedJobs : undefined,
      date: selectedDate || undefined,
    };

    fetchRooms(filters, currentPage - 1);
  }, [currentPage, fetchRooms]);

  if (error) {
    return <div>에러: {error}</div>;
  }

  const handleEnterRoom = async (roomId: number) => {
    try {
      const reservationResponse = await apiController({
        method: 'POST' as const,
        url: `/reservations/${roomId}`,
      });

      const data = reservationResponse.data;

      if (data.isSuccess) {
        // 현재 rooms에서 해당 방 정보 찾아서 메시지 구성
        const room = rooms.find((r) => r.id === roomId);

        const message = room
          ? [
              `제목: ${room.title}`,
              `일시: ${formatToKoreanDate(room.scheduledTime)} ${formatToKoreanTime(room.scheduledTime)}`,
              `직무: ${findLabelByValue(room.jobCategory)}`,
            ].join('\n')
          : '예약되었습니다.';

        const filters = {
          jobs: selectedJobs.length > 0 ? selectedJobs : undefined,
          date: selectedDate || undefined,
        };

        openAlert(
          message,
          () => {
            fetchRooms(filters, currentPage - 1);
          },
          '예약 완료',
        );
      } else {
        // 실패 모달
        openAlert(`${data.message ?? '알 수 없음'}`, undefined, '예약 실패');
      }
    } catch (error: any) {
      const code = error?.data?.code || error?.response?.data?.code;
      if (code === 'RESERVATION4002') {
        openAlert(
          '겹치는 시간이 있어 예약에 실패했습니다.',
          undefined,
          '예약 실패',
        );
      } else {
        openAlert('예약 처리 중 오류가 발생했습니다.', undefined, '오류');
      }
    }
  };

  return (
    <div className={`flex flex-col justify-between h-full`}>
      <div>
        <RoomListsHeader display={`hidden sm:block`} />
        <div className="hidden sm:block">
          {rooms.map((room) => (
            <RoomList
              key={room.id}
              date={formatToKoreanDate(room.scheduledTime)}
              time={formatToKoreanTime(room.scheduledTime)}
              job={findLabelByValue(room.jobCategory)}
              title={room.title}
              participants={`${room.participants}/${room.maxParticipant}`}
              inActive={room.participants < room.maxParticipant}
              isParticipanted={room._participant}
              onclick={() => handleEnterRoom(room.id)}
            />
          ))}
        </div>
      </div>

      <div className="sm:hidden">
        {rooms.map((room) => (
          <RoomListMobileView
            key={room.id}
            date={formatToKoreanDate(room.scheduledTime)}
            time={formatToKoreanTime(room.scheduledTime)}
            job={findLabelByValue(room.jobCategory)}
            title={room.title}
            participants={`${room.participants}/${room.maxParticipant}`}
            inActive={room.participants < room.maxParticipant}
            isParticipanted={room._participant}
            onclick={() => handleEnterRoom(room.id)}
          />
        ))}
      </div>

      <div className="">
        <Pagination
          totalItems={totalItems}
          itemsPerPage={itemsPerPage}
          currentPage={currentPage}
          delta={2}
        />
      </div>

      {/* 확인 버튼만 보이도록 hideCancel 사용 */}
      <WithdrawModal
        isOpen={isAlertOpen}
        onClose={() => setIsAlertOpen(false)}
        onConfirm={alertOnConfirm}
        title={alertTitle}
        message={alertMessage}
        confirmText="확인"
        hideCancel
      />
    </div>
  );
};

export default RoomLists;
