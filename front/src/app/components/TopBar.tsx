"use client";
import React from "react";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import AccountCircle from "@mui/icons-material/AccountCircle";
import { Avatar, Button } from "@mui/material";

import { useRouter } from "next/navigation";
import axios from "axios";
import styles from "./style/TopBar.module.css";
import { signOut, useSession } from "next-auth/react";
import { useMessage } from "../store";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";

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

  console.log("세션", user);

  // const {
  //   data: userImage,
  //   error,
  //   isLoading,
  //   refetch,
  // } = useQuery({
  //   queryKey: ["userImage", user?.user.id],
  //   queryFn: async () => {
  //     if (user?.user != null) {
  //       console.log("확인중");
  //       const response = await axios.post(
  //         `${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/${user.user.id}`,
  //         { image: true },
  //         {
  //           withCredentials: true,
  //         }
  //       );
  //       if (response.status === 201) {
  //         return response.data;
  //       }
  //     }
  //   },
  //   // F5 새로고침 시 세션이 인증된 상태에서만 요청을 수행합니다.
  //   // 이거 안하니까. F5 새로고침 시 세션이 인증되지 않은 상태에서 API요청을 수행해서 안 불러옴
  //   enabled: status === "authenticated",
  // });

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
      <Link href="/" aria-label="Home" className={styles.title}>
        Live Board
      </Link>
      {/* {userImage && <Avatar src={`${process.env.NEXT_PUBLIC_BASE_URL}${userImage}`} />} */}
      <nav className={styles.nav}>
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
