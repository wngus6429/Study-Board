"use client";
import React from "react";
import { IconButton, Tooltip, useTheme } from "@mui/material";
import { Brightness4, Brightness7 } from "@mui/icons-material";
import { useThemeStore } from "../store/themeStore";
import { styled } from "@mui/material/styles";

const StyledToggleButton = styled(IconButton)(({ theme }) => ({
  position: "relative",
  width: 48,
  height: 48,
  borderRadius: "50%",
  transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
  overflow: "hidden",

  // 라이트 모드 스타일
  ...(theme.palette.mode === "light" && {
    backgroundColor: "rgba(99, 102, 241, 0.1)",
    color: "#6366f1",
    border: "2px solid rgba(99, 102, 241, 0.2)",
    "&:hover": {
      backgroundColor: "rgba(99, 102, 241, 0.2)",
      transform: "scale(1.05)",
      boxShadow: "0 4px 15px rgba(99, 102, 241, 0.3)",
    },
  }),

  // 다크 모드 스타일 (네온 효과)
  ...(theme.palette.mode === "dark" && {
    backgroundColor: "rgba(139, 92, 246, 0.1)",
    color: "#a78bfa",
    border: "2px solid rgba(139, 92, 246, 0.3)",
    boxShadow: "0 0 10px rgba(139, 92, 246, 0.2)",

    "&:hover": {
      backgroundColor: "rgba(139, 92, 246, 0.2)",
      transform: "scale(1.05)",
      boxShadow: "0 0 20px rgba(139, 92, 246, 0.4), 0 0 40px rgba(139, 92, 246, 0.2)",
      border: "2px solid rgba(139, 92, 246, 0.5)",
    },

    "&:active": {
      transform: "scale(0.95)",
      boxShadow: "0 0 25px rgba(139, 92, 246, 0.6)",
    },

    // 네온 글로우 효과
    "&::before": {
      content: '""',
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      borderRadius: "50%",
      background: "linear-gradient(45deg, rgba(139, 92, 246, 0.1), rgba(6, 182, 212, 0.1))",
      opacity: 0,
      transition: "opacity 0.3s ease",
    },

    "&:hover::before": {
      opacity: 1,
    },
  }),

  // 아이콘 애니메이션
  "& .MuiSvgIcon-root": {
    fontSize: "1.5rem",
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",

    "&:hover": {
      transform: "rotate(180deg)",
    },
  },
}));

const DarkModeToggle: React.FC = () => {
  const { isDarkMode, toggleTheme } = useThemeStore();
  const theme = useTheme();

  return (
    <Tooltip title={isDarkMode ? "라이트 모드로 전환" : "다크 모드로 전환"} placement="bottom" arrow>
      <StyledToggleButton onClick={toggleTheme} aria-label="테마 전환" size="medium">
        {isDarkMode ? <Brightness7 /> : <Brightness4 />}
      </StyledToggleButton>
    </Tooltip>
  );
};

export default DarkModeToggle;
