"use client";
import { Fab } from "@mui/material";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";

const ScrollUpButton = () => {
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
        background: "linear-gradient(45deg, #1E90FF, #C0C0C0)", // 파란색과 실버 그라데이션
        color: "#fff", // 아이콘 색상 설정 (필요에 따라 조정 가능)
        boxShadow: "0px 3px 5px rgba(0, 0, 0, 0.2)",
        "&:hover": {
          background: "linear-gradient(45deg, #1C86EE, #B0B0B0)", // hover 시 약간 어둡게 처리
        },
      }}
    >
      <KeyboardArrowUpIcon />
    </Fab>
  );
};

export default ScrollUpButton;
