import { create } from "zustand";

interface User {
  id: string;
  email: string;
  nickname: string;
  avatarUrl?: string;
}

interface UserState {
  // ─── 인증 유저 정보 ───
  currentUser: User | null;
  setUser: (user: User) => void;
  clearUser: () => void;

  // ─── 프로필 이미지 처리 ───
  userImageUrl: string;
  setUserImageUrl: (url: string) => void;

  topBarImageDelete: boolean;
  setTopBarImageDelete: () => void;
}

export const useUserStore = create<UserState>((set) => ({
  // ─── 인증 유저 초기값 ───
  currentUser: null,
  setUser: (user) => set({ currentUser: user }),
  clearUser: () => set({ currentUser: null }),

  // ─── 이미지 URL 초기값 ───
  userImageUrl: "",
  setUserImageUrl: (url) => set({ userImageUrl: url }),

  // ─── TopBar 이미지 삭제 플래그 ───
  topBarImageDelete: false,
  setTopBarImageDelete: () => set({ topBarImageDelete: true }),
}));
