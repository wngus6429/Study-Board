// 알림 타입 정의
export interface INotification {
  id: number;
  type: 'comment' | 'reply'; // 댓글 또는 대댓글
  message: string;
  isRead: boolean;
  createdAt: string;
  comment?: {
    id: number;
    content: string;
    author: {
      id: string;
      nickname: string;
    };
    storyId: number;
  };
  post?: {
    id: number;
    title: string;
  };
}

// 알림 목록 응답 타입
export interface INotificationListResponse {
  items: INotification[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
} 