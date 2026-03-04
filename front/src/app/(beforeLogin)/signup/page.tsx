"use client";
import React, { ReactNode, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signupSchema, SignupSchema } from "@/schemas/auth";
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
import axios from "axios";
import { useRouter } from "next/navigation";
import { signIn, useSession } from "next-auth/react";
import { useMessage } from "@/app/store/messageStore";

// 회원가입 화면
const SignupPage = (): ReactNode => {
  const router = useRouter();
  const theme = useTheme();
  const { update } = useSession();
  const { showMessage } = useMessage((state) => state);

  const {
    register,
    handleSubmit,
    formState: { errors },
    getValues,
    trigger,
    watch,
  } = useForm<SignupSchema>({
    resolver: zodResolver(signupSchema),
    mode: "onChange",
    defaultValues: {
      email: "",
      nickname: "",
      password: "",
      rePassword: "",
      terms: false,
    },
  });

  const termsChecked = watch("terms");

  // 닉네임 중복 확인 관련 상태
  const [nicknameChecked, setNicknameChecked] = useState<boolean>(false);
  const [nicknameAvailable, setNicknameAvailable] = useState<boolean>(false);
  const [nicknameCheckLoading, setNicknameCheckLoading] = useState<boolean>(false);
  const [nicknameCheckMessage, setNicknameCheckMessage] = useState<string>("");
  const [apiError, setApiError] = useState<string>("");

  // 닉네임 중복 확인
  const handleNicknameCheck = async (): Promise<void> => {
    const nickname = getValues("nickname");

    // Zod 유효성 검사 먼저 실행
    const isFormatValid = await trigger("nickname");
    if (!isFormatValid) return;

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
    } catch (err: unknown) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const error = err as any;
      console.error("닉네임 중복 확인 실패:", error);
      setNicknameAvailable(false);
      setNicknameChecked(false);
      setNicknameCheckMessage("중복 확인 중 오류가 발생했습니다.");
      showMessage("중복 확인 중 오류가 발생했습니다.", "error");
    } finally {
      setNicknameCheckLoading(false);
    }
  };

  const nicknameRegister = register("nickname");

  // form 전송
  const onSubmit = async (data: SignupSchema): Promise<void> => {
    if (!nicknameChecked || !nicknameAvailable) {
      showMessage("닉네임 중복 확인을 해주세요.", "warning");
      return;
    }

    const { email, password, nickname } = data;
    const requestData = { user_email: email, password, nickname };

    await axios
      .post(`${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/signup`, requestData, { withCredentials: true })
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
            setApiError("유효하지 않은 요청입니다.");
          }
        }
      })
      .catch((err: unknown) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const error = err as any;
        console.log("어라", error.response?.data?.data);
        setApiError(error.response?.data?.data || "회원가입 중 오류가 발생했습니다.");
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
          <Box component="form" noValidate sx={{ mt: 1 }} onSubmit={handleSubmit(onSubmit)}>
            <FormControl component="fieldset" variant="standard" fullWidth>
              <Grid container spacing={2}>
                <Grid size={12}>
                  <TextField
                    required
                    autoFocus
                    fullWidth
                    type="email"
                    id="email"
                    label="이메일 주소"
                    {...register("email")}
                    error={!!errors.email}
                    helperText={errors.email?.message}
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
                      fullWidth
                      type="text"
                      id="nickname"
                      label="닉네임"
                      {...nicknameRegister}
                      onChange={(e) => {
                        nicknameRegister.onChange(e);
                        setNicknameChecked(false);
                        setNicknameAvailable(false);
                        setNicknameCheckMessage("");
                      }}
                      error={!!errors.nickname || (nicknameChecked && !nicknameAvailable)}
                      helperText={errors.nickname?.message || nicknameCheckMessage}
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
                      disabled={nicknameCheckLoading}
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
                    label="비밀번호 (숫자+영문자+특수문자 8자리 이상)"
                    {...register("password")}
                    error={!!errors.password}
                    helperText={errors.password?.message}
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        backgroundColor: theme.palette.mode === "dark" ? "rgba(26, 26, 46, 0.8)" : "#f8f9fa",
                        "& fieldset": {
                          borderColor: !!errors.password
                            ? "#f44336"
                            : theme.palette.mode === "dark"
                              ? "rgba(139, 92, 246, 0.5)"
                              : "rgba(0, 0, 0, 0.2)",
                        },
                        "&:hover fieldset": {
                          borderColor: !!errors.password
                            ? "#f44336"
                            : theme.palette.mode === "dark"
                              ? "rgba(139, 92, 246, 0.8)"
                              : "#1976d2",
                        },
                        "&.Mui-focused fieldset": {
                          borderColor: !!errors.password
                            ? "#f44336"
                            : theme.palette.mode === "dark"
                              ? "rgba(139, 92, 246, 1)"
                              : "#1976d2",
                        },
                      },
                      "& .MuiInputLabel-root": {
                        color: !!errors.password
                          ? "#f44336"
                          : theme.palette.mode === "dark"
                            ? "rgba(255, 255, 255, 0.7)"
                            : "rgba(0, 0, 0, 0.6)",
                        "&.Mui-focused": {
                          color: !!errors.password
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
                    label="비밀번호 재입력"
                    {...register("rePassword")}
                    error={!!errors.rePassword}
                    helperText={errors.rePassword?.message}
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        backgroundColor: theme.palette.mode === "dark" ? "rgba(26, 26, 46, 0.8)" : "#f8f9fa",
                        "& fieldset": {
                          borderColor: !!errors.rePassword
                            ? "#f44336"
                            : theme.palette.mode === "dark"
                              ? "rgba(139, 92, 246, 0.5)"
                              : "rgba(0, 0, 0, 0.2)",
                        },
                        "&:hover fieldset": {
                          borderColor: !!errors.rePassword
                            ? "#f44336"
                            : theme.palette.mode === "dark"
                              ? "rgba(139, 92, 246, 0.8)"
                              : "#1976d2",
                        },
                        "&.Mui-focused fieldset": {
                          borderColor: !!errors.rePassword
                            ? "#f44336"
                            : theme.palette.mode === "dark"
                              ? "rgba(139, 92, 246, 1)"
                              : "#1976d2",
                        },
                      },
                      "& .MuiInputLabel-root": {
                        color: !!errors.rePassword
                          ? "#f44336"
                          : theme.palette.mode === "dark"
                            ? "rgba(255, 255, 255, 0.7)"
                            : "rgba(0, 0, 0, 0.6)",
                        "&.Mui-focused": {
                          color: !!errors.rePassword
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
                        {...register("terms")}
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
                        color:
                          !!errors.terms
                            ? "#f44336"
                            : theme.palette.mode === "dark"
                              ? "rgba(255, 255, 255, 0.8)"
                              : "rgba(0, 0, 0, 0.8)",
                        fontWeight: "500",
                      },
                    }}
                  />
                  {errors.terms && (
                    <Typography variant="caption" color="error" sx={{ ml: 2, display: "block" }}>
                      {errors.terms.message}
                    </Typography>
                  )}
                </Grid>
              </Grid>
              {apiError && (
                <Alert severity="error" sx={{ mt: 2 }}>
                  {apiError}
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
                disabled={!termsChecked}
                size="large"
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
