import { Box, Button, Card, Typography } from "@mui/material";
import ThumbUpIcon from "@mui/icons-material/ThumbUp";
import ThumbDownIcon from "@mui/icons-material/ThumbDown";
import { useState } from "react";

export default function RecommendButtonsWithCount() {
  const [likes, setLikes] = useState(0); // 추천 수
  const [dislikes, setDislikes] = useState(0); // 비추천 수

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
        10
        <Box sx={{ display: "flex", gap: 2, justifyContent: "center", mt: 1 }}>
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
            onClick={() => setLikes(likes + 1)}
          >
            추천
          </Button>
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
            onClick={() => setDislikes(dislikes + 1)}
          >
            비추
          </Button>
        </Box>
      </Box>
    </Box>
  );
}
