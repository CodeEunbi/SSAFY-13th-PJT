// src/components/room/QAScreen.tsx

import React, { useRef, useEffect } from 'react';
import { LocalVideoTrack, RemoteVideoTrack } from 'livekit-client';
import ButtonWithIcon from '../common/ButtonWithIcon';
import ExitIcon from '../../assets/icons/exit.svg';
import CameraOff from '../layout/videos/CameraOFf';

interface VideoTrackInfo {
  type: 'local' | 'remote';
  track: LocalVideoTrack | RemoteVideoTrack | null;
  participantIdentity: string;
  trackSid: string;
}

interface QAScreenProps {
  roomId: string;
  allVideoTracks: VideoTrackInfo[];
  audioSinkRef: React.RefObject<HTMLDivElement | null>;
  myKey: string;
  order: string[];
  onLeave: () => void;
}

const QAScreen: React.FC<QAScreenProps> = ({
  allVideoTracks,
  audioSinkRef,
  myKey,
  order,
  onLeave,
}) => {
  return (
    <div className="min-h-screen px-4 mb-4 flex flex-col gap-4">
      {/* 헤더 */}
      <div className="sticky top-0 h-20 bg-my-black flex justify-between items-center px-8 z-50">
        <div className="w-11"></div>
        <h1 className="text-2xl font-semibold text-watermelon">질의응답</h1>
        {/* 방 나가기 버튼 */}
        <ButtonWithIcon onClick={onLeave}>
          <img src={ExitIcon} alt="Exit" className="w-7 h-7" />
        </ButtonWithIcon>
      </div>

      <span className="text-center">
        발표가 종료되었습니다. 자유롭게 질의응답 해주세요.
      </span>

      {/* 비디오 그리드 */}
      <div className="flex-1">
        <VideoGrid videoTracks={allVideoTracks} myKey={myKey} order={order} />
      </div>

      {/* 오디오 싱크 */}
      <div ref={audioSinkRef} className="hidden" />
    </div>
  );
};

interface VideoGridProps {
  videoTracks: VideoTrackInfo[];
  myKey: string;
  order: string[];
}

const VideoGrid: React.FC<VideoGridProps> = ({ videoTracks, myKey, order }) => {
  // 발표 순서대로 정렬
  const sortedTracks = [...videoTracks].sort((a, b) => {
    const aIndex = order.indexOf(a.participantIdentity);
    const bIndex = order.indexOf(b.participantIdentity);

    // 발표 순서에 있는 사람들을 먼저, 그 다음에 순서대로
    if (aIndex === -1 && bIndex === -1) return 0;
    if (aIndex === -1) return 1;
    if (bIndex === -1) return -1;
    return aIndex - bIndex;
  });

  // 그리드 레이아웃 계산
  const getGridCols = (count: number) => {
    if (count <= 1) return 'grid-cols-1';
    if (count <= 4) return 'grid-cols-2';
    if (count <= 6) return 'grid-cols-3';
    return 'grid-cols-4';
  };

  return (
    <div className={`grid gap-4 h-full ${getGridCols(sortedTracks.length)}`}>
      {sortedTracks.map((trackInfo) => (
        <VideoCard
          key={trackInfo.trackSid}
          trackInfo={trackInfo}
          isMe={trackInfo.participantIdentity === myKey}
          order={order}
        />
      ))}
    </div>
  );
};

interface VideoCardProps {
  trackInfo: VideoTrackInfo;
  isMe: boolean;
  order: string[];
}

const VideoCard: React.FC<VideoCardProps> = ({ trackInfo, isMe, order }) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement || !trackInfo.track) return;

    try {
      trackInfo.track.attach(videoElement);
      console.log(`✅ 비디오 연결: ${trackInfo.participantIdentity}`);
    } catch (error) {
      console.error('비디오 연결 실패:', error);
    }

    return () => {
      try {
        if (trackInfo.track) {
          trackInfo.track.detach(videoElement);
        }
      } catch (error) {
        console.error('비디오 해제 실패:', error);
      }
    };
  }, [trackInfo.track, trackInfo.participantIdentity]);

  const presentationIndex = order.indexOf(trackInfo.participantIdentity);
  const displayName =
    presentationIndex >= 0
      ? `발표자 ${presentationIndex + 1}`
      : trackInfo.participantIdentity;

  // 실제 비디오 트랙이 있는지 확인 (더미 트랙 제외)
  const hasVideoTrack = !!(
    trackInfo.track && !trackInfo.trackSid.startsWith('dummy-')
  );

  return (
    <div className="relative bg-gray-800 rounded-lg overflow-hidden aspect-video">
      {hasVideoTrack ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={trackInfo.type === 'local'} // 로컬 비디오만 음소거
          className="w-full h-full object-cover"
        />
      ) : (
        <CameraOff />
      )}

      {/* 참가자 정보 오버레이 */}
      <div className="absolute bottom-2 left-2 bg-black/50 px-3 py-1 rounded-full text-sm">
        <span className={isMe ? 'text-watermelon' : 'text-white'}>
          {displayName}
          {isMe && ' (나)'}
        </span>
      </div>
    </div>
  );
};

export default QAScreen;
