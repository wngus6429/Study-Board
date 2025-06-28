import { styled } from "@mui/material/styles";
import { Box, Card, Button, Typography } from "@mui/material";
import {
  colors,
  shadows,
  getCardStyle,
  getGradientButtonStyle,
  getTextGradientStyle,
  getMetallicCardStyle,
  getMetallicAvatarStyle,
  getMetallicTextStyle,
} from "./styles";

// 메인 컨테이너
export const MainContainer = styled(Box)(({ theme }) => ({
  minHeight: "100vh",
  background: theme.palette.mode === "dark" ? colors.gradient.background.dark : colors.gradient.background.light,
}));

// 채널 정보 카드 (메탈릭 스타일)
export const ChannelInfoCard = styled(Card)(({ theme }) => ({
  ...getMetallicCardStyle(theme),
  marginBottom: 0,
}));

// 그라디언트 버튼
export const GradientButton = styled(Button)<{
  variant?: "primary" | "success" | "error" | "warning";
  size?: "small" | "medium" | "large";
}>(({ theme, variant = "primary", size = "medium" }) => ({
  ...getGradientButtonStyle(theme, variant as "primary" | "success" | "error" | "warning"),
  height: size === "large" ? "95px" : size === "medium" ? "60px" : "35px",
  minWidth: size === "large" ? "130px" : size === "medium" ? "110px" : "80px",
  fontSize: size === "large" ? "1rem" : size === "medium" ? "0.9rem" : "0.85rem",
}));

// 채팅 버튼 (특별한 스타일)
export const ChatButton = styled(Button)<{ active?: boolean }>(({ theme, active }) => {
  const variant = active ? "error" : "success";
  return {
    ...getGradientButtonStyle(theme, variant),
    height: "95px",
    minWidth: "130px",
    fontSize: "0.95rem",
    boxShadow: active
      ? theme.palette.mode === "dark"
        ? "0 8px 32px rgba(239, 68, 68, 0.4), 0 0 20px rgba(239, 68, 68, 0.3)"
        : "0 8px 28px rgba(239, 68, 68, 0.3), 0 0 16px rgba(239, 68, 68, 0.2)"
      : theme.palette.mode === "dark"
        ? "0 8px 32px rgba(34, 197, 94, 0.4), 0 0 20px rgba(34, 197, 94, 0.3)"
        : "0 8px 28px rgba(34, 197, 94, 0.3), 0 0 16px rgba(34, 197, 94, 0.2)",
    "&:hover": {
      background: active
        ? "linear-gradient(135deg, #dc2626, #b91c1c, #991b1b)"
        : "linear-gradient(135deg, #16a34a, #15803d, #166534)",
      boxShadow: active
        ? theme.palette.mode === "dark"
          ? "0 12px 40px rgba(239, 68, 68, 0.5), 0 0 25px rgba(239, 68, 68, 0.4)"
          : "0 12px 35px rgba(239, 68, 68, 0.4), 0 0 20px rgba(239, 68, 68, 0.3)"
        : theme.palette.mode === "dark"
          ? "0 12px 40px rgba(34, 197, 94, 0.5), 0 0 25px rgba(34, 197, 94, 0.4)"
          : "0 12px 35px rgba(34, 197, 94, 0.4), 0 0 20px rgba(34, 197, 94, 0.3)",
    },
  };
});

// 구독 버튼
export const SubscribeButton = styled(Button)<{ subscribed?: boolean }>(({ theme, subscribed }) => {
  const variant = subscribed ? "error" : "primary";
  return {
    ...getGradientButtonStyle(theme, variant),
    height: "60px",
    minWidth: "150px",
    fontSize: "1rem",
    border: subscribed
      ? theme.palette.mode === "dark"
        ? "2px solid rgba(239, 68, 68, 0.6)"
        : "2px solid rgba(239, 68, 68, 0.4)"
      : theme.palette.mode === "dark"
        ? "2px solid rgba(139, 92, 246, 0.6)"
        : "2px solid rgba(139, 92, 246, 0.4)",
    "&:hover": {
      background: subscribed
        ? "linear-gradient(135deg, #dc2626, #b91c1c, #991b1b)"
        : "linear-gradient(135deg, #7c3aed, #6366f1, #4f46e5)",
    },
  };
});

