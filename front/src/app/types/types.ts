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
  creator_email: string;
  read_count: number;
  like_count: number;
  comments: string | null;
  created_at: string;
  updated_at: string;
  Image: ImageType[]; // ImageType 배열로 설정
}
