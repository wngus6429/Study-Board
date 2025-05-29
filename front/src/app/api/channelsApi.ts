export interface Channel {
  id: number;
  ChannelName: string;
  StoryCount: number;
  SubscriberCount: number;
  created_at: string;
  updated_at: string;
}

export interface ChannelSubscription {
  id: number;
  Channel: Channel;
  created_at: string;
  updated_at: string;
}

// 모든 채널 조회
export const getChannels = async (): Promise<Channel[]> => {
  const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/channels`, {
    method: "GET",
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error("채널 목록을 가져오는데 실패했습니다.");
  }

  return response.json();
};

// 특정 채널 조회
export const getChannel = async (id: number): Promise<Channel> => {
  const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/channels/${id}`, {
    method: "GET",
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error("채널 정보를 가져오는데 실패했습니다.");
  }

  return response.json();
};

// 채널 구독
export const subscribeChannel = async (id: number): Promise<{ message: string }> => {
  const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/channels/${id}/subscribe`, {
    method: "POST",
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error("구독에 실패했습니다.");
  }

  return response.json();
};

// 채널 구독 취소
export const unsubscribeChannel = async (id: number): Promise<{ message: string }> => {
  const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/channels/${id}/subscribe`, {
    method: "DELETE",
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error("구독 취소에 실패했습니다.");
  }

  return response.json();
};

// 유저가 구독한 채널 목록
export const getUserSubscriptions = async (): Promise<Channel[]> => {
  const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/channels/user/subscriptions`, {
    method: "GET",
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error("구독 채널 목록을 가져오는데 실패했습니다.");
  }

  return response.json();
};

// 초기 채널 데이터 생성
export const initializeChannels = async (): Promise<{ message: string }> => {
  const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/channels/initialize`, {
    method: "POST",
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error("초기 데이터 생성에 실패했습니다.");
  }

  return response.json();
};
