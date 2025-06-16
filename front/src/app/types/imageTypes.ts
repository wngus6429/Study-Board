export interface ImageType {
  id: number; // 이미지의 고유 ID
  link: string; // 이미지의 링크 (URL)
}

export interface StoryImageType {
  id: number;
  image_name: string;
  link: string;
  created_at: string;
  file_size?: number; // 파일 크기 (bytes)
  mime_type?: string; // MIME 타입
}

export interface StoryVideoType {
  id: number;
  video_name: string;
  link: string;
  created_at: string;
  file_size?: number; // 파일 크기 (bytes)
  mime_type?: string; // MIME 타입
  duration?: number; // 동영상 길이 (초)
}

export interface SuggestionImageType {
  id: number;
  image_name: string;
  link: string;
  created_at: string;
  file_size?: number; // 파일 크기 (bytes)
  mime_type?: string; // MIME 타입
}
