// import { UserType } from "./userType";

// 테이블 타입
export interface TableStoryType {
  id: number;
  category: string;
  title: string;
  content: string;
  // User: Pick<UserType, "nickname">;
  userId?: string; // 사용자 ID 추가 (블라인드 처리용)
  nickname: string;
  read_count: number;
  recommend_Count: number;
  comment_count: number;
  imageFlag: boolean;
  videoFlag: boolean; // 동영상 존재 여부 플래그
  created_at: string;
  isRecommendRanking?: boolean; // 추천 랭킹 게시글 여부
}
