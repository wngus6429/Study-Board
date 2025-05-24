import axios from './axios';
import { INotification, INotificationListResponse } from '../types/notification';

// 읽지 않은 알림 조회
export const getUnreadNotifications = async (): Promise<INotification[]> => {
  const response = await axios.get(`${process.env.NEXT_PUBLIC_BASE_URL}/api/notifications`, {
    withCredentials: true,
  });
  return response.data;
};

// 모든 알림 조회 (페이지네이션)
export const getAllNotifications = async (
  page: number = 1,
  limit: number = 20
): Promise<INotificationListResponse> => {
  const response = await axios.get(`${process.env.NEXT_PUBLIC_BASE_URL}/api/notifications/all`, {
    params: { page, limit },
    withCredentials: true,
  });
  return response.data;
};

// 알림을 읽음으로 표시
export const markNotificationAsRead = async (id: number): Promise<void> => {
  await axios.patch(
    `${process.env.NEXT_PUBLIC_BASE_URL}/api/notifications/${id}/read`,
    {},
    { withCredentials: true }
  );
};

// 모든 알림을 읽음으로 표시
export const markAllNotificationsAsRead = async (): Promise<void> => {
  await axios.patch(
    `${process.env.NEXT_PUBLIC_BASE_URL}/api/notifications/read-all`,
    {},
    { withCredentials: true }
  );
};

// 알림 삭제
export const deleteNotification = async (id: number): Promise<void> => {
  await axios.delete(`${process.env.NEXT_PUBLIC_BASE_URL}/api/notifications/${id}`, {
    withCredentials: true,
  });
}; 