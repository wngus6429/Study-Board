"use client";
import React from "react";
import { Typography } from "@mui/material";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";

interface BlindedContentProps {
  type: "post" | "comment";
  className?: string;
}

const BlindedContent: React.FC<BlindedContentProps> = ({ type, className }) => {
  return (
    <Typography
      variant="body2"
      color="text.disabled"
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 0.5,
        fontStyle: "italic",
      }}
      className={className}
    >
      <VisibilityOffIcon fontSize="small" />
      블라인드된 사용자입니다
    </Typography>
  );
};

export default BlindedContent;
