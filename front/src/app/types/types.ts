export interface ImageType {
  id: number; // 이미지의 고유 ID
  link: string; // 이미지의 링크 (URL)
}

export interface UserType {
  id: string;
  user_email: string;
  nickname: string;
  password: string;
  image?: ImageType | null; // 유저 프로필 이미지 (nullable)
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
}

export interface StoryImageType {
  id: number;
  image_name: string;
  link: string;
  created_at: string;
  // deleted_at?: string | null;
  // story_id: number;
}

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
}
