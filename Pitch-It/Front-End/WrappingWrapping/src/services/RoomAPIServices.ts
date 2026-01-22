// services/RoomAPIService.ts
import apiController from '../api/apiController';

export interface RoomParticipant {
  id: string;
  name?: string;
}

export interface RoomInfo {
  participantIds: string[];
  roomName?: string;
  startTime?: string;
  endTime?: string;
}

export class RoomAPIService {
  static async fetchRoomInfo(roomId: string): Promise<RoomInfo> {
    try {
      const response = await apiController({
        method: 'GET',
        url: `/reservations/${roomId}`,
      });

      console.log('Room info response:', response);

      if (response.data && response.data.isSuccess) {
        return response.data.result;
      }

      throw new Error('Invalid response format');
    } catch (error: any) {
      console.error('Failed to fetch room info:', error);

      if (error.response?.status === 403) {
        throw new Error('이 회의실에 접근할 권한이 없습니다.');
      }

      throw new Error('회의실 정보를 가져오는데 실패했습니다.');
    }
  }

  // static async leaveRoom(roomId: string): Promise<void> {
  //   try {
  //     await apiController({
  //       method: 'POST',
  //       url: `/reservations/${roomId}/leave`,
  //     });
  //   } catch (error) {
  //     // console.error('Failed to leave room:', error);
  //     // 나가기 실패해도 로컬에서는 나가도록 처리
  //   }
  // }
}
