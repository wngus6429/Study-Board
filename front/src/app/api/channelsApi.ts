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
  // 채널 대표 이미지 (옵셔널)
  ChannelImage?: {
    id: number;
    image_name: string;
    link: string;
    created_at: string;
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
  // 로딩 테스트를 위한 2초 지연
  await new Promise((resolve) => setTimeout(resolve, 2000));

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

// 채널 이미지 업로드 (채널 생성자만 가능)
export const uploadChannelImage = async (
  channelId: number,
  imageFile: File
): Promise<{ message: string; image: { id: number; link: string; imageName: string; uploadedAt: string } }> => {
  const formData = new FormData();
  formData.append("channelImage", imageFile); // 'channelImage'는 백엔드에서 기대하는 필드명

  const response = await axios.post(
    `${process.env.NEXT_PUBLIC_BASE_URL}/api/channels/${channelId}/upload-image`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      withCredentials: true,
    }
  );
  return response.data;
};

// 채널 이미지 삭제 (채널 생성자만 가능)
export const deleteChannelImage = async (channelId: number): Promise<{ message: string }> => {
  const response = await axios.delete(`${process.env.NEXT_PUBLIC_BASE_URL}/api/channels/${channelId}/image`, {
    withCredentials: true,
  });
  return response.data;
};
