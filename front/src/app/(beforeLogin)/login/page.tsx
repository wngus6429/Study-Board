"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, TextField, Typography, Box, Container, Alert, useTheme } from "@mui/material";
import axios from "axios";
import { signIn, useSession } from "next-auth/react";
import { useMessage } from "@/app/store/messageStore";

// 로그인 화면
const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();
  const { showMessage, hideMessage } = useMessage((state) => state);
  const { data: session, update, status } = useSession();
  const theme = useTheme();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // API 토큰 요청
      const response1 = await axios.post(
        `${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/signin`,
        {
          user_email: email,
          password,
        },
        { withCredentials: true }
      );
      if (response1.status !== 200) {
        setError("로그인 중 오류가 발생했습니다.");
      }

      // 두 번째 요청: NextAuth의 signIn 호출
      const response2 = await signIn("credentials", {
        user_email: email,
        password,
        redirect: false,
      });

      if (response2?.status !== 200) {
        // 두 번째 요청 실패 시 첫 번째 요청 롤백 (쿠키 제거)
        await axios.post(`${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/logout`, {}, { withCredentials: true });
        setError("로그인 중 오류가 발생했습니다.");
        return;
      }
      // 로그인 성공 메시지
      showMessage("로그인 성공", "success");
      // 세션 업데이트 및 페이지 이동
      await update();
      router.refresh();
      router.push("/channels");
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        setError(error.response.data.data);
      } else {
        setError("로그인 중 오류가 발생했습니다.");
      }
    }
  };

  return (
    <Container component="main" maxWidth="xs">
      <Box
        sx={{
          marginTop: 8,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          height: 400,
        }}
      >
        <Box
          sx={{
            backgroundColor: theme.palette.mode === "dark" ? "rgba(26, 26, 46, 0.95)" : "#ffffff",
            padding: 4,
            borderRadius: 2,
            boxShadow:
              theme.palette.mode === "dark"
                ? "0px 8px 32px rgba(139, 92, 246, 0.3)"
                : "0px 8px 24px rgba(0, 0, 0, 0.15)",
            maxWidth: 400,
            width: "100%",
            border:
              theme.palette.mode === "dark" ? "1px solid rgba(139, 92, 246, 0.4)" : "1px solid rgba(0, 0, 0, 0.1)",
          }}
        >
          <Typography
            component="h1"
            variant="h5"
            textAlign="center"
            gutterBottom
            sx={{
              color: theme.palette.mode === "dark" ? "#ffffff" : "#1a1a2e",
              textShadow: theme.palette.mode === "dark" ? "0 0 10px rgba(139, 92, 246, 0.5)" : "none",
              fontWeight: "bold",
              mb: 3,
            }}
          >
            로그인
          </Typography>
          <Box component="form" onSubmit={handleLogin} noValidate sx={{ mt: 1 }}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="이메일"
              name="email"
              autoComplete="email"
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              sx={{
                "& .MuiOutlinedInput-root": {
                  backgroundColor: theme.palette.mode === "dark" ? "rgba(26, 26, 46, 0.8)" : "#f8f9fa",
                  "& fieldset": {
                    borderColor: theme.palette.mode === "dark" ? "rgba(139, 92, 246, 0.5)" : "rgba(0, 0, 0, 0.2)",
                  },
                  "&:hover fieldset": {
                    borderColor: theme.palette.mode === "dark" ? "rgba(139, 92, 246, 0.8)" : "#1976d2",
                  },
                  "&.Mui-focused fieldset": {
                    borderColor: theme.palette.mode === "dark" ? "rgba(139, 92, 246, 1)" : "#1976d2",
                  },
                },
                "& .MuiInputLabel-root": {
                  color: theme.palette.mode === "dark" ? "rgba(255, 255, 255, 0.7)" : "rgba(0, 0, 0, 0.6)",
                  "&.Mui-focused": {
                    color: theme.palette.mode === "dark" ? "rgba(139, 92, 246, 1)" : "#1976d2",
                  },
                },
                "& .MuiOutlinedInput-input": {
                  color: theme.palette.mode === "dark" ? "#ffffff" : "#1a1a2e",
                },
              }}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="비밀번호"
              type="password"
              id="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              sx={{
                "& .MuiOutlinedInput-root": {
                  backgroundColor: theme.palette.mode === "dark" ? "rgba(26, 26, 46, 0.8)" : "#f8f9fa",
                  "& fieldset": {
                    borderColor: theme.palette.mode === "dark" ? "rgba(139, 92, 246, 0.5)" : "rgba(0, 0, 0, 0.2)",
                  },
                  "&:hover fieldset": {
                    borderColor: theme.palette.mode === "dark" ? "rgba(139, 92, 246, 0.8)" : "#1976d2",
                  },
                  "&.Mui-focused fieldset": {
                    borderColor: theme.palette.mode === "dark" ? "rgba(139, 92, 246, 1)" : "#1976d2",
                  },
                },
                "& .MuiInputLabel-root": {
                  color: theme.palette.mode === "dark" ? "rgba(255, 255, 255, 0.7)" : "rgba(0, 0, 0, 0.6)",
                  "&.Mui-focused": {
                    color: theme.palette.mode === "dark" ? "rgba(139, 92, 246, 1)" : "#1976d2",
                  },
                },
                "& .MuiOutlinedInput-input": {
                  color: theme.palette.mode === "dark" ? "#ffffff" : "#1a1a2e",
                },
              }}
            />
            {error && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {error}
              </Alert>
            )}
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{
                mt: 3,
                mb: 2,
                py: 1.5,
                fontSize: "1.1rem",
                fontWeight: "bold",
                background:
                  theme.palette.mode === "dark"
                    ? "linear-gradient(135deg, rgba(139, 92, 246, 0.8), rgba(6, 182, 212, 0.8))"
                    : "linear-gradient(135deg, #1976d2, #42a5f5)",
                "&:hover": {
                  background:
                    theme.palette.mode === "dark"
                      ? "linear-gradient(135deg, rgba(139, 92, 246, 1), rgba(6, 182, 212, 1))"
                      : "linear-gradient(135deg, #1565c0, #1976d2)",
                  transform: "translateY(-1px)",
                },
                boxShadow:
                  theme.palette.mode === "dark"
                    ? "0 0 20px rgba(139, 92, 246, 0.4)"
                    : "0 4px 12px rgba(25, 118, 210, 0.3)",
                transition: "all 0.2s ease-in-out",
              }}
            >
              로그인
            </Button>
          </Box>
        </Box>
      </Box>
    </Container>
  );
};

export default LoginPage;
