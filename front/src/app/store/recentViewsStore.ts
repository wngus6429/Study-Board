import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface RecentViewItem {
  id: number;
  title: string;
  category: string;
  created_at: string;
  viewedAt: string; // 언제 봤는지 기록
  channelSlug: string; // 채널 slug 정보
}

interface RecentViewsState {
  recentViews: RecentViewItem[];
  addRecentView: (item: Omit<RecentViewItem, "viewedAt">) => void;
  clearRecentViews: () => void;
}

const MAX_RECENT_VIEWS = 30;

export const useRecentViews = create<RecentViewsState>()(
  persist(
    (set, get) => ({
      recentViews: [],
      addRecentView: (item) => {
        const currentViews = get().recentViews;
        const viewedAt = new Date().toISOString();

        // 이미 존재하는 항목인지 확인
        const existingIndex = currentViews.findIndex((view) => view.id === item.id);

        if (existingIndex !== -1) {
          // 이미 존재하면 해당 항목을 제거하고 맨 앞에 추가 (최신으로)
          const updatedViews = [...currentViews];
          updatedViews.splice(existingIndex, 1);
          updatedViews.unshift({ ...item, viewedAt });

          set({ recentViews: updatedViews });
        } else {
          // 새 항목이면 맨 앞에 추가
          const newViews = [{ ...item, viewedAt }, ...currentViews];

          // 30개를 초과하면 오래된 것부터 제거
          if (newViews.length > MAX_RECENT_VIEWS) {
            newViews.splice(MAX_RECENT_VIEWS);
          }

          set({ recentViews: newViews });
        }
      },
      clearRecentViews: () => set({ recentViews: [] }),
    }),
    {
      name: "recent-views-storage", // localStorage 키 이름
    }
  )
);
