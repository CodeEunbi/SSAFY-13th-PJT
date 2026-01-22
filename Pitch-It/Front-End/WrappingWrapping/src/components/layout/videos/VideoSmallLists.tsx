// src/components/layout/videos/VideoSmallLists.tsx

import { useEffect, useRef } from 'react';
import type { VideoTrackInfo } from '../../../types/interfaces/rooms';
import { getIndexByParticipantId } from '../../../utils/roomUtils';
import CameraOff from './CameraOFf';

interface VideoSmallListsProps {
  videoTracks: VideoTrackInfo[];
  myKey?: string; // 현재 사용자 식별자
}

const VideoSmallLists = ({ videoTracks, myKey }: VideoSmallListsProps) => {
  return (
    <div>
      <div className="flex flex-wrap gap-4 justify-center">
        {videoTracks.map((track) => (
          <VideoSmallItem key={track.trackSid} track={track} myKey={myKey} />
        ))}
      </div>
    </div>
  );
};

// 개별 비디오 아이템 컴포넌트
const VideoSmallItem = ({
  track,
  myKey,
}: {
  track: VideoTrackInfo;
  myKey?: string;
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!videoRef.current || !track.track) return;

    track.track.attach(videoRef.current);
    return () => track.track.detach();
  }, [track.track]);

  // 여러 방법으로 본인 확인
  const isMe = track.type === 'local'; // 로컬 트랙이면 본인

  const hasVideoTrack = !!(track.track && !track.trackSid.startsWith('dummy-'));

  return (
    <div className="mb-4">
      <div style={{ fontSize: 12, marginBottom: 4 }}>
        {getIndexByParticipantId(track.participantIdentity) + 1}번 참가자
        {isMe && <span className="text-watermelon font-bold"> (나)</span>}
      </div>

      <div className="relative w-[150px] h-[100px] bg-gray-800 rounded overflow-hidden">
        {hasVideoTrack ? (
          <video
            ref={videoRef}
            className="w-full h-full scale-x-[-1] object-cover"
            autoPlay
            playsInline
            muted
          />
        ) : (
          <CameraOff />
        )}
      </div>
    </div>
  );
};

export default VideoSmallLists;
