import { Theme } from "@mui/material/styles";

// 색상 팔레트
export const colors = {
  primary: {
    light: "#8b5cf6",
    dark: "#a78bfa",
  },
  secondary: {
    light: "#06b6d4",
    dark: "#22d3ee",
  },
  success: {
    light: "#10b981",
    dark: "#34d399",
  },
  warning: {
    light: "#f59e0b",
    dark: "#fbbf24",
  },
  error: {
    light: "#ef4444",
    dark: "#f87171",
  },
  gradient: {
    primary: "linear-gradient(135deg, #8b5cf6, #06b6d4)",
    primaryDark: "linear-gradient(135deg, #a78bfa, #22d3ee)",
    success: "linear-gradient(135deg, #22c55e, #16a34a, #15803d)",
    error: "linear-gradient(135deg, #ef4444, #dc2626, #b91c1c)",
    warning: "linear-gradient(135deg, #f59e0b, #f97316, #ea580c)",
    background: {
      light: "linear-gradient(135deg, #f8f9fa, #e9ecef)",
      dark: "linear-gradient(135deg, rgba(26, 26, 46, 0.95), rgba(16, 16, 32, 0.98))",
    },
  },
};

// 박스 섀도우
export const shadows = {
  card: {
    light: "0 8px 24px rgba(0, 0, 0, 0.08)",
    dark: "0 8px 32px rgba(139, 92, 246, 0.15)",
  },
  button: {
    light: "0 6px 24px rgba(139, 92, 246, 0.3)",
    dark: "0 6px 28px rgba(139, 92, 246, 0.4)",
  },
  glow: {
    primary: "0 0 20px rgba(139, 92, 246, 0.4)",
    success: "0 0 20px rgba(34, 197, 94, 0.3)",
    error: "0 0 20px rgba(239, 68, 68, 0.3)",
  },
};

// 공통 스타일 함수들
export const getCardStyle = (theme: Theme) => ({
  borderRadius: "16px",
  background:
    theme.palette.mode === "dark"
      ? "linear-gradient(135deg, rgba(26, 26, 46, 0.95) 0%, rgba(45, 48, 71, 0.95) 100%)"
      : "linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)",
  border: theme.palette.mode === "dark" ? "1px solid rgba(139, 92, 246, 0.2)" : "1px solid rgba(0, 0, 0, 0.08)",
  boxShadow: theme.palette.mode === "dark" ? shadows.card.dark : shadows.card.light,
  position: "relative" as const,
  overflow: "hidden" as const,
});

export const getGradientButtonStyle = (
  theme: Theme,
  variant: "primary" | "success" | "error" | "warning" = "primary"
) => {
  const gradients = {
    primary: theme.palette.mode === "dark" ? colors.gradient.primaryDark : colors.gradient.primary,
    success: colors.gradient.success,
    error: colors.gradient.error,
    warning: colors.gradient.warning,
  };

  return {
    background: gradients[variant],
    color: "white",
    fontWeight: 700,
    borderRadius: "16px",
    position: "relative" as const,
    overflow: "hidden" as const,
    transition: "all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
    textTransform: "none" as const,
    "&::before": {
      content: '""',
      position: "absolute" as const,
      top: 0,
      left: "-100%",
      width: "100%",
      height: "100%",
      background: "linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent)",
      transition: "left 0.6s ease",
    },
    "&:hover": {
      transform: "translateY(-3px) scale(1.02)",
      boxShadow: theme.palette.mode === "dark" ? shadows.button.dark : shadows.button.light,
      "&::before": {
        left: "100%",
      },
    },
    "&:active": {
      transform: "translateY(-1px) scale(0.98)",
    },
  };
};

export const getTextGradientStyle = (theme: Theme) => ({
  fontWeight: 700,
  background: theme.palette.mode === "dark" ? colors.gradient.primaryDark : colors.gradient.primary,
  WebkitBackgroundClip: "text",
  WebkitTextFillColor: "transparent",
  backgroundClip: "text",
});

export const getGlassmorphismStyle = (theme: Theme) => ({
  background: theme.palette.mode === "dark" ? "rgba(30, 32, 38, 0.98)" : "rgba(255, 255, 255, 0.98)",
  backdropFilter: "blur(12px)",
  border: theme.palette.mode === "dark" ? "1px solid rgba(255, 255, 255, 0.1)" : "1px solid rgba(0, 0, 0, 0.05)",
});

export const getTabsStyle = (theme: Theme) => ({
  borderRadius: 2,
  boxShadow: theme.palette.mode === "dark" ? shadows.card.dark : shadows.card.light,
  overflow: "hidden" as const,
  bgcolor: theme.palette.mode === "dark" ? "rgba(26, 26, 46, 0.95)" : "background.paper",
  border: theme.palette.mode === "dark" ? "1px solid rgba(139, 92, 246, 0.3)" : "none",
});
