import { create } from "zustand";

export interface ScrapItem {
  id: number;
  Story: {
    id: number;
    title: string;
    category: string;
    created_at: string;
    read_count: number;
    like_count: number;
    comment_count: number;
    User: {
      id: string;
      nickname: string;
    };
    Channel: {
      id: number;
      slug: string;
      name: string;
    };
  };
  created_at: string;
}

export interface ScrapResponse {
  scraps: ScrapItem[];
  total: number;
  page: number;
  totalPages: number;
}

interface ScrapStore {
  scrapList: ScrapItem[];
  total: number;
  currentPage: number;
  totalPages: number;
  loading: boolean;
  error: string | null;

  // Actions
  setScrapList: (data: ScrapResponse) => void;
  addScrap: (scrap: ScrapItem) => void;
  removeScrap: (scrapId: number) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearScraps: () => void;
}

export const useScrapStore = create<ScrapStore>((set) => ({
  scrapList: [],
  total: 0,
  currentPage: 1,
  totalPages: 0,
  loading: false,
  error: null,

  setScrapList: (data: ScrapResponse) =>
    set({
      scrapList: data.scraps,
      total: data.total,
      currentPage: data.page,
      totalPages: data.totalPages,
    }),

  addScrap: (scrap: ScrapItem) =>
    set((state) => ({
      scrapList: [scrap, ...state.scrapList],
      total: state.total + 1,
    })),

  removeScrap: (scrapId: number) =>
    set((state) => ({
      scrapList: state.scrapList.filter((scrap) => scrap.id !== scrapId),
      total: state.total - 1,
    })),

  setLoading: (loading: boolean) => set({ loading }),

  setError: (error: string | null) => set({ error }),

  clearScraps: () =>
    set({
      scrapList: [],
      total: 0,
      currentPage: 1,
      totalPages: 0,
      error: null,
    }),
}));
