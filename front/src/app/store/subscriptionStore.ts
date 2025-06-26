import { create } from "zustand";
import { getUserSubscriptions, Channel } from "../api/channelsApi";

interface SubscriptionState {
  subscribedChannels: Channel[];
  loading: boolean;
  error: string | null;
  isInitialized: boolean; // 한 번 로드되었는지 확인

  // Actions
  loadSubscriptions: () => Promise<void>;
  addSubscription: (channel: Channel) => void;
  removeSubscription: (channelId: number) => void;
  isSubscribed: (channelId: number) => boolean;
  clearSubscriptions: () => void;
}

export const useSubscriptionStore = create<SubscriptionState>((set, get) => ({
  subscribedChannels: [],
  loading: false,
  error: null,
  isInitialized: false,

  loadSubscriptions: async () => {
    const { isInitialized } = get();

    // 이미 한 번 로드되었으면 스킵
    if (isInitialized) {
      return;
    }

    try {
      set({ loading: true, error: null });
      const channels = await getUserSubscriptions();
      set({ subscribedChannels: channels, loading: false, isInitialized: true });
    } catch (error: any) {
      // 401 Unauthorized 에러는 로그인이 필요한 상황이므로 에러로 처리하지 않음
      if (error?.response?.status === 401) {
        console.log("로그인이 필요한 API입니다. 구독 데이터를 불러올 수 없습니다.");
        set({ loading: false, error: null });
        return;
      }

      console.error("구독 채널 목록을 불러오는데 실패했습니다:", error);
      set({
        error: "구독 채널 목록을 불러오는데 실패했습니다.",
        loading: false,
      });
    }
  },

  addSubscription: (channel: Channel) => {
    const { subscribedChannels } = get();
    if (!subscribedChannels.find((c) => c.id === channel.id)) {
      set({
        subscribedChannels: [...subscribedChannels, channel],
      });
    }
  },

  removeSubscription: (channelId: number) => {
    const { subscribedChannels } = get();
    set({
      subscribedChannels: subscribedChannels.filter((c) => c.id !== channelId),
    });
  },

  isSubscribed: (channelId: number) => {
    const { subscribedChannels } = get();
    return subscribedChannels.some((c) => c.id === channelId);
  },

  clearSubscriptions: () => {
    set({ subscribedChannels: [], error: null, isInitialized: false });
  },
}));
