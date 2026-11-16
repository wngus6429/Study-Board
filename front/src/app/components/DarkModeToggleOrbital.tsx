"use client";
import { IconButton, Tooltip } from "@mui/material";
import DarkModeOutlinedIcon from "@mui/icons-material/DarkModeOutlined";
import LightModeOutlinedIcon from "@mui/icons-material/LightModeOutlined";
import { useThemeStore } from "../store/themeStore";

export default function DarkModeToggle() {
  const { isDarkMode, toggleTheme } = useThemeStore();
  const label = isDarkMode ? "라이트 모드로 전환" : "다크 모드로 전환";
  return (
    <Tooltip title={label}>
      <IconButton
        onClick={toggleTheme}
        aria-label={label}
        sx={{
          width: 38,
          height: 38,
          color: "text.secondary",
          border: "1px solid",
          borderColor: "divider",
          borderRadius: 2,
        }}
      >
        {isDarkMode ? (
          <LightModeOutlinedIcon fontSize="small" />
        ) : (
          <DarkModeOutlinedIcon fontSize="small" />
        )}
      </IconButton>
    </Tooltip>
  );
}
