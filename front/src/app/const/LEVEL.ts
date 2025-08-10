// 레벨/경험치 상수 정의 - 여기서 자유롭게 조정하세요

export type LevelDefinition = {
  level: number;
  minExp: number; // 해당 레벨의 최소 누적 경험치
  badgeName: string;
  badgeColor: string; // CSS 색상값
  badgeImage?: string; // public/assets 경로의 뱃지 이미지
};

// 레벨 테이블: 필요시 자유롭게 수정/추가
export const LEVELS: LevelDefinition[] = [
  { level: 1, minExp: 0, badgeName: "Bronze", badgeColor: "#cd7f32", badgeImage: "/assets/bronze.png" },
  { level: 2, minExp: 100, badgeName: "Gold", badgeColor: "#d4af37", badgeImage: "/assets/gold.png" },
  { level: 3, minExp: 300, badgeName: "Platinum", badgeColor: "#e5e4e2", badgeImage: "/assets/platinum.png" },
  { level: 4, minExp: 600, badgeName: "Diamond", badgeColor: "#1fb6ff", badgeImage: "/assets/diamond.png" },
  { level: 5, minExp: 1000, badgeName: "Rank", badgeColor: "#7c3aed", badgeImage: "/assets/rank.png" },
  // 레벨 6 이상은 Rank 뱃지를 재사용 (필요 시 자산 추가)
  { level: 6, minExp: 1500, badgeName: "Rank+", badgeColor: "#7c3aed", badgeImage: "/assets/rank.png" },
];

// 경험치 규칙: 자유롭게 조정 가능
export const EXPERIENCE_RULES = {
  likeOnMyPost: 1, // 내가 쓴 글이 좋아요 1개 받을 때
  dislikeOnMyPost: -1, // 내가 쓴 글이 싫어요 1개 받을 때
  writePost: 2, // 글 1개 작성 시
  writeComment: 0.5, // 댓글 1개 작성 시
} as const;
