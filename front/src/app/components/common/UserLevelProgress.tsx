"use client";
import React from "react";
import { Box, LinearProgress, Typography } from "@mui/material";
import { getLevelInfoByExp } from "@/app/utils/level";

type Props = {
  totalExperience: number;
};

export default function UserLevelProgress({ totalExperience }: Props) {
  const info = getLevelInfoByExp(totalExperience);
  return (
    <Box sx={{ width: "100%" }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
        <Typography variant="caption" fontWeight={700}>
          Lv.{info.level} ({info.badgeName})
        </Typography>
        <Typography variant="caption">{Math.round(info.progressPercent)}%</Typography>
      </Box>
      <LinearProgress
        variant="determinate"
        value={info.progressPercent}
        sx={{
          height: 8,
          borderRadius: 999,
          ["& .MuiLinearProgress-bar"]: {
            backgroundColor: info.badgeColor,
          },
        }}
      />
      {info.nextLevelMinExp != null && (
        <Typography variant="caption" color="text.secondary">
          {info.currentExp} / {info.nextLevelMinExp}
        </Typography>
      )}
    </Box>
  );
}
