import { create } from "zustand";

// Zustand 상태와 액션의 타입 정의
interface StoreState {
  loginState: boolean;
  login: () => void;
  logout: () => void;
}

// Zustand 스토어 생성
const useStore = create<StoreState>((set) => ({
  loginState: false,
  login: () => set({ loginState: true }),
  logout: () => set({ loginState: false }),
}));

export default useStore;
