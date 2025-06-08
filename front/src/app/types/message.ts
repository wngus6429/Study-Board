// 쪽지 관련 타입 정의
export interface User {
  id: string;
  nickname: string;
  user_email: string;
}

export interface Message {
  id: number;
  sender: User;
  receiver: User;
  title: string;
  content: string;
  isRead: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SendMessageRequest {
  receiverNickname: string;
  title: string;
  content: string;
}

export interface MessageListResponse {
  messages: Message[];
  total: number;
  page: number;
  limit: number;
}
