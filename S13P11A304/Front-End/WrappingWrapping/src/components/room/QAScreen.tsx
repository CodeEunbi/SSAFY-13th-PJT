// src/components/room/QAScreen.tsx

import React, { useRef, useEffect, useMemo } from 'react';
import { LocalVideoTrack, RemoteVideoTrack } from 'livekit-client';
import ButtonWithIcon from '../common/ButtonWithIcon';
import ExitIcon from '../../assets/icons/exit.svg';
import CameraOff from '../layout/videos/CameraOff';

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
  // 🔥 간단한 ID 중복 제거
  const uniqueVideoTracks = useMemo(() => {
    console.log(
      '🎥 QAScreen 원본 트랙들:',
      allVideoTracks.map((t) => ({
        participantId: t.participantIdentity,
        trackSid: t.trackSid,
        type: t.type,
      })),
    );

    // Set으로 이미 본 ID 추적
    const seenIds = new Set<string>();
    const uniqueTracks = allVideoTracks.filter((track) => {
      if (seenIds.has(track.participantIdentity)) {
        return false; // 이미 있으면 제외
      }
      seenIds.add(track.participantIdentity);
      return true; // 처음 보는 ID면 포함
    });

    console.log(
      '🔥 QAScreen 중복 제거 후:',
      uniqueTracks.map((t) => ({
        participantId: t.participantIdentity,
        trackSid: t.trackSid,
        type: t.type,
      })),
    );

    return uniqueTracks;
  }, [allVideoTracks]);

  // QAScreen에서 오디오 엘리먼트 상태 확인
  useEffect(() => {
    const audioElements = document.querySelectorAll('audio[data-track-sid]');
    console.log('QAScreen 오디오 엘리먼트 개수:', audioElements.length);
    audioElements.forEach((el, i) => {
      const audio = el as HTMLAudioElement;
      console.log(`오디오 ${i}:`, {
        trackSid: audio.dataset.trackSid,
        volume: audio.volume,
        muted: audio.muted,
        paused: audio.paused,
        autoplay: audio.autoplay,
      });
    });
  }, []);

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
        <VideoGrid
          videoTracks={uniqueVideoTracks}
          myKey={myKey}
          order={order}
        />
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

  console.log(
    '🎯 VideoGrid 최종 트랙들:',
    sortedTracks.map((t) => ({
      participantId: t.participantIdentity,
      trackSid: t.trackSid,
      isMe: t.participantIdentity === myKey,
    })),
  );

  return (
    <div className={`grid gap-4 h-full ${getGridCols(sortedTracks.length)}`}>
      {sortedTracks.map((trackInfo) => (
        <VideoCard
          key={`${trackInfo.participantIdentity}-${trackInfo.type}`} // 🔥 더 고유한 키
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

  // 더미 트랙이거나 트랙이 없거나 음소거된 경우 CameraOff 표시
  const shouldShowCameraOff =
    !trackInfo.track ||
    trackInfo.trackSid.startsWith('dummy-') ||
    (trackInfo.track && trackInfo.track.isMuted);

  return (
    <div className="relative bg-gray-800 rounded-2xl overflow-hidden aspect-video">
      {!shouldShowCameraOff ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={trackInfo.type === 'local'}
          className="w-full h-full object-cover scale-x-[-1] border-2 border-watermelon rounded-2xl"
        />
      ) : (
        <CameraOff />
      )}

      {/* 참가자 정보 오버레이 */}
      <div className="absolute bottom-2 left-2 bg-black/60 px-3 py-1 rounded-full text-sm">
        <span className={isMe ? 'text-watermelon font-bold' : 'text-white'}>
          {displayName}
          {isMe && ' (나)'}
        </span>
      </div>
    </div>
  );
};

export default QAScreen;
