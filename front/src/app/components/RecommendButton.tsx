"use client";
import { useState } from "react";
import { Box, Button, Typography, useTheme } from "@mui/material";
import ThumbUpIcon from "@mui/icons-material/ThumbUp";
import ThumbDownIcon from "@mui/icons-material/ThumbDown";
import { motion } from "framer-motion"; // framer-motion 추가

interface RecommendButtonsWithCountProps {
  like: number;
  dislike: number;
  likeFunc: (vote: "like" | "dislike") => void;
}

export default function RecommendButtonsWithCount({ like, dislike, likeFunc }: RecommendButtonsWithCountProps) {
  const [clicked, setClicked] = useState<"like" | "dislike" | null>(null);
  const theme = useTheme();

  const handleClick = (vote: "like" | "dislike") => {
    setClicked(vote);
    likeFunc(vote);

    // 500ms 후 클릭 상태 초기화 (애니메이션 효과 후 복귀)
    setTimeout(() => setClicked(null), 500);
  };

  const chromeStyle = {
    background:
      theme.palette.mode === "dark"
        ? "linear-gradient(135deg, rgba(26, 26, 46, 0.98) 0%, rgba(45, 48, 71, 0.95) 100%)"
        : "linear-gradient(135deg, rgba(255, 255, 255, 0.98) 0%, rgba(241, 245, 249, 0.98) 100%)",
    position: "relative" as const,
    overflow: "hidden",
    border: theme.palette.mode === "dark" ? "2px solid rgba(139, 92, 246, 0.6)" : "2px solid rgba(139, 92, 246, 0.4)",
    // 복잡한 애니메이션 제거
  };

  return (
    <Box
      sx={{
        position: "fixed",
        bottom: 20,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 10,
        textAlign: "center",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 2,
        opacity: 0.95,
      }}
    >
      <Box
        sx={{
          padding: "16px",
          borderRadius: "20px",
          ...chromeStyle,
          boxShadow:
            theme.palette.mode === "dark" ? "0 8px 30px rgba(139, 92, 246, 0.4)" : "0 8px 30px rgba(139, 92, 246, 0.3)",
          width: 240,
          textAlign: "center",
          backdropFilter: "blur(20px)",
          // 복잡한 애니메이션 제거
        }}
      >
        <Box sx={{ display: "flex", gap: 3, justifyContent: "center", mt: 1, position: "relative", zIndex: 2 }}>
          {/* 추천 카운트 */}
          <Box sx={{ textAlign: "center" }}>
            <motion.div
              key={like}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              <Typography
                variant="subtitle1"
                sx={{
                  fontWeight: "bold",
                  background:
                    theme.palette.mode === "dark"
                      ? "linear-gradient(45deg, #22d3ee, #06b6d4)"
                      : "linear-gradient(45deg, #1976d2, #2196f3)",
                  backgroundClip: "text",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  fontSize: "1.4rem",
                  // 복잡한 애니메이션 제거
                }}
              >
                {like}
              </Typography>
            </motion.div>
            <motion.div whileTap={{ scale: 1.2 }} whileHover={{ scale: 1.05 }}>
              <Button
                variant="contained"
                startIcon={<ThumbUpIcon />}
                sx={{
                  borderRadius: "16px",
                  padding: "12px 20px",
                  fontWeight: "bold",
                  background:
                    clicked === "like"
                      ? "linear-gradient(45deg, #10b981, #22d3ee)"
                      : theme.palette.mode === "dark"
                        ? "linear-gradient(45deg, #3b82f6, #22d3ee)"
                        : "linear-gradient(45deg, #1976d2, #2196f3)",
                  color: "#ffffff",
                  boxShadow:
                    theme.palette.mode === "dark"
                      ? "0 4px 15px rgba(59, 130, 246, 0.5)"
                      : "0 4px 15px rgba(25, 118, 210, 0.5)",
                  "&:hover": {
                    transform: "translateY(-2px) scale(1.02)",
                    boxShadow:
                      theme.palette.mode === "dark"
                        ? "0 6px 20px rgba(59, 130, 246, 0.6)"
                        : "0 6px 20px rgba(25, 118, 210, 0.6)",
                  },
                  transition: "all 0.2s ease",
                }}
                onClick={() => handleClick("like")}
              >
                추천
              </Button>
            </motion.div>
          </Box>

          {/* 비추천 카운트 */}
          <Box sx={{ textAlign: "center" }}>
            <motion.div
              key={dislike}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              <Typography
                variant="subtitle1"
                sx={{
                  fontWeight: "bold",
                  background:
                    theme.palette.mode === "dark"
                      ? "linear-gradient(45deg, #f87171, #ef4444)"
                      : "linear-gradient(45deg, #d32f2f, #f44336)",
                  backgroundClip: "text",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  fontSize: "1.4rem",
                  // 복잡한 애니메이션 제거
                }}
              >
                {dislike}
              </Typography>
            </motion.div>
            <motion.div whileTap={{ scale: 1.2 }} whileHover={{ scale: 1.05 }}>
              <Button
                variant="contained"
                startIcon={<ThumbDownIcon />}
                sx={{
                  borderRadius: "16px",
                  padding: "12px 20px",
                  fontWeight: "bold",
                  background:
                    clicked === "dislike"
                      ? "linear-gradient(45deg, #dc2626, #ef4444)"
                      : theme.palette.mode === "dark"
                        ? "linear-gradient(45deg, #ef4444, #f87171)"
                        : "linear-gradient(45deg, #d32f2f, #f44336)",
                  color: "#ffffff",
                  boxShadow:
                    theme.palette.mode === "dark"
                      ? "0 4px 15px rgba(239, 68, 68, 0.5)"
                      : "0 4px 15px rgba(211, 47, 47, 0.5)",
                  "&:hover": {
                    transform: "translateY(-2px) scale(1.02)",
                    boxShadow:
                      theme.palette.mode === "dark"
                        ? "0 6px 20px rgba(239, 68, 68, 0.6)"
                        : "0 6px 20px rgba(211, 47, 47, 0.6)",
                  },
                  transition: "all 0.2s ease",
                }}
                onClick={() => handleClick("dislike")}
              >
                비추
              </Button>
            </motion.div>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
