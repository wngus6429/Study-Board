import axios from "./axios";

// 채널 알림 구독
export const subscribeToChannelNotifications = async (channelId: number): Promise<any> => {
  const response = await axios.post(
    `${process.env.NEXT_PUBLIC_BASE_URL}/api/channel-notifications/subscribe/${channelId}`,
    {},
    { withCredentials: true }
  );
  return response.data;
};

// 채널 알림 구독 해제
export const unsubscribeFromChannelNotifications = async (channelId: number): Promise<any> => {
  const response = await axios.delete(
    `${process.env.NEXT_PUBLIC_BASE_URL}/api/channel-notifications/unsubscribe/${channelId}`,
    { withCredentials: true }
  );
  return response.data;
};

// 내 채널 알림 구독 목록 조회
export const getMyChannelNotificationSubscriptions = async (): Promise<any[]> => {
  const response = await axios.get(`${process.env.NEXT_PUBLIC_BASE_URL}/api/channel-notifications/my-subscriptions`, {
    withCredentials: true,
  });
  return response.data;
};

// 특정 채널의 알림 구독 상태 확인
export const getChannelNotificationStatus = async (channelId: number): Promise<{ isSubscribed: boolean }> => {
  const response = await axios.get(
    `${process.env.NEXT_PUBLIC_BASE_URL}/api/channel-notifications/status/${channelId}`,
    { withCredentials: true }
  );
  return response.data;
};
