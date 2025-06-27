"use client";
import React, { useEffect, useState } from "react";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Settings from "@mui/icons-material/Settings";
import { Avatar, Button, Menu, MenuItem, ListItemIcon, ListItemText, useTheme } from "@mui/material";
import { useRouter } from "next/navigation";
import axios from "@/app/api/axios";
import styles from "./style/TopBar.module.css";
import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useMessage } from "../store/messageStore";
import { useUserImage } from "../store/userImageStore";
import usePageStore from "../store/pageStore";
import NotificationDropdown from "./NotificationDropdown";
import ChannelNotificationDropdown from "./ChannelNotificationDropdown";
import DarkModeToggle from "./DarkModeToggle";
import DisplaySettingsIcon from "@mui/icons-material/DisplaySettings";
import MessageIcon from "@mui/icons-material/Message";
import HistoryIcon from "@mui/icons-material/History";
import BookmarkIcon from "@mui/icons-material/Bookmark";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";

// const SearchBox = styled("div")(({ theme }) => ({
//   position: "relative",
//   borderRadius: theme.shape.borderRadius,
//   background: `linear-gradient(45deg, ${alpha(theme.palette.common.white, 0.15)}, ${alpha(theme.palette.common.white, 0.25)})`,
//   "&:hover": {
//     background: `linear-gradient(45deg, ${alpha(theme.palette.common.white, 0.25)}, ${alpha(theme.palette.common.white, 0.35)})`,
//   },
//   marginLeft: 0,
//   width: "100%",
//   [theme.breakpoints.up("sm")]: {
//     marginLeft: theme.spacing(1),
//     width: "auto",
//   },
// }));

// const StyledInputBase = styled(InputBase)(({ theme }) => ({
//   color: "inherit",
//   "& .MuiInputBase-input": {
//     padding: theme.spacing(1, 1, 1, 0),
//     paddingLeft: `calc(1em + ${theme.spacing(4)})`,
//     transition: theme.transitions.create("width"),
//     width: "100%",
//     [theme.breakpoints.up("md")]: {
//       width: "20ch",
//     },
//   },
// }));

