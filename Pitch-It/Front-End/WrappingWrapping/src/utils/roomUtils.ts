import { jobs } from '../types/interfaces/mainPage';
import type { ReservationInfo } from '../types/interfaces/mypage';
import { roomApiController } from '../api/roomApiController';
import { jwtDecode } from 'jwt-decode';
import { AuthUtils } from './authUtils';
import { useRoomStore } from '../stores/useRoomStore';

export const findLabelByValue = (value: string): string => {
  const job = jobs.find((job) => job.value === value);
  return job ? job.label : value;
};

export const futureOnlyReservations = (reservations: ReservationInfo[]) => {
  const now = Date.now();
  return reservations.filter((r) => new Date(r.scheduledTime).getTime() > now);
};

export const sortReservationsByTime = (reservations: ReservationInfo[]) => {
  const sorted = futureOnlyReservations(reservations).sort(
    (a, b) =>
      new Date(a.scheduledTime).getTime() - new Date(b.scheduledTime).getTime(),
  );
  return sorted;
};

export const getToken = async (roomId: string): Promise<string> => {
  // jwt 디코드 하여 사용자 id 추출
  const token = AuthUtils.getAccessToken();
  if (!token) {
    throw new Error('No access token found');
  }

  const decoded: any = jwtDecode(token);

  const response = await roomApiController({
    method: 'POST' as const,
    url: '/token',
    data: {
      roomId,
      participantId: decoded.sub,
    },
  });
  const liveKitToken = response.data.result;
  return liveKitToken;
};

// 참가자 ID로 발표 순서 인덱스 가져오기 (필터링된 순서 기준)
export const getIndexByParticipantId = (participantId: string): number => {
  const { presentationOrder } = useRoomStore.getState();
  return presentationOrder.indexOf(participantId);
};

// 전체 순서에서의 인덱스가 필요한 경우
export const getFullIndexByParticipantId = (participantId: string): number => {
  const { fullPresentationOrder } = useRoomStore.getState();
  return fullPresentationOrder.indexOf(participantId);
};
