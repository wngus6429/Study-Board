"use client";
import { Box, Typography, Button } from "@mui/material";
import { alpha } from "@mui/material/styles";
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
        minHeight: "calc(100vh - 70px)",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        textAlign: "center",
        background: (theme) =>
          `radial-gradient(circle at 50% 35%, ${alpha(
            theme.palette.primary.main,
            theme.palette.mode === "dark" ? 0.12 : 0.1,
          )}, transparent 42%), ${theme.palette.background.default}`,
        padding: { xs: 3, sm: 4 },
      }}
    >
      <img src="/assets/nn.png" alt="Not Found" style={{ width: "300px", height: "auto", marginBottom: "20px" }} />
      <Typography variant="h6" sx={{ marginBottom: 3, color: "text.secondary" }}>
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
