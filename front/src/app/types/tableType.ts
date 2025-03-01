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
  imageFlag: boolean;
  isNotice?: boolean;
  created_at: string;
}
