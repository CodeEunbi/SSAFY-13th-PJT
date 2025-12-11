import { jobs } from '../types/interfaces/mainPage';
import type { ReservationInfo } from '../types/interfaces/mypage';
import { roomApiController } from '../api/roomApiController';
import { AuthUtils } from './authUtils';
import { useRoomStore } from '../stores/useRoomStore';
import apiController from '../api/apiController';

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
  const id = AuthUtils.extractUserFromToken();

  const response = await roomApiController({
    method: 'POST' as const,
    url: '/token',
    data: {
      roomId,
      participantId: id,
    },
  });
  const liveKitToken = response.data.result;
  return liveKitToken;
};

/**
 * 참가자 ID로 발표 순서 인덱스 가져오기 (필터링된 순서 기준)
 */
export const getIndexByParticipantId = (participantId: string): number => {
  const { presentationOrder } = useRoomStore.getState();
  return presentationOrder.indexOf(participantId);
};

/**
 * 전체 순서에서의 인덱스가 필요한 경우
 */
export const getFullIndexByParticipantId = (participantId: string): number => {
  const { fullPresentationOrder } = useRoomStore.getState();
  return fullPresentationOrder.indexOf(participantId);
};

export interface RoomValidationResult {
  isValid: boolean;
  reason?: string;
}

/**
 * 방 참여자 검증
 */
export const validateRoomParticipant = async (
  roomId: string,
): Promise<RoomValidationResult> => {
  try {
    const userId = AuthUtils.extractUserFromToken();
    if (!userId) {
      return { isValid: false, reason: '유효하지 않은 토큰' };
    }

    const participantsResponse = await apiController({
      method: 'GET' as const,
      url: `/reservations/${roomId}`,
    });

    const participants = participantsResponse?.data?.result?.participantIds;

    if (!Array.isArray(participants)) {
      console.warn('참여자 정보가 올바르지 않음:', participantsResponse?.data);
      return { isValid: false, reason: '참여자 정보를 찾을 수 없음' };
    }

    const isParticipant = participants.includes(Number(userId));

    if (!isParticipant) {
      return { isValid: false, reason: '방 참여자가 아님' };
    }

    return { isValid: true };
  } catch (error) {
    console.error('참여자 검증 실패:', error);
    return { isValid: false, reason: '참여자 검증 API 호출 실패' };
  }
};

/**
 * 방 시간 검증
 */
export const validateRoomTime = async (
  roomId: string,
): Promise<RoomValidationResult> => {
  try {
    const timeResponse = await apiController({
      method: 'GET' as const,
      url: `/reservations/time/${roomId}`,
    });

    const scheduledTime = timeResponse?.data?.result?.scheduledTime;

    if (!scheduledTime) {
      console.warn('회의 시간 정보가 올바르지 않음:', timeResponse?.data);
      return { isValid: false, reason: '회의 시간 정보를 찾을 수 없음' };
    }

    const currentTime = new Date().getTime();
    const meetingEndTime = new Date(scheduledTime).getTime();

    if (currentTime > meetingEndTime) {
      return { isValid: false, reason: '회의 시간이 종료됨' };
    }

    return { isValid: true };
  } catch (error) {
    console.error('시간 검증 실패:', error);
    return { isValid: false, reason: '시간 검증 API 호출 실패' };
  }
};

/**
 * 방 접근 권한 종합 검증
 */
export const validateRoomAccess = async (
  roomId: string | undefined,
): Promise<RoomValidationResult> => {
  if (!roomId) {
    return { isValid: false, reason: 'roomId가 없음' };
  }

  // 참여자 검증
  const participantResult = await validateRoomParticipant(roomId);
  if (!participantResult.isValid) {
    return participantResult;
  }

  // 시간 검증
  const timeResult = await validateRoomTime(roomId);
  if (!timeResult.isValid) {
    return timeResult;
  }

  return { isValid: true };
};
