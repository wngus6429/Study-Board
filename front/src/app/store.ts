import { create } from "zustand";

interface LoginState {
  loginState: boolean;
  login: () => void;
  logout: () => void;
}

export const useLogin = create<LoginState>((set) => ({
  loginState: false,
  login: () => set({ loginState: true }),
  logout: () => set({ loginState: false }),
}));

// 리액트쿼리 isLoading을 대체하는 로딩 상태
interface LoadingState {
  loadingState: boolean;
  loadingIn: () => void;
  loadingOut: () => void;
}

export const useLoading = create<LoadingState>((set) => ({
  loadingState: false,
  loadingIn: () => set({ loadingState: true }),
  loadingOut: () => set({ loadingState: false }),
}));
