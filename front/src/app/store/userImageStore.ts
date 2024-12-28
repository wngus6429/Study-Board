import { create } from "zustand";

interface UserImageState {
  userImageUrl: string;
  setUserImageUrl: (url: string) => void;
  TopBarImageDelete: boolean;
  setTopBarImageDelete: () => void;
}

export const useUserImage = create<UserImageState>((set) => ({
  userImageUrl: "",
  setUserImageUrl: (url) => set({ userImageUrl: url }),
  TopBarImageDelete: false,
  setTopBarImageDelete: () => set({ TopBarImageDelete: true }),
}));
