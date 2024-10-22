"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, TextField, Typography, Box, Container, Alert } from "@mui/material";
import axios from "axios";
import { useLogin, useMessage } from "@/app/store";

// 로그인 화면
const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();
  const { showMessage } = useMessage((state) => state);
  const { login } = useLogin((state) => state);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // 로그인 API 요청
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/signin`,
        {
          user_email: email,
          password,
        },
        { withCredentials: true }
      ); // 쿠키를 포함하여 요청
      // alert("Login Response:", response);
      console.log("Login Response:", response);
      if (response.status === 200) {
        // 성공 시 리다이렉트
        showMessage("로그인 성공", "success");
        router.push("/");
      }
      login();
    } catch (error) {
      setError("유효하지 않은 요청입니다.");
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
