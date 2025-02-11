import { useState } from "react";
import { Box, Button, Typography } from "@mui/material";
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
          border: "2px solid rgba(0, 0, 0, 0.1)",
          padding: "8px",
          borderRadius: 2,
          backgroundColor: "rgba(255, 255, 255, 0.8)",
          boxShadow: 3,
          width: 200,
          textAlign: "center",
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
              <Typography variant="subtitle1" sx={{ fontWeight: "bold" }}>
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
                  padding: "8px 15px",
                  fontWeight: "bold",
                  opacity: 1,
                  backgroundColor: clicked === "like" ? "green" : undefined, // 클릭 시 색상 변경
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
              <Typography variant="subtitle1" sx={{ fontWeight: "bold" }}>
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
                  padding: "8px 15px",
                  fontWeight: "bold",
                  opacity: 1,
                  backgroundColor: clicked === "dislike" ? "red" : undefined,
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
