"use client";
import * as React from "react";
import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Toolbar from "@mui/material/Toolbar";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import Menu from "@mui/material/Menu";
import MenuIcon from "@mui/icons-material/Menu";
import Container from "@mui/material/Container";
import Avatar from "@mui/material/Avatar";
import Button from "@mui/material/Button";
import Tooltip from "@mui/material/Tooltip";
import MenuItem from "@mui/material/MenuItem";
import AdbIcon from "@mui/icons-material/Adb";
import Link from "next/link";

const NavMenuBar = () => {
  const menu = [
    {
      href: "/",
      color: "red",
      title: "게시판",
    },
    {
      href: "/searchFPS",
      color: "blue",
      title: "FPS게임",
    },
    {
      href: "/searchAirplane",
      color: "green",
      title: "비행기 게임",
    },
    {
      href: "/searchRacing",
      color: "purple",
      title: "레이싱게임",
    },
  ];

  return (
    <div className="flex justify-center items-center px-6">
      <nav>
        <ul className="flex gap-4 items-center p-4">
          {menu.map((item) => (
            <li key={item.href}>
              <Link href={item.href} aria-label={item.title}>
                <Button
                  variant="outlined"
                  style={{ borderColor: item.color, color: item.color }}
                  sx={{ "&:hover": { backgroundColor: `${item.color}10` } }}
                >
                  {item.title}
                </Button>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
};

export default NavMenuBar;

{
  /* {user && (
            <li>
              <Link href={`/user/${user.username}`}>
                <Avatar image={user.image} size="small" highlight />
              </Link>
            </li>
          )} */
}
{
  /* <li>
            {session ? (
              <ColorButton text="Sign out" onClick={() => signOut()} />
            ) : (
              <ColorButton text="Sign in" onClick={() => signIn()} />
            )}
          </li> */
}
