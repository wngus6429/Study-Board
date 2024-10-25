"use client";
import React from "react";
import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Toolbar from "@mui/material/Toolbar";
import IconButton from "@mui/material/IconButton";
import MenuIcon from "@mui/icons-material/Menu";
import AccountCircle from "@mui/icons-material/AccountCircle";
import Search from "@mui/icons-material/Search";
import InputBase from "@mui/material/InputBase";
import { styled, alpha } from "@mui/material/styles";
import { Button, Link } from "@mui/material";

import { useRouter } from "next/navigation";
import axios from "axios";
import styles from "./style/TopBar.module.css";
// import { useSession } from "next-auth/react";

const SearchBox = styled("div")(({ theme }) => ({
  position: "relative",
  borderRadius: theme.shape.borderRadius,
  background: `linear-gradient(45deg, ${alpha(theme.palette.common.white, 0.15)}, ${alpha(theme.palette.common.white, 0.25)})`,
  "&:hover": {
    background: `linear-gradient(45deg, ${alpha(theme.palette.common.white, 0.25)}, ${alpha(theme.palette.common.white, 0.35)})`,
  },
  marginLeft: 0,
  width: "100%",
  [theme.breakpoints.up("sm")]: {
    marginLeft: theme.spacing(1),
    width: "auto",
  },
}));

const StyledInputBase = styled(InputBase)(({ theme }) => ({
  color: "inherit",
  "& .MuiInputBase-input": {
    padding: theme.spacing(1, 1, 1, 0),
    paddingLeft: `calc(1em + ${theme.spacing(4)})`,
    transition: theme.transitions.create("width"),
    width: "100%",
    [theme.breakpoints.up("md")]: {
      width: "20ch",
    },
  },
}));

export default function MenuBar() {
  const Router = useRouter();

  const logout = () => {
    axios.post(`${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/logout`, {}, { withCredentials: true }).then((res) => {
      console.log("logout res:", res);
      Router.push("/");
    });
  };
  return (
    <div className={styles.container}>
      <Link href="/" aria-label="Home">
        <h1 className={styles.title}>Live Board</h1>
      </Link>
      <nav className={styles.nav}>
        <Button variant="contained" onClick={() => Router.push("/login")} color="info">
          로그인
        </Button>
        <Button variant="contained" onClick={logout} color="error">
          로그아웃
        </Button>
        <Button variant="contained" onClick={() => Router.push("/signup")} color="inherit">
          회원가입
        </Button>
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
