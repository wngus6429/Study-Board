import { StoryImageType } from "./imageTypes";
import { UserType } from "./userType";

// 상세페이지 타입
export interface StoryType {
  id: number;
  category: string;
  title: string;
  content: string;
  nickname: string;
  creator_user_id: string;
  read_count: number;
  like_count: number;
  dislike_count: number;
  comments: string | null;
  created_at: string;
  updated_at: string;
  StoryImage: StoryImageType[]; // ImageType 배열로 설정
  User: UserType;
  isNotice?: boolean;
}
