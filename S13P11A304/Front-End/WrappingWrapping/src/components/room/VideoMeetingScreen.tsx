// src/components/room/VideoMeetingScreen.tsx

import { useEffect, useState } from 'react';
import { RefObject } from 'react';
import VideoBig from '../layout/videos/VideoBig';
import VideoSmallLists from '../layout/videos/VideoSmallLists';
import Timer from '../common/Timer';
import type { VideoTrackInfo } from '../../types/interfaces/rooms';
import { LocalVideoTrack, RemoteVideoTrack } from 'livekit-client';
import { PreparationOverlay } from '../room/PreparationOverlayProps';
import ButtonWithIcon from '../common/ButtonWithIcon';
import ExitIcon from '../../assets/icons/exit.svg';

interface VideoMeetingScreenProps {
  roomId: string;
  presentationEndTime: string | null;
  onPresentationExpire: () => void;

  // 발표자 관련
  currentPresenter: string | null;
  isMyTurn: boolean;
  isLastPresenter: boolean;
  onNextPresenter: () => void;

  // 사용자 식별
  myKey: string;

  // 비디오 트랙 관련
  presenterVideoTrack: {
    type: 'local' | 'remote';
    track: LocalVideoTrack | RemoteVideoTrack | null;
  } | null;
  otherVideoTracks: VideoTrackInfo[];

  // 오디오 싱크 참조
  audioSinkRef: RefObject<HTMLDivElement | null>;

  isPreparationPhase: boolean;
  preparationEndTime: string | null;
  onPreparationComplete: () => void;

  // 녹음
  isRecording: boolean;
  currentRecordingPresenter: string | null;
  recordingStartTime: string | null;

  // 방 나가기 콜백
  onLeave: () => void;
}

// 녹음 상태 표시 컴포넌트
const RecordingIndicator: React.FC<{
  isRecording: boolean;
  presenter: string | null;
  startTime: string | null;
}> = ({ isRecording, presenter, startTime }) => {
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    if (!isRecording || !startTime) return;

    const startTimeDate = new Date(startTime);

    const interval = setInterval(() => {
      setDuration(Math.floor((Date.now() - startTimeDate.getTime()) / 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, [isRecording, startTime]);

  if (!isRecording || !presenter) return null;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="top-4 left-4 text-white px-4 py-2 rounded-lg flex items-center space-x-2 z-40">
      <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
      <span className="font-medium">REC</span>
      <span className="font-mono">{formatTime(duration)}</span>
    </div>
  );
};

const VideoMeetingScreen = ({
  presentationEndTime,
  onPresentationExpire,
  currentPresenter,
  isMyTurn,
  myKey,
  presenterVideoTrack,
  otherVideoTracks,
  audioSinkRef,
  isPreparationPhase,
  preparationEndTime,
  onPreparationComplete,
  isRecording,
  currentRecordingPresenter,
  recordingStartTime,
  onLeave,
}: VideoMeetingScreenProps) => {
  return (
    <div className="relative h-screen">
      {/* 녹음 상태 표시 */}
      {/* 타이머 */}

      <div className="sticky top-0 h-24 bg-my-black flex justify-between items-center px-8 z-50">
        <div className="bg-watermelon rounded-3xl min-w-24 px-4 py-2 text-my-black text-center font-bold text-xl">
          <Timer
            endTime={presentationEndTime}
            onExpire={onPresentationExpire}
          />
        </div>
        <RecordingIndicator
          isRecording={isRecording}
          presenter={currentRecordingPresenter}
          startTime={recordingStartTime}
        />
        <div className="w-24 flex bg-transparent justify-end">
          <ButtonWithIcon onClick={onLeave}>
            <img src={ExitIcon} alt="Exit" className="w-7 h-7" />
          </ButtonWithIcon>
        </div>
      </div>

      <div className="flex flex-col gap-4 m-4">
        {/* 발표자 비디오 */}
        <VideoBig
          localTrack={
            presenterVideoTrack?.type === 'local'
              ? (presenterVideoTrack.track as LocalVideoTrack | null)
              : null
          }
          remoteTrack={
            presenterVideoTrack?.type === 'remote'
              ? (presenterVideoTrack.track as RemoteVideoTrack | null)
              : null
          }
          presenterName={currentPresenter}
        />

        {/* 다른 참가자들 비디오 */}
        <VideoSmallLists videoTracks={otherVideoTracks} myKey={myKey} />

        {/* 숨김 오디오 컨테이너 */}
        <div ref={audioSinkRef} className="sr-only" aria-hidden="true" />
      </div>
      {/* 발표 준비 오버레이 */}
      {isPreparationPhase && preparationEndTime && (
        <PreparationOverlay
          endTime={preparationEndTime}
          onComplete={onPreparationComplete}
          isMyTurn={isMyTurn}
        />
      )}
    </div>
  );
};

export default VideoMeetingScreen;
