"use client";
import { Box, Typography, Button } from "@mui/material";
import { useRouter } from "next/navigation";

const NotFoundPage = () => {
  const router = useRouter();

  const handleBackToHome = () => {
    router.push("/");
  };

  return (
    <Box
      sx={{
        width: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        textAlign: "center",
        backgroundColor: "#f5f5f5",
        padding: 4,
      }}
    >
      <img src="/assets/nn.png" alt="Not Found" style={{ width: "300px", height: "auto", marginBottom: "20px" }} />
      <Typography variant="h6" sx={{ marginBottom: 3, color: "#616161" }}>
        페이지를 찾을 수 없습니다.
      </Typography>
      <Button
        variant="contained"
        color="primary"
        onClick={handleBackToHome}
        sx={{
          textTransform: "none",
          padding: "10px 20px",
          fontSize: "1rem",
        }}
      >
        홈으로 돌아가기
      </Button>
    </Box>
  );
};

export default NotFoundPage;
