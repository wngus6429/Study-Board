import { create } from "zustand";

interface User {
  id: string;
  email: string;
  nickname: string;
  avatarUrl?: string;
  is_super_admin?: boolean; // 총 관리자 권한
  createdChannels?: Array<{ id: number; channel_name: string }>; // 생성한 채널 목록
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

  // ─── 관리자 권한 체크 헬퍼 함수들 ───
  isSuperAdmin: () => boolean;
  isChannelAdmin: (channelId?: number) => boolean;
  hasAdminPermission: (channelId?: number) => boolean;
}

export const useUserStore = create<UserState>((set, get) => ({
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

  // ─── 관리자 권한 체크 헬퍼 함수들 ───

  /**
   * 총 관리자 권한 확인
   * @returns 총 관리자 여부
   */
  isSuperAdmin: () => {
    const { currentUser } = get();
    return currentUser?.is_super_admin === true;
  },

  /**
   * 특정 채널의 관리자 권한 확인 (채널 생성자)
   * @param channelId 채널 ID
   * @returns 해당 채널의 관리자 여부
   */
  isChannelAdmin: (channelId?: number) => {
    const { currentUser } = get();
    if (!currentUser || !channelId) return false;

    return currentUser.createdChannels?.some((channel) => channel.id === channelId) === true;
  },

  /**
   * 관리자 권한 종합 확인 (총 관리자 또는 채널 관리자)
   * @param channelId 채널 ID (선택사항)
   * @returns 관리자 권한 여부
   */
  hasAdminPermission: (channelId?: number) => {
    const { isSuperAdmin, isChannelAdmin } = get();
    return isSuperAdmin() || isChannelAdmin(channelId);
  },
}));
