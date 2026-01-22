// src/pages/room/RoomMeeting.tsx

import { useEffect, useMemo, useCallback } from 'react';
import { useParams } from 'react-router-dom';

import { useMediaStore } from '../../stores/useMediaStore';
import { useRoom } from '../../hooks/useRooms';
import { usePresentationOrder } from '../../hooks/usePresentationOrder';
import { useLiveKitRoom } from '../../hooks/useLiveKitRoom';
import { usePresentationFlow } from '../../hooks/usePresentationFlow';
import { useMicrophoneControl } from '../../hooks/useMicrophoneControl';
import { useVideoTracks } from '../../hooks/useVideoTracks';
import { useAutoRecording } from '../../hooks/useAutoRecording';
import { useRoomContext } from '../../contexts/RoomContext';

import VideoMeetingScreen from '../../components/room/VideoMeetingScreen';
import RequirementDisplay from '../../components/room/RequirementDisplay';
import QAScreen from '../../components/room/QAScreen';

export default function RoomMeeting() {
  const { roomId } = useParams<{ roomId: string }>();
  const { isCameraOn, isMicOn, videoDeviceId, audioDeviceId } = useMediaStore();
  const { leaveRoom } = useRoomContext();

  if (!roomId) return <div>방 ID가 없습니다.</div>;

  // 방/순서 정보
  const { room } = useRoom(roomId);
  const { order } = usePresentationOrder(roomId);

  // LiveKit 연결
  const {
    liveKitRoom,
    localTrack,
    remoteTracks,
    myKey,
    isConnected,
    audioSinkRef,
    updateMediaSettings,
    cleanup: cleanupLiveKit,
  } = useLiveKitRoom({
    roomId,
    videoDeviceId,
    audioDeviceId,
    isCameraOn,
    isMicOn,
  });

  // 발표 플로우 (order prop 제거)
  const {
    showRequirements,
    currentPresenter,
    currentPresenterIndex,
    requirementEndTime,
    presentationEndTime,
    isLastPresenter,
    isPreparationPhase,
    preparationEndTime,
    allPresentationsComplete,
    skipToVideo,
    handleRequirementExpire: originalHandleRequirementExpire,
    handlePreparationComplete,
    handlePresentationExpire,
    nextPresenter,
  } = usePresentationFlow(); // 빈 객체 전달

  // 실제 발표 여부
  const canRecord = useMemo(
    () =>
      !showRequirements &&
      !allPresentationsComplete &&
      !!currentPresenter &&
      isConnected,
    [showRequirements, allPresentationsComplete, currentPresenter, isConnected],
  );

  // 자동 녹음
  const {
    isRecording,
    currentRecordingPresenter,
    recordingStartTime,
    manualStopRecording,
  } = useAutoRecording({
    room: liveKitRoom,
    isConnected,
    currentPresenter,
    myKey,
    canRecord,
    presentationEndTime,
    currentPresenterIndex,
    roomId,
    autoDownload: false, // 서버 업로드 모드
  });

  // 마이크 제어
  useMicrophoneControl({
    room: liveKitRoom,
    isConnected,
    showRequirements,
    isMicOn,
  });

  // 비디오 트랙
  const { isMyTurn, presenterVideoTrack, otherVideoTracks } = useVideoTracks({
    currentPresenter,
    myKey,
    localTrack,
    remoteTracks,
  });

  // 질의응답용 모든 비디오 트랙
  const allVideoTracks = useMemo(() => {
    const tracks = [];

    if (localTrack) {
      tracks.push({
        type: 'local' as const,
        track: localTrack,
        participantIdentity: myKey,
        trackSid: 'local',
      });
    }

    const remoteVideoTracks = remoteTracks.filter(
      (t) => t.trackPublication.kind === 'video',
    );

    remoteVideoTracks.forEach((t) => {
      tracks.push({
        type: 'remote' as const,
        track: t.trackPublication.videoTrack || null,
        participantIdentity: t.participantIdentity,
        trackSid: t.trackPublication.trackSid,
      });
    });

    return tracks;
  }, [localTrack, remoteTracks, myKey]);

  // Context에서 가져온 leaveRoom 함수를 현재 상태에 맞게 래핑
  const handleLeaveRoom = useCallback(() => {
    // 🔑 LiveKit cleanup을 먼저 실행
    if (cleanupLiveKit) {
      cleanupLiveKit();
    }

    leaveRoom(liveKitRoom, isRecording, manualStopRecording);
  }, [
    leaveRoom,
    liveKitRoom,
    isRecording,
    manualStopRecording,
    cleanupLiveKit,
  ]);

  // 미디어 설정
  useEffect(() => {
    if (!showRequirements) {
      updateMediaSettings(isCameraOn, isMicOn);
    }
  }, [showRequirements, isCameraOn, isMicOn, updateMediaSettings]);

  // 페이지 언마운트 시 정리
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (liveKitRoom) {
        liveKitRoom.disconnect();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      // 컴포넌트 언마운트 시에도 정리
      if (liveKitRoom) {
        liveKitRoom.disconnect();
      }
    };
  }, [liveKitRoom]);

  // 요구사항 만료 시 미디어 활성화
  const handleRequirementExpire = useCallback(async () => {
    if (liveKitRoom) {
      try {
        await liveKitRoom.localParticipant.enableCameraAndMicrophone();
        console.log('✅ 미디어 활성화 성공');
      } catch (error) {
        console.warn('⚠️ 미디어 활성화 실패:', error);
      }
    }

    originalHandleRequirementExpire();
  }, [liveKitRoom, originalHandleRequirementExpire]);

  // 초기 로딩 로그
  useEffect(() => {
    if (room && order.length > 0) {
      console.log('✅ 방 정보 로드 완료:', room);
      console.log('✅ 필터링된 발표 순서 로드 완료:', order);
    }
  }, [room, order]);

  // 요구사항 화면
  if (showRequirements && room) {
    return (
      <RequirementDisplay
        room={{
          question: room.question || null,
          situation: room.situation || null,
          requirements: room.requirements || null,
        }}
        endTime={requirementEndTime}
        onSkip={skipToVideo}
        onExpire={handleRequirementExpire}
        onLeave={handleLeaveRoom}
      />
    );
  }

  // 질의응답 화면
  if (allPresentationsComplete) {
    return (
      <QAScreen
        roomId={roomId}
        allVideoTracks={allVideoTracks}
        audioSinkRef={audioSinkRef}
        myKey={myKey}
        onLeave={handleLeaveRoom}
        order={order}
      />
    );
  }

  // 비디오 회의 화면
  return (
    <VideoMeetingScreen
      roomId={roomId}
      presentationEndTime={presentationEndTime}
      onPresentationExpire={handlePresentationExpire}
      currentPresenter={currentPresenter}
      isMyTurn={isMyTurn}
      isLastPresenter={isLastPresenter}
      onNextPresenter={nextPresenter}
      myKey={myKey}
      presenterVideoTrack={presenterVideoTrack}
      otherVideoTracks={otherVideoTracks}
      audioSinkRef={audioSinkRef}
      isPreparationPhase={isPreparationPhase}
      preparationEndTime={preparationEndTime}
      onPreparationComplete={handlePreparationComplete}
      isRecording={isRecording}
      currentRecordingPresenter={currentRecordingPresenter}
      recordingStartTime={recordingStartTime}
      onLeave={handleLeaveRoom}
    />
  );
}
