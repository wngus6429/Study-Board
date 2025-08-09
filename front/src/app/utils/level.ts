export interface UserActivityTotals {
  totalPosts: number;
  totalComments: number;
  totalReceivedRecommends?: number; // 확장용 (백엔드 제공 시 연동)
}

export interface UserLevelInfo {
  level: number;
  title: string;
  score: number;
  nextLevelScore?: number;
  color: string; // MUI color or hex
  gradient?: string; // css linear-gradient for fancy badge
}

/**
 * 사용자 활동 점수 계산
 * 기본 가중치: 글 5점, 댓글 2점, 받은 추천 1점(옵션)
 */
export function calculateActivityScore(totals: UserActivityTotals): number {
  const postsScore = (totals.totalPosts || 0) * 5;
  const commentsScore = (totals.totalComments || 0) * 2;
  const recommendsScore = (totals.totalReceivedRecommends || 0) * 1;
  return postsScore + commentsScore + recommendsScore;
}

// 레벨 테이블 (임계값: 누적 점수)
const LEVELS: Array<{ threshold: number; title: string; color: string; gradient?: string }> = [
  { threshold: 0, title: "새싹", color: "default" },
  { threshold: 20, title: "초심자", color: "#60a5fa" }, // blue-400
  { threshold: 60, title: "입문", color: "#34d399" }, // emerald-400
  { threshold: 120, title: "견습", color: "#a78bfa" }, // violet-400
  { threshold: 250, title: "숙련", color: "#fbbf24" }, // amber-400
  { threshold: 500, title: "고수", color: "#f59e0b", gradient: "linear-gradient(135deg,#f59e0b,#ef4444)" },
  { threshold: 1000, title: "마스터", color: "#eab308", gradient: "linear-gradient(135deg,#eab308,#db2777)" },
];

export function calculateUserLevel(totals: UserActivityTotals): UserLevelInfo {
  const score = calculateActivityScore(totals);
  // 가장 높은 임계값부터 찾기
  let selectedIndex = 0;
  for (let i = LEVELS.length - 1; i >= 0; i -= 1) {
    if (score >= LEVELS[i].threshold) {
      selectedIndex = i;
      break;
    }
  }
  const current = LEVELS[selectedIndex];
  const next = LEVELS[selectedIndex + 1];
  return {
    level: selectedIndex + 1,
    title: current.title,
    score,
    nextLevelScore: next ? next.threshold : undefined,
    color: current.color,
    gradient: current.gradient,
  };
}
