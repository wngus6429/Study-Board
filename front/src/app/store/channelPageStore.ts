import { create } from "zustand";
import { persist } from "zustand/middleware";

// 채널 페이지 게시글 데이터 타입
export interface ChannelPageStory {
  id: number;
  title: string;
  userId?: string; // 블라인드 판별용 사용자 ID
  nickname: string;
  category: string;
  created_at: string;
  read_count: number;
  recommend_Count: number;
  comments_count: number;
  channelSlug?: string;
}

// 채널 페이지 데이터 스토어 상태 타입
interface ChannelPageState {
  currentChannelSlug: string | null;
  currentPage: number;
  currentCategory: string;
  stories: ChannelPageStory[];
  isLoading: boolean;

  // 액션들
  setChannelPageData: (channelSlug: string, page: number, category: string, stories: ChannelPageStory[]) => void;
  clearChannelPageData: () => void;
  updateStory: (storyId: number, updates: Partial<ChannelPageStory>) => void;
}

export const useChannelPageStore = create<ChannelPageState>()(
  persist(
    (set, get) => ({
      currentChannelSlug: null,
      currentPage: 1,
      currentCategory: "all",
      stories: [],
      isLoading: false,

      setChannelPageData: (channelSlug, page, category, stories) => {
        set({
          currentChannelSlug: channelSlug,
          currentPage: page,
          currentCategory: category,
          stories: stories,
          isLoading: false,
        });
      },

      clearChannelPageData: () => {
        set({
          currentChannelSlug: null,
          currentPage: 1,
          currentCategory: "all",
          stories: [],
          isLoading: false,
        });
      },

      updateStory: (storyId, updates) => {
        const { stories } = get();
        const updatedStories = stories.map((story) => (story.id === storyId ? { ...story, ...updates } : story));
        set({ stories: updatedStories });
      },
    }),
    {
      name: "channel-page-storage", // localStorage key
      // 필요한 경우 특정 필드만 저장하도록 설정
      partialize: (state) => ({
        currentChannelSlug: state.currentChannelSlug,
        currentPage: state.currentPage,
        currentCategory: state.currentCategory,
        stories: state.stories,
      }),
    }
  )
);
