"use client";
import React, { useState, useEffect } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  useTheme,
  InputAdornment,
  IconButton,
  Alert,
} from "@mui/material";
import { Lock as LockIcon, Visibility, VisibilityOff, VpnKey as KeyIcon } from "@mui/icons-material";
import Loading from "../common/Loading";

interface SitePasswordGateProps {
  children: React.ReactNode;
}

//! - 역할: 전체 사이트(또는 라우트)에 간단한 접근 코드를 걸어 비공개로 유지할 때 사용하는
//*   클라이언트 사이드 게이트 컴포넌트입니다. 인증되면 하위 children을 렌더링합니다.
// - 동작: 환경변수(NEXT_PUBLIC_SITE_PASSWORD)와 입력값을 클라이언트에서 비교하고,
//   성공 시 로컬스토리지(`siteAccess`, `siteAccessTime`)에 인증 정보를 저장해 재접근을 허용합니다.
//* - TTL: 현재 코드는 인증 후 3일(변수명은 sevenDays지만 값은 3일) 동안 유효하도록 처리합니다.
// - 보안 주의: 클라이언트에 노출되는 환경변수(NEXT_PUBLIC_*)로 비밀번호를 넣으면 누구나
//   빌드 산출물에서 확인 가능하므로 민감한 비밀번호는 서버에서 검증하거나 세션/쿠키 기반으로 처리하세요.
// - 개선 제안:
//   · 서버 사이드 라우트에서 검증 후 세션을 발급
//   · 서버에서 해시 비교 및 요청률 제한 적용
//   · 민감값은 NEXT_PUBLIC_ 접두어 없이 서버 환경변수로 관리

const SitePasswordGate: React.FC<SitePasswordGateProps> = ({ children }) => {
  const theme = useTheme();
  const [password, setPassword] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // 사이트 비밀번호 (실제로는 환경변수로 관리하는 것이 좋습니다)
  const SITE_PASSWORD = process.env.NEXT_PUBLIC_SITE_PASSWORD; // 이 비밀번호를 변경하세요

  useEffect(() => {
    // 페이지 로드 시 로컬스토리지에서 인증 상태 확인
    const savedAuth = localStorage.getItem("siteAccess");
    const authTime = localStorage.getItem("siteAccessTime");

    if (savedAuth === "true" && authTime) {
      // 3일간 유효
      const sevenDays = 3 * 24 * 60 * 60 * 1000;
      const isExpired = Date.now() - parseInt(authTime) > sevenDays;

      if (!isExpired) {
        setIsAuthenticated(true);
      } else {
        // 만료된 경우 로컬스토리지 정리
        localStorage.removeItem("siteAccess");
        localStorage.removeItem("siteAccessTime");
      }
    }
    setIsLoading(false);
  }, []);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!password.trim()) {
      setError("비밀번호를 입력해주세요.");
      return;
    }

    if (password === SITE_PASSWORD) {
      setIsAuthenticated(true);
      setError("");
      // 로컬스토리지에 인증 정보 저장 (7일간 유효)
      localStorage.setItem("siteAccess", "true");
      localStorage.setItem("siteAccessTime", Date.now().toString());
    } else {
      setError("잘못된 비밀번호입니다. 사이트 관리자에게 문의하세요.");
      setPassword("");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSubmit();
    }
  };

  // 로딩 중
  if (isLoading) {
    return <Loading />;
  }

  // 인증됨 - 실제 사이트 컨텐츠 표시
  if (isAuthenticated) {
    return <>{children}</>;
  }

  // 인증 안됨 - 비밀번호 입력 화면
  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background:
          theme.palette.mode === "dark"
            ? "linear-gradient(135deg, rgba(26, 26, 46, 0.95), rgba(16, 16, 32, 0.98))"
            : "linear-gradient(135deg, #f8f9fa, #e9ecef)",
        p: 2,
      }}
    >
      <Card
        sx={{
          maxWidth: 400,
          width: "100%",
          borderRadius: "16px",
          background:
            theme.palette.mode === "dark"
              ? "linear-gradient(135deg, rgba(26, 26, 46, 0.95) 0%, rgba(45, 48, 71, 0.95) 100%)"
              : "linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)",
          border: theme.palette.mode === "dark" ? "1px solid rgba(139, 92, 246, 0.2)" : "1px solid rgba(0, 0, 0, 0.08)",
          boxShadow:
            theme.palette.mode === "dark" ? "0 8px 32px rgba(139, 92, 246, 0.15)" : "0 8px 24px rgba(0, 0, 0, 0.08)",
        }}
      >
        <CardContent sx={{ p: 4 }}>
          {/* 헤더 */}
          <Box sx={{ textAlign: "center", mb: 4 }}>
            <Box sx={{ mb: 2 }}>
              <LockIcon
                sx={{
                  fontSize: 48,
                  color: theme.palette.mode === "dark" ? "#a78bfa" : "#8b5cf6",
                }}
              />
            </Box>
            <Typography
              variant="h4"
              sx={{
                fontWeight: 700,
                mb: 1,
                background:
                  theme.palette.mode === "dark"
                    ? "linear-gradient(135deg, #a78bfa, #22d3ee)"
                    : "linear-gradient(135deg, #8b5cf6, #06b6d4)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Study Board
            </Typography>
            <Typography variant="body1" color="text.secondary">
              사이트 접근 코드를 입력하세요
            </Typography>
          </Box>

          {/* 폼 */}
          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth
              type={showPassword ? "text" : "password"}
              label="접근 코드"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError(""); // 입력 시 에러 메시지 제거
              }}
              onKeyPress={handleKeyPress}
              variant="outlined"
              sx={{ mb: 2 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <KeyIcon color="action" />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            <Button
              fullWidth
              variant="contained"
              type="submit"
              sx={{
                py: 1.5,
                borderRadius: "12px",
                background: "linear-gradient(135deg, #8b5cf6, #06b6d4)",
                fontWeight: 600,
                fontSize: "1rem",
                "&:hover": {
                  background: "linear-gradient(135deg, #7c3aed, #0891b2)",
                },
              }}
            >
              입장하기
            </Button>
          </form>

          {/* 하단 텍스트 */}
          <Box sx={{ mt: 3, textAlign: "center" }}>
            <Typography variant="caption" color="text.secondary">
              접근 코드가 없으시다면 관리자에게 문의하세요
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default SitePasswordGate;
