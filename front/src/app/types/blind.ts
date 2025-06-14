// 블라인드 사용자 정보
export interface IBlindUser {
  id: number;
  userId: string;
  targetUserId: string;
  targetUser: {
    id: string;
    nickname: string;
    email?: string;
  };
  createdAt: string;
}

// 블라인드 요청 타입
export interface IBlindRequest {
  targetUserNickname: string;
}

// 블라인드 목록 응답 타입
export interface IBlindListResponse {
  items: IBlindUser[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
