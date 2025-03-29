"use client";
import { Button, Box } from "@mui/material";

const ScrollUpButton = () => {
  // 버튼 클릭 시 부드럽게 맨 위로 이동
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <Box display="flex" justifyContent="center">
      <Button variant="contained" onClick={scrollToTop}>
        Go to Up
      </Button>
    </Box>
  );
};

export default ScrollUpButton;
