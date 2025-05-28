"use client";
import { Fab } from "@mui/material";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import { useTheme } from "@mui/material/styles";

const ScrollUpButton = () => {
  const theme = useTheme();

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <Fab
      onClick={scrollToTop}
      aria-label="맨 위로 이동"
      sx={{
        position: "fixed",
        bottom: 64,
        right: 50,
        background:
          theme.palette.mode === "dark"
            ? "linear-gradient(45deg, #8b5cf6, #06b6d4)"
            : "linear-gradient(45deg, #1E90FF, #C0C0C0)", // 파란색과 실버 그라데이션
        color: "#fff", // 아이콘 색상 설정 (필요에 따라 조정 가능)
        boxShadow:
          theme.palette.mode === "dark" ? "0px 4px 15px rgba(139, 92, 246, 0.4)" : "0px 3px 5px rgba(0, 0, 0, 0.2)",
        "&:hover": {
          background:
            theme.palette.mode === "dark"
              ? "linear-gradient(45deg, #7c3aed, #0891b2)"
              : "linear-gradient(45deg, #1C86EE, #B0B0B0)", // hover 시 약간 어둡게 처리
          boxShadow:
            theme.palette.mode === "dark" ? "0px 6px 20px rgba(139, 92, 246, 0.6)" : "0px 4px 8px rgba(0, 0, 0, 0.3)",
          transform: theme.palette.mode === "dark" ? "translateY(-2px)" : "scale(1.05)",
        },
      }}
    >
      <KeyboardArrowUpIcon />
    </Fab>
  );
};

export default ScrollUpButton;
