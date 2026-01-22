// src/stores/useTimerStore.ts

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface TimerState {
  countdown: number;
  currentSpeakerIndex: number;
  isPresentationActive: boolean;
  meetingCompleted: boolean;
  meetingStartedAt: string | null;
  roomId: string | null;
  lastUpdateTime: number;
}

interface TimerActions {
  setCountdown: (countdown: number | ((prev: number) => number)) => void;
  setCurrentSpeakerIndex: (index: number) => void;
  setIsPresentationActive: (active: boolean) => void;
  setMeetingCompleted: (completed: boolean) => void;
  setMeetingStartedAt: (startedAt: string) => void;
  setRoomId: (roomId: string) => void;
  updateLastUpdateTime: () => void;
  resetTimer: () => void;
  initializeTimer: (roomId: string, startedAt: string) => void;
  clearAllData: () => void; // 새로운 회의 시작 시 모든 데이터 초기화
  syncFromMessage: (message: any) => void; // 동기화 메시지로부터 상태 업데이트
  setIsHost: (isHost: boolean) => void; // 호스트 여부 설정
}

export const useTimerStore = create<TimerState & TimerActions>()(
  persist(
    (set, get) => ({
      // 초기 상태
      countdown: 600, // 10분
      currentSpeakerIndex: 0,
      isPresentationActive: false,
      meetingCompleted: false,
      meetingStartedAt: null,
      roomId: null,
      lastUpdateTime: Date.now(),

      // 액션들
      setCountdown: (countdown) => {
        const newCountdown = typeof countdown === 'function' ? countdown(get().countdown) : countdown;
        console.log('setCountdown 호출:', get().countdown, '->', newCountdown);
        set({ 
          countdown: newCountdown,
          lastUpdateTime: Date.now()
        });
      },
      setCurrentSpeakerIndex: (index) => {
        console.log('setCurrentSpeakerIndex 호출:', get().currentSpeakerIndex, '->', index);
        set({ 
          currentSpeakerIndex: index,
          lastUpdateTime: Date.now() // setCurrentSpeakerIndex와 함께 lastUpdateTime 업데이트
        });
      },
      setIsPresentationActive: (active) => {
        console.log('setIsPresentationActive 호출:', get().isPresentationActive, '->', active);
        set({ 
          isPresentationActive: active,
          lastUpdateTime: Date.now() // setIsPresentationActive와 함께 lastUpdateTime 업데이트
        });
      },
      setMeetingCompleted: (completed) => {
        console.log('setMeetingCompleted 호출:', get().meetingCompleted, '->', completed);
        set({ 
          meetingCompleted: completed,
          lastUpdateTime: Date.now()
        });
      },
      setMeetingStartedAt: (startedAt) => set({ meetingStartedAt: startedAt }),
      setRoomId: (roomId) => set({ roomId }),
      updateLastUpdateTime: () => set({ lastUpdateTime: Date.now() }),
      
      resetTimer: () => set({
        countdown: 600, // 10분
        currentSpeakerIndex: 0,
        isPresentationActive: false,
        meetingCompleted: false,
        meetingStartedAt: null,
        roomId: null,
        lastUpdateTime: Date.now(),
      }),

      initializeTimer: (roomId, startedAt) => {
        const currentState = get();
        
        // 같은 방이고 이미 초기화된 경우 새로고침으로 간주하여 상태 유지
        if (currentState.roomId === roomId && currentState.meetingStartedAt) {
          console.log('새로고침 감지 - 기존 타이머 상태 유지');
          return;
        }
        
        // 다른 방이거나 처음 입장하는 경우에만 상태 설정
        if (!currentState.roomId || currentState.roomId !== roomId) {
          console.log('타이머 초기화 - 주제 읽기 모드로 시작');
          set({
            roomId,
            meetingStartedAt: startedAt,
            countdown: 600, // 10분으로 초기화
            isPresentationActive: false, // 무조건 주제 읽기 모드로 시작
            currentSpeakerIndex: 0,
            lastUpdateTime: Date.now(),
          });
        }
      },

      clearAllData: () => {
        console.log('모든 타이머 데이터 초기화');
        set({
          countdown: 600, // 10분
          currentSpeakerIndex: 0,
          isPresentationActive: false,
          meetingCompleted: false,
          meetingStartedAt: null,
          roomId: null,
          lastUpdateTime: Date.now(),
        });
      },

      syncFromMessage: (message) => {
        console.log('동기화 메시지로부터 상태 업데이트:', message);
        set({
          countdown: message.countdown,
          currentSpeakerIndex: message.currentSpeakerIndex,
          isPresentationActive: message.isPresentationActive,
          lastUpdateTime: Date.now(),
        });
      },

      setIsHost: (isHost) => {
        // 호스트 여부는 별도 상태로 관리하지 않고, 
        // useTimer에서 TimerSyncService를 통해 관리
        console.log('호스트 여부 설정:', isHost);
      },
    }),
    {
      name: 'timer-storage',
      partialize: (state) => ({
        countdown: state.countdown,
        currentSpeakerIndex: state.currentSpeakerIndex,
        isPresentationActive: state.isPresentationActive,
        meetingCompleted: state.meetingCompleted,
        meetingStartedAt: state.meetingStartedAt,
        roomId: state.roomId,
        lastUpdateTime: state.lastUpdateTime,
      }),
      // localStorage 사용 (브라우저 탭별로 독립)
      storage: {
        getItem: (name) => {
          try {
            const item = localStorage.getItem(name);
            return item ? JSON.parse(item) : null;
          } catch {
            return null;
          }
        },
        setItem: (name, value) => {
          try {
            localStorage.setItem(name, JSON.stringify(value));
          } catch {
            // 에러 무시
          }
        },
        removeItem: (name) => {
          try {
            localStorage.removeItem(name);
          } catch {
            // 에러 무시
          }
        },
      },
      // 상태 복원 시 초기화 방지
      onRehydrateStorage: () => (state) => {
        console.log('타이머 상태 복원됨:', state);
      },
    }
  )
);
