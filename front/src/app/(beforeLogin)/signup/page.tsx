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
  useTheme,
} from "@mui/material/";
import Grid from "@mui/material/Grid2";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import axios from "axios";
import { useRouter } from "next/navigation";
import { signIn, useSession } from "next-auth/react";
import { useMessage } from "@/app/store/messageStore";

// 회원가입 화면
const SignupPage = (): ReactNode => {
  const router = useRouter();
  const theme = useTheme();
  const { update } = useSession();
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
      .then(async (res: { status: number }) => {
        if (res.status === 201) {
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
              showMessage("회원가입, 로그인 성공", "success");
              // 세션 업데이트 강제
              await update();
              router.refresh();
              router.push("/");
            }
          } catch (error) {
            console.log("error", error);
            setError("유효하지 않은 요청입니다.");
          }
        }
      })
      .catch((err: any) => {
        console.log("어라", err.response.data.data);
        setError(err.response.data.data);
      });
  };

  return (
    <>
      <Container component="main" maxWidth="xs">
        <CssBaseline />
        <Box
          sx={{
            marginTop: 8,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            backgroundColor: theme.palette.mode === "dark" ? "rgba(26, 26, 46, 0.95)" : "white",
            padding: 4,
            borderRadius: 2,
            boxShadow:
              theme.palette.mode === "dark"
                ? "0px 8px 32px rgba(139, 92, 246, 0.3)"
                : "0px 4px 20px rgba(0, 0, 0, 0.1)",
            border: theme.palette.mode === "dark" ? "1px solid rgba(139, 92, 246, 0.4)" : "none",
          }}
        >
          <Avatar
            sx={{
              m: 1,
              bgcolor: theme.palette.mode === "dark" ? "rgba(139, 92, 246, 0.8)" : "primary.main",
              boxShadow: theme.palette.mode === "dark" ? "0 0 15px rgba(139, 92, 246, 0.5)" : "none",
            }}
          />
          <Typography
            component="h1"
            variant="h5"
            sx={{
              color: theme.palette.mode === "dark" ? "#ffffff" : "inherit",
              textShadow: theme.palette.mode === "dark" ? "0 0 10px rgba(139, 92, 246, 0.5)" : "none",
            }}
          >
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
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        backgroundColor: theme.palette.mode === "dark" ? "rgba(26, 26, 46, 0.8)" : "inherit",
                        "& fieldset": {
                          borderColor: theme.palette.mode === "dark" ? "rgba(139, 92, 246, 0.5)" : "inherit",
                        },
                        "&:hover fieldset": {
                          borderColor: theme.palette.mode === "dark" ? "rgba(139, 92, 246, 0.8)" : "inherit",
                        },
                        "&.Mui-focused fieldset": {
                          borderColor: theme.palette.mode === "dark" ? "rgba(139, 92, 246, 1)" : "inherit",
                        },
                      },
                      "& .MuiInputLabel-root": {
                        color: theme.palette.mode === "dark" ? "rgba(255, 255, 255, 0.7)" : "inherit",
                      },
                      "& .MuiOutlinedInput-input": {
                        color: theme.palette.mode === "dark" ? "#ffffff" : "inherit",
                      },
                    }}
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
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        backgroundColor: theme.palette.mode === "dark" ? "rgba(26, 26, 46, 0.8)" : "inherit",
                        "& fieldset": {
                          borderColor: theme.palette.mode === "dark" ? "rgba(139, 92, 246, 0.5)" : "inherit",
                        },
                        "&:hover fieldset": {
                          borderColor: theme.palette.mode === "dark" ? "rgba(139, 92, 246, 0.8)" : "inherit",
                        },
                        "&.Mui-focused fieldset": {
                          borderColor: theme.palette.mode === "dark" ? "rgba(139, 92, 246, 1)" : "inherit",
                        },
                      },
                      "& .MuiInputLabel-root": {
                        color: theme.palette.mode === "dark" ? "rgba(255, 255, 255, 0.7)" : "inherit",
                      },
                      "& .MuiOutlinedInput-input": {
                        color: theme.palette.mode === "dark" ? "#ffffff" : "inherit",
                      },
                    }}
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
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        backgroundColor: theme.palette.mode === "dark" ? "rgba(26, 26, 46, 0.8)" : "inherit",
                        "& fieldset": {
                          borderColor: theme.palette.mode === "dark" ? "rgba(139, 92, 246, 0.5)" : "inherit",
                        },
                        "&:hover fieldset": {
                          borderColor: theme.palette.mode === "dark" ? "rgba(139, 92, 246, 0.8)" : "inherit",
                        },
                        "&.Mui-focused fieldset": {
                          borderColor: theme.palette.mode === "dark" ? "rgba(139, 92, 246, 1)" : "inherit",
                        },
                      },
                      "& .MuiInputLabel-root": {
                        color: theme.palette.mode === "dark" ? "rgba(255, 255, 255, 0.7)" : "inherit",
                      },
                      "& .MuiOutlinedInput-input": {
                        color: theme.palette.mode === "dark" ? "#ffffff" : "inherit",
                      },
                    }}
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
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        backgroundColor: theme.palette.mode === "dark" ? "rgba(26, 26, 46, 0.8)" : "inherit",
                        "& fieldset": {
                          borderColor: theme.palette.mode === "dark" ? "rgba(139, 92, 246, 0.5)" : "inherit",
                        },
                        "&:hover fieldset": {
                          borderColor: theme.palette.mode === "dark" ? "rgba(139, 92, 246, 0.8)" : "inherit",
                        },
                        "&.Mui-focused fieldset": {
                          borderColor: theme.palette.mode === "dark" ? "rgba(139, 92, 246, 1)" : "inherit",
                        },
                      },
                      "& .MuiInputLabel-root": {
                        color: theme.palette.mode === "dark" ? "rgba(255, 255, 255, 0.7)" : "inherit",
                      },
                      "& .MuiOutlinedInput-input": {
                        color: theme.palette.mode === "dark" ? "#ffffff" : "inherit",
                      },
                    }}
                  />
                </Grid>
                <Grid size={12}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        onChange={handleAgree}
                        sx={{
                          color: theme.palette.mode === "dark" ? "rgba(139, 92, 246, 0.7)" : "primary.main",
                          "&.Mui-checked": {
                            color: theme.palette.mode === "dark" ? "rgba(139, 92, 246, 1)" : "primary.main",
                          },
                        }}
                      />
                    }
                    label="회원가입 약관에 동의합니다."
                    sx={{
                      "& .MuiFormControlLabel-label": {
                        color: theme.palette.mode === "dark" ? "rgba(255, 255, 255, 0.8)" : "inherit",
                      },
                    }}
                  />
                </Grid>
              </Grid>
              {error && <Alert severity="error">{error}</Alert>}
              <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{
                  mt: 1,
                  mb: 2,
                  background:
                    theme.palette.mode === "dark"
                      ? "linear-gradient(135deg, rgba(139, 92, 246, 0.8), rgba(6, 182, 212, 0.8))"
                      : "inherit",
                  "&:hover": {
                    background:
                      theme.palette.mode === "dark"
                        ? "linear-gradient(135deg, rgba(139, 92, 246, 1), rgba(6, 182, 212, 1))"
                        : "inherit",
                  },
                  "&:disabled": {
                    background: theme.palette.mode === "dark" ? "rgba(139, 92, 246, 0.3)" : "inherit",
                  },
                  boxShadow: theme.palette.mode === "dark" ? "0 0 20px rgba(139, 92, 246, 0.4)" : "inherit",
                }}
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
    </>
  );
};

export default SignupPage;
