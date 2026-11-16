"use client";
import React, { useEffect, useState } from "react";

import { useTheme, useMediaQuery } from "@mui/material";
import { usePathname, useRouter } from "next/navigation";
import axios from "@/app/api/axios";

import { signOut, useSession } from "next-auth/react";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMessage } from "../store/messageStore";
import { useUserImage } from "../store/userImageStore";
import usePageStore from "../store/pageStore";
import { useSubscriptionStore } from "../store/subscriptionStore";

import { useLanguageStore, type AppLanguage } from "../store/languageStore";

import { translateKoreanText } from "../i18n/translations";
import { useAuthUiStore } from "../store/authUiStore";

export default function useTopBarController() {
  const router = useRouter();
  const pathname = usePathname();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const { data: user, status } = useSession();
  const queryClient = useQueryClient();
  const { showMessage } = useMessage((state) => state);
  const { setUserImageUrl, TopBarImageDelete } = useUserImage();
  const { setCurrentPage } = usePageStore();
  const clearSubscriptions = useSubscriptionStore(
    (state) => state.clearSubscriptions,
  );
  const hasLocalLogout = useAuthUiStore((state) => state.hasLocalLogout);
  const markLocalLogout = useAuthUiStore((state) => state.markLocalLogout);
  const { language, setLanguage } = useLanguageStore();
  const [settingsMenuAnchor, setSettingsMenuAnchor] =
    useState<null | HTMLElement>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const topBarText = (text: string) =>
    language === "ja" ? translateKoreanText(text) : text;
  const isAuthenticated =
    status === "authenticated" &&
    Boolean(user?.user) &&
    !hasLocalLogout &&
    !isLoggingOut;
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
      background:
        "linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)",
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

  const { data: userImage, refetch } = useQuery({
    queryKey: ["userTopImage", currentUser?.id],
    queryFn: async () => {
      if (currentUser != null) {
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/${currentUser.id}`,
          {
            withCredentials: true,
          },
        );
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
      const logoutResponse = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/logout`,
        {
          method: "POST",
          credentials: "include",
        },
      );

      if (!logoutResponse.ok) {
        console.warn(
          "백엔드 로그아웃 응답이 성공 상태가 아닙니다:",
          logoutResponse.status,
        );
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
    showMessage(
      nextLanguage === "ja" ? "日本語で表示します。" : "한국어로 표시합니다.",
      "success",
    );
  };

  return {
    router,
    pathname,
    theme,
    isMobile,
    user,
    status,
    queryClient,
    showMessage,
    setUserImageUrl,
    TopBarImageDelete,
    setCurrentPage,
    clearSubscriptions,
    hasLocalLogout,
    markLocalLogout,
    language,
    setLanguage,
    settingsMenuAnchor,
    setSettingsMenuAnchor,
    isLoggingOut,
    setIsLoggingOut,
    topBarText,
    isAuthenticated,
    currentUser,
    modernButtonStyle,
    brandLinkStyles,
    userImage,
    refetch,
    logout,
    handleSettingsMenuOpen,
    handleSettingsMenuClose,
    handleMessages,
    handleRecentViews,
    handleScraps,
    handleBlinds,
    handleReports,
    handleLanguageChange,
  };
}
export type TopBarController = ReturnType<typeof useTopBarController>;
