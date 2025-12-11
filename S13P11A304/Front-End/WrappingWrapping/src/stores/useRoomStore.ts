// src/stores/useRoomStore.ts

import { create } from 'zustand';

// 참가자 기본 정보만
type Participant = {
  id: string;
  name?: string;
  joinedAt: Date;
  role?: 'host' | 'presenter' | 'participant';
};

type RoomState = {
  // ===== 기본 방 정보 =====
  roomId: string | null;
  setRoomId: (id: string) => void;
  clearRoom: () => void;

  job: string; // 직무
  setJob: (job: string) => void;
  getJob: () => string;

  mode: string; // 모드 (PT, QA 등)
  setMode: (mode: string) => void;
  getMode: () => string;

  title: string; // 방 제목
  setTitle: (title: string) => void;
  getTitle: () => string;

  // ===== 참가자 관리 =====
  participants: Map<string, Participant>;
  myParticipantId: string | null;

  addParticipant: (participant: Participant) => void;
  removeParticipant: (participantId: string) => void;
  setMyParticipantId: (id: string) => void;

  // 참가자 수 getter
  getParticipantCount: () => number;
  getParticipantById: (id: string) => Participant | undefined;

  // ===== 발표 관리 =====
  fullPresentationOrder: string[]; // 전체 신청자 순서 (서버에서 받은 원본)
  presentationOrder: string[]; // 실제 참여자만 필터링된 발표 순서
  currentPresenter: string | null;

  setFullPresentationOrder: (order: string[]) => void; // 서버에서 받은 전체 순서 설정
  setPresentationOrder: (order: string[]) => void; // 필터링된 순서 직접 설정
  updateActivePresentationOrder: () => void; // 현재 참여자 기준으로 발표 순서 업데이트
  setCurrentPresenter: (presenter: string | null) => void;

  // 발표 순서 관리
  getNextPresenter: () => string | null;
  moveToNextPresenter: () => void;

  // ===== 발표 주제 정보 =====
  // 주제
  presentationTopic: string;
  setPresentationTopic: (topic: string) => void;
  getPresentationTopic: () => string;

  // 상황
  presentationContext: string;
  setPresentationContext: (context: string) => void;
  getPresentationContext: () => string;

  // 제약조건
  presentationConstraints: string;
  setPresentationConstraints: (constraints: string) => void;
  getPresentationConstraints: () => string;

  // ===== 화면 공유 상태 =====
  screenSharingParticipant: string | null;
  setScreenSharingParticipant: (participantId: string | null) => void;

  // ===== 발표 타이머 =====
  presentationStartTime: Date | null;
  presentationDuration: number; // 분 단위
  setPresentationStartTime: (time: Date | null) => void;
  setPresentationDuration: (duration: number) => void;
  getRemainingTime: () => number; // 초 단위
};

export const useRoomStore = create<RoomState>((set, get) => ({
  // ===== 기본 방 정보 =====
  roomId: null,
  setRoomId: (id) => set({ roomId: id }),
  clearRoom: () =>
    set({
      roomId: null,
      participants: new Map(),
      myParticipantId: null,
      fullPresentationOrder: [],
      presentationOrder: [],
      currentPresenter: null,
      presentationTopic: '',
      presentationContext: '',
      presentationConstraints: '',
      screenSharingParticipant: null,
      presentationStartTime: null,
    }),

  job: '',
  setJob: (job) => set({ job }),
  getJob: () => get().job,

  mode: 'PT',
  setMode: (mode) => set({ mode }),
  getMode: () => get().mode,

  title: '',
  setTitle: (title) => set({ title }),
  getTitle: () => get().title,

  // ===== 참가자 관리 =====
  participants: new Map(),
  myParticipantId: null,

  addParticipant: (participant) => {
    set((state) => {
      const newParticipants = new Map(state.participants);
      newParticipants.set(participant.id, participant);
      return { participants: newParticipants };
    });
    // 참가자가 추가될 때마다 발표 순서 업데이트
    get().updateActivePresentationOrder();
  },

  removeParticipant: (participantId) => {
    set((state) => {
      const newParticipants = new Map(state.participants);
      newParticipants.delete(participantId);
      return { participants: newParticipants };
    });
    // 참가자가 제거될 때마다 발표 순서 업데이트
    get().updateActivePresentationOrder();
  },

  setMyParticipantId: (id) => set({ myParticipantId: id }),

  getParticipantCount: () => get().participants.size,
  getParticipantById: (id) => get().participants.get(id),

  // ===== 발표 관리 =====
  fullPresentationOrder: [],
  presentationOrder: [],
  currentPresenter: null,

  setFullPresentationOrder: (order) => {
    set({ fullPresentationOrder: order });
    // 전체 순서가 설정될 때 활성 순서도 업데이트
    get().updateActivePresentationOrder();
  },

  setPresentationOrder: (order) => set({ presentationOrder: order }),

  updateActivePresentationOrder: () => {
    const { fullPresentationOrder, participants } = get();

    // 전체 순서에서 실제 참여자만 필터링
    const activeOrder = fullPresentationOrder.filter((participantId) =>
      participants.has(participantId),
    );

    set({ presentationOrder: activeOrder });

    console.log('🔄 활성 발표 순서 업데이트:', {
      전체순서: fullPresentationOrder,
      참여자: Array.from(participants.keys()),
      활성순서: activeOrder,
    });
  },

  setCurrentPresenter: (presenter) => set({ currentPresenter: presenter }),

  getNextPresenter: () => {
    const { presentationOrder, currentPresenter } = get();
    if (!currentPresenter) return presentationOrder[0] || null;

    const currentIndex = presentationOrder.indexOf(currentPresenter);
    const nextIndex = currentIndex + 1;
    return nextIndex < presentationOrder.length
      ? presentationOrder[nextIndex]
      : null;
  },

  moveToNextPresenter: () => {
    const nextPresenter = get().getNextPresenter();
    if (nextPresenter) {
      set({
        currentPresenter: nextPresenter,
        presentationStartTime: new Date(),
      });
    }
  },

  // ===== 발표 주제 정보 =====
  presentationTopic: '',
  setPresentationTopic: (topic) => set({ presentationTopic: topic }),
  getPresentationTopic: () => get().presentationTopic,

  presentationContext: '',
  setPresentationContext: (context) => set({ presentationContext: context }),
  getPresentationContext: () => get().presentationContext,

  presentationConstraints: '',
  setPresentationConstraints: (constraints) =>
    set({ presentationConstraints: constraints }),
  getPresentationConstraints: () => get().presentationConstraints,

  // ===== 화면 공유 상태 =====
  screenSharingParticipant: null,
  setScreenSharingParticipant: (participantId) =>
    set({ screenSharingParticipant: participantId }),

  // ===== 발표 타이머 =====
  presentationStartTime: null,
  presentationDuration: 10, // 기본 10분
  setPresentationStartTime: (time) => set({ presentationStartTime: time }),
  setPresentationDuration: (duration) =>
    set({ presentationDuration: duration }),

  getRemainingTime: () => {
    const { presentationStartTime, presentationDuration } = get();
    if (!presentationStartTime) return presentationDuration * 60;

    const elapsed = Math.floor(
      (Date.now() - presentationStartTime.getTime()) / 1000,
    );
    const total = presentationDuration * 60;
    return Math.max(0, total - elapsed);
  },
}));
