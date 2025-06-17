"use client";
import React, { useEffect, useState } from "react";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Settings from "@mui/icons-material/Settings";
import { Avatar, Button, Menu, MenuItem, ListItemIcon, ListItemText } from "@mui/material";
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
  const { data: user, status } = useSession();
  const { showMessage } = useMessage((state) => state);
  const { setUserImageUrl, TopBarImageDelete } = useUserImage();
  const { setCurrentPage } = usePageStore();
  const [settingsMenuAnchor, setSettingsMenuAnchor] = useState<null | HTMLElement>(null);

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
          background: "linear-gradient(45deg, #FF6B6B, #4ECDC4)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          padding: "0.5rem 1rem",
          borderRadius: "8px",
          textDecoration: "none",
          transition: "transform 0.2s ease-in-out",
          display: "inline-block",
          textShadow: "2px 2px 4px rgba(0,0,0,0.1)",
          letterSpacing: "1px",
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.transform = "scale(1.05)";
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.transform = "scale(1)";
        }}
      >
        Hobby Channel
      </Link>
      <Box sx={{ width: 56, height: 56 }}>
        {userImage ? (
          <Avatar src={`${process.env.NEXT_PUBLIC_BASE_URL}${userImage}`} sx={{ width: 56, height: 56 }} />
        ) : (
          // 이미지가 없을 때에도 같은 크기의 빈 Avatar 또는 기본 아이콘을 보여줌
          <Box sx={{ width: 56, height: 56 }} />
        )}
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
          <Button size="medium" variant="contained" onClick={() => router.push("/login")} color="info">
            로그인
          </Button>
        )}
        {user?.user && (
          <Button size="medium" variant="contained" onClick={logout} color="error">
            로그아웃
          </Button>
        )}
        {!user?.user && (
          <Button size="medium" variant="contained" onClick={() => router.push("/signup")} color="inherit">
            회원가입
          </Button>
        )}
        {user?.user && (
          <Button
            size="medium"
            variant="contained"
            onClick={() => {
              router.push(`/setting/profile`);
            }}
            color="error"
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
              "&:hover": {
                backgroundColor: (theme) => theme.palette.action.hover,
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
        >
          {/* <MenuItem onClick={handleDisplaySettings}>
            <ListItemIcon>
              <DisplaySettingsIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>표시설정</ListItemText>
          </MenuItem> */}
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
