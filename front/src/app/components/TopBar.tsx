"use client";
import React, { useEffect } from "react";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import AccountCircle from "@mui/icons-material/AccountCircle";
import { Avatar, Button } from "@mui/material";
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

  return (
    <div className={styles.container}>
      <Link href="/" aria-label="Home" className={styles.title} onClick={() => setCurrentPage(1)}>
        🍔Live Board
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
        {user?.user && <NotificationDropdown />}
        
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
        {/* 오른쪽 메뉴: 프로필 관련 */}
        <Box sx={{ flexGrow: 1 }} />
        <IconButton size="large" edge="end" aria-label="account of current user" aria-haspopup="true" color="inherit">
          <AccountCircle />
        </IconButton>
      </nav>
    </div>
  );
}
