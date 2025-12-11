import { create } from 'zustand';
import { AuthUtils } from '../utils/authUtils';

interface NicknameStore {
  nickname: string;
  setNickname: (nickname: string) => void;
  initializeNickname: () => void;
}

export const useNicknameStore = create<NicknameStore>((set) => ({
  nickname: AuthUtils.getUserData()?.nickname || '사용자',

  setNickname: (nickname: string) => {
    set({ nickname });

    // localStorage에 저장
    const currentUser = AuthUtils.getUserData();
    if (currentUser) {
      const updatedUser = {
        ...currentUser,
        nickname,
      };
      AuthUtils.setUserData(updatedUser);
    }
  },

  initializeNickname: () => {
    const user = AuthUtils.getUserData();
    if (user?.nickname) {
      set({ nickname: user.nickname });
    }
  },
}));

// localStorage 변경 감지
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (event) => {
    if (event.key === 'user') {
      const user = AuthUtils.getUserData();
      if (user?.nickname) {
        useNicknameStore.getState().setNickname(user.nickname);
      }
    }
  });
}
