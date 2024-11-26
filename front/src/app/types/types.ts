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

export interface ImageType {
  imageId: number;
  image_name: string;
  link: string;
  user_id: string;
  created_at: string;
  deleted_at?: string | null;
  story_id: number;
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
  comments: string | null;
  created_at: string;
  updated_at: string;
  Image: ImageType[]; // ImageType 배열로 설정
  User: UserType;
}
