// src/components/layout/videos/VideoBig.tsx

import { useEffect, useRef } from 'react';
import { LocalVideoTrack, RemoteVideoTrack } from 'livekit-client';
import { getIndexByParticipantId } from '../../../utils/roomUtils';
import CameraOff from './CameraOff';

interface VideoBigProps {
  localTrack?: LocalVideoTrack | RemoteVideoTrack | null;
  remoteTrack?: LocalVideoTrack | RemoteVideoTrack | null;
  presenterName?: string | null;
}

const VideoBig = ({
  localTrack,
  remoteTrack,
  presenterName,
}: VideoBigProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!videoRef.current) return;

    // 로컬 트랙 우선, 없으면 원격 트랙
    const track = localTrack || remoteTrack;

    if (track) {
      track.attach(videoRef.current);

      // cleanup 함수에서 detach 호출하되 반환값은 무시
      return () => {
        track.detach();
      };
    }
  }, [localTrack, remoteTrack]);

  // 실제 비디오 트랙이 있고 음소거되지 않았는지 확인
  const track = localTrack || remoteTrack;
  const shouldShowCameraOff = !track || (track && track.isMuted);

  return (
    <div className="flex flex-col items-center justify-center h-full">
      <div className="flex gap-1">
        {presenterName && (
          <h3 className="mb-2">
            발표자: {getIndexByParticipantId(presenterName) + 1}
          </h3>
        )}
        {localTrack && <span className="text-watermelon font-bold"> (나)</span>}
      </div>

      <div className="relative w-full max-w-[800px] rounded-2xl overflow-hidden">
        {!shouldShowCameraOff ? (
          <video
            ref={videoRef}
            className="w-full scale-x-[-1] bg-black border-2 border-watermelon rounded-2xl"
            autoPlay
            playsInline
            muted={!!localTrack} // 로컬 트랙일 때 음소거
          />
        ) : (
          <CameraOff />
        )}
      </div>
    </div>
  );
};

export default VideoBig;
