"use client";
import React, { useEffect } from "react";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import AccountCircle from "@mui/icons-material/AccountCircle";
import InputBase from "@mui/material/InputBase";
import { styled, alpha } from "@mui/material/styles";
import { Alert, Button, Link } from "@mui/material";

import { useRouter } from "next/navigation";
import axios from "axios";
import styles from "./style/TopBar.module.css";
import { signOut, useSession } from "next-auth/react";
import { useMessage } from "../store";

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

  const logout = async () => {
    // TODO 둘다 성공해야 로그아웃 성공되게끔. Promise.all 사용

    try {
      // Promise.all을 사용하여 로그아웃 요청과 Next-Auth signOut을 병렬로 수행
      const [logoutResponse] = await Promise.all([
        axios.post(`${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/logout`, {}, { withCredentials: true }),
        signOut(),
      ]);
      if (logoutResponse.status === 200) {
        showMessage("로그아웃 성공", "warning");
        // 로그아웃 후 페이지를 새로고침하고 메인 페이지로 이동
        router.refresh();
      }
    } catch (error) {
      // 에러 처리
      console.error("로그아웃 실패:", error);
    }
  };

  return (
    <div className={styles.container}>
      <Link href="/" aria-label="Home">
        <h1 className={styles.title}>Live Board</h1>
      </Link>
      <nav className={styles.nav}>
        {!user?.user && (
          <Button variant="contained" onClick={() => router.push("/login")} color="info">
            로그인
          </Button>
        )}
        <Button variant="contained" onClick={logout} color="error">
          로그아웃
        </Button>
        {!user?.user && (
          <Button variant="contained" onClick={() => router.push("/signup")} color="inherit">
            회원가입
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

// <ul className="flex gap-4 items-center p-4">
//         {menu.map((item) => (
//             <li key={item.href}>
//               <Link href={item.href} aria-label={item.title}>
//                 {pathName === item.href ? item.clickedIcon : item.icon}
//               </Link>
//             </li>
//           ))}
//           {user && (
//             <li>
//               <Link href={`/user/${user.username}`}>
//                 <Avatar image={user.image} size="small" highlight />
//               </Link>
//             </li>
//           )}
//           <li>
//             {session ? (
//               <ColorButton text="Sign out" onClick={() => signOut()} />
//             ) : (
//               <ColorButton text="Sign in" onClick={() => signIn()} />
//             )}
//           </li>
//  </ul>
