import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Room,
  LocalAudioTrack,
  LocalTrackPublication,
  RoomEvent,
  Track,
} from 'livekit-client';
import sttApiController from '../api/sttApiController';
import { useRoomStore } from '../stores/useRoomStore';
import { formatToKoreanDateTimeWithSeconds } from '../utils/dateUtils';

interface UseAutoRecordingProps {
  room: Room | null;
  isConnected: boolean;
  currentPresenter: string | null;
  myKey: string;

  // RoomMeeting에서 계산: 실제 발표 중일 때만 true
  canRecord: boolean;

  presentationEndTime: string | null;
  currentPresenterIndex: number;

  roomId?: string;
  autoDownload?: boolean; // false로 설정하면 서버로만 전송
}

interface RecordingInfo {
  presenterIndex: number;
  startTime: string;
  endTime?: string;
  fileName: string;
  presenterIdentity: string;
}

type MRState = 'inactive' | 'recording' | 'paused';

const MIN_REQUIRED_MS = 3000; // 남은 시간이 이하면 시작 스킵
const MIN_ACTIVE_MS = 800; // start 직후 최소 유지시간

export const useAutoRecording = ({
  room,
  isConnected,
  currentPresenter,
  myKey,
  canRecord,
  presentationEndTime,
  currentPresenterIndex,
  roomId,
  autoDownload = false, // 기본값을 false로 변경 (서버 업로드 우선)
}: UseAutoRecordingProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const [currentRecordingPresenter, setCurrentRecordingPresenter] = useState<
    string | null
  >(null);
  const [recordingStartTime, setRecordingStartTime] = useState<string | null>(
    null,
  );
  const [recordedPresenters, setRecordedPresenters] = useState<RecordingInfo[]>(
    [],
  );
  const [uploadStatus, setUploadStatus] = useState<{
    uploading: boolean;
    error: string | null;
    success: boolean;
  }>({
    uploading: false,
    error: null,
    success: false,
  });

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const currentRecordingInfoRef = useRef<RecordingInfo | null>(null);

  const stopTimerRef = useRef<number | null>(null);
  const watchdogRef = useRef<number | null>(null);
  const armedAtRef = useRef<number>(0);
  const trackEndedUnsubRef = useRef<() => void>(() => {});

  // ---- 방 정보 가져오기 ----
  const {
    getJob,
    getMode,
    getTitle,
    getPresentationConstraints,
    getPresentationContext,
    getPresentationTopic,
  } = useRoomStore();

  // ---- 유틸: LiveKit 로컬 마이크 트랙 가져오기 ----
  const getLocalMicTrack = useCallback(
    (r: Room | null): LocalAudioTrack | null => {
      if (!r) return null;
      for (const pub of r.localParticipant.audioTrackPublications.values()) {
        const p = pub as LocalTrackPublication;
        if (p.source === Track.Source.Microphone && p.audioTrack) {
          return p.audioTrack as LocalAudioTrack;
        }
      }
      return null;
    },
    [],
  );

  // ---- 서버로 업로드 ----
  const uploadToServer = useCallback(
    async (blob: Blob, info: RecordingInfo) => {
      setUploadStatus({ uploading: true, error: null, success: false });

      try {
        const formData = new FormData();

        // 파일 추가
        formData.append('audio', blob, info.fileName);

        // 메타데이터 추가
        formData.append('userId', info.presenterIdentity);
        formData.append(
          'meetingAt',
          formatToKoreanDateTimeWithSeconds(info.startTime),
        );
        formData.append('job', getJob());
        formData.append('mode', getMode());
        formData.append('title', getTitle());
        formData.append('situation', getPresentationContext());
        formData.append('requirements', getPresentationConstraints());
        formData.append('question', getPresentationTopic());

        // 디버깅용 로그
        console.log('📦 업로드할 FormData:', {
          audio: info.fileName,
          userId: info.presenterIdentity,
          meetingAt: formatToKoreanDateTimeWithSeconds(info.startTime),
          job: getJob(),
          mode: getMode(),
          title: getTitle(),
          situation: getPresentationContext(),
          requirements: getPresentationConstraints(),
          question: getPresentationTopic(),
        });

        console.log('📤 서버로 녹음 파일 업로드 시작:', info.fileName);

        const response = await sttApiController({
          method: 'POST' as const,
          url: '/stt/process-interview',
          data: formData,
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });

        console.log('✅ 녹음 파일 업로드 성공:', response.data);
        setUploadStatus({ uploading: false, error: null, success: true });

        return response.data;
      } catch (error) {
        console.error('❌ 녹음 파일 업로드 실패:', error);
        setUploadStatus({
          uploading: false,
          error: error instanceof Error ? error.message : '업로드 실패',
          success: false,
        });
        throw error;
      }
    },
    [roomId],
  );

  // ---- 저장(다운로드 또는 서버 업로드) ----
  const saveRecording = useCallback(async () => {
    const chunks = recordedChunksRef.current;
    const info = currentRecordingInfoRef.current;
    if (!chunks.length || !info) {
      console.warn('⚠️ 저장할 녹음 데이터가 없습니다. (chunks.length=0)');
      return;
    }
    const blob = new Blob(chunks, { type: 'audio/webm' });

    // 서버 업로드 시도
    try {
      await uploadToServer(blob, info);
      console.log(`📤 서버 업로드 완료: ${info.fileName}`);
    } catch (error) {
      console.error('서버 업로드 실패, 로컬 다운로드로 대체:', error);

      // 서버 업로드 실패 시 로컬 다운로드로 대체
      // if (autoDownload) {
      try {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = info.fileName;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 0);
        console.log(`💾 로컬 다운로드 완료: ${info.fileName}`);
      } catch (e) {
        console.error('로컬 다운로드도 실패:', e);
      }
      // }
    }

    setRecordedPresenters((prev) => [...prev, { ...info }]);

    recordedChunksRef.current = [];
    currentRecordingInfoRef.current = null;
  }, [autoDownload, uploadToServer]);

  // ---- 진짜 stop (상태/클린업 포함) ----
  const reallyStop = useCallback((reason?: string) => {
    const mr = mediaRecorderRef.current;
    if (mr && (mr.state as MRState) === 'recording') {
      try {
        mr.requestData();
      } catch (e) {
        // console.log(e);
      }
      if (currentRecordingInfoRef.current) {
        currentRecordingInfoRef.current.endTime = new Date().toISOString();
      }
      try {
        mr.stop();
      } catch (e) {
        console.error('❌ MediaRecorder stop 실패:', e);
      }
      console.log('⏹️ 녹음 중지', reason ? `(${reason})` : '');
    }
    mediaRecorderRef.current = null;
    setIsRecording(false);
    setCurrentRecordingPresenter(null);
    setRecordingStartTime(null);

    // onended 구독 해제
    try {
      trackEndedUnsubRef.current();
    } catch (e) {
      // console.log(e);
    }
    trackEndedUnsubRef.current = () => {};
  }, []);

  // stop 요청은 최소 유지시간 보장
  const stopRecording = useCallback(
    (reason?: string) => {
      const delay = Math.max(0, armedAtRef.current - Date.now());
      if (delay > 0) {
        setTimeout(() => reallyStop(`${reason ?? 'stop'}(delayed)`), delay);
      } else {
        reallyStop(reason);
      }
    },
    [reallyStop],
  );

  // ---- 시작 ----
  const startRecording = useCallback(async () => {
    if (!room || !isConnected || isRecording) return;

    // 잔여 시간 체크
    const remainMs = presentationEndTime
      ? new Date(presentationEndTime).getTime() - Date.now()
      : Number.POSITIVE_INFINITY;
    if (remainMs <= MIN_REQUIRED_MS) {
      console.log(`⏸ 남은 시간 ${remainMs}ms → 녹음 시작 스킵`);
      return;
    }

    // LiveKit 로컬 마이크 트랙 확보 (없으면 이벤트 기다림)
    const beginWithTrack = (trk: LocalAudioTrack) => {
      const mst = trk.mediaStreamTrack;
      if (!mst) {
        console.warn('⚠️ LocalAudioTrack에 mediaStreamTrack 없음');
        return;
      }

      const stream = new MediaStream([mst]);

      let mime: string | undefined = 'audio/webm;codecs=opus';
      if (!MediaRecorder.isTypeSupported(mime)) {
        mime = 'audio/webm';
        if (!MediaRecorder.isTypeSupported(mime)) mime = undefined;
      }

      const mr = new MediaRecorder(stream, {
        mimeType: mime,
        audioBitsPerSecond: 128_000,
      } as MediaRecorderOptions);

      recordedChunksRef.current = [];

      mr.onstart = () => console.log('🎬 MediaRecorder start: ', Date.now());
      mr.onerror = (e) => console.error('MediaRecorder error:', e);
      mr.ondataavailable = (ev) => {
        if (ev.data && ev.data.size > 0) {
          recordedChunksRef.current.push(ev.data);
        }
      };
      mr.onstop = () => {
        console.log('🧲 MediaRecorder stop → save: ', Date.now());
        saveRecording();
      };

      const startISO = new Date().toISOString();
      const ts = startISO.replace(/[-:TZ.]/g, '').slice(0, 14);
      const presenter = currentPresenter ?? myKey;
      const safePresenter = presenter.replace(/[^a-zA-Z0-9_-]/g, '');
      const base = roomId ? `${roomId}_` : '';
      const fileName = `recording_${base}${currentPresenterIndex + 1}_${safePresenter}_${ts}.webm`;

      currentRecordingInfoRef.current = {
        presenterIndex: currentPresenterIndex,
        startTime: startISO,
        fileName,
        presenterIdentity: presenter,
      };

      // ✅ timeslice 없이 시작 → stop 때 한 번에 데이터
      mr.start();
      mediaRecorderRef.current = mr;

      // 최소 유지시간 가드
      armedAtRef.current = Date.now() + MIN_ACTIVE_MS;

      setIsRecording(true);
      setCurrentRecordingPresenter(presenter);
      setRecordingStartTime(startISO);

      console.log(`🔴 녹음 시작: ${fileName}`);

      // 트랙 종료(onended) 시에도 상태/저장 처리
      const onEnded = () => {
        // LiveKit/OS에서 마이크가 끊겨도 저장/정리
        stopRecording('track-ended');
      };
      mst.addEventListener('ended', onEnded);
      trackEndedUnsubRef.current = () =>
        mst.removeEventListener('ended', onEnded);

      // 발표 종료 타이머
      if (presentationEndTime) {
        const delay = Math.max(
          0,
          new Date(presentationEndTime).getTime() - Date.now(),
        );
        if (stopTimerRef.current) clearTimeout(stopTimerRef.current);
        stopTimerRef.current = window.setTimeout(() => {
          stopTimerRef.current = null;
          stopRecording('timeup');
        }, delay);
      }

      // 보강 워치독
      if (!watchdogRef.current) {
        watchdogRef.current = window.setInterval(() => {
          if (!isRecording || !presentationEndTime) return;
          const endMs = new Date(presentationEndTime).getTime();
          if (Date.now() >= endMs) stopRecording('watchdog');
        }, 1000);
      }
    };

    const existing = getLocalMicTrack(room);
    if (existing) {
      beginWithTrack(existing);
      return;
    }

    // 아직 발행 전이면 1회 대기
    const onLocalTrackPublished = (pub: LocalTrackPublication) => {
      if (pub.source === Track.Source.Microphone && pub.audioTrack) {
        room.off(RoomEvent.LocalTrackPublished, onLocalTrackPublished);
        // 여전히 시작 조건 성립하는지 재확인
        const stillOk =
          canRecord &&
          currentPresenter === myKey &&
          (!presentationEndTime ||
            new Date(presentationEndTime).getTime() - Date.now() >
              MIN_REQUIRED_MS);
        if (stillOk) beginWithTrack(pub.audioTrack as LocalAudioTrack);
      }
    };
    room.on(RoomEvent.LocalTrackPublished, onLocalTrackPublished);

    // 안전 타임아웃(8초)
    setTimeout(() => {
      if (!room) return;
      room.off(RoomEvent.LocalTrackPublished, onLocalTrackPublished);
    }, 8000);
  }, [
    room,
    isConnected,
    isRecording,
    presentationEndTime,
    canRecord,
    currentPresenter,
    myKey,
    roomId,
    currentPresenterIndex,
    getLocalMicTrack,
    saveRecording,
    stopRecording,
  ]);

  // ---- canRecord 변화 → 시작/종료 ----
  useEffect(() => {
    const iAmPresenter = currentPresenter === myKey;

    if (canRecord && iAmPresenter) {
      startRecording();
    } else {
      if (isRecording) stopRecording('phase/off');
    }
  }, [
    canRecord,
    currentPresenter,
    myKey,
    startRecording,
    isRecording,
    stopRecording,
  ]);

  // ---- unload 대비 ----
  useEffect(() => {
    const onPageHide = () => {
      if (isRecording) stopRecording('pagehide');
    };
    const onBeforeUnload = () => {
      if (isRecording) stopRecording('beforeunload');
    };
    window.addEventListener('pagehide', onPageHide);
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => {
      window.removeEventListener('pagehide', onPageHide);
      window.removeEventListener('beforeunload', onBeforeUnload);
    };
  }, [isRecording, stopRecording]);

  // ---- 정리 ----
  useEffect(() => {
    return () => {
      if (stopTimerRef.current) clearTimeout(stopTimerRef.current);
      if (watchdogRef.current) clearInterval(watchdogRef.current);
      try {
        trackEndedUnsubRef.current();
      } catch (e) {
        // console.log(e);
      }
      trackEndedUnsubRef.current = () => {};
      if (isRecording) stopRecording('unmount');
    };
  }, [isRecording, stopRecording]);

  return {
    isRecording,
    currentRecordingPresenter,
    recordingStartTime,
    recordedPresenters,
    uploadStatus, // 업로드 상태 추가
    manualStopRecording: () => stopRecording('manual'),
  };
};
