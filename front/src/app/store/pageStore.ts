import { create } from "zustand";

interface PageStore {
  currentPage: number;
  setCurrentPage: (page: number) => void;
}

const usePageStore = create<PageStore>((set) => ({
  currentPage: 1, // 기본값
  setCurrentPage: (page) => set({ currentPage: page }),
}));

export default usePageStore;
