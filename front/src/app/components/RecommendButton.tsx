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
        opacity: 0.9,
      }}
    >
      <Box
        sx={{
          border: theme.palette.mode === "dark" ? "2px solid rgba(139, 92, 246, 0.4)" : "2px solid rgba(0, 0, 0, 0.1)",
          padding: "12px",
          borderRadius: 3,
          backgroundColor: theme.palette.mode === "dark" ? "rgba(26, 26, 46, 0.95)" : "rgba(255, 255, 255, 0.95)",
          boxShadow: theme.palette.mode === "dark" ? "0 8px 32px rgba(139, 92, 246, 0.3)" : 3,
          width: 220,
          textAlign: "center",
          backdropFilter: "blur(10px)",
        }}
      >
        <Box sx={{ display: "flex", gap: 2, justifyContent: "center", mt: 1 }}>
          {/* 추천 카운트 */}
          <Box sx={{ textAlign: "center" }}>
            <motion.div
              key={like} // like 값이 바뀔 때 애니메이션 실행
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              <Typography
                variant="subtitle1"
                sx={{
                  fontWeight: "bold",
                  color: theme.palette.mode === "dark" ? "#22d3ee" : "#1976d2",
                  fontSize: "1.2rem",
                }}
              >
                {like}
              </Typography>
            </motion.div>
            <motion.div
              whileTap={{ scale: 1.4 }} // 버튼을 눌렀을 때 약간 커지는 효과
              whileHover={{ scale: 1.2 }} // 마우스를 올리면 커지는 효과
            >
              <Button
                variant="contained"
                color="primary"
                startIcon={<ThumbUpIcon />}
                sx={{
                  borderRadius: 20,
                  padding: "10px 18px",
                  fontWeight: "bold",
                  opacity: 1,
                  background:
                    clicked === "like"
                      ? "linear-gradient(45deg, #10b981 30%, #22d3ee 90%)"
                      : theme.palette.mode === "dark"
                        ? "linear-gradient(45deg, #3b82f6 30%, #22d3ee 90%)"
                        : undefined,
                  boxShadow: theme.palette.mode === "dark" ? "0 4px 15px rgba(59, 130, 246, 0.4)" : undefined,
                  "&:hover": {
                    background:
                      theme.palette.mode === "dark" ? "linear-gradient(45deg, #2563eb 30%, #0891b2 90%)" : undefined,
                    boxShadow: theme.palette.mode === "dark" ? "0 6px 20px rgba(59, 130, 246, 0.6)" : undefined,
                    transform: "translateY(-2px)",
                  },
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
                  color: theme.palette.mode === "dark" ? "#f87171" : "#d32f2f",
                  fontSize: "1.2rem",
                }}
              >
                {dislike}
              </Typography>
            </motion.div>
            <motion.div whileTap={{ scale: 1.4 }} whileHover={{ scale: 1.2 }}>
              <Button
                variant="contained"
                color="error"
                startIcon={<ThumbDownIcon />}
                sx={{
                  borderRadius: 20,
                  padding: "10px 18px",
                  fontWeight: "bold",
                  opacity: 1,
                  background:
                    clicked === "dislike"
                      ? "linear-gradient(45deg, #dc2626 30%, #ef4444 90%)"
                      : theme.palette.mode === "dark"
                        ? "linear-gradient(45deg, #ef4444 30%, #f87171 90%)"
                        : undefined,
                  boxShadow: theme.palette.mode === "dark" ? "0 4px 15px rgba(239, 68, 68, 0.4)" : undefined,
                  "&:hover": {
                    background:
                      theme.palette.mode === "dark" ? "linear-gradient(45deg, #dc2626 30%, #ef4444 90%)" : undefined,
                    boxShadow: theme.palette.mode === "dark" ? "0 6px 20px rgba(239, 68, 68, 0.6)" : undefined,
                    transform: "translateY(-2px)",
                  },
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
