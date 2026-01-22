import { useEffect, useCallback, useRef } from 'react';
import { useTimerStore } from '../stores/useTimerStore';
import { SimpleWebSocketService } from '../services/SimpleWebSocketService';

const MEETING_DURATION_SECONDS = 30; // 10분
const PRESENTATION_DURATION_SECONDS = 30; // 5분

export const useTimer = (order: number[], roomId?: string, myKey?: string, isHost: boolean = false) => {
  const {
    countdown,
    currentSpeakerIndex,
    isPresentationActive,
    meetingCompleted,
    meetingStartedAt,
    // roomId: storeRoomId,
    setCountdown,
    setCurrentSpeakerIndex,
    setIsPresentationActive,
    setMeetingCompleted,
    syncFromMessage,
  } = useTimerStore();

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timerSyncServiceRef = useRef<SimpleWebSocketService | null>(null);

  // 상태 최신화를 위한 ref
  const currentSpeakerIndexRef = useRef(currentSpeakerIndex);
  const isPresentationActiveRef = useRef(isPresentationActive);
  const orderRef = useRef(order);

  currentSpeakerIndexRef.current = currentSpeakerIndex;
  isPresentationActiveRef.current = isPresentationActive;
  orderRef.current = order;

  // 타이머 동기화 서비스 초기화
  useEffect(() => {
    if (roomId && myKey && timerSyncServiceRef.current === null) {
      timerSyncServiceRef.current = new SimpleWebSocketService();
      
      // 새로고침 시에도 호스트 상태 복원 시도
      let restoredIsHost = isHost;
      try {
        const syncState = localStorage.getItem(`timer_sync_state_${roomId}`);
        if (syncState) {
          const parsed = JSON.parse(syncState);
          if (parsed.myKey === myKey && parsed.isHost) {
            restoredIsHost = true;
            console.log('새로고침 시 호스트 상태 복원');
          }
        }
      } catch (error) {
        console.warn('동기화 상태 복원 실패:', error);
      }
      
      timerSyncServiceRef.current.connect(roomId, myKey, restoredIsHost);
      console.log('타이머 동기화 서비스 초기화 완료:', { roomId, myKey, isHost: restoredIsHost });
    }

    return () => {
      if (timerSyncServiceRef.current) {
        timerSyncServiceRef.current.cleanup();
        timerSyncServiceRef.current = null;
      }
    };
  }, [roomId, myKey, isHost]);

  // 동기화 메시지 리스너
  useEffect(() => {
    const handleTimerSync = (event: CustomEvent) => {
      const message = event.detail;
      if (message.roomId === roomId) {
        syncFromMessage(message);
      }
    };

    window.addEventListener('timerSync', handleTimerSync as EventListener);
    return () => {
      window.removeEventListener('timerSync', handleTimerSync as EventListener);
    };
  }, [roomId, syncFromMessage]);

  // 메인 타이머: countdown 의존성 제거, 필요한 상태만 넣음
  useEffect(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (countdown <= 0) return;

    timerRef.current = setInterval(() => {
      setCountdown((prev) => {
        const newCountdown = (() => {
          if (prev <= 1) {
            if (!isPresentationActiveRef.current) {
              // 주제 읽기 완료 → 발표 모드 전환
              if (orderRef.current.length > 0) {
                setIsPresentationActive(true);
                setCurrentSpeakerIndex(0);
                return PRESENTATION_DURATION_SECONDS;
              }
              return 0; // 발표자가 없으면 종료
            } else {
              // 발표자 시간 종료 → 다음 발표자 전환
              const nextSpeakerIndex = currentSpeakerIndexRef.current + 1;
              if (nextSpeakerIndex >= orderRef.current.length) {
                // 모든 발표 완료 - 발표 모드 종료
                setIsPresentationActive(false);
                setCurrentSpeakerIndex(0);
                setMeetingCompleted(true);
                return 0; // 타이머 종료
              } else {
                setCurrentSpeakerIndex(nextSpeakerIndex);
                return PRESENTATION_DURATION_SECONDS;
              }
            }
          }
          return prev - 1;
        })();

        // 호스트인 경우 동기화 메시지 전송
        if (isHost && timerSyncServiceRef.current && newCountdown > 0) {
          timerSyncServiceRef.current.updateTimer(
            newCountdown,
            currentSpeakerIndexRef.current,
            isPresentationActiveRef.current
          );
        }

        return newCountdown;
      });
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isPresentationActive, currentSpeakerIndex, order.length, setCountdown, setIsPresentationActive, setCurrentSpeakerIndex]);

  // 타이머 상태 복원 (필요시 호출)
  const restoreTimerState = useCallback(() => {
    if (!meetingStartedAt || !roomId) return;

    const now = new Date();
    const startedTime = new Date(meetingStartedAt);
    const elapsedSeconds = Math.floor((now.getTime() - startedTime.getTime()) / 1000);

    console.log('타이머 상태 복원 - 경과 시간:', elapsedSeconds, '초');

    if (elapsedSeconds < MEETING_DURATION_SECONDS) {
      // 주제 읽기 모드 중
      const remaining = Math.max(MEETING_DURATION_SECONDS - elapsedSeconds, 1);
      setCountdown(remaining);
      setIsPresentationActive(false);
      setCurrentSpeakerIndex(0);
      console.log('주제 읽기 모드 복원 - 남은 시간:', remaining, '초');
    } else if (order.length > 0) {
      // 발표 모드 중
      setIsPresentationActive(true);
      const presentationElapsed = elapsedSeconds - MEETING_DURATION_SECONDS;
      const currentSpeakerElapsed = Math.floor(presentationElapsed / PRESENTATION_DURATION_SECONDS);
      const remainingInCurrentSpeaker = PRESENTATION_DURATION_SECONDS - (presentationElapsed % PRESENTATION_DURATION_SECONDS);
      
      if (currentSpeakerElapsed < order.length) {
        setCurrentSpeakerIndex(currentSpeakerElapsed);
        setCountdown(Math.max(remainingInCurrentSpeaker, 1));
        console.log('발표 모드 복원 - 발표자:', currentSpeakerElapsed + 1, '번, 남은 시간:', remainingInCurrentSpeaker, '초');
      } else {
        // 모든 발표 완료
        setCurrentSpeakerIndex(0);
        setCountdown(0);
        console.log('모든 발표 완료');
      }
    } else {
      // 발표자가 없는 경우
      setIsPresentationActive(false);
      setCurrentSpeakerIndex(0);
      setCountdown(0);
      console.log('발표자 없음 - 타이머 종료');
    }
  }, [meetingStartedAt, roomId, order.length, setCountdown, setIsPresentationActive, setCurrentSpeakerIndex]);

  // 타이머 초기화 (컴포넌트에서 호출)
  const initializeTimer = useCallback((_roomId: string, startedAt: string) => {
    const now = new Date();
    const startedTime = new Date(startedAt);
    const elapsedSeconds = Math.floor((now.getTime() - startedTime.getTime()) / 1000);

    if (elapsedSeconds < 60) {
      setCountdown(MEETING_DURATION_SECONDS);
      setIsPresentationActive(false);
      setCurrentSpeakerIndex(0);
      return;
    }

    if (elapsedSeconds >= MEETING_DURATION_SECONDS) {
      if (order.length > 0) {
        setIsPresentationActive(true);
        const presentationElapsed = elapsedSeconds - MEETING_DURATION_SECONDS;
        const currentSpeakerElapsed = Math.floor(presentationElapsed / PRESENTATION_DURATION_SECONDS);
        const remainingInCurrentSpeaker = PRESENTATION_DURATION_SECONDS - (presentationElapsed % PRESENTATION_DURATION_SECONDS);
        if (currentSpeakerElapsed < order.length) {
          setCurrentSpeakerIndex(currentSpeakerElapsed);
          setCountdown(Math.max(remainingInCurrentSpeaker, 1));
        } else {
          setCurrentSpeakerIndex(0);
          setCountdown(PRESENTATION_DURATION_SECONDS);
        }
      } else {
        setIsPresentationActive(false);
        setCurrentSpeakerIndex(0);
        setCountdown(0);
      }
    } else {
      const remaining = Math.max(MEETING_DURATION_SECONDS - elapsedSeconds, 1);
      setCountdown(remaining);
      setIsPresentationActive(false);
      setCurrentSpeakerIndex(0);
    }
  }, [order.length, setCountdown, setIsPresentationActive, setCurrentSpeakerIndex]);

  return {
    countdown,
    currentSpeakerIndex,
    isPresentationActive,
    meetingCompleted,
    restoreTimerState,
    initializeTimer,
    timerSyncService: timerSyncServiceRef.current,
  };
};
