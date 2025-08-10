"use client";
import React from "react";
import { Box, Typography } from "@mui/material";
import { getLevelInfoByExp } from "@/app/utils/level";
import { EXPERIENCE_RULES } from "@/app/const/LEVEL";

type Totals = {
  totalPosts?: number;
  totalComments?: number;
  totalLikesReceived?: number; // 내가 쓴 글에 받은 좋아요 수 (선택)
  totalDislikesReceived?: number; // 내가 쓴 글에 받은 싫어요 수 (선택)
};

type UserBadgeProps = {
  totalExperience?: number; // 서버에서 누적 경험치를 제공하는 경우
  totals?: Totals; // 서버에서 누적 카운트만 제공하는 경우
  levelOverride?: number; // 레벨 숫자를 직접 넘길 때
  badgeNameOverride?: string; // 뱃지 이름을 직접 지정하고 싶을 때
  nickname?: string; // 타입 호환을 위해 허용 (미사용)
  size?: "small" | "medium";
  showText?: boolean; // 텍스트(레벨명/진행도) 표시 여부
};

export default function UserBadge({
  totalExperience,
  totals,
  levelOverride,
  badgeNameOverride,
  nickname, // eslint-disable-line @typescript-eslint/no-unused-vars
  size = "small",
  showText = false,
}: UserBadgeProps) {
  // 우선순위: totalExperience > totals 기반 계산 > 0
  let computedExp = totalExperience ?? 0;
  if (totalExperience == null && totals) {
    const posts = totals.totalPosts ?? 0;
    const comments = totals.totalComments ?? 0;
    const likes = totals.totalLikesReceived ?? 0;
    const dislikes = totals.totalDislikesReceived ?? 0;
    computedExp =
      posts * EXPERIENCE_RULES.writePost +
      comments * EXPERIENCE_RULES.writeComment +
      likes * EXPERIENCE_RULES.likeOnMyPost +
      dislikes * EXPERIENCE_RULES.dislikeOnMyPost;
  }

  const info = getLevelInfoByExp(computedExp);
  const label = badgeNameOverride ?? `${levelOverride ?? info.level}레벨 · ${info.badgeName}`;

  const badgeImgSrc = (info as any).badgeImage || undefined;

  if (!showText) {
    // 텍스트 없이, 닉네임 오른쪽에 작은 아이콘만 (툴팁 제거)
    return (
      <Box
        component="img"
        src={badgeImgSrc}
        alt={info.badgeName}
        sx={{
          width: size === "small" ? 20 : 24,
          height: size === "small" ? 20 : 24,
          objectFit: "contain",
          display: "inline-block",
        }}
      />
    );
  }

  // 내 프로필 등 텍스트가 필요한 경우: 레벨 텍스트 + 뱃지 + 다음 레벨 정보
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
      <Box
        component="img"
        src={badgeImgSrc}
        alt={info.badgeName}
        sx={{ width: 24, height: 24, objectFit: "contain" }}
      />
      <Typography variant="body2" sx={{ fontWeight: 700 }}>
        Lv.{levelOverride ?? info.level} {info.badgeName}
      </Typography>
      {info.nextLevelMinExp != null && (
        <Typography variant="caption" color="text.secondary">
          {Math.round(info.currentExp)} / {info.nextLevelMinExp}
        </Typography>
      )}
    </Box>
  );
}
