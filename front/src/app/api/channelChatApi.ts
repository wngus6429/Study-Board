import axios from "axios";

// 채팅 메시지 타입 정의
export interface ChannelChatMessage {
  id: number;
  channel_id: number;
  user_id: string;
  message: string;
  created_at: string;
  updated_at: string;
  user: {
    id: string;
    nickname: string;
    user_email: string;
    profile_image?: string;
  };
}

// 채팅 메시지 목록 응답 타입
export interface ChannelChatResponse {
  messages: ChannelChatMessage[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

// 메시지 전송 요청 타입
export interface SendChannelChatRequest {
  channel_id: number;
  message: string;
}

// 채널 채팅 메시지 목록 조회
export const getChannelChatMessages = async (
  channelId: number,
  page: number = 1,
  limit: number = 50
): Promise<ChannelChatResponse> => {
  const response = await axios.get(`${process.env.NEXT_PUBLIC_BASE_URL}/api/channel-chat/${channelId}/messages`, {
    params: { page, limit },
    withCredentials: true,
  });
  return response.data;
};

// 채널 채팅 메시지 전송
export const sendChannelChatMessage = async (
  channelId: number,
  message: string
): Promise<{ message: string; chatMessage: ChannelChatMessage }> => {
  const response = await axios.post(
    `${process.env.NEXT_PUBLIC_BASE_URL}/api/channel-chat/${channelId}/send`,
    { message },
    {
      withCredentials: true,
    }
  );
  return response.data;
};

// 채널 채팅 메시지 삭제 (본인 메시지만)
export const deleteChannelChatMessage = async (channelId: number, messageId: number): Promise<{ message: string }> => {
  const response = await axios.delete(
    `${process.env.NEXT_PUBLIC_BASE_URL}/api/channel-chat/${channelId}/messages/${messageId}`,
    {
      withCredentials: true,
    }
  );
  return response.data;
};

// 채널 채팅 참여자 목록 조회
export const getChannelChatParticipants = async (channelId: number): Promise<{ users: any[]; count: number }> => {
  const response = await axios.get(`${process.env.NEXT_PUBLIC_BASE_URL}/api/channel-chat/${channelId}/participants`, {
    withCredentials: true,
  });
  return response.data;
};

// 채널 채팅 접속 알림 (웹소켓 연결 전 호출)
export const joinChannelChat = async (channelId: number): Promise<{ message: string }> => {
  const response = await axios.post(
    `${process.env.NEXT_PUBLIC_BASE_URL}/api/channel-chat/${channelId}/join`,
    {},
    {
      withCredentials: true,
    }
  );
  return response.data;
};

// 채널 채팅 나가기 알림 (웹소켓 연결 해제 후 호출)
export const leaveChannelChat = async (channelId: number): Promise<{ message: string }> => {
  const response = await axios.post(
    `${process.env.NEXT_PUBLIC_BASE_URL}/api/channel-chat/${channelId}/leave`,
    {},
    {
      withCredentials: true,
    }
  );
  return response.data;
};
