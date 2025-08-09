"use client";
import React from "react";
import { Box, Chip, Tooltip, Typography } from "@mui/material";
import { calculateUserLevel, UserActivityTotals } from "@/app/utils/level";

export interface UserBadgeProps {
  nickname?: string;
  totals: UserActivityTotals;
  size?: "small" | "medium"; // small: 댓글/인라인, medium: 카드/헤더
  inline?: boolean; // true면 닉네임 옆에 여백 작게
}

/**
 * 사용자 레벨/뱃지 컴포넌트
 * nickname과 활동 totals를 받아 레벨/칭호/색상/점수 툴팁을 렌더링합니다.
 */
const UserBadge: React.FC<UserBadgeProps> = ({ nickname, totals, size = "small", inline = true }) => {
  const info = calculateUserLevel(totals);
  const label = `Lv.${info.level} ${info.title}`;
  const tooltip =
    `${nickname ?? "사용자"} · 점수 ${info.score}` +
    (info.nextLevelScore ? ` (다음 레벨까지 ${Math.max(0, info.nextLevelScore - info.score)}점)` : " (최고 단계)");

  // Chip 기반 배지 (gradient 우선 적용)
  const chipSx = {
    height: size === "small" ? 22 : 26,
    fontSize: size === "small" ? "0.72rem" : "0.78rem",
    fontWeight: 700,
    color: info.gradient ? "#fff" : undefined,
    bgcolor: info.gradient ? undefined : info.color,
    background: info.gradient,
    border: info.gradient ? "none" : "1px solid rgba(0,0,0,0.08)",
    boxShadow: info.gradient ? "0 4px 12px rgba(0,0,0,0.2)" : "none",
    px: 1,
    mr: inline ? 0.5 : 1,
  } as const;

  return (
    <Tooltip title={tooltip} arrow>
      <Chip label={label} size={size} sx={chipSx} />
    </Tooltip>
  );
};

export default UserBadge;
