import { LEVELS } from "@/app/const/LEVEL";

export type UserLevelInfo = {
  level: number;
  currentExp: number; // 현재 누적 경험치
  currentLevelMinExp: number;
  nextLevelMinExp: number | null; // 최고 레벨이면 null
  progressPercent: number; // 0~100
  badgeName: string;
  badgeColor: string;
};

export function getLevelInfoByExp(totalExperience: number): UserLevelInfo {
  // 현재 레벨 찾기: minExp 기준으로 가장 큰 레벨
  let current = LEVELS[0];
  for (const lv of LEVELS) {
    if (totalExperience >= lv.minExp) current = lv;
  }

  const currentIndex = LEVELS.findIndex((l) => l.level === current.level);
  const next = LEVELS[currentIndex + 1] ?? null;

  const currentLevelMinExp = current.minExp;
  const nextLevelMinExp = next?.minExp ?? null;

  let progressPercent = 100;
  if (nextLevelMinExp != null) {
    const range = Math.max(1, nextLevelMinExp - currentLevelMinExp);
    progressPercent = Math.min(100, Math.max(0, ((totalExperience - currentLevelMinExp) / range) * 100));
  }

  return {
    level: current.level,
    currentExp: totalExperience,
    currentLevelMinExp,
    nextLevelMinExp,
    progressPercent,
    badgeName: current.badgeName,
    badgeColor: current.badgeColor,
    // 아래 필드는 UserBadge에서만 접근 (as any)하여 이미지 렌더링에 사용
    // 타입 확장을 피해 최소 주석으로만 표기
    ...(current as any),
  };
}
