// 레벨/경험치 상수 정의 - 여기서 자유롭게 조정하세요

export type LevelDefinition = {
  level: number;
  minExp: number; // 해당 레벨의 최소 누적 경험치
  badgeName: string;
  badgeColor: string; // CSS 색상값
  badgeImage?: string; // public/assets 경로의 뱃지 이미지
};

// 레벨 테이블: 필요시 자유롭게 수정/추가 (최대 레벨 5)
export const LEVELS: LevelDefinition[] = [
  { level: 1, minExp: 0, badgeName: "Bronze", badgeColor: "#cd7f32", badgeImage: "/assets/level1.png" },
  { level: 2, minExp: 100, badgeName: "Silver", badgeColor: "#c0c0c0", badgeImage: "/assets/level2.png" },
  { level: 3, minExp: 300, badgeName: "Gold", badgeColor: "#d4af37", badgeImage: "/assets/level3.png" },
  { level: 4, minExp: 600, badgeName: "Platinum", badgeColor: "#e5e4e2", badgeImage: "/assets/level4.png" },
  { level: 5, minExp: 1000, badgeName: "Diamond", badgeColor: "#1fb6ff", badgeImage: "/assets/level5.png" },
];

// 경험치 규칙: 자유롭게 조정 가능
export const EXPERIENCE_RULES = {
  likeOnMyPost: 1, // 내가 쓴 글이 좋아요 1개 받을 때
  dislikeOnMyPost: -1, // 내가 쓴 글이 싫어요 1개 받을 때
  writePost: 2, // 글 1개 작성 시
  writeComment: 0.5, // 댓글 1개 작성 시
} as const;
