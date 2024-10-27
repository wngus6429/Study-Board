"use client";
import React, { ReactNode, useState } from "react";
import {
  Avatar,
  Button,
  CssBaseline,
  TextField,
  FormControl,
  FormControlLabel,
  Checkbox,
  Box,
  Typography,
  Container,
  Alert,
} from "@mui/material/";
import Grid from "@mui/material/Grid2";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import axios from "axios";
import { useRouter } from "next/navigation";
import { useMessage } from "@/app/store";

// 회원가입 화면
const SignupPage = (): ReactNode => {
  const router = useRouter();
  const theme = createTheme();
  const [checked, setChecked] = useState(false);

  const { showMessage } = useMessage((state) => state);
  // 동의 체크
  const handleAgree = (e: any): void => {
    setChecked(!checked);
  };

  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [rePassword, setRePassword] = useState<string>("");
  const [nickname, setNickname] = useState<string>("");
  const [error, setError] = useState<string>("");

  // form 전송
  const handleSubmit = async (e: any): Promise<void> => {
    e.preventDefault();
    if (password !== rePassword) {
      showMessage("비밀번호가 일치하지 않습니다.", "error");
      return;
    }
    if (!checked) {
      showMessage("약관에 동의해주세요.", "info");
      return;
    }
    const data = { user_email: email, password, nickname };
    console.log("data:", data);
    //! fetch에서는 credentials: 'include'로 쿠키를 전달할 수 있음
    //! axios에서는 withCredentials: true로 쿠키를 전달할 수 있음
    await axios
      .post(`${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/signup`, data, { withCredentials: true })
      .then((res: { status: number }) => {
        console.log("res:", res);
        if (res.status === 201) {
          showMessage("회원가입 성공", "success");
          router.push("/");
        }
      })
      .catch((err: any) => {
        setError(err.response.data.message);
      });
  };

  return (
    <>
      {error && (
        <Alert variant="outlined" severity="error">
          에러가 발생 했습니다.
        </Alert>
      )}
      <ThemeProvider theme={theme}>
        <Container component="main" maxWidth="xs">
          <CssBaseline />
          <Box
            sx={{
              marginTop: 8,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <Avatar sx={{ m: 1, bgcolor: "primary.main" }} />
            <Typography component="h1" variant="h5">
              회원가입
            </Typography>
            <Box component="form" noValidate sx={{ mt: 1 }}>
              <FormControl component="fieldset" variant="standard">
                <Grid container spacing={1}>
                  <Grid size={12}>
                    <TextField
                      required
                      autoFocus
                      fullWidth
                      type="email"
                      id="email"
                      name="email"
                      label="이메일 주소"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </Grid>
                  <Grid size={12}>
                    <TextField
                      required
                      autoFocus
                      fullWidth
                      type="text"
                      id="nickname"
                      name="nickname"
                      label="닉네임"
                      value={nickname}
                      onChange={(e) => setNickname(e.target.value)}
                    />
                  </Grid>
                  <Grid size={12}>
                    <TextField
                      required
                      fullWidth
                      type="password"
                      id="password"
                      name="password"
                      label="비밀번호 (숫자+영문자+특수문자 8자리 이상)"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </Grid>
                  <Grid size={12}>
                    <TextField
                      required
                      fullWidth
                      type="password"
                      id="rePassword"
                      name="rePassword"
                      label="비밀번호 재입력"
                      value={rePassword}
                      onChange={(e) => setRePassword(e.target.value)}
                    />
                  </Grid>
                  <Grid size={12}>
                    <TextField required fullWidth id="name" name="name" label="이름" />
                  </Grid>
                  <Grid size={12}>
                    <FormControlLabel
                      control={<Checkbox onChange={handleAgree} color="primary" />}
                      label="회원가입 약관에 동의합니다."
                    />
                  </Grid>
                </Grid>
                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  sx={{ mt: 1, mb: 2 }}
                  disabled={!checked}
                  size="large"
                  onClick={handleSubmit}
                >
                  회원가입
                </Button>
              </FormControl>
            </Box>
          </Box>
        </Container>
      </ThemeProvider>
    </>
  );
};

export default SignupPage;
