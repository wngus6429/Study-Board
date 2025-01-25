"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, TextField, Typography, Box, Container, Alert } from "@mui/material";
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
      router.push("/");
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
        }}
      >
        <Box
          sx={{
            backgroundColor: "white",
            padding: 4,
            borderRadius: 2,
            boxShadow: "0px 4px 20px rgba(0, 0, 0, 0.1)", // 박스 그림자
            maxWidth: 400,
            width: "100%",
          }}
        >
          <Typography component="h1" variant="h5" textAlign="center" gutterBottom>
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
            />
            {error && <Alert severity="error">{error}</Alert>}
            <Button type="submit" fullWidth variant="contained" sx={{ mt: 3, mb: 2 }}>
              로그인
            </Button>
          </Box>
        </Box>
      </Box>
    </Container>
  );
};

export default LoginPage;
