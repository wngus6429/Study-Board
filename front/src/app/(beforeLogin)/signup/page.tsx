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
  CircularProgress,
} from "@mui/material";
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

  // 닉네임 중복 확인
  const handleNicknameCheck = async (): Promise<void> => {
    if (!nickname.trim()) {
      showMessage("닉네임을 입력해주세요.", "warning");
      return;
    }

    setNicknameCheckLoading(true);
    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/check-nickname/${encodeURIComponent(nickname)}`
      );

      const { isAvailable, message } = response.data;
      setNicknameAvailable(isAvailable);
      setNicknameChecked(true);
      setNicknameCheckMessage(message);

      showMessage(message, isAvailable ? "success" : "error");
    } catch (error: any) {
      console.error("닉네임 중복 확인 실패:", error);
      setNicknameAvailable(false);
      setNicknameChecked(false);
      setNicknameCheckMessage("중복 확인 중 오류가 발생했습니다.");
      showMessage("중복 확인 중 오류가 발생했습니다.", "error");
    } finally {
      setNicknameCheckLoading(false);
    }
  };

  // 닉네임 변경 시 중복 확인 상태 초기화
  const handleNicknameChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setNickname(e.target.value);
    setNicknameChecked(false);
    setNicknameAvailable(false);
    setNicknameCheckMessage("");
  };

  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [rePassword, setRePassword] = useState<string>("");
  const [nickname, setNickname] = useState<string>("");
  const [error, setError] = useState<string>("");

  // 닉네임 중복 확인 관련
  const [nicknameChecked, setNicknameChecked] = useState<boolean>(false);
  const [nicknameAvailable, setNicknameAvailable] = useState<boolean>(false);
  const [nicknameCheckLoading, setNicknameCheckLoading] = useState<boolean>(false);
  const [nicknameCheckMessage, setNicknameCheckMessage] = useState<string>("");

  // 비밀번호 일치 여부 확인
  const isPasswordMismatch = password !== "" && rePassword !== "" && password !== rePassword;

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
    if (!nicknameChecked || !nicknameAvailable) {
      showMessage("닉네임 중복 확인을 해주세요.", "warning");
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
              // router.refresh();
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
            backgroundColor: theme.palette.mode === "dark" ? "rgba(26, 26, 46, 0.95)" : "#ffffff",
            padding: 4,
            borderRadius: 2,
            boxShadow:
              theme.palette.mode === "dark"
                ? "0px 8px 32px rgba(139, 92, 246, 0.3)"
                : "0px 8px 24px rgba(0, 0, 0, 0.15)",
            border:
              theme.palette.mode === "dark" ? "1px solid rgba(139, 92, 246, 0.4)" : "1px solid rgba(0, 0, 0, 0.1)",
          }}
        >
          <Avatar
            sx={{
              m: 1,
              bgcolor: theme.palette.mode === "dark" ? "rgba(139, 92, 246, 0.8)" : "#1976d2",
              boxShadow:
                theme.palette.mode === "dark"
                  ? "0 0 15px rgba(139, 92, 246, 0.5)"
                  : "0 4px 12px rgba(25, 118, 210, 0.3)",
            }}
          />
          <Typography
            component="h1"
            variant="h5"
            sx={{
              color: theme.palette.mode === "dark" ? "#ffffff" : "#1a1a2e",
              textShadow: theme.palette.mode === "dark" ? "0 0 10px rgba(139, 92, 246, 0.5)" : "none",
              fontWeight: "bold",
              mb: 3,
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
                </Grid>
                <Grid size={12}>
                  <Box sx={{ display: "flex", gap: 1, alignItems: "flex-start" }}>
                    <TextField
                      required
                      autoFocus
                      fullWidth
                      type="text"
                      id="nickname"
                      name="nickname"
                      label="닉네임"
                      value={nickname}
                      onChange={handleNicknameChange}
                      error={nicknameChecked && !nicknameAvailable}
                      helperText={nicknameCheckMessage}
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          backgroundColor: theme.palette.mode === "dark" ? "rgba(26, 26, 46, 0.8)" : "#f8f9fa",
                          "& fieldset": {
                            borderColor:
                              nicknameChecked && !nicknameAvailable
                                ? "#f44336"
                                : nicknameChecked && nicknameAvailable
                                  ? "#4caf50"
                                  : theme.palette.mode === "dark"
                                    ? "rgba(139, 92, 246, 0.5)"
                                    : "rgba(0, 0, 0, 0.2)",
                          },
                          "&:hover fieldset": {
                            borderColor:
                              nicknameChecked && !nicknameAvailable
                                ? "#f44336"
                                : nicknameChecked && nicknameAvailable
                                  ? "#4caf50"
                                  : theme.palette.mode === "dark"
                                    ? "rgba(139, 92, 246, 0.8)"
                                    : "#1976d2",
                          },
                          "&.Mui-focused fieldset": {
                            borderColor:
                              nicknameChecked && !nicknameAvailable
                                ? "#f44336"
                                : nicknameChecked && nicknameAvailable
                                  ? "#4caf50"
                                  : theme.palette.mode === "dark"
                                    ? "rgba(139, 92, 246, 1)"
                                    : "#1976d2",
                          },
                        },
                        "& .MuiInputLabel-root": {
                          color:
                            nicknameChecked && !nicknameAvailable
                              ? "#f44336"
                              : theme.palette.mode === "dark"
                                ? "rgba(255, 255, 255, 0.7)"
                                : "rgba(0, 0, 0, 0.6)",
                          "&.Mui-focused": {
                            color:
                              nicknameChecked && !nicknameAvailable
                                ? "#f44336"
                                : theme.palette.mode === "dark"
                                  ? "rgba(139, 92, 246, 1)"
                                  : "#1976d2",
                          },
                        },
                        "& .MuiOutlinedInput-input": {
                          color: theme.palette.mode === "dark" ? "#ffffff" : "#1a1a2e",
                        },
                        "& .MuiFormHelperText-root": {
                          color:
                            nicknameChecked && !nicknameAvailable
                              ? "#f44336"
                              : nicknameChecked && nicknameAvailable
                                ? "#4caf50"
                                : theme.palette.mode === "dark"
                                  ? "rgba(255, 255, 255, 0.7)"
                                  : "rgba(0, 0, 0, 0.6)",
                          fontWeight: "500",
                        },
                      }}
                    />
                    <Button
                      variant="outlined"
                      onClick={handleNicknameCheck}
                      disabled={!nickname.trim() || nicknameCheckLoading}
                      sx={{
                        minWidth: "100px",
                        height: "56px",
                        borderColor: theme.palette.mode === "dark" ? "rgba(139, 92, 246, 0.7)" : "#1976d2",
                        color: theme.palette.mode === "dark" ? "rgba(139, 92, 246, 1)" : "#1976d2",
                        "&:hover": {
                          borderColor: theme.palette.mode === "dark" ? "rgba(139, 92, 246, 1)" : "#1565c0",
                          backgroundColor:
                            theme.palette.mode === "dark" ? "rgba(139, 92, 246, 0.1)" : "rgba(25, 118, 210, 0.04)",
                        },
                        "&:disabled": {
                          borderColor:
                            theme.palette.mode === "dark" ? "rgba(139, 92, 246, 0.3)" : "rgba(25, 118, 210, 0.3)",
                          color: theme.palette.mode === "dark" ? "rgba(255, 255, 255, 0.3)" : "rgba(0, 0, 0, 0.26)",
                        },
                      }}
                    >
                      {nicknameCheckLoading ? <CircularProgress size={20} /> : "중복확인"}
                    </Button>
                  </Box>
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
                    error={isPasswordMismatch}
                    // helperText={isPasswordMismatch ? "비밀번호가 일치하지 않습니다" : ""}
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        backgroundColor: theme.palette.mode === "dark" ? "rgba(26, 26, 46, 0.8)" : "#f8f9fa",
                        "& fieldset": {
                          borderColor: isPasswordMismatch
                            ? "#f44336"
                            : theme.palette.mode === "dark"
                              ? "rgba(139, 92, 246, 0.5)"
                              : "rgba(0, 0, 0, 0.2)",
                        },
                        "&:hover fieldset": {
                          borderColor: isPasswordMismatch
                            ? "#f44336"
                            : theme.palette.mode === "dark"
                              ? "rgba(139, 92, 246, 0.8)"
                              : "#1976d2",
                        },
                        "&.Mui-focused fieldset": {
                          borderColor: isPasswordMismatch
                            ? "#f44336"
                            : theme.palette.mode === "dark"
                              ? "rgba(139, 92, 246, 1)"
                              : "#1976d2",
                        },
                        "&.Mui-error fieldset": {
                          borderColor: "#f44336",
                        },
                      },
                      "& .MuiInputLabel-root": {
                        color: isPasswordMismatch
                          ? "#f44336"
                          : theme.palette.mode === "dark"
                            ? "rgba(255, 255, 255, 0.7)"
                            : "rgba(0, 0, 0, 0.6)",
                        "&.Mui-focused": {
                          color: isPasswordMismatch
                            ? "#f44336"
                            : theme.palette.mode === "dark"
                              ? "rgba(139, 92, 246, 1)"
                              : "#1976d2",
                        },
                        "&.Mui-error": {
                          color: "#f44336",
                        },
                      },
                      "& .MuiOutlinedInput-input": {
                        color: theme.palette.mode === "dark" ? "#ffffff" : "#1a1a2e",
                      },
                      "& .MuiFormHelperText-root": {
                        color: "#f44336",
                        fontWeight: "500",
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
                    error={isPasswordMismatch}
                    // helperText={isPasswordMismatch ? "비밀번호가 일치하지 않습니다" : ""}
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        backgroundColor: theme.palette.mode === "dark" ? "rgba(26, 26, 46, 0.8)" : "#f8f9fa",
                        "& fieldset": {
                          borderColor: isPasswordMismatch
                            ? "#f44336"
                            : theme.palette.mode === "dark"
                              ? "rgba(139, 92, 246, 0.5)"
                              : "rgba(0, 0, 0, 0.2)",
                        },
                        "&:hover fieldset": {
                          borderColor: isPasswordMismatch
                            ? "#f44336"
                            : theme.palette.mode === "dark"
                              ? "rgba(139, 92, 246, 0.8)"
                              : "#1976d2",
                        },
                        "&.Mui-focused fieldset": {
                          borderColor: isPasswordMismatch
                            ? "#f44336"
                            : theme.palette.mode === "dark"
                              ? "rgba(139, 92, 246, 1)"
                              : "#1976d2",
                        },
                        "&.Mui-error fieldset": {
                          borderColor: "#f44336",
                        },
                      },
                      "& .MuiInputLabel-root": {
                        color: isPasswordMismatch
                          ? "#f44336"
                          : theme.palette.mode === "dark"
                            ? "rgba(255, 255, 255, 0.7)"
                            : "rgba(0, 0, 0, 0.6)",
                        "&.Mui-focused": {
                          color: isPasswordMismatch
                            ? "#f44336"
                            : theme.palette.mode === "dark"
                              ? "rgba(139, 92, 246, 1)"
                              : "#1976d2",
                        },
                        "&.Mui-error": {
                          color: "#f44336",
                        },
                      },
                      "& .MuiOutlinedInput-input": {
                        color: theme.palette.mode === "dark" ? "#ffffff" : "#1a1a2e",
                      },
                      "& .MuiFormHelperText-root": {
                        color: "#f44336",
                        fontWeight: "500",
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
                          color: theme.palette.mode === "dark" ? "rgba(139, 92, 246, 0.7)" : "#1976d2",
                          "&.Mui-checked": {
                            color: theme.palette.mode === "dark" ? "rgba(139, 92, 246, 1)" : "#1976d2",
                          },
                        }}
                      />
                    }
                    label="회원가입 약관에 동의합니다."
                    sx={{
                      "& .MuiFormControlLabel-label": {
                        color: theme.palette.mode === "dark" ? "rgba(255, 255, 255, 0.8)" : "rgba(0, 0, 0, 0.8)",
                        fontWeight: "500",
                      },
                    }}
                  />
                </Grid>
              </Grid>
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
                  mt: 1,
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
                  "&:disabled": {
                    background: theme.palette.mode === "dark" ? "rgba(139, 92, 246, 0.3)" : "rgba(25, 118, 210, 0.3)",
                    color: theme.palette.mode === "dark" ? "rgba(255, 255, 255, 0.3)" : "rgba(255, 255, 255, 0.7)",
                  },
                  boxShadow:
                    theme.palette.mode === "dark"
                      ? "0 0 20px rgba(139, 92, 246, 0.4)"
                      : "0 4px 12px rgba(25, 118, 210, 0.3)",
                  transition: "all 0.2s ease-in-out",
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
