// src/contexts/RoomContext.tsx
import React, {
  createContext,
  useContext,
  useCallback,
  ReactNode,
} from 'react';
import { useNavigate } from 'react-router-dom';
import { Room } from 'livekit-client';
import { useRoomStore } from '../stores/useRoomStore';
import { useMediaStore } from '../stores/useMediaStore';

interface RoomContextType {
  leaveRoom: (
    liveKitRoom?: Room | null,
    isRecording?: boolean,
    manualStopRecording?: () => void,
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
      liveKitRoom?: Room | null,
      isRecording?: boolean,
      manualStopRecording?: () => void,
    ) => {
      try {
        console.log('🚪 방 나가기 시작...');

        // 1. 녹음 중이면 중지
        if (isRecording && manualStopRecording) {
          manualStopRecording();
          console.log('✅ 녹음 중지 완료');
        }

        // 2. LiveKit 로컬 트랙 정리 (더 강력하게)
        if (liveKitRoom?.localParticipant) {
          try {
            // 모든 로컬 트랙 정리
            const audioTracks =
              liveKitRoom.localParticipant.audioTrackPublications;
            const videoTracks =
              liveKitRoom.localParticipant.videoTrackPublications;

            // 오디오 트랙 정리
            for (const [, publication] of audioTracks) {
              if (publication.track) {
                publication.track.stop();
                await publication.track.detach();
                console.log('🔇 오디오 트랙 정지:', publication.trackSid);
              }
            }

            // 비디오 트랙 정리
            for (const [, publication] of videoTracks) {
              if (publication.track) {
                publication.track.stop();
                await publication.track.detach();
                console.log('📹 비디오 트랙 정지:', publication.trackSid);
              }
            }

            // 카메라/마이크 명시적 비활성화
            await liveKitRoom.localParticipant.setCameraEnabled(false);
            await liveKitRoom.localParticipant.setMicrophoneEnabled(false);
            console.log('✅ 카메라/마이크 명시적 비활성화 완료');
          } catch (error) {
            console.error('로컬 트랙 정리 실패:', error);
          }
        }

        // 3. LiveKit 연결 해제
        if (liveKitRoom) {
          await liveKitRoom.disconnect();
          console.log('✅ LiveKit 연결 해제 완료');
        }

        // 4. 브라우저 미디어 스트림 강제 정리
        try {
          // 현재 활성화된 모든 미디어 스트림 가져오기
          const stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true,
          });

          // 모든 트랙 정지
          stream.getTracks().forEach((track) => {
            track.stop();
            console.log(`🛑 트랙 정지: ${track.kind} - ${track.label}`);
          });

          console.log('✅ 브라우저 미디어 스트림 강제 정리 완료');
        } catch (e) {
          console.log(
            '미디어 스트림 정리 시도했지만 권한 없음 또는 이미 정리됨',
          );
        }

        // 5. 추가: 페이지의 모든 video 엘리먼트 정리
        try {
          const videos = document.querySelectorAll('video');
          videos.forEach((video) => {
            if (video.srcObject) {
              const stream = video.srcObject as MediaStream;
              stream.getTracks().forEach((track) => track.stop());
              video.srcObject = null;
            }
          });
          console.log('✅ 페이지 video 엘리먼트 정리 완료');
        } catch (e) {
          console.error('video 엘리먼트 정리 실패:', e);
        }

        // 6. 방 스토어 초기화
        const roomStore = useRoomStore.getState();
        roomStore.clearRoom();
        console.log('✅ 방 스토어 초기화 완료');

        // 7. 미디어 스토어 초기화
        const mediaStore = useMediaStore.getState();
        mediaStore.setCameraOn(false);
        mediaStore.setMicOn(false);
        mediaStore.setVideoDevice(undefined);
        mediaStore.setAudioDevice(undefined);
        console.log('✅ 미디어 스토어 초기화 완료');

        console.log('✅ 방 나가기 완료');

        // 8. 잠시 대기 후 페이지 이동 (트랙 정리 시간 확보)
        setTimeout(() => {
          navigate('/mypage');
        }, 100);
      } catch (error) {
        console.error('❌ 방 나가기 실패:', error);
        // 실패해도 페이지는 이동
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
