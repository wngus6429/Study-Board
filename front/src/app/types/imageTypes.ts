export interface ImageType {
  id: number; // 이미지의 고유 ID
  link: string; // 이미지의 링크 (URL)
}

export interface StoryImageType {
  id: number;
  image_name: string;
  link: string;
  created_at: string;
}
