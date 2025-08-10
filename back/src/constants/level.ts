// 레벨/경험치 설정 상수 (자유롭게 수정 가능)

export const EXPERIENCE_RULES = {
  writePost: 2, // 글 1개 작성 시 +2
  writeComment: 0.5, // 댓글 1개 작성 시 +0.5
  likeOnMyPost: 1, // 내가 쓴 글이 좋아요 1개 받을 때 +1
  dislikeOnMyPost: -1, // 내가 쓴 글이 싫어요 1개 받을 때 -1
} as const;

export type LevelDefinition = {
  level: number;
  minExp: number; // 해당 레벨의 최소 누적 경험치
};

export const LEVELS: LevelDefinition[] = [
  { level: 1, minExp: 0 },
  { level: 2, minExp: 100 }, // 1 -> 2에 100 필요
  { level: 3, minExp: 300 },
  { level: 4, minExp: 600 },
  { level: 5, minExp: 1000 },
  { level: 6, minExp: 1500 },
];

export function getLevelByExperience(exp: number): number {
  let current = LEVELS[0];
  for (const lv of LEVELS) {
    if (exp >= lv.minExp) current = lv;
  }
  return current.level;
}
