// src/hooks/useAutoRecording.ts
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
  canRecord: boolean;
  presentationEndTime: string | null;
  currentPresenterIndex: number;
  roomId?: string;
  autoDownload?: boolean;
}

interface RecordingInfo {
  presenterIndex: number;
  startTime: string;
  endTime?: string;
  fileName: string;
  presenterIdentity: string;
}

type MRState = 'inactive' | 'recording' | 'paused';

const MIN_REQUIRED_MS = 3000;
const MIN_ACTIVE_MS = 800;

export const useAutoRecording = ({
  room,
  isConnected,
  currentPresenter,
  myKey,
  canRecord,
  presentationEndTime,
  currentPresenterIndex,
  roomId,
  // autoDownload = false,
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
  const [uploadStatus, setUploadStatus] = useState({
    uploading: false,
    error: null as string | null,
    success: false,
  });

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const currentRecordingInfoRef = useRef<RecordingInfo | null>(null);

  const stopTimerRef = useRef<number | null>(null);
  const watchdogRef = useRef<number | null>(null);
  const armedAtRef = useRef<number>(0);
  const trackEndedUnsubRef = useRef<() => void>(() => {});

  const {
    getJob,
    getMode,
    getTitle,
    getPresentationConstraints,
    getPresentationContext,
    getPresentationTopic,
  } = useRoomStore();

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

  const uploadToServer = useCallback(
    async (blob: Blob, info: RecordingInfo) => {
      setUploadStatus({ uploading: true, error: null, success: false });
      try {
        const formData = new FormData();
        formData.append('audio', blob, info.fileName);
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

        console.log('📤 서버로 녹음 파일 업로드 시작:', info.fileName);
        const response = await sttApiController({
          method: 'POST' as const,
          url: '/stt/process-interview',
          data: formData,
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        console.log('✅ 녹음 파일 업로드 성공:', response.data);
        setUploadStatus({ uploading: false, error: null, success: true });
        return response.data;
      } catch (error: any) {
        console.error('❌ 녹음 파일 업로드 실패:', error);
        setUploadStatus({
          uploading: false,
          error: error?.message ?? '업로드 실패',
          success: false,
        });
        throw error;
      }
    },
    [
      roomId,
      getJob,
      getMode,
      getTitle,
      getPresentationContext,
      getPresentationConstraints,
      getPresentationTopic,
    ],
  );

  const saveRecording = useCallback(async () => {
    const chunks = recordedChunksRef.current;
    const info = currentRecordingInfoRef.current;
    if (!chunks.length || !info) {
      console.warn('⚠️ 저장할 녹음 데이터가 없습니다.');
      return;
    }
    const blob = new Blob(chunks, { type: 'audio/webm' });

    try {
      await uploadToServer(blob, info);
      console.log(`📤 서버 업로드 완료: ${info.fileName}`);
    } catch (error) {
      console.error('서버 업로드 실패, 로컬 다운로드로 대체:', error);
      // try {
      //   const url = URL.createObjectURL(blob);
      //   const a = document.createElement('a');
      //   a.href = url;
      //   a.download = info.fileName;
      //   document.body.appendChild(a);
      //   a.click();
      //   a.remove();
      //   setTimeout(() => URL.revokeObjectURL(url), 0);
      // } catch (e) {
      //   console.error('로컬 다운로드도 실패:', e);
      // }
    }

    setRecordedPresenters((prev) => [...prev, { ...info }]);
    recordedChunksRef.current = [];
    currentRecordingInfoRef.current = null;
  }, [uploadToServer]);

  const reallyStop = useCallback((reason?: string) => {
    const mr = mediaRecorderRef.current;
    if (mr && (mr.state as MRState) === 'recording') {
      try {
        mr.requestData();
      } catch (e) {
        console.error('❌ MediaRecorder requestData 실패:', e);
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
    try {
      trackEndedUnsubRef.current();
    } catch (e) {
      console.error('❌ trackEndedUnsubRef cleanup 실패:', e);
    }
    trackEndedUnsubRef.current = () => {};
  }, []);

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

  const startRecording = useCallback(async () => {
    if (!room || !isConnected || isRecording) return;

    const remainMs = presentationEndTime
      ? new Date(presentationEndTime).getTime() - Date.now()
      : Number.POSITIVE_INFINITY;
    if (remainMs <= MIN_REQUIRED_MS) {
      console.log(`⏸ 남은 시간 ${remainMs}ms → 녹음 시작 스킵`);
      return;
    }

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

      mr.onstart = () => console.log('🎬 MediaRecorder start:', Date.now());
      mr.onerror = (e) => console.error('MediaRecorder error:', e);
      mr.ondataavailable = (ev) => {
        if (ev.data && ev.data.size > 0)
          recordedChunksRef.current.push(ev.data);
      };
      mr.onstop = () => {
        console.log('🧲 MediaRecorder stop → save:', Date.now());
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

      mr.start(); // timeslice 없음 → stop에서 한 번에 flush
      mediaRecorderRef.current = mr;

      armedAtRef.current = Date.now() + MIN_ACTIVE_MS;
      setIsRecording(true);
      setCurrentRecordingPresenter(presenter);
      setRecordingStartTime(startISO);

      console.log(`🔴 녹음 시작: ${fileName}`);

      const onEnded = () => stopRecording('track-ended');
      mst.addEventListener('ended', onEnded);
      trackEndedUnsubRef.current = () =>
        mst.removeEventListener('ended', onEnded);

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

    const onLocalTrackPublished = (pub: LocalTrackPublication) => {
      if (pub.source === Track.Source.Microphone && pub.audioTrack) {
        room.off(RoomEvent.LocalTrackPublished, onLocalTrackPublished);
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
    setTimeout(() => {
      room?.off(RoomEvent.LocalTrackPublished, onLocalTrackPublished);
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

  // ✅ 언로드 대비: beforeunload에서 멈추지 않는다!
  // 실제로 떠나는 시점에만 firing 되는 'pagehide'에서만 stopRecording 호출
  useEffect(() => {
    const onPageHide = () => {
      if (isRecording) stopRecording('pagehide');
    };
    window.addEventListener('pagehide', onPageHide);
    return () => {
      window.removeEventListener('pagehide', onPageHide);
    };
  }, [isRecording, stopRecording]);

  // 정리
  useEffect(() => {
    return () => {
      if (stopTimerRef.current) clearTimeout(stopTimerRef.current);
      if (watchdogRef.current) clearInterval(watchdogRef.current);
      try {
        trackEndedUnsubRef.current();
      } catch (e) {
        console.error('❌ trackEndedUnsubRef cleanup 실패:', e);
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
    uploadStatus,
    manualStopRecording: () => stopRecording('manual'),
  };
};
