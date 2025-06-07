import { create } from "zustand";
import { getUserSubscriptions, Channel } from "../api/channelsApi";

interface SubscriptionState {
  subscribedChannels: Channel[];
  loading: boolean;
  error: string | null;

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

  loadSubscriptions: async () => {
    try {
      set({ loading: true, error: null });
      const channels = await getUserSubscriptions();
      set({ subscribedChannels: channels, loading: false });
    } catch (error) {
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
    set({ subscribedChannels: [], error: null });
  },
}));
