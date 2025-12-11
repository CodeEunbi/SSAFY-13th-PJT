// src/contexts/RoomContext.tsx
import React, {
  createContext,
  useContext,
  useCallback,
  ReactNode,
} from 'react';
import { useNavigate } from 'react-router-dom';
import { useRoomStore } from '../stores/useRoomStore';
import { useMediaStore } from '../stores/useMediaStore';

interface RoomContextType {
  leaveRoom: (
    // liveKitRoom?: Room | null,
    isRecording?: boolean,
    manualStopRecording?: () => void,
    cleanup?: () => void, // useLiveKitRoom의 cleanup 함수 추가
  ) => Promise<void>;
}

const RoomContext = createContext<RoomContextType | undefined>(undefined);

interface RoomProviderProps {
  children: ReactNode;
}

export const RoomProvider: React.FC<RoomProviderProps> = ({ children }) => {
  const navigate = useNavigate();

  const leaveRoom = useCallback(
    async (
      // liveKitRoom?: Room | null,
      isRecording?: boolean,
      manualStopRecording?: () => void,
      cleanup?: () => void,
    ) => {
      try {
        console.log('🚪 방 나가기 시작...');

        // 1. 녹음 중이면 중지
        if (isRecording && manualStopRecording) {
          manualStopRecording();
          console.log('✅ 녹음 중지 완료');
        }

        // 2. useLiveKitRoom의 cleanup을 먼저 실행
        if (cleanup) {
          cleanup();
          console.log('✅ useLiveKitRoom cleanup 완료');
        }

        // 3. 방 스토어 초기화
        try {
          const roomStore = useRoomStore.getState();
          roomStore.clearRoom();
          console.log('✅ 방 스토어 초기화 완료');
        } catch (e) {
          console.error('⚠️ 방 스토어 초기화 실패:', e);
        }

        // 4. 미디어 스토어 초기화
        try {
          const mediaStore = useMediaStore.getState();
          mediaStore.setCameraOn(false);
          mediaStore.setMicOn(false);
          mediaStore.setVideoDevice(undefined);
          mediaStore.setAudioDevice(undefined);
          console.log('✅ 미디어 스토어 초기화 완료');
        } catch (e) {
          console.error('⚠️ 미디어 스토어 초기화 실패:', e);
        }

        console.log('✅ 방 나가기 완료');

        // 5. 페이지 이동
        setTimeout(() => {
          navigate('/mypage');
        }, 100);
      } catch (error) {
        console.error('❌ 방 나가기 실패:', error);
        navigate('/mypage');
      }
    },
    [navigate],
  );

  return (
    <RoomContext.Provider value={{ leaveRoom }}>
      {children}
    </RoomContext.Provider>
  );
};

export const useRoomContext = () => {
  const context = useContext(RoomContext);
  if (context === undefined) {
    throw new Error('useRoomContext must be used within a RoomProvider');
  }
  return context;
};
