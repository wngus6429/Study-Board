import { Box, Button, Typography } from "@mui/material";
import ThumbUpIcon from "@mui/icons-material/ThumbUp";
import ThumbDownIcon from "@mui/icons-material/ThumbDown";
import { useState } from "react";

interface RecommendButtonsWithCountProps {
  like: number;
  unlike: number;
  likeFunc: (flag: boolean) => void;
}

export default function RecommendButtonsWithCount({ like, unlike, likeFunc }: RecommendButtonsWithCountProps) {
  // const [likes, setLikes] = useState(like); // 추천 수
  // const [dislikes, setDislikes] = useState(unlike); // 비추천 수

  return (
    <Box
      sx={{
        position: "fixed",
        bottom: 20, // 화면 아래에서 20px 위치
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 10,
        textAlign: "center",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 2,
        opacity: 0.7,
      }}
    >
      <Box
        sx={{
          border: "2px solid rgba(0, 0, 0, 0.1)", // 투명한 사각형 테두리
          padding: "8px",
          borderRadius: 2,
          backgroundColor: "rgba(255, 255, 255, 0.8)", // 반투명 배경
          boxShadow: 3,
          width: 200,
          textAlign: "center",
        }}
      >
        <Box sx={{ display: "flex", gap: 2, justifyContent: "center", mt: 1 }}>
          {/* 추천 카운트 */}
          <Box sx={{ textAlign: "center" }}>
            <Typography variant="subtitle1" sx={{ fontWeight: "bold" }}>
              {like}
            </Typography>
            <Button
              variant="contained"
              color="primary"
              startIcon={<ThumbUpIcon />}
              sx={{
                borderRadius: 20,
                padding: "8px 15px",
                fontWeight: "bold",
                opacity: 1,
              }}
              onClick={() => likeFunc(true)}
            >
              추천
            </Button>
          </Box>

          {/* 비추천 카운트 */}
          <Box sx={{ textAlign: "center" }}>
            <Typography variant="subtitle1" sx={{ fontWeight: "bold" }}>
              {unlike}
            </Typography>
            <Button
              variant="contained"
              color="error"
              startIcon={<ThumbDownIcon />}
              sx={{
                borderRadius: 20,
                padding: "8px 15px",
                fontWeight: "bold",
                opacity: 1,
              }}
              onClick={() => likeFunc(false)}
            >
              비추
            </Button>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
