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
  metallic: {
    platinum: {
      light: "linear-gradient(135deg, #e6e6fa 0%, #d3d3d3 25%, #c0c0c0 50%, #b8860b 75%, #daa520 100%)",
      dark: "linear-gradient(135deg, #2a2a3a 0%, #3d3d5c 25%, #4a4a6a 50%, #5a5a7a 75%, #6a6a8a 100%)",
    },
    silver: {
      light: "linear-gradient(135deg, #f8f8ff 0%, #e6e6fa 25%, #c0c0c0 50%, #a9a9a9 75%, #808080 100%)",
      dark: "linear-gradient(135deg, #1a1a2e 0%, #16213e 25%, #0f3460 50%, #533483 75%, #e94560 100%)",
    },
    gold: {
      light: "linear-gradient(135deg, #fff8dc 0%, #ffd700 25%, #ffb347 50%, #daa520 75%, #b8860b 100%)",
      dark: "linear-gradient(135deg, #2c1810 0%, #4a2c17 25%, #8b4513 50%, #cd853f 75%, #daa520 100%)",
    },
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

// 메탈릭 카드 스타일
export const getMetallicCardStyle = (theme: Theme) => ({
  borderRadius: "20px",
  background: theme.palette.mode === "dark" ? colors.metallic.silver.dark : colors.metallic.silver.light,
  border: theme.palette.mode === "dark" ? "2px solid rgba(139, 92, 246, 0.3)" : "2px solid rgba(192, 192, 192, 0.4)",
  boxShadow:
    theme.palette.mode === "dark"
      ? "0 12px 40px rgba(0, 0, 0, 0.6), 0 0 30px rgba(139, 92, 246, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1)"
      : "0 12px 40px rgba(0, 0, 0, 0.15), 0 0 20px rgba(192, 192, 192, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.8)",
  position: "relative" as const,
  overflow: "hidden" as const,
  "&::before": {
    content: '""',
    position: "absolute" as const,
    top: 0,
    left: 0,
    right: 0,
    height: "4px",
    background:
      theme.palette.mode === "dark"
        ? "linear-gradient(90deg, #533483, #e94560, #f27121)"
        : "linear-gradient(90deg, #8a2387, #e94057, #f27121)",
  },
  "&::after": {
    content: '""',
    position: "absolute" as const,
    top: 0,
    left: "-100%",
    width: "100%",
    height: "100%",
    background: "linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent)",
    animation: "shimmer 3s infinite",
    pointerEvents: "none" as const,
  },
  "@keyframes shimmer": {
    "0%": { left: "-100%" },
    "100%": { left: "100%" },
  },
});

// 메탈릭 아바타 스타일
export const getMetallicAvatarStyle = (theme: Theme) => ({
  width: 70,
  height: 70,
  background: theme.palette.mode === "dark" ? colors.metallic.gold.dark : colors.metallic.gold.light,
  fontSize: "1.6rem",
  fontWeight: "bold",
  color: theme.palette.mode === "dark" ? "#ffffff" : "#2c1810",
  border: theme.palette.mode === "dark" ? "3px solid rgba(218, 165, 32, 0.5)" : "3px solid rgba(184, 134, 11, 0.6)",
  boxShadow:
    theme.palette.mode === "dark"
      ? "0 8px 32px rgba(218, 165, 32, 0.4), 0 0 20px rgba(255, 215, 0, 0.3), inset 0 2px 4px rgba(255, 255, 255, 0.1)"
      : "0 8px 32px rgba(184, 134, 11, 0.3), 0 0 16px rgba(255, 215, 0, 0.2), inset 0 2px 4px rgba(255, 255, 255, 0.8)",
  position: "relative" as const,
  "&::after": {
    content: '""',
    position: "absolute" as const,
    top: "10%",
    left: "10%",
    width: "30%",
    height: "30%",
    background: "rgba(255, 255, 255, 0.3)",
    borderRadius: "50%",
    filter: "blur(8px)",
  },
});

// 메탈릭 텍스트 스타일
export const getMetallicTextStyle = (theme: Theme, variant: "title" | "subtitle" = "title") => {
  if (variant === "title") {
    return {
      fontWeight: 800,
      background: theme.palette.mode === "dark" ? colors.metallic.platinum.dark : colors.metallic.platinum.light,
      WebkitBackgroundClip: "text",
      WebkitTextFillColor: "transparent",
      backgroundClip: "text",
      textShadow: theme.palette.mode === "dark" ? "0 2px 8px rgba(139, 92, 246, 0.3)" : "0 2px 8px rgba(0, 0, 0, 0.1)",
      filter: "drop-shadow(0 1px 2px rgba(0, 0, 0, 0.1))",
    };
  } else {
    return {
      fontWeight: 600,
      color: theme.palette.mode === "dark" ? "#cbd5e1" : "#64748b",
      textShadow: theme.palette.mode === "dark" ? "0 1px 3px rgba(0, 0, 0, 0.5)" : "0 1px 3px rgba(255, 255, 255, 0.8)",
    };
  }
};
