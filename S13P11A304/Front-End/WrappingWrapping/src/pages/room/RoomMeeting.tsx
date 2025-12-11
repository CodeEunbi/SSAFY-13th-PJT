// src/pages/room/RoomMeeting.tsx

import { useEffect, useMemo, useCallback, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

import { useMediaStore } from '../../stores/useMediaStore';
import { useRoom } from '../../hooks/useRooms';
import { usePresentationOrder } from '../../hooks/usePresentationOrder';
import { useLiveKitRoom } from '../../hooks/useLiveKitRoom';
import { usePresentationFlow } from '../../hooks/usePresentationFlow';
import { useVideoTracks } from '../../hooks/useVideoTracks';
import { useAutoRecording } from '../../hooks/useAutoRecording';
import { validateRoomAccess } from '../../utils/roomUtils';
import type { VideoTrackInfo } from '../../types/interfaces/rooms';

import VideoMeetingScreen from '../../components/room/VideoMeetingScreen';
import RequirementDisplay from '../../components/room/RequirementDisplay';
import QAScreen from '../../components/room/QAScreen';
import RoomExitModal from '../../components/room/RoomExitModal';

export default function RoomMeeting() {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const { isCameraOn, isMicOn, videoDeviceId, audioDeviceId } = useMediaStore();
  const [isValidating, setIsValidating] = useState(true);

  // 커스텀 나가기 모달 상태
  const [showExitModal, setShowExitModal] = useState(false);

  // 🔥 마이크 제어를 위한 상태
  const [wasRequirementsShown, setWasRequirementsShown] = useState(false);

  // 방/순서 정보
  const { room } = useRoom(roomId || '');
  const { order } = usePresentationOrder(roomId || '');

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
    roomId: roomId || '',
    videoDeviceId,
    audioDeviceId,
    isCameraOn,
    isMicOn,
  });

  // 발표 플로우
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
  } = usePresentationFlow();

  // 🔥 새로고침 후 마이페이지 리다이렉션 체크
  useEffect(() => {
    const checkRedirectFlag = () => {
      const shouldRedirect = sessionStorage.getItem(
        'redirectToMyPageFromMeeting',
      );
      if (shouldRedirect === 'true') {
        console.log('🔄 새로고침 감지: 마이페이지로 리다이렉션');
        sessionStorage.removeItem('redirectToMyPageFromMeeting');
        navigate('/mypage', { replace: true });
        return true;
      }
      return false;
    };

    // 페이지 로드 시 즉시 체크
    if (checkRedirectFlag()) {
      return; // 리다이렉션 중이면 더 이상 실행하지 않음
    }
  }, [navigate]);

  // 실제 녹음 가능 조건
  const canRecord = useMemo(
    () =>
      !showRequirements &&
      !allPresentationsComplete &&
      !!currentPresenter &&
      isConnected,
    [showRequirements, allPresentationsComplete, currentPresenter, isConnected],
  );

  // 자동 녹음
  const { isRecording, currentRecordingPresenter, recordingStartTime } =
    useAutoRecording({
      room: liveKitRoom,
      isConnected,
      currentPresenter,
      myKey,
      canRecord,
      presentationEndTime,
      currentPresenterIndex,
      roomId: roomId || '',
      autoDownload: false,
    });

  // 🔥 마이크 제어 로직
  useEffect(() => {
    if (!liveKitRoom || !isConnected) return;

    const handleMicrophoneControl = async () => {
      try {
        if (showRequirements) {
          // 요구사항 화면 시작: 마이크 음소거
          setWasRequirementsShown(true);
          await liveKitRoom.localParticipant.setMicrophoneEnabled(false);
          console.log('🔇 요구사항 화면: 마이크 음소거');
        } else if (wasRequirementsShown) {
          // 요구사항 화면 종료: 마이크 복원
          console.log('🔊 요구사항 화면 종료: 마이크 복원 시작');

          // 1단계: 전체 미디어 재활성화
          await liveKitRoom.localParticipant.enableCameraAndMicrophone();

          // 2단계: 명시적 마이크 활성화
          await liveKitRoom.localParticipant.setMicrophoneEnabled(true);

          // 3단계: 카메라 상태 복원
          await liveKitRoom.localParticipant.setCameraEnabled(isCameraOn);

          console.log('🔊 마이크 복원 완료');
        }
      } catch (error) {
        console.error('❌ 마이크 제어 실패:', error);
      }
    };

    handleMicrophoneControl();
  }, [
    showRequirements,
    wasRequirementsShown,
    liveKitRoom,
    isConnected,
    isCameraOn,
  ]);

  // 🔥 QAScreen 진입 시 마이크 확실히 활성화
  useEffect(() => {
    if (allPresentationsComplete && liveKitRoom && isConnected) {
      const ensureQAMicrophone = async () => {
        try {
          console.log('🎤 QAScreen 진입: 마이크 활성화 확인');

          // QA 화면에서는 무조건 마이크 활성화
          await liveKitRoom.localParticipant.setMicrophoneEnabled(true);
          await liveKitRoom.localParticipant.setCameraEnabled(isCameraOn);

          console.log('✅ QAScreen 마이크 활성화 완료');

          // 🔥 모든 원격 오디오 트랙을 다시 연결
          console.log('🔊 QAScreen: 원격 오디오 트랙 재연결 시작');

          liveKitRoom.remoteParticipants.forEach((participant) => {
            const audioPubs = Array.from(
              participant.audioTrackPublications.values(),
            );
            audioPubs.forEach((publication) => {
              if (
                publication.track &&
                publication.isSubscribed &&
                audioSinkRef.current
              ) {
                const sid = publication.trackSid;

                // 기존 오디오 엘리먼트 확인
                const existing =
                  audioSinkRef.current.querySelector<HTMLAudioElement>(
                    `audio[data-track-sid="${sid}"]`,
                  );

                if (!existing) {
                  // 새 오디오 엘리먼트 생성
                  const el = document.createElement('audio');
                  el.autoplay = true;
                  el.controls = false;
                  el.volume = 1.0;
                  el.muted = false;
                  el.dataset.trackSid = sid;

                  publication.track.attach(el as HTMLMediaElement);
                  audioSinkRef.current.appendChild(el);

                  console.log('🔊 QAScreen 오디오 엘리먼트 재생성:', {
                    participantId: participant.identity,
                    trackSid: sid,
                  });

                  // 재생 시도
                  setTimeout(() => {
                    el.play().catch((e) =>
                      console.log('QAScreen 오디오 재생 실패:', e),
                    );
                  }, 100);
                } else {
                  console.log('🔊 QAScreen 기존 오디오 엘리먼트 유지:', sid);
                }
              }
            });
          });

          // 오디오 엘리먼트 개수 확인
          setTimeout(() => {
            const audioElements = document.querySelectorAll(
              'audio[data-track-sid]',
            );
            console.log(
              '🔊 QAScreen 오디오 엘리먼트 재연결 완료. 총 개수:',
              audioElements.length,
            );
          }, 200);
        } catch (error) {
          console.error('❌ QAScreen 마이크 활성화 실패:', error);
        }
      };

      // 100ms 지연 후 실행 (화면 전환 완료 후)
      setTimeout(ensureQAMicrophone, 100);
    }
  }, [
    allPresentationsComplete,
    liveKitRoom,
    isConnected,
    isCameraOn,
    audioSinkRef,
  ]);

  // 비디오 트랙
  const { isMyTurn, presenterVideoTrack, otherVideoTracks } = useVideoTracks({
    currentPresenter,
    myKey,
    localTrack,
    remoteTracks,
  });

  // 질의응답용 모든 비디오 트랙 (중복 제거)
  const allVideoTracks = useMemo(() => {
    const tracks: {
      type: 'local' | 'remote';
      track: any;
      participantIdentity: string;
      trackSid: string;
    }[] = [];

    // 내 로컬 트랙 추가
    if (localTrack) {
      tracks.push({
        type: 'local',
        track: localTrack,
        participantIdentity: myKey,
        trackSid: 'local',
      });
    }

    // 🔥 중복 제거: 참가자별로 가장 최신/실제 비디오 트랙만 추가
    const participantVideoTracks = new Map<string, VideoTrackInfo>();

    remoteTracks
      .filter((t) => t.trackPublication.kind === 'video')
      .forEach((t) => {
        const participantId = t.participantIdentity;
        const existing = participantVideoTracks.get(participantId);

        // 더미 트랙이 아닌 실제 트랙을 우선
        const isDummy = t.trackPublication.trackSid.startsWith('dummy-');
        const existingIsDummy = existing?.trackSid.startsWith('dummy-');

        if (!existing || (existingIsDummy && !isDummy)) {
          participantVideoTracks.set(participantId, {
            type: 'remote',
            track: t.trackPublication.videoTrack || null,
            participantIdentity: t.participantIdentity,
            trackSid: t.trackPublication.trackSid,
          });
        }
      });

    // Map에서 배열로 변환하여 추가
    participantVideoTracks.forEach((trackInfo) => {
      tracks.push(trackInfo);
    });

    console.log(
      '🎥 QAScreen allVideoTracks 생성:',
      tracks.map((t) => ({
        participantId: t.participantIdentity,
        trackSid: t.trackSid,
        isDummy: t.trackSid.startsWith('dummy-'),
      })),
    );

    return tracks;
  }, [localTrack, remoteTracks, myKey]);

  // 통합된 방 나가기
  const handleLeaveRoom = useCallback(() => {
    setShowExitModal(true);
  }, []);

  // 모달: 확인 → cleanup
  const confirmLeave = useCallback(() => {
    setShowExitModal(false);
    cleanupLiveKit();
  }, [cleanupLiveKit]);

  // 모달: 취소 → 체류
  const cancelLeave = useCallback(() => {
    setShowExitModal(false);
    history.pushState(null, '', location.href);
  }, []);

  // 초기 접근 검증
  useEffect(() => {
    const initialize = async () => {
      const result = await validateRoomAccess(roomId);
      if (!result || !result.isValid) {
        navigate('/mypage');
        return;
      }
      setIsValidating(false);
    };
    initialize();
  }, [roomId, navigate]);

  // 요구사항 화면이 아닐 때만 미디어 설정 업데이트
  useEffect(() => {
    if (!showRequirements && !wasRequirementsShown) {
      // 처음 입장 시에만 기본 미디어 설정 적용
      updateMediaSettings(isCameraOn, isMicOn);
    }
  }, [
    showRequirements,
    wasRequirementsShown,
    isCameraOn,
    isMicOn,
    updateMediaSettings,
  ]);

  // 🔥 새로고침 감지 및 마이페이지 리다이렉션 설정
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      // 새로고침 감지 플래그 설정
      sessionStorage.setItem('redirectToMyPageFromMeeting', 'true');
      console.log('🔄 새로고침 감지: 리다이렉션 플래그 설정');

      // 사용자에게 확인 메시지 표시 (선택사항)
      e.preventDefault();
      e.returnValue = '회의에서 나가시겠습니까? 다시 입장할 수 없습니다.';
      return e.returnValue;
    };

    const handleUnload = () => {
      // 페이지가 실제로 언로드될 때 플래그 유지
      sessionStorage.setItem('redirectToMyPageFromMeeting', 'true');
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('unload', handleUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('unload', handleUnload);
    };
  }, []);

  // 브라우저 뒤로가기 가드
  useEffect(() => {
    history.pushState(null, '', location.href);

    const onPopState = (e: PopStateEvent) => {
      e.preventDefault();
      setShowExitModal(true);
    };

    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  // 요구사항 만료 시 처리
  const handleRequirementExpire = useCallback(async () => {
    console.log('⏰ 요구사항 화면 타이머 만료');
    originalHandleRequirementExpire();
  }, [originalHandleRequirementExpire]);

  if (!roomId) return <div>방 ID가 없습니다.</div>;

  // 검증 중 로딩
  if (isValidating) {
    return (
      <div className="w-full min-h-screen bg-my-black flex items-center justify-center">
        <div className="text-my-white text-xl">
          회의 접근 권한을 확인하는 중...
        </div>
      </div>
    );
  }

  // 요구사항 화면
  if (showRequirements && room) {
    return (
      <>
        <RequirementDisplay
          room={{
            question: room.question || null,
            situation: room.situation || null,
            requirements: room.requirements || null,
          }}
          endTime={requirementEndTime!}
          onSkip={skipToVideo}
          onExpire={handleRequirementExpire}
          onLeave={handleLeaveRoom}
        />
        <RoomExitModal
          isOpen={showExitModal}
          onConfirm={confirmLeave}
          onCancel={cancelLeave}
        />
      </>
    );
  }

  // 질의응답 화면
  if (allPresentationsComplete) {
    return (
      <>
        <QAScreen
          roomId={roomId}
          allVideoTracks={allVideoTracks}
          audioSinkRef={audioSinkRef}
          myKey={myKey}
          onLeave={handleLeaveRoom}
          order={order}
        />
        <RoomExitModal
          isOpen={showExitModal}
          onConfirm={confirmLeave}
          onCancel={cancelLeave}
        />
      </>
    );
  }

  // 비디오 회의 화면
  return (
    <>
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
      <RoomExitModal
        isOpen={showExitModal}
        onConfirm={confirmLeave}
        onCancel={cancelLeave}
      />
    </>
  );
}
