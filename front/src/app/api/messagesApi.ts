import axios from "axios";
import { Message, SendMessageRequest, MessageListResponse, User } from "../types/message";

// 받은 쪽지 목록 조회
export const getReceivedMessages = async (page: number = 1, limit: number = 10): Promise<MessageListResponse> => {
  try {
    const response = await axios.get(`${process.env.NEXT_PUBLIC_BASE_URL}/api/messages/received`, {
      params: { page, limit },
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    console.error("받은 쪽지 목록 조회 실패:", error);
    // 임시 목데이터 반환 (실제 API 개발 전까지)
    return {
      messages: [],
      total: 0,
      page: 1,
      limit: 10,
    };
  }
};

// 보낸 쪽지 목록 조회
export const getSentMessages = async (page: number = 1, limit: number = 10): Promise<MessageListResponse> => {
  try {
    const response = await axios.get(`${process.env.NEXT_PUBLIC_BASE_URL}/api/messages/sent`, {
      params: { page, limit },
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    console.error("보낸 쪽지 목록 조회 실패:", error);
    // 임시 목데이터 반환 (실제 API 개발 전까지)
    return {
      messages: [],
      total: 0,
      page: 1,
      limit: 10,
    };
  }
};

// 특정 쪽지 상세 조회
export const getMessage = async (messageId: number): Promise<Message> => {
  const response = await axios.get(`${process.env.NEXT_PUBLIC_BASE_URL}/api/messages/${messageId}`, {
    withCredentials: true,
  });
  return response.data;
};

// 쪽지 보내기
export const sendMessage = async (messageData: SendMessageRequest): Promise<{ message: string }> => {
  try {
    const response = await axios.post(`${process.env.NEXT_PUBLIC_BASE_URL}/api/messages/send`, messageData, {
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    console.error("쪽지 보내기 실패:", error);
    throw error;
  }
};

// 쪽지 읽음 처리
export const markMessageAsRead = async (messageId: number): Promise<{ message: string }> => {
  const response = await axios.patch(
    `${process.env.NEXT_PUBLIC_BASE_URL}/api/messages/${messageId}/read`,
    {},
    {
      withCredentials: true,
    }
  );
  return response.data;
};

// 쪽지 수정
export const updateMessage = async (
  messageId: number,
  messageData: { title?: string; content?: string }
): Promise<{ message: string }> => {
  try {
    const response = await axios.patch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/messages/${messageId}`, messageData, {
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    console.error("쪽지 수정 실패:", error);
    throw error;
  }
};

// 쪽지 삭제
export const deleteMessage = async (messageId: number): Promise<{ message: string }> => {
  const response = await axios.delete(`${process.env.NEXT_PUBLIC_BASE_URL}/api/messages/${messageId}`, {
    withCredentials: true,
  });
  return response.data;
};

// 사용자 검색 (닉네임으로)
export const searchUserByNickname = async (nickname: string): Promise<User[]> => {
  try {
    const response = await axios.get(`${process.env.NEXT_PUBLIC_BASE_URL}/api/users/search`, {
      params: { nickname },
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    console.error("사용자 검색 실패:", error);
    return [];
  }
};
