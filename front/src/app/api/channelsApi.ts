import axios from "axios";

// 채널 타입 정의
export interface Channel {
  id: number;
  channel_name: string;
  slug: string;
  story_count: number;
  subscriber_count: number;
  created_at: string;
  updated_at: string;
  creator: {
    id: string;
    nickname: string;
    user_email: string;
  };
}

export interface ChannelSubscription {
  id: number;
  Channel: Channel;
  created_at: string;
  updated_at: string;
}

// 모든 채널 조회
export const getChannels = async (): Promise<Channel[]> => {
  const response = await axios.get(`${process.env.NEXT_PUBLIC_BASE_URL}/api/channels`, {
    withCredentials: true,
  });
  return response.data;
};

// 특정 채널 조회
export const getChannel = async (id: number): Promise<Channel> => {
  const response = await axios.get(`${process.env.NEXT_PUBLIC_BASE_URL}/api/channels/${id}`, {
    withCredentials: true,
  });
  return response.data;
};

// 슬러그로 채널 조회
export const getChannelBySlug = async (slug: string): Promise<Channel> => {
  const response = await axios.get(`${process.env.NEXT_PUBLIC_BASE_URL}/api/channels/slug/${slug}`, {
    withCredentials: true,
  });
  return response.data;
};

// 채널 구독
export const subscribeChannel = async (id: number): Promise<{ message: string }> => {
  const response = await axios.post(
    `${process.env.NEXT_PUBLIC_BASE_URL}/api/channels/${id}/subscribe`,
    {},
    {
      withCredentials: true,
    }
  );
  return response.data;
};

// 채널 구독 취소
export const unsubscribeChannel = async (id: number): Promise<{ message: string }> => {
  const response = await axios.delete(`${process.env.NEXT_PUBLIC_BASE_URL}/api/channels/${id}/subscribe`, {
    withCredentials: true,
  });
  return response.data;
};

// 유저가 구독한 채널 목록
export const getUserSubscriptions = async (): Promise<Channel[]> => {
  const response = await axios.get(`${process.env.NEXT_PUBLIC_BASE_URL}/api/channels/user/subscriptions`, {
    withCredentials: true,
  });
  return response.data;
};

// 채널 생성
export const createChannel = async (
  channelName: string,
  slug: string
): Promise<{ message: string; channel: Channel }> => {
  const response = await axios.post(
    `${process.env.NEXT_PUBLIC_BASE_URL}/api/channels/create`,
    { channelName, slug },
    {
      withCredentials: true,
    }
  );
  return response.data;
};

// 채널 삭제 (생성자만 가능)
export const deleteChannel = async (id: number): Promise<{ message: string }> => {
  const response = await axios.delete(`${process.env.NEXT_PUBLIC_BASE_URL}/api/channels/${id}`, {
    withCredentials: true,
  });
  return response.data;
};

// // 초기 채널 데이터 생성
// export const initializeChannels = async (): Promise<{ message: string }> => {
//   const response = await axios.post(
//     `${process.env.NEXT_PUBLIC_BASE_URL}/api/channels/initialize`,
//     {},
//     {
//       withCredentials: true,
//     }
//   );
//   return response.data;
// };
