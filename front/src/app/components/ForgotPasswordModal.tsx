"use client";
import { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  CircularProgress,
  useTheme,
  Stepper,
  Step,
  StepLabel,
} from "@mui/material";
import LockResetIcon from "@mui/icons-material/LockReset";
import EmailIcon from "@mui/icons-material/Email";
import PasswordIcon from "@mui/icons-material/Password";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import axios from "axios";
import { useMessage } from "@/app/store/messageStore";

interface ForgotPasswordModalProps {
  open: boolean;
  onClose: () => void;
}

/**
 * 🔑 비밀번호 찾기 모달 컴포넌트 (간단한 버전)
 *
 * @description
 * 1단계: 이메일 입력 및 확인
 * 2단계: 새 비밀번호 입력 및 변경
 *
 * @features
 * - 2단계 프로세스
 * - 이메일 존재 여부 확인
 * - 새 비밀번호 설정
 * - 다크모드 지원
 *
 * @author Study-Board Team
 * @version 2.0.0
 */
const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({ open, onClose }) => {
  const [activeStep, setActiveStep] = useState(0);
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { showMessage } = useMessage((state) => state);
  const theme = useTheme();

  const steps = ["이메일 확인", "새 비밀번호 설정"];

  // 📧 이메일 유효성 검증
  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // 🔄 모달 초기화
  const resetModal = () => {
    setActiveStep(0);
    setEmail("");
    setNewPassword("");
    setConfirmPassword("");
    setError("");
    setLoading(false);
  };

  // ❌ 모달 닫기
  const handleClose = () => {
    resetModal();
    onClose();
  };

  // 📧 1단계: 이메일 확인
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      setError("이메일을 입력해주세요.");
      return;
    }

    if (!isValidEmail(email)) {
      setError("올바른 이메일 형식이 아닙니다.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/forgot-password`,
        { user_email: email },
        { withCredentials: true }
      );

      if (response.data.success && response.data.emailExists) {
        setActiveStep(1);
        showMessage("이메일을 확인했습니다. 새 비밀번호를 설정해주세요.", "success");
      } else {
        setError(response.data.message || "등록되지 않은 이메일입니다.");
      }
    } catch (error: any) {
      console.error("이메일 확인 실패:", error);
      setError(error.response?.data?.message || "이메일 확인 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  // 🔒 2단계: 비밀번호 재설정
  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newPassword.trim()) {
      setError("새 비밀번호를 입력해주세요.");
      return;
    }

    if (newPassword.length < 6) {
      setError("비밀번호는 최소 6자 이상이어야 합니다.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("비밀번호가 일치하지 않습니다.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/reset-password`,
        {
          user_email: email,
          new_password: newPassword,
        },
        { withCredentials: true }
      );

      if (response.data.success) {
        setActiveStep(2);
        showMessage("비밀번호가 성공적으로 변경되었습니다.", "success");
      } else {
        setError(response.data.message || "비밀번호 변경에 실패했습니다.");
      }
    } catch (error: any) {
      console.error("비밀번호 재설정 실패:", error);
      setError(error.response?.data?.message || "비밀번호 변경 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return (
          <Box component="form" onSubmit={handleEmailSubmit} noValidate>
            <TextField
              autoFocus
              margin="dense"
              id="email"
              label="이메일 주소"
              type="email"
              fullWidth
              variant="outlined"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              error={!!error}
              helperText={error}
              InputProps={{
                startAdornment: (
                  <EmailIcon
                    sx={{
                      color: theme.palette.mode === "dark" ? "rgba(139, 92, 246, 0.7)" : "#666",
                      mr: 1,
                    }}
                  />
                ),
              }}
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
            <Box sx={{ mt: 2 }}>
              <Alert
                severity="info"
                sx={{
                  backgroundColor:
                    theme.palette.mode === "dark" ? "rgba(59, 130, 246, 0.1)" : "rgba(59, 130, 246, 0.05)",
                  color: theme.palette.mode === "dark" ? "#ffffff" : "#1a1a2e",
                  "& .MuiAlert-icon": {
                    color: theme.palette.mode === "dark" ? "#60a5fa" : "#1976d2",
                  },
                }}
              >
                등록된 이메일 주소를 입력하면 계정을 확인한 후 새 비밀번호를 설정할 수 있습니다.
              </Alert>
            </Box>
          </Box>
        );

      case 1:
        return (
          <Box component="form" onSubmit={handlePasswordReset} noValidate>
            <TextField
              autoFocus
              margin="dense"
              id="newPassword"
              label="새 비밀번호"
              type="password"
              fullWidth
              variant="outlined"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              disabled={loading}
              InputProps={{
                startAdornment: (
                  <PasswordIcon
                    sx={{
                      color: theme.palette.mode === "dark" ? "rgba(139, 92, 246, 0.7)" : "#666",
                      mr: 1,
                    }}
                  />
                ),
              }}
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
              margin="dense"
              id="confirmPassword"
              label="새 비밀번호 확인"
              type="password"
              fullWidth
              variant="outlined"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={loading}
              error={!!error}
              helperText={error}
              InputProps={{
                startAdornment: (
                  <PasswordIcon
                    sx={{
                      color: theme.palette.mode === "dark" ? "rgba(139, 92, 246, 0.7)" : "#666",
                      mr: 1,
                    }}
                  />
                ),
              }}
              sx={{
                mt: 2,
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

            <Box sx={{ mt: 2 }}>
              <Alert
                severity="warning"
                sx={{
                  backgroundColor:
                    theme.palette.mode === "dark" ? "rgba(245, 158, 11, 0.1)" : "rgba(245, 158, 11, 0.05)",
                  color: theme.palette.mode === "dark" ? "#ffffff" : "#1a1a2e",
                  "& .MuiAlert-icon": {
                    color: theme.palette.mode === "dark" ? "#fbbf24" : "#f59e0b",
                  },
                }}
              >
                비밀번호는 최소 6자 이상이어야 하며, 안전을 위해 영문, 숫자, 특수문자를 조합하는 것을 권장합니다.
              </Alert>
            </Box>
          </Box>
        );

      case 2:
        return (
          <Box sx={{ textAlign: "center", py: 2 }}>
            <Box
              sx={{
                width: 80,
                height: 80,
                borderRadius: "50%",
                backgroundColor: theme.palette.mode === "dark" ? "rgba(34, 197, 94, 0.2)" : "rgba(34, 197, 94, 0.1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 16px",
              }}
            >
              <CheckCircleIcon
                sx={{
                  fontSize: 40,
                  color: theme.palette.mode === "dark" ? "#22c55e" : "#16a34a",
                }}
              />
            </Box>

            <Typography variant="h6" gutterBottom sx={{ color: theme.palette.mode === "dark" ? "#ffffff" : "#1a1a2e" }}>
              비밀번호 변경 완료!
            </Typography>

            <Typography
              variant="body1"
              color="text.secondary"
              sx={{
                color: theme.palette.mode === "dark" ? "rgba(255, 255, 255, 0.8)" : "rgba(0, 0, 0, 0.7)",
                mb: 2,
              }}
            >
              <strong>{email}</strong> 계정의 비밀번호가 성공적으로 변경되었습니다.
            </Typography>

            <Alert
              severity="success"
              sx={{
                backgroundColor: theme.palette.mode === "dark" ? "rgba(34, 197, 94, 0.1)" : "rgba(34, 197, 94, 0.05)",
                color: theme.palette.mode === "dark" ? "#ffffff" : "#1a1a2e",
                "& .MuiAlert-icon": {
                  color: theme.palette.mode === "dark" ? "#22c55e" : "#16a34a",
                },
              }}
            >
              이제 새로운 비밀번호로 로그인하실 수 있습니다.
            </Alert>
          </Box>
        );

      default:
        return null;
    }
  };

  const renderActionButtons = () => {
    switch (activeStep) {
      case 0:
        return (
          <>
            <Button
              onClick={handleClose}
              disabled={loading}
              sx={{
                color: theme.palette.mode === "dark" ? "rgba(255, 255, 255, 0.7)" : "rgba(0, 0, 0, 0.6)",
                "&:hover": {
                  backgroundColor: theme.palette.mode === "dark" ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.05)",
                },
              }}
            >
              취소
            </Button>
            <Button
              onClick={handleEmailSubmit}
              disabled={loading || !email.trim()}
              variant="contained"
              startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <EmailIcon />}
              sx={{
                minWidth: 120,
                background:
                  theme.palette.mode === "dark"
                    ? "linear-gradient(135deg, rgba(139, 92, 246, 0.8), rgba(6, 182, 212, 0.8))"
                    : "linear-gradient(135deg, #1976d2, #42a5f5)",
                "&:hover": {
                  background:
                    theme.palette.mode === "dark"
                      ? "linear-gradient(135deg, rgba(139, 92, 246, 1), rgba(6, 182, 212, 1))"
                      : "linear-gradient(135deg, #1565c0, #1976d2)",
                },
                "&:disabled": {
                  background: theme.palette.mode === "dark" ? "rgba(139, 92, 246, 0.3)" : "rgba(0, 0, 0, 0.12)",
                },
              }}
            >
              {loading ? "확인중..." : "이메일 확인"}
            </Button>
          </>
        );

      case 1:
        return (
          <>
            <Button
              onClick={() => setActiveStep(0)}
              disabled={loading}
              sx={{
                color: theme.palette.mode === "dark" ? "rgba(255, 255, 255, 0.7)" : "rgba(0, 0, 0, 0.6)",
                "&:hover": {
                  backgroundColor: theme.palette.mode === "dark" ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.05)",
                },
              }}
            >
              이전
            </Button>
            <Button
              onClick={handlePasswordReset}
              disabled={loading || !newPassword.trim() || !confirmPassword.trim()}
              variant="contained"
              startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <LockResetIcon />}
              sx={{
                minWidth: 120,
                background:
                  theme.palette.mode === "dark"
                    ? "linear-gradient(135deg, rgba(139, 92, 246, 0.8), rgba(6, 182, 212, 0.8))"
                    : "linear-gradient(135deg, #1976d2, #42a5f5)",
                "&:hover": {
                  background:
                    theme.palette.mode === "dark"
                      ? "linear-gradient(135deg, rgba(139, 92, 246, 1), rgba(6, 182, 212, 1))"
                      : "linear-gradient(135deg, #1565c0, #1976d2)",
                },
                "&:disabled": {
                  background: theme.palette.mode === "dark" ? "rgba(139, 92, 246, 0.3)" : "rgba(0, 0, 0, 0.12)",
                },
              }}
            >
              {loading ? "변경중..." : "비밀번호 변경"}
            </Button>
          </>
        );

      case 2:
        return (
          <Button
            onClick={handleClose}
            variant="contained"
            fullWidth
            sx={{
              background:
                theme.palette.mode === "dark"
                  ? "linear-gradient(135deg, rgba(34, 197, 94, 0.8), rgba(16, 185, 129, 0.8))"
                  : "linear-gradient(135deg, #16a34a, #22c55e)",
              "&:hover": {
                background:
                  theme.palette.mode === "dark"
                    ? "linear-gradient(135deg, rgba(34, 197, 94, 1), rgba(16, 185, 129, 1))"
                    : "linear-gradient(135deg, #15803d, #16a34a)",
              },
            }}
          >
            완료
          </Button>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog
      open={open}
      onClose={activeStep === 2 ? handleClose : undefined}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          backgroundColor: theme.palette.mode === "dark" ? "rgba(26, 26, 46, 0.98)" : "#ffffff",
          border: theme.palette.mode === "dark" ? "1px solid rgba(139, 92, 246, 0.4)" : "1px solid rgba(0, 0, 0, 0.1)",
          boxShadow:
            theme.palette.mode === "dark" ? "0px 8px 32px rgba(139, 92, 246, 0.3)" : "0px 8px 24px rgba(0, 0, 0, 0.15)",
        },
      }}
    >
      <DialogTitle
        sx={{
          textAlign: "center",
          pb: 1,
          color: theme.palette.mode === "dark" ? "#ffffff" : "#1a1a2e",
          borderBottom:
            theme.palette.mode === "dark" ? "1px solid rgba(139, 92, 246, 0.2)" : "1px solid rgba(0, 0, 0, 0.1)",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 1, mb: 2 }}>
          <LockResetIcon
            sx={{
              color: theme.palette.mode === "dark" ? "#8b5cf6" : "#1976d2",
              fontSize: 28,
            }}
          />
          <Typography variant="h5" component="span" fontWeight="bold">
            비밀번호 찾기
          </Typography>
        </Box>

        {activeStep < 2 && (
          <Stepper activeStep={activeStep} alternativeLabel sx={{ mt: 1 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel
                  sx={{
                    "& .MuiStepLabel-label": {
                      color: theme.palette.mode === "dark" ? "rgba(255, 255, 255, 0.7)" : "rgba(0, 0, 0, 0.6)",
                      fontSize: "0.875rem",
                    },
                    "& .MuiStepLabel-label.Mui-active": {
                      color: theme.palette.mode === "dark" ? "#8b5cf6" : "#1976d2",
                      fontWeight: "bold",
                    },
                    "& .MuiStepLabel-label.Mui-completed": {
                      color: theme.palette.mode === "dark" ? "#22c55e" : "#16a34a",
                    },
                  }}
                >
                  {label}
                </StepLabel>
              </Step>
            ))}
          </Stepper>
        )}
      </DialogTitle>

      <DialogContent sx={{ pt: 3, pb: 2 }}>{renderStepContent()}</DialogContent>

      <DialogActions sx={{ px: 3, pb: 3, pt: 1 }}>{renderActionButtons()}</DialogActions>
    </Dialog>
  );
};

export default ForgotPasswordModal;
