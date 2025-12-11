// src/components/layout/videos/VideoSmallLists.tsx

import { useEffect, useRef, useMemo } from 'react';
import type { VideoTrackInfo } from '../../../types/interfaces/rooms';
import { getIndexByParticipantId } from '../../../utils/roomUtils';
import CameraOff from './CameraOff';

interface VideoSmallListsProps {
  videoTracks: VideoTrackInfo[];
  myKey?: string; // 현재 사용자 식별자
}

const VideoSmallLists = ({ videoTracks, myKey }: VideoSmallListsProps) => {
  // 🔥 간단한 ID 중복 제거
  const uniqueVideoTracks = useMemo(() => {
    console.log(
      '🎥 VideoSmall 원본 트랙들:',
      videoTracks.map((t) => ({
        participantId: t.participantIdentity,
        trackSid: t.trackSid,
        type: t.type,
      })),
    );

    // Set으로 이미 본 ID 추적
    const seenIds = new Set<string>();
    const uniqueTracks = videoTracks.filter((track) => {
      if (seenIds.has(track.participantIdentity)) {
        return false; // 이미 있으면 제외
      }
      seenIds.add(track.participantIdentity);
      return true; // 처음 보는 ID면 포함
    });

    console.log(
      '🔥 VideoSmall 중복 제거 후:',
      uniqueTracks.map((t) => ({
        participantId: t.participantIdentity,
        trackSid: t.trackSid,
        type: t.type,
      })),
    );

    return uniqueTracks;
  }, [videoTracks]);

  return (
    <div>
      <div className="flex flex-wrap gap-4 justify-center">
        {uniqueVideoTracks.map((track) => (
          <VideoSmallItem
            key={`${track.participantIdentity}-${track.type}`} // 🔥 더 고유한 키
            track={track}
            myKey={myKey}
          />
        ))}
      </div>
    </div>
  );
};

// 개별 비디오 아이템 컴포넌트
const VideoSmallItem = ({
  track,
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

  // 더미 트랙이거나 트랙이 없거나 음소거된 경우 CameraOff 표시
  const shouldShowCameraOff =
    !track.track ||
    track.trackSid.startsWith('dummy-') ||
    (track.track && track.track.isMuted);

  return (
    <div className="mb-4">
      <div style={{ fontSize: 12, marginBottom: 4 }}>
        {getIndexByParticipantId(track.participantIdentity) + 1}번 참가자
        {isMe && <span className="text-watermelon font-bold"> (나)</span>}
      </div>

      <div className="relative w-[150px] h-[100px] bg-gray-800 rounded-lg overflow-hidden">
        {!shouldShowCameraOff ? (
          <video
            ref={videoRef}
            className="w-full h-full scale-x-[-1] object-cover border-2 border-watermelon rounded-lg"
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