export default function MenuBar() {
  const router = useRouter();
  const theme = useTheme();
  const { data: user, status } = useSession();
  const { showMessage } = useMessage((state) => state);
  const { setUserImageUrl, TopBarImageDelete } = useUserImage();
  const { setCurrentPage } = usePageStore();
  const [settingsMenuAnchor, setSettingsMenuAnchor] = useState<null | HTMLElement>(null);

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

  const {
    data: userImage,
    error,
    refetch,
  } = useQuery({
    queryKey: ["userTopImage", user?.user.id],
    queryFn: async () => {
      if (user?.user != null) {
        const response = await axios.get(`${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/${user.user.id}`, {
          withCredentials: true,
        });
        if (response.data.image.link != null) {
          return response.data.image.link;
        }
      }
    },
    // F5 새로고침 시 세션이 인증된 상태에서만 요청을 수행합니다.
    // 이거 안하니까. F5 새로고침 시 세션이 인증되지 않은 상태에서 API요청을 수행해서 안 불러옴
    enabled: status === "authenticated",
    staleTime: Infinity,
  });

  // 프로필 사진 삭제 시 refetch를 트리거하는 이벤트를 전달받을 수 있도록 설정
  useEffect(() => {
    // 예를 들어, 전역 상태나 props를 통해 refetch를 호출
    if (TopBarImageDelete) {
      refetch();
    }
  }, [TopBarImageDelete]);

  const logout = async () => {
    // TODO 둘다 성공해야 로그아웃 성공되게끔. Promise.all 사용
    try {
      // Promise.all을 사용하여 로그아웃 요청과 Next-Auth signOut을 병렬로 수행
      const [logoutResponse] = await Promise.all([
        await axios.post(`${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/logout`, {}, { withCredentials: true }),
        await signOut(),
      ]);
      if (logoutResponse.status === 200) {
        showMessage("로그아웃 성공", "warning");
        router.refresh();
      }
    } catch (error) {
      // 에러 처리
      console.error("로그아웃 실패:", error);
    }
  };

  useEffect(() => {
    if (userImage) {
      setUserImageUrl(userImage);
    }
  }, [userImage]);

  const handleSettingsMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setSettingsMenuAnchor(event.currentTarget);
  };

  const handleSettingsMenuClose = () => {
    setSettingsMenuAnchor(null);
  };

  const handleDisplaySettings = () => {
    handleSettingsMenuClose();
    // 표시설정 페이지로 이동 로직 추가
    console.log("표시설정 클릭됨");
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

  return (
    <div className={styles.container}>
      <Link
        href="/channels"
        aria-label="Home"
        className={styles.title}
        onClick={() => setCurrentPage(1)}
        style={{
          fontSize: "2rem",
          fontWeight: "bold",
          color: theme.palette.mode === "dark" ? "#A78BFA" : "#7C3AED",
          padding: "0.5rem 1rem",
          borderRadius: "12px",
          textDecoration: "none",
          transition: "all 0.4s ease",
          display: "inline-block",
          letterSpacing: "1px",
          cursor: "pointer",
          textShadow:
            theme.palette.mode === "dark"
              ? "0 0 20px rgba(167, 139, 250, 0.4), 0 2px 4px rgba(0,0,0,0.3)"
              : "0 0 15px rgba(124, 58, 237, 0.3), 0 2px 4px rgba(0,0,0,0.1)",
          filter: theme.palette.mode === "dark" ? "brightness(1.1)" : "brightness(1)",
        }}
      >
        Hobby Channel
      </Link>
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
          src={userImage ? `${process.env.NEXT_PUBLIC_BASE_URL}${userImage}` : "/assets/noprofileImage.png"}
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
      </Box>
      <nav className={styles.nav}>
        {/* 로그인한 사용자에게만 알림 아이콘 표시 */}
        {user?.user && (
          <>
            <NotificationDropdown />
            <ChannelNotificationDropdown />
          </>
        )}

        {!user?.user && (
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
            로그인
          </Button>
        )}

        {user?.user && (
          <Button
            size="medium"
            variant="contained"
            onClick={logout}
            color="error"
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
            로그아웃
          </Button>
        )}

        {!user?.user && (
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
            회원가입
          </Button>
        )}

        {user?.user && (
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
            프로필
          </Button>
        )}

        {/* 다크모드 토글 버튼 */}
        <DarkModeToggle />

        {/* 설정 메뉴 - 로그인한 사용자에게만 표시 */}
        {user?.user && (
          <IconButton
            size="large"
            edge="end"
            aria-label="settings menu"
            aria-haspopup="true"
            color="inherit"
            sx={{
              color: "white",
              borderRadius: "50%",
              padding: "10px",
              background:
                theme.palette.mode === "dark"
                  ? "linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(59, 130, 246, 0.2))"
                  : "linear-gradient(135deg, rgba(25, 118, 210, 0.1), rgba(33, 150, 243, 0.1))",
              backdropFilter: "blur(10px)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              transition: "all 0.3s ease",
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
        )}

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
          <MenuItem onClick={handleMessages}>
            <ListItemIcon>
              <MessageIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>쪽지</ListItemText>
          </MenuItem>
          <MenuItem onClick={handleRecentViews}>
            <ListItemIcon>
              <HistoryIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>최근에 봤던 게시물</ListItemText>
          </MenuItem>
          <MenuItem onClick={handleScraps}>
            <ListItemIcon>
              <BookmarkIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>스크랩</ListItemText>
          </MenuItem>
          <MenuItem onClick={handleBlinds}>
            <ListItemIcon>
              <VisibilityOffIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>블라인드</ListItemText>
          </MenuItem>
        </Menu>
      </nav>
    </div>
  );
}
