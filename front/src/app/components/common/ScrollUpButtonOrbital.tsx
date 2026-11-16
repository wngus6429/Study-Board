"use client";
import { Fab } from "@mui/material";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";

export default function ScrollUpButton() {
  const scrollToTop = () => {
    const shouldReduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    window.scrollTo({
      top: 0,
      behavior: shouldReduceMotion ? "auto" : "smooth",
    });
  };
  return (
    <Fab
      size="small"
      onClick={scrollToTop}
      aria-label="맨 위로 이동"
      sx={{
        position: "fixed",
        bottom: 76,
        right: 20,
        bgcolor: "background.paper",
        color: "text.primary",
        border: "1px solid",
        borderColor: "divider",
        boxShadow: "0 2px 8px #00000012",
        "&:hover": { bgcolor: "action.selected" },
      }}
    >
      <KeyboardArrowUpIcon />
    </Fab>
  );
}
