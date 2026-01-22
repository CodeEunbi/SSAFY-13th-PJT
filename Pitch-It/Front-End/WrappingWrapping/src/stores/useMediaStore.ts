// src/stores/useMediaStore.ts
import { create } from 'zustand';

type MediaState = {
  isCameraOn: boolean;
  isMicOn: boolean;
  videoDeviceId?: string;
  audioDeviceId?: string;
  setCameraOn: (v: boolean) => void;
  setMicOn: (v: boolean) => void;
  setVideoDevice: (id?: string) => void;
  setAudioDevice: (id?: string) => void;
};

export const useMediaStore = create<MediaState>((set) => ({
  isCameraOn: true,
  isMicOn: true,
  videoDeviceId: undefined,
  audioDeviceId: undefined,
  setCameraOn: (v) => set({ isCameraOn: v }),
  setMicOn: (v) => set({ isMicOn: v }),
  setVideoDevice: (id) => set({ videoDeviceId: id }),
  setAudioDevice: (id) => set({ audioDeviceId: id }),
}));
