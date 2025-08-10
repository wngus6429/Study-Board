import { Box } from "@mui/material";
import { LEVELS } from "@/app/const/LEVEL";

interface LevelBadgeProps {
  level?: number | null;
  size?: "small" | "medium" | "large";
}

/**
 * 레벨 뱃지 컴포넌트
 * - 레벨 번호만 받아서 해당하는 뱃지 이미지를 표시
 * - 경험치 계산 없이 간단하게 사용
 */
export default function LevelBadge({ level, size = "small" }: LevelBadgeProps) {
  // 레벨이 없거나 0 이하면 뱃지를 표시하지 않음
  if (!level || level <= 0) {
    return null;
  }

  // 레벨에 해당하는 뱃지 정보 찾기
  const levelDef = LEVELS.find((l) => l.level === level) || LEVELS[LEVELS.length - 1]; // 해당 레벨이 없으면 최고 레벨 뱃지 사용

  const badgeSize = size === "small" ? 30 : size === "medium" ? 36 : 42; // 1.5배 증가 (small: 30px, medium: 36px, large: 42px)

  return (
    <Box
      component="img"
      src={levelDef.badgeImage}
      alt={levelDef.badgeName}
      sx={{
        width: badgeSize,
        height: badgeSize,
        objectFit: "contain",
        display: "inline-block",
      }}
    />
  );
}