// 그라디언트 텍스트
export const GradientText = styled(Typography)(({ theme }) => ({
  ...getTextGradientStyle(theme),
}));

// 메탈릭 아바타
export const MetallicAvatar = styled(Box)(({ theme }) => ({
  ...getMetallicAvatarStyle(theme),
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  borderRadius: "50%",
}));

// 메탈릭 제목 텍스트
export const MetallicTitle = styled(Typography)(({ theme }) => ({
  ...getMetallicTextStyle(theme, "title"),
}));

// 메탈릭 서브타이틀 텍스트
export const MetallicSubtitle = styled(Typography)(({ theme }) => ({
  ...getMetallicTextStyle(theme, "subtitle"),
}));

// 탭 컨테이너
export const TabsContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  width: "100%",
  borderRadius: theme.spacing(2),
  boxShadow: theme.palette.mode === "dark" ? shadows.card.dark : shadows.card.light,
  overflow: "hidden",
  backgroundColor: theme.palette.mode === "dark" ? "rgba(26, 26, 46, 0.95)" : theme.palette.background.paper,
  border: theme.palette.mode === "dark" ? "1px solid rgba(139, 92, 246, 0.3)" : "none",
}));

// 버튼 그룹 컨테이너
export const ButtonGroup = styled(Box)({
  display: "flex",
  flexDirection: "column",
  gap: "8px",
});

// 로딩 컨테이너
export const LoadingContainer = styled(Box)(({ theme }) => ({
  minHeight: "100vh",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  background: theme.palette.mode === "dark" ? colors.gradient.background.dark : colors.gradient.background.light,
}));

// 공지사항 카드
export const NoticeCard = styled(Card)(({ theme }) => ({
  borderRadius: "16px",
  background: theme.palette.mode === "dark" ? "rgba(30, 32, 38, 0.98)" : "rgba(255, 255, 255, 0.98)",
  backdropFilter: "blur(12px)",
  boxShadow:
    theme.palette.mode === "dark"
      ? "0 20px 40px rgba(0, 0, 0, 0.5), 0 0 20px rgba(139, 92, 246, 0.2)"
      : "0 20px 40px rgba(0, 0, 0, 0.15), 0 0 20px rgba(233, 64, 87, 0.1)",
  border: theme.palette.mode === "dark" ? "1px solid rgba(255, 255, 255, 0.1)" : "1px solid rgba(0, 0, 0, 0.05)",
  position: "relative",
  overflow: "hidden",
  "&::after": {
    content: '""',
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: "4px",
    background: "linear-gradient(90deg, #8a2387, #e94057, #f27121)",
  },
}));

// 공지사항 아이템
export const NoticeItem = styled(Box)(({ theme }) => ({
  borderRadius: "10px",
  padding: theme.spacing(2),
  marginBottom: theme.spacing(1),
  backgroundColor: theme.palette.mode === "dark" ? "rgba(45, 48, 56, 0.6)" : "rgba(249, 250, 251, 0.8)",
  border: theme.palette.mode === "dark" ? "1px solid rgba(255, 255, 255, 0.05)" : "1px solid rgba(0, 0, 0, 0.05)",
  transition: "all 0.3s ease",
  cursor: "pointer",
  "&:hover": {
    backgroundColor: theme.palette.mode === "dark" ? "rgba(55, 58, 66, 0.8)" : "rgba(233, 64, 87, 0.05)",
    transform: "translateX(8px)",
    boxShadow: theme.palette.mode === "dark" ? "0 4px 15px rgba(0, 0, 0, 0.3)" : "0 4px 15px rgba(0, 0, 0, 0.1)",
    borderColor: theme.palette.mode === "dark" ? "rgba(139, 92, 246, 0.3)" : "rgba(233, 64, 87, 0.2)",
  },
  "&:last-child": {
    marginBottom: 0,
  },
}));
