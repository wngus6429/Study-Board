// import { UserType } from "./userType";

// 테이블 타입
export interface TableStoryType {
  id: number;
  category: string;
  title: string;
  content: string;
  // User: Pick<UserType, "nickname">;
  nickname: string;
  read_count: number;
  recommend_Count: number;
  comment_count: number;
  imageFlag: boolean;
  created_at: string;
  isRecommendRanking?: boolean; // 추천 랭킹 게시글 여부
}
