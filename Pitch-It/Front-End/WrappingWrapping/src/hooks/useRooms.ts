// src/hooks/useRoom.ts
import { useEffect, useState } from 'react';
import { useRoomStore } from '../stores/useRoomStore';
import apiController from '../api/apiController';
import { RoomMeetingProps } from '../types/interfaces/mainPage';

export const useRoom = (roomId: string) => {
  const [room, setRoom] = useState<RoomMeetingProps | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!roomId || roomId === '') return;

    const fetchRoom = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await apiController({
          method: 'GET' as const,
          url: `/reservations/detail/${roomId}`,
        });
        const data: RoomMeetingProps = response.data.result;

        setRoom(data);
      } catch (error) {
        console.error('방 정보 가져오기 실패:', error);
        setError('방 정보를 가져오는데 실패했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchRoom();
  }, [roomId]);

  useEffect(() => {
    if (!room) return;

    const roomStore = useRoomStore.getState();
    roomStore.setRoomId(roomId);
    roomStore.setTitle(room.title);
    roomStore.setJob(room.jobCategory);
    roomStore.setMode(room.modeType);
    roomStore.setPresentationTopic(room.question || '');
    roomStore.setPresentationContext(room.requirements || '');
    roomStore.setPresentationConstraints(room.situation || '');
  }, [room, roomId]);

  return { room, loading, error };
};
