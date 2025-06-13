// 알림 타입 정의
export interface INotification {
  id: number;
  type: "comment" | "reply" | "channel_post"; // 댓글, 대댓글, 채널 새 게시글
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
    channelSlug: string | null;
  };
  post?: {
    id: number;
    title: string;
    author?: {
      id: string;
      nickname: string;
    };
    channelId?: number;
    channelSlug?: string;
    channelName?: string;
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
