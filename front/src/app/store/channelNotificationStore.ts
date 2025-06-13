import { create } from "zustand";
import { persist } from "zustand/middleware";

interface ChannelNotificationSubscription {
  channelId: number;
  channelName: string;
  channelSlug: string;
  subscribedAt: string;
}

interface ChannelNotificationState {
  subscribedChannels: ChannelNotificationSubscription[];
  loading: boolean;
  error: string | null;

  // Actions
  subscribeToChannel: (channelId: number, channelName: string, channelSlug: string) => void;
  unsubscribeFromChannel: (channelId: number) => void;
  isSubscribedToNotifications: (channelId: number) => boolean;
  clearAllSubscriptions: () => void;
  getSubscribedChannelIds: () => number[];
}

export const useChannelNotificationStore = create<ChannelNotificationState>()(
  persist(
    (set, get) => ({
      subscribedChannels: [],
      loading: false,
      error: null,

      subscribeToChannel: (channelId: number, channelName: string, channelSlug: string) => {
        const { subscribedChannels } = get();

        // 이미 구독중인지 확인
        if (!subscribedChannels.find((sub) => sub.channelId === channelId)) {
          const newSubscription: ChannelNotificationSubscription = {
            channelId,
            channelName,
            channelSlug,
            subscribedAt: new Date().toISOString(),
          };

          set({
            subscribedChannels: [...subscribedChannels, newSubscription],
            error: null,
          });
        }
      },

      unsubscribeFromChannel: (channelId: number) => {
        const { subscribedChannels } = get();
        set({
          subscribedChannels: subscribedChannels.filter((sub) => sub.channelId !== channelId),
          error: null,
        });
      },

      isSubscribedToNotifications: (channelId: number) => {
        const { subscribedChannels } = get();
        return subscribedChannels.some((sub) => sub.channelId === channelId);
      },

      getSubscribedChannelIds: () => {
        const { subscribedChannels } = get();
        return subscribedChannels.map((sub) => sub.channelId);
      },

      clearAllSubscriptions: () => {
        set({
          subscribedChannels: [],
          error: null,
        });
      },
    }),
    {
      name: "channel-notification-storage", // localStorage 키
      // 필요한 필드만 persist
      partialize: (state) => ({
        subscribedChannels: state.subscribedChannels,
      }),
    }
  )
);
