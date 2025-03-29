import { FC } from "react";
import Link from "next/link";
import { Box, List, ListItem, ListItemButton, ListItemText } from "@mui/material";

type MenuItem = {
  name: string;
  path: string;
};

const menuItems: MenuItem[] = [
  { name: "Home", path: "/" },
  { name: "스카이림스카이림", path: "/skyrim" },
  { name: "Contact", path: "/contact" },
];

const NavMenuBar: FC = () => {
  return (
    <Box
      sx={{
        position: "fixed", // 스크롤과 상관없이 고정
        top: "50%", // 수직 중앙
        left: "20px", // 화면 왼쪽에서 약간 띄워서 배치 (원하는 값으로 조정 가능)
        transform: "translateY(-50%)", // 수직 중앙 정렬 보정
        width: 150, // 직사각형의 너비 (원하는 값으로 조정)
        bgcolor: "background.paper", // 배경색 (테마에 맞게 조정)
        border: "1px solid #ccc", // 옅은 테두리
        borderRadius: "8px", // 모서리 둥글게 처리
        boxShadow: 3, // 떠 있는 느낌을 주는 그림자 효과
        p: 2, // 내부 패딩
        zIndex: 1000, // 다른 요소보다 위에 표시
      }}
    >
      <List>
        {menuItems.map((item) => (
          <ListItem key={item.path} disablePadding>
            <ListItemButton component={Link} href={item.path}>
              <ListItemText primary={item.name} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Box>
  );
};

export default NavMenuBar;
