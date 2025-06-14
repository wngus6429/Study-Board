import axios from "./axios";
import { INotification, INotificationListResponse } from "../types/notification";

// 읽지 않은 알림 조회 (댓글/답글만)
export const getUnreadCommentNotifications = async (): Promise<INotification[]> => {
  const response = await axios.get(`${process.env.NEXT_PUBLIC_BASE_URL}/api/notifications`, {
    withCredentials: true,
  });
  // 댓글과 답글 알림만 필터링
  return response.data.filter(
    (notification: INotification) => notification.type === "comment" || notification.type === "reply"
  );
};

// 읽지 않은 채널 알림 조회 (채널 새 게시글만)
export const getUnreadChannelNotifications = async (): Promise<INotification[]> => {
  const response = await axios.get(`${process.env.NEXT_PUBLIC_BASE_URL}/api/notifications`, {
    withCredentials: true,
  });
  // 채널 새 게시글 알림만 필터링
  return response.data.filter((notification: INotification) => notification.type === "channel_post");
};

// 읽지 않은 알림 조회 (전체)
export const getUnreadNotifications = async (): Promise<INotification[]> => {
  const response = await axios.get(`${process.env.NEXT_PUBLIC_BASE_URL}/api/notifications`, {
    withCredentials: true,
  });
  return response.data;
};

// 모든 알림 조회 (페이지네이션)
export const getAllNotifications = async (page: number = 1, limit: number = 20): Promise<INotificationListResponse> => {
  const response = await axios.get(`${process.env.NEXT_PUBLIC_BASE_URL}/api/notifications/all`, {
    params: { page, limit },
    withCredentials: true,
  });
  return response.data;
};

// 알림을 읽음으로 표시
export const markNotificationAsRead = async (id: number): Promise<void> => {
  await axios.patch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/notifications/${id}/read`, {}, { withCredentials: true });
};

// 모든 알림을 읽음으로 표시
export const markAllNotificationsAsRead = async (): Promise<void> => {
  await axios.patch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/notifications/read-all`, {}, { withCredentials: true });
};

// 알림 삭제
export const deleteNotification = async (id: number): Promise<void> => {
  await axios.delete(`${process.env.NEXT_PUBLIC_BASE_URL}/api/notifications/${id}`, {
    withCredentials: true,
  });
};
