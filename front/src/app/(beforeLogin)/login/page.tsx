"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, TextField, Typography, Box, Container, Alert } from "@mui/material";
import axios from "axios";
import { useMessage } from "@/app/store";
import { signIn, useSession } from "next-auth/react";

// 로그인 화면
const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();
  const { showMessage } = useMessage((state) => state);
  const { data: session, update, status } = useSession();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const [response1, response2] = await Promise.all([
        await axios.post(
          `${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/signin`,
          {
            user_email: email,
            password,
          },
          { withCredentials: true }
        ),
        await signIn("credentials", {
          user_email: email,
          password,
          redirect: false,
        }),
      ]);
      if (response1?.status === 200 && response2?.status === 200) {
        showMessage("로그인 성공", "success");
        // 세션 업데이트 강제
        await update();
        router.refresh();
        router.push("/");
      } else if (response1?.status === 401 || response2?.status === 401) {
        setError("아이디 또는 비밀번호가 일치하지 않습니다.");
      }
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        setError(error.response.data.data);
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
