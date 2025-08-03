export interface Comment {
  id: number;
  content: string;
  nickname: string;
  userId: string; // 블라인드 처리를 위한 userId 추가
  parentNickname?: string; // 부모 댓글 작성자 닉네임
  parentUserId?: string; // 부모 댓글 작성자 ID 추가
  avatarUrl?: string;
  parentId: number | null;
  createdAt: string;
  children: Comment[];
  depth?: number;
  updated_at: string;
  link: string; // 프로필 이미지 링크
}

// 페이지네이션 응답 인터페이스
export interface CommentResponse {
  processedComments: Comment[];
  loginUser: any;
  totalCount: number; // 전체 댓글 수 추가 (대댓글 포함)
}

export interface CommentsViewProps {
  channelId?: number; // 채널 ID 추가 (채널 관리자 권한 체크용)
  channelCreatorId?: string; // 채널 생성자 ID 추가
}

export interface CommentListProps {
  comments: Comment[];
  toggleReply: (commentId: number) => void;
  handleReplySubmit: (parentId: number, content: string) => void;
  replyTo: number | null;
  handleEditSubmit: (commentId: number, newContent: string) => void;
  handleAdminDeleteComment: (commentId: number, content: string) => void;
  handleDeleteClick: (commentId: number) => void;
  sessionUserId?: string;
  channelId?: number;
  channelCreatorId?: string;
  MAX_DEPTH: number;
}

export interface CommentFormProps {
  content: string;
  setContent: (content: string) => void;
  handleSubmit: () => void;
  isLoggedIn: boolean;
  sessionUser: {
    image?: string;
    nickname?: string;
  } | null;
  refetch: () => void;
}

export interface CommentPaginationProps {
  totalPages: number;
  currentPage: number;
  handlePageClick: (event: React.ChangeEvent<unknown>, page: number) => void;
}

export interface AdminDeleteDialog {
  open: boolean;
  commentId: number | null;
  content: string;
}
