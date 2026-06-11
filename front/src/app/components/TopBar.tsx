"use client";
import React, { useEffect, useState } from "react";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Settings from "@mui/icons-material/Settings";
import { Avatar, Button, Divider, Menu, MenuItem, ListItemIcon, ListItemText, useTheme, useMediaQuery } from "@mui/material";
import { usePathname, useRouter } from "next/navigation";
import axios from "@/app/api/axios";
import styles from "./style/TopBar.module.css";
import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMessage } from "../store/messageStore";
import { useUserImage } from "../store/userImageStore";
import usePageStore from "../store/pageStore";
import { useSubscriptionStore } from "../store/subscriptionStore";
import NotificationDropdown from "./NotificationDropdown";
import DarkModeToggle from "./DarkModeToggle";
import UserBadge from "@/app/components/common/UserBadge";
import { useUserActivityTotals } from "@/app/components/api/useUserActivityTotals";
import MessageIcon from "@mui/icons-material/Message";
import HistoryIcon from "@mui/icons-material/History";
import BookmarkIcon from "@mui/icons-material/Bookmark";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import ReportIcon from "@mui/icons-material/Report";
import LoginIcon from "@mui/icons-material/Login";
import LogoutIcon from "@mui/icons-material/Logout";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import TranslateIcon from "@mui/icons-material/Translate";
import CheckIcon from "@mui/icons-material/Check";
import { useLanguageStore, type AppLanguage } from "../store/languageStore";
import { resolveMediaUrl } from "../utils/mediaUrl";
import { translateKoreanText } from "../i18n/translations";
import { useAuthUiStore } from "../store/authUiStore";

