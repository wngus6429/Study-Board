"use client";
import { FC, useEffect } from "react";
import Link from "next/link";
import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Typography,
  Divider,
  Chip,
  Avatar,
  CircularProgress,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useSubscriptionStore } from "../store/subscriptionStore";

type MenuItem = {
  name: string;
  path: string;
};

const menuItems: MenuItem[] = [
  { name: "Home", path: "/" },
  { name: "채널", path: "/channels" },
  { name: "스카이림스카이림", path: "/skyrim" },
  { name: "Contact", path: "/contact" },
];

const NavMenuBar: FC = () => {
  const theme = useTheme();
  const { subscribedChannels, loading, error, loadSubscriptions } = useSubscriptionStore();

  useEffect(() => {
    loadSubscriptions();
  }, [loadSubscriptions]);

  return (
    <Box
      sx={{
        position: "fixed", // 스크롤과 상관없이 고정
        top: "50%", // 수직 중앙
        left: "20px", // 화면 왼쪽에서 약간 띄워서 배치 (원하는 값으로 조정 가능)
        transform: "translateY(-50%)", // 수직 중앙 정렬 보정
        width: 200, // 직사각형의 너비 (구독 채널 표시를 위해 확장)
        maxHeight: "80vh", // 최대 높이 설정
        overflow: "auto", // 스크롤 가능하게
        bgcolor: theme.palette.mode === "dark" ? "rgba(26, 26, 46, 0.95)" : "background.paper", // 배경색 (테마에 맞게 조정)
        border: theme.palette.mode === "dark" ? "1px solid rgba(139, 92, 246, 0.3)" : "1px solid #ccc", // 옅은 테두리
        borderRadius: "8px", // 모서리 둥글게 처리
        boxShadow: theme.palette.mode === "dark" ? "0 8px 25px rgba(139, 92, 246, 0.15)" : 3, // 떠 있는 느낌을 주는 그림자 효과
        p: 2, // 내부 패딩
        zIndex: 1000, // 다른 요소보다 위에 표시
      }}
    >
      {/* 메뉴 항목들 */}
      <List>
        {menuItems.map((item) => (
          <ListItem key={item.path} disablePadding>
            <ListItemButton
              component={Link}
              href={item.path}
              sx={{
                borderRadius: 1,
                "&:hover": {
                  backgroundColor: theme.palette.mode === "dark" ? "rgba(139, 92, 246, 0.1)" : "rgba(0, 0, 0, 0.04)",
                },
              }}
            >
              <ListItemText
                primary={item.name}
                sx={{
                  "& .MuiTypography-root": {
                    color: theme.palette.mode === "dark" ? "#e2e8f0" : "inherit",
                    fontWeight: 500,
                  },
                }}
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>

      <Divider
        sx={{
          my: 2,
          borderColor: theme.palette.mode === "dark" ? "rgba(139, 92, 246, 0.3)" : "rgba(0, 0, 0, 0.12)",
        }}
      />

      {/* 구독한 채널 섹션 */}
      <Typography
        variant="subtitle2"
        sx={{
          color: theme.palette.mode === "dark" ? "rgba(139, 92, 246, 0.8)" : "#1976d2",
          fontWeight: 600,
          mb: 1,
          px: 1,
        }}
      >
        구독한 채널
      </Typography>

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 2 }}>
          <CircularProgress size={20} />
        </Box>
      ) : subscribedChannels.length > 0 ? (
        <List dense>
          {subscribedChannels.map((channel) => (
            <ListItem key={channel.id} disablePadding>
              <ListItemButton
                component={Link}
                href={`/channels/${channel.id}`}
                sx={{
                  borderRadius: 1,
                  py: 0.5,
                  "&:hover": {
                    backgroundColor: theme.palette.mode === "dark" ? "rgba(139, 92, 246, 0.1)" : "rgba(0, 0, 0, 0.04)",
                  },
                }}
              >
                <Avatar
                  sx={{
                    width: 24,
                    height: 24,
                    mr: 1,
                    fontSize: "0.8rem",
                    background:
                      theme.palette.mode === "dark"
                        ? "linear-gradient(135deg, rgba(139, 92, 246, 0.6), rgba(6, 182, 212, 0.6))"
                        : "linear-gradient(135deg, #1976d2, #42a5f5)",
                  }}
                >
                  {channel.channel_name.charAt(0)}
                </Avatar>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography
                    variant="body2"
                    sx={{
                      color: theme.palette.mode === "dark" ? "#e2e8f0" : "inherit",
                      fontWeight: 500,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {channel.channel_name}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{
                      color: theme.palette.mode === "dark" ? "rgba(255, 255, 255, 0.6)" : "rgba(0, 0, 0, 0.6)",
                    }}
                  >
                    {channel.story_count}개 글
                  </Typography>
                </Box>
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      ) : (
        <Typography
          variant="caption"
          sx={{
            color: theme.palette.mode === "dark" ? "rgba(255, 255, 255, 0.5)" : "rgba(0, 0, 0, 0.5)",
            px: 1,
            display: "block",
          }}
        >
          구독한 채널이 없습니다
        </Typography>
      )}
    </Box>
  );
};

export default NavMenuBar;
