import { ImageType } from "./imageTypes";

export interface UserType {
  id: string;
  user_email: string;
  nickname: string;
  password: string;
  image?: ImageType | null; // 유저 프로필 이미지 (nullable)
  avatar: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
}