export default function MenuBar() {
  const router = useRouter();
  const pathname = usePathname();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const { data: user, status } = useSession();
  const queryClient = useQueryClient();
  const { showMessage } = useMessage((state) => state);
  const { setUserImageUrl, TopBarImageDelete } = useUserImage();
  const { setCurrentPage } = usePageStore();
  const clearSubscriptions = useSubscriptionStore((state) => state.clearSubscriptions);
  const hasLocalLogout = useAuthUiStore((state) => state.hasLocalLogout);
  const markLocalLogout = useAuthUiStore((state) => state.markLocalLogout);
  const { language, setLanguage } = useLanguageStore();
  const [settingsMenuAnchor, setSettingsMenuAnchor] = useState<null | HTMLElement>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const topBarText = (text: string) => (language === "ja" ? translateKoreanText(text) : text);
  const isAuthenticated = status === "authenticated" && Boolean(user?.user) && !hasLocalLogout && !isLoggingOut;
  const currentUser = isAuthenticated ? user?.user : null;

  // 현대적인 버튼 스타일
  const modernButtonStyle = {
    borderRadius: "12px",
    padding: "8px 20px",
    fontWeight: 600,
    textTransform: "none" as const,
    position: "relative" as const,
    overflow: "hidden" as const,
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    backdropFilter: "blur(10px)",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    "&::before": {
      content: '""',
      position: "absolute",
      top: 0,
      left: "-100%",
      width: "100%",
      height: "100%",
      background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)",
      transition: "left 0.5s ease",
    },
    "&:hover": {
      transform: "translateY(-2px)",
      boxShadow: "0 8px 25px rgba(0,0,0,0.15)",
      "&::before": {
        left: "100%",
      },
    },
    "&:active": {
      transform: "translateY(0px)",
    },
  };

  const brandLinkStyles = {
    fontSize: isMobile ? "1.5rem" : "2rem",
    lineHeight: isMobile ? 1.05 : 1.2,
    fontWeight: "800",
    color: theme.palette.mode === "dark" ? "#a78bfa" : "#4338ca",
    textShadow:
      theme.palette.mode === "dark"
        ? "0 0 10px rgba(139, 92, 246, 0.45)"
        : "0 0 6px rgba(67, 56, 202, 0.2)",
    padding: isMobile ? "0.15rem 0.4rem" : "0.5rem 1rem",
    borderRadius: "12px",
    textDecoration: "none",
    transition: "all 0.4s ease",
    display: "inline-flex",
    flexDirection: "column" as const,
    letterSpacing: 0,
    cursor: "pointer",
    marginTop: isMobile ? "-2px" : 0,
    marginBottom: isMobile ? "-2px" : 0,
    filter:
      theme.palette.mode === "dark"
        ? "drop-shadow(0 0 8px rgba(139, 92, 246, 0.45))"
        : "drop-shadow(0 0 5px rgba(79, 70, 229, 0.25))",
    whiteSpace: isMobile ? "normal" : "nowrap",
  };

  const {
    data: userImage,
    refetch,
  } = useQuery({
    queryKey: ["userTopImage", currentUser?.id],
    queryFn: async () => {
      if (currentUser != null) {
        const response = await axios.get(`${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/${currentUser.id}`, {
          withCredentials: true,
        });
        if (response.data.image?.link != null) {
          return response.data.image.link;
        }
      }
    },
    // F5 새로고침 시 세션이 인증된 상태에서만 요청을 수행합니다.
    // 이거 안하니까. F5 새로고침 시 세션이 인증되지 않은 상태에서 API요청을 수행해서 안 불러옴
    enabled: isAuthenticated,
    staleTime: Infinity,
  });

  // 유저 활동 총합 (닉네임 기준)
  const { data: activityTotals } = useUserActivityTotals(currentUser?.nickname);

  // 프로필 사진 삭제 시 refetch를 트리거하는 이벤트를 전달받을 수 있도록 설정
  useEffect(() => {
    // 예를 들어, 전역 상태나 props를 통해 refetch를 호출
    if (TopBarImageDelete) {
      refetch();
    }
  }, [TopBarImageDelete, refetch]);

  const logout = async () => {
    if (isLoggingOut) return;

    setIsLoggingOut(true);
    markLocalLogout();
    handleSettingsMenuClose();
    queryClient.removeQueries({ queryKey: ["userTopImage"] });
    queryClient.removeQueries({ queryKey: ["userActivityTotals"] });
    clearSubscriptions();
    setUserImageUrl("");

    try {
      const logoutResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/logout`, {
        method: "POST",
        credentials: "include",
      });

      if (!logoutResponse.ok) {
        console.warn("백엔드 로그아웃 응답이 성공 상태가 아닙니다:", logoutResponse.status);
      }

      await signOut({ redirect: false, callbackUrl: "/channels" });
      showMessage(topBarText("로그아웃 성공"), "warning");
      if (pathname !== "/channels") {
        router.replace("/channels");
      }
    } catch (error) {
      console.error("로그아웃 실패:", error);
      showMessage(topBarText("로그아웃 실패"), "error");
    } finally {
      setIsLoggingOut(false);
    }
  };

  useEffect(() => {
    if (userImage) {
      setUserImageUrl(userImage);
    }
  }, [userImage, setUserImageUrl]);

  const handleSettingsMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setSettingsMenuAnchor(event.currentTarget);
  };

  const handleSettingsMenuClose = () => {
    setSettingsMenuAnchor(null);
  };

  const handleMessages = () => {
    handleSettingsMenuClose();
    // 쪽지 페이지로 이동
    router.push("/messages");
  };

  const handleRecentViews = () => {
    handleSettingsMenuClose();
    // 최근에 봤던 게시물 페이지로 이동
    router.push("/recent-views");
  };

  const handleScraps = () => {
    handleSettingsMenuClose();
    // 스크랩 페이지로 이동
    router.push("/scraps");
  };

  const handleBlinds = () => {
    handleSettingsMenuClose();
    // 블라인드 페이지로 이동
    router.push("/blinds");
  };

  const handleReports = () => {
    handleSettingsMenuClose();
    // 신고 목록 페이지로 이동
    router.push("/reports");
  };

  const handleLanguageChange = (nextLanguage: AppLanguage) => {
    setLanguage(nextLanguage);
    handleSettingsMenuClose();
    showMessage(nextLanguage === "ja" ? "日本語で表示します。" : "한국어로 표시합니다.", "success");
  };

  return (
    <div className={styles.container}>
      {/* 채널 이름과 다크모드 토글을 하나의 컨테이너로 묶음 */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: isMobile ? "10px" : "12px",
          flex: isMobile ? 1 : "unset",
        }}
      >
        <Link
          href="/channels"
          aria-label="Home"
          className={styles.title}
          onClick={() => setCurrentPage(1)}
          style={brandLinkStyles}
        >
          Hobby Channel
        </Link>

        {/* 다크모드 토글 버튼 - 채널 이름 바로 오른쪽에 위치 */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            transform: isMobile ? "scale(0.85)" : "none",
            transformOrigin: "center",
            marginTop: isMobile ? "-2px" : 0,
          }}
        >
          <DarkModeToggle />
        </div>
      </div>

      {!isMobile && (
        <Box
        sx={{
          width: 64,
          height: 64,
          position: "relative",
          // 외부 액자 프레임 (황금/플래티넘 느낌)
          background:
            theme.palette.mode === "dark"
              ? "linear-gradient(145deg, #2a2a3e 0%, #1a1a2e 50%, #2a2a3e 100%)"
              : "linear-gradient(145deg, #f8f9fa 0%, #e9ecef 50%, #f8f9fa 100%)",
          borderRadius: "50%",
          padding: "4px",
          boxShadow:
            theme.palette.mode === "dark"
              ? `
              0 12px 40px rgba(0, 0, 0, 0.6),
              0 4px 12px rgba(139, 92, 246, 0.2),
              inset 0 2px 4px rgba(255, 255, 255, 0.1),
              inset 0 -2px 4px rgba(0, 0, 0, 0.4),
              inset 0 0 20px rgba(139, 92, 246, 0.05)
            `
              : `
              0 12px 40px rgba(0, 0, 0, 0.15),
              0 4px 12px rgba(218, 165, 32, 0.3),
              inset 0 2px 4px rgba(255, 255, 255, 0.9),
              inset 0 -2px 4px rgba(0, 0, 0, 0.1),
              inset 0 0 20px rgba(218, 165, 32, 0.1)
            `,
          transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
          // 회전하는 액자 테두리 효과
          "&::before": {
            content: '""',
            position: "absolute",
            top: -3,
            left: -3,
            right: -3,
            bottom: -3,
            background:
              theme.palette.mode === "dark"
                ? "conic-gradient(from 0deg, #8B5CF6, #06B6D4, #10B981, #F59E0B, #EF4444, #8B5CF6)"
                : "conic-gradient(from 0deg, #DAA520, #FF6B6B, #4ECDC4, #45B7D1, #9C27B0, #DAA520)",
            borderRadius: "50%",
            opacity: 0.8,
            transition: "opacity 0.3s ease",
            zIndex: -1,
            animation: "frameGlow 6s linear infinite",
          },
          // 내부 액자 프레임
          "&::after": {
            content: '""',
            position: "absolute",
            top: 2,
            left: 2,
            right: 2,
            bottom: 2,
            background:
              theme.palette.mode === "dark"
                ? "linear-gradient(145deg, rgba(42, 42, 62, 0.9), rgba(26, 26, 46, 0.9))"
                : "linear-gradient(145deg, rgba(255, 255, 255, 0.9), rgba(240, 240, 240, 0.9))",
            borderRadius: "50%",
            border:
              theme.palette.mode === "dark" ? "1px solid rgba(139, 92, 246, 0.3)" : "1px solid rgba(218, 165, 32, 0.4)",
            zIndex: 1,
          },
          "&:hover": {
            transform: "scale(1.08) rotate(3deg)",
            boxShadow:
              theme.palette.mode === "dark"
                ? `
                0 16px 50px rgba(0, 0, 0, 0.8),
                0 6px 20px rgba(139, 92, 246, 0.4),
                inset 0 3px 6px rgba(255, 255, 255, 0.15),
                inset 0 -3px 6px rgba(0, 0, 0, 0.5),
                inset 0 0 30px rgba(139, 92, 246, 0.1)
              `
                : `
                0 16px 50px rgba(0, 0, 0, 0.25),
                0 6px 20px rgba(218, 165, 32, 0.5),
                inset 0 3px 6px rgba(255, 255, 255, 1),
                inset 0 -3px 6px rgba(0, 0, 0, 0.15),
                inset 0 0 30px rgba(218, 165, 32, 0.15)
              `,
            "&::before": {
              opacity: 1,
              transform: "scale(1.1)",
            },
          },
          "@keyframes frameGlow": {
            "0%": { transform: "rotate(0deg)" },
            "100%": { transform: "rotate(360deg)" },
          },
        }}
      >
        <Avatar
          src={resolveMediaUrl(userImage) ?? "/assets/noprofileImage.png"}
          sx={{
            width: 56,
            height: 56,
            position: "relative",
            zIndex: 2,
            // 사진 자체의 고급 프레임 효과
            border:
              theme.palette.mode === "dark" ? "2px solid rgba(139, 92, 246, 0.5)" : "2px solid rgba(218, 165, 32, 0.7)",
            boxShadow:
              theme.palette.mode === "dark"
                ? `
                0 0 25px rgba(139, 92, 246, 0.4),
                inset 0 3px 6px rgba(255, 255, 255, 0.1),
                inset 0 -3px 6px rgba(0, 0, 0, 0.3),
                0 0 0 1px rgba(255, 255, 255, 0.05)
              `
                : `
                0 6px 25px rgba(218, 165, 32, 0.4),
                inset 0 3px 6px rgba(255, 255, 255, 0.8),
                inset 0 -3px 6px rgba(0, 0, 0, 0.1),
                0 0 0 1px rgba(255, 255, 255, 0.3)
              `,
            transition: "all 0.3s ease",
            cursor: "pointer",
            // 사진에 고급스러운 필터 효과
            filter: "contrast(1.08) saturate(1.15) brightness(1.02)",
            "&:hover": {
              filter: "contrast(1.15) saturate(1.25) brightness(1.08)",
              transform: "scale(1.02)",
              boxShadow:
                theme.palette.mode === "dark"
                  ? `
                  0 0 35px rgba(139, 92, 246, 0.6),
                  inset 0 4px 8px rgba(255, 255, 255, 0.15),
                  inset 0 -4px 8px rgba(0, 0, 0, 0.4),
                  0 0 0 2px rgba(255, 255, 255, 0.1)
                `
                  : `
                  0 8px 35px rgba(218, 165, 32, 0.5),
                  inset 0 4px 8px rgba(255, 255, 255, 0.9),
                  inset 0 -4px 8px rgba(0, 0, 0, 0.15),
                  0 0 0 2px rgba(255, 255, 255, 0.5)
                `,
            },
          }}
        />
        {/* 레벨 뱃지를 아바타 오른쪽 하단에 표시 */}
        {activityTotals && (
          <Box
            sx={{
              position: "absolute",
              bottom: -2,
              right: -2,
              zIndex: 3,
              background: theme.palette.mode === "dark" ? "rgba(26, 26, 46, 0.9)" : "rgba(255, 255, 255, 0.9)",
              borderRadius: "50%",
              padding: "2px",
              border:
                theme.palette.mode === "dark"
                  ? "1px solid rgba(139, 92, 246, 0.3)"
                  : "1px solid rgba(218, 165, 32, 0.4)",
              boxShadow: "0 2px 8px rgba(0, 0, 0, 0.2)",
            }}
          >
            <UserBadge totals={activityTotals} size="small" showText={false} />
          </Box>
        )}
      </Box>
      )}
      <nav
        data-i18n-skip
        className={styles.nav}
        style={{
          gap: isMobile ? "8px" : undefined,
        }}
      >
        {/* 로그인한 사용자에게만 알림 아이콘 표시 */}
        {isAuthenticated && (
          <>
            <NotificationDropdown />
          </>
        )}

        {!isMobile && !isAuthenticated && (
          <Button
            size="medium"
            variant="contained"
            onClick={() => router.push("/login")}
            color="info"
            sx={{
              ...modernButtonStyle,
              background:
                theme.palette.mode === "dark"
                  ? "linear-gradient(135deg, #3B82F6 0%, #1E40AF 100%)"
                  : "linear-gradient(135deg, #2196F3 0%, #1976D2 100%)",
              "&:hover": {
                ...modernButtonStyle["&:hover"],
                background:
                  theme.palette.mode === "dark"
                    ? "linear-gradient(135deg, #1E40AF 0%, #1E3A8A 100%)"
                    : "linear-gradient(135deg, #1976D2 0%, #1565C0 100%)",
              },
            }}
          >
            {topBarText("로그인")}
          </Button>
        )}

        {!isMobile && isAuthenticated && (
          <Button
            size="medium"
            variant="contained"
            onClick={logout}
            color="error"
            disabled={isLoggingOut}
            sx={{
              ...modernButtonStyle,
              background:
                theme.palette.mode === "dark"
                  ? "linear-gradient(135deg, #EF4444 0%, #DC2626 100%)"
                  : "linear-gradient(135deg, #F44336 0%, #D32F2F 100%)",
              "&:hover": {
                ...modernButtonStyle["&:hover"],
                background:
                  theme.palette.mode === "dark"
                    ? "linear-gradient(135deg, #DC2626 0%, #B91C1C 100%)"
                    : "linear-gradient(135deg, #D32F2F 0%, #C62828 100%)",
              },
            }}
          >
            {topBarText(isLoggingOut ? "로그아웃 중..." : "로그아웃")}
          </Button>
        )}

        {!isMobile && !isAuthenticated && (
          <Button
            size="medium"
            variant="contained"
            onClick={() => router.push("/signup")}
            color="inherit"
            sx={{
              ...modernButtonStyle,
              background:
                theme.palette.mode === "dark"
                  ? "linear-gradient(135deg, #6B7280 0%, #4B5563 100%)"
                  : "linear-gradient(135deg, #9E9E9E 0%, #757575 100%)",
              color: "white",
              "&:hover": {
                ...modernButtonStyle["&:hover"],
                background:
                  theme.palette.mode === "dark"
                    ? "linear-gradient(135deg, #4B5563 0%, #374151 100%)"
                    : "linear-gradient(135deg, #757575 0%, #616161 100%)",
              },
            }}
          >
            {topBarText("회원가입")}
          </Button>
        )}

        {!isMobile && isAuthenticated && (
          <Button
            size="medium"
            variant="contained"
            onClick={() => router.push(`/setting/profile`)}
            color="error"
            sx={{
              ...modernButtonStyle,
              background:
                theme.palette.mode === "dark"
                  ? "linear-gradient(135deg, #10B981 0%, #059669 100%)"
                  : "linear-gradient(135deg, #4CAF50 0%, #388E3C 100%)",
              "&:hover": {
                ...modernButtonStyle["&:hover"],
                background:
                  theme.palette.mode === "dark"
                    ? "linear-gradient(135deg, #059669 0%, #047857 100%)"
                    : "linear-gradient(135deg, #388E3C 0%, #2E7D32 100%)",
              },
            }}
          >
            {topBarText("프로필")}
          </Button>
        )}

        <IconButton
          size="large"
          edge="end"
          aria-label="settings menu"
          aria-haspopup="true"
          color="inherit"
          sx={{
            color: theme.palette.mode === "dark" ? "#f8fafc" : "#334155",
            borderRadius: "50%",
            padding: "10px",
            background:
              theme.palette.mode === "dark"
                ? "linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(59, 130, 246, 0.2))"
                : "linear-gradient(135deg, rgba(25, 118, 210, 0.1), rgba(33, 150, 243, 0.1))",
            backdropFilter: "blur(10px)",
            border:
              theme.palette.mode === "dark"
                ? "1px solid rgba(255, 255, 255, 0.1)"
                : "1px solid rgba(79, 70, 229, 0.18)",
            transition: "all 0.3s ease",
            marginRight: isMobile ? "12px" : 0,
            "&:hover": {
              backgroundColor: theme.palette.mode === "dark" ? "rgba(139, 92, 246, 0.3)" : "rgba(25, 118, 210, 0.2)",
              transform: "rotate(90deg) scale(1.1)",
              boxShadow: "0 4px 15px rgba(0,0,0,0.2)",
            },
          }}
          onClick={handleSettingsMenuOpen}
        >
          <Settings />
        </IconButton>

        {/* 설정 드롭다운 메뉴 */}
        <Menu
          anchorEl={settingsMenuAnchor}
          open={Boolean(settingsMenuAnchor)}
          onClose={handleSettingsMenuClose}
          anchorOrigin={{
            vertical: "bottom",
            horizontal: "right",
          }}
          transformOrigin={{
            vertical: "top",
            horizontal: "right",
          }}
          sx={{
            "& .MuiPaper-root": {
              background:
                theme.palette.mode === "dark"
                  ? "linear-gradient(135deg, rgba(26, 26, 46, 0.95), rgba(35, 35, 60, 0.95))"
                  : "linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(248, 250, 252, 0.95))",
              backdropFilter: "blur(20px)",
              border:
                theme.palette.mode === "dark" ? "1px solid rgba(139, 92, 246, 0.2)" : "1px solid rgba(0, 0, 0, 0.05)",
              borderRadius: "12px",
              boxShadow:
                theme.palette.mode === "dark"
                  ? "0 20px 40px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(139, 92, 246, 0.1)"
                  : "0 20px 40px rgba(0, 0, 0, 0.1)",
              overflow: "hidden",
              minWidth: 200,
            },
            "& .MuiMenuItem-root": {
              borderRadius: "8px",
              margin: "4px 8px",
              padding: "12px 16px",
              transition: "all 0.2s ease",
              "&:hover": {
                background:
                  theme.palette.mode === "dark"
                    ? "linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(59, 130, 246, 0.1))"
                    : "linear-gradient(135deg, rgba(25, 118, 210, 0.05), rgba(33, 150, 243, 0.05))",
                transform: "translateX(4px)",
              },
            },
          }}
        >
          {currentUser && (
            <>
              <MenuItem
                onClick={() => {
                  handleSettingsMenuClose();
                  router.push("/setting/profile");
                }}
                sx={{ gap: 1 }}
              >
                <ListItemIcon>
                  <Avatar
                    src={resolveMediaUrl(userImage) ?? "/assets/noprofileImage.png"}
                    sx={{ width: 36, height: 36 }}
                  />
                </ListItemIcon>
                <ListItemText primary={currentUser.nickname} secondary={topBarText("프로필 보기")} />
              </MenuItem>
              <Divider sx={{ my: 0.5 }} />
            </>
          )}
          <MenuItem data-i18n-skip selected={language === "ja"} onClick={() => handleLanguageChange("ja")}>
            <ListItemIcon>
              <TranslateIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText primary="日本語" secondary={language === "ja" ? "現在の表示言語" : "Japanese"} />
            {language === "ja" && <CheckIcon fontSize="small" color="primary" />}
          </MenuItem>
          <MenuItem data-i18n-skip selected={language === "ko"} onClick={() => handleLanguageChange("ko")}>
            <ListItemIcon>
              <TranslateIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText primary="한국어" secondary={language === "ko" ? "현재 표시 언어" : "Korean"} />
            {language === "ko" && <CheckIcon fontSize="small" color="primary" />}
          </MenuItem>
          <Divider sx={{ my: 0.5 }} />
          {isAuthenticated ? (
            <>
              <MenuItem onClick={handleMessages}>
                <ListItemIcon>
                  <MessageIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText>{topBarText("쪽지")}</ListItemText>
              </MenuItem>
              <MenuItem onClick={handleRecentViews}>
                <ListItemIcon>
                  <HistoryIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText>{topBarText("최근에 봤던 게시물")}</ListItemText>
              </MenuItem>
              <MenuItem onClick={handleScraps}>
                <ListItemIcon>
                  <BookmarkIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText>{topBarText("스크랩")}</ListItemText>
              </MenuItem>
              <MenuItem onClick={handleBlinds}>
                <ListItemIcon>
                  <VisibilityOffIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText>{topBarText("블라인드")}</ListItemText>
              </MenuItem>
              <MenuItem onClick={handleReports}>
                <ListItemIcon>
                  <ReportIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText>{topBarText("신고 목록")}</ListItemText>
              </MenuItem>
              <MenuItem
                onClick={() => {
                  handleSettingsMenuClose();
                  logout();
                }}
                disabled={isLoggingOut}
              >
                <ListItemIcon>
                  <LogoutIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText>{topBarText(isLoggingOut ? "로그아웃 중..." : "로그아웃")}</ListItemText>
              </MenuItem>
            </>
          ) : (
            <>
              <MenuItem
                onClick={() => {
                  handleSettingsMenuClose();
                  router.push("/login");
                }}
              >
                <ListItemIcon>
                  <LoginIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText>{topBarText("로그인")}</ListItemText>
              </MenuItem>
              <MenuItem
                onClick={() => {
                  handleSettingsMenuClose();
                  router.push("/signup");
                }}
                sx={{
                  mt: 0.5,
                  borderRadius: "14px",
                  background:
                    theme.palette.mode === "dark"
                      ? "linear-gradient(135deg, rgba(236, 72, 153, 0.25), rgba(139, 92, 246, 0.35))"
                      : "linear-gradient(135deg, rgba(249, 168, 212, 0.4), rgba(129, 140, 248, 0.35))",
                  border:
                    theme.palette.mode === "dark"
                      ? "1px solid rgba(236, 72, 153, 0.45)"
                      : "1px solid rgba(99, 102, 241, 0.35)",
                  boxShadow:
                    theme.palette.mode === "dark"
                      ? "0 10px 25px rgba(15, 23, 42, 0.55)"
                      : "0 10px 25px rgba(148, 163, 184, 0.45)",
                  color: theme.palette.mode === "dark" ? "#FDF4FF" : "#1F2937",
                  position: "relative",
                  overflow: "hidden",
                  "&::after": {
                    content: '\"\"',
                    position: "absolute",
                    inset: 0,
                    background:
                      theme.palette.mode === "dark"
                        ? "radial-gradient(circle at top right, rgba(255,255,255,0.25), transparent 45%)"
                        : "radial-gradient(circle at top right, rgba(255,255,255,0.55), transparent 45%)",
                    opacity: 0.8,
                    pointerEvents: "none",
                  },
                  "&:hover": {
                    transform: "translateY(-2px)",
                    boxShadow:
                      theme.palette.mode === "dark"
                        ? "0 16px 35px rgba(15, 23, 42, 0.7)"
                        : "0 16px 35px rgba(148, 163, 184, 0.55)",
                  },
                }}
              >
                <ListItemIcon>
                  <PersonAddIcon
                    fontSize="small"
                    sx={{
                      color: theme.palette.mode === "dark" ? "#FEE2E2" : "#7C3AED",
                    }}
                  />
                </ListItemIcon>
                <ListItemText
                  primary={topBarText("회원가입")}
                  secondary={topBarText("30초 만에 취향 커뮤니티 합류")}
                  primaryTypographyProps={{
                    fontWeight: 800,
                    fontSize: "0.95rem",
                    color: "inherit",
                  }}
                  secondaryTypographyProps={{
                    fontSize: "0.75rem",
                    fontWeight: 500,
                    color: theme.palette.mode === "dark" ? "rgba(248, 250, 252, 0.85)" : "rgba(15, 23, 42, 0.7)",
                  }}
                />
                <Box
                  component="span"
                  sx={{
                    ml: 1,
                    px: 1,
                    py: 0.25,
                    borderRadius: "999px",
                    fontSize: "0.7rem",
                    fontWeight: 700,
                    background: theme.palette.mode === "dark" ? "rgba(15, 23, 42, 0.45)" : "rgba(255, 255, 255, 0.7)",
                    color: theme.palette.mode === "dark" ? "#FDE68A" : "#7C3AED",
                    border: theme.palette.mode === "dark" ? "1px solid rgba(253, 230, 138, 0.5)" : "1px solid rgba(124, 58, 237, 0.3)",
                  }}
                >
                  {topBarText("무료")}
                </Box>
              </MenuItem>
            </>
          )}
        </Menu>
      </nav>
    </div>
  );
}
