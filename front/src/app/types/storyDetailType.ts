import { StoryImageType, StoryVideoType } from "./imageTypes";
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
  StoryImage: StoryImageType[]; // 이미지 배열
  StoryVideo: StoryVideoType[]; // 동영상 배열
  User: UserType;
  channelName?: string; // 채널 이름 추가
  channelSlug?: string; // 채널 슬러그 추가
}
