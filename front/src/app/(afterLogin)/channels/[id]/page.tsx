"use client";
import React, { useState } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Avatar,
  Chip,
  Tab,
  Tabs,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Menu,
  MenuItem,
  useTheme,
  Divider,
  Badge,
} from "@mui/material";
import {
  Settings as SettingsIcon,
  PersonAdd as PersonAddIcon,
  Notifications as NotificationsIcon,
  NotificationsOff as NotificationsOffIcon,
  MoreVert as MoreVertIcon,
  ThumbUp as ThumbUpIcon,
  Comment as CommentIcon,
  Visibility as VisibilityIcon,
  Create as CreateIcon,
  Star as StarIcon,
  People as PeopleIcon,
  Article as ArticleIcon,
  TrendingUp as TrendingUpIcon,
} from "@mui/icons-material";
import { useRouter, useParams } from "next/navigation";

// Mock 데이터
const mockChannelData = {
  1: {
    id: 1,
    name: "프로그래밍",
    description: "개발자들의 소통 공간입니다. 코딩 팁, 기술 토론, 프로젝트 공유 등을 자유롭게 나누세요.",
    memberCount: 15420,
    postCount: 8934,
    category: "기술",
    isHot: true,
    tags: ["개발", "코딩", "IT", "프로그래밍", "웹개발"],
    owner: "코딩마스터",
    createdAt: "2023-01-15",
    rules: [
      "서로 존중하며 대화해주세요",
      "스팸성 게시글은 금지입니다",
      "개발 관련 내용만 게시해주세요",
      "질문할 때는 구체적으로 작성해주세요",
    ],
    moderators: ["코딩마스터", "개발자A", "프로그래머B"],
    isSubscribed: false,
    isNotificationEnabled: false,
  },
};

const mockPosts = [
  {
    id: 1,
    title: "React 18의 새로운 기능들 정리",
    author: "리액트개발자",
    createdAt: "2024-01-15 14:30",
    views: 1234,
    likes: 89,
    comments: 23,
    isHot: true,
    isPinned: true,
    category: "정보",
  },
  {
    id: 2,
    title: "TypeScript 초보자를 위한 가이드",
    author: "타입스크립트마스터",
    createdAt: "2024-01-15 13:15",
    views: 856,
    likes: 67,
    comments: 15,
    isHot: false,
    isPinned: false,
    category: "질문",
  },
  {
    id: 3,
    title: "Next.js 14 업데이트 후기",
    author: "넥스트개발자",
    createdAt: "2024-01-15 12:00",
    views: 2341,
    likes: 156,
    comments: 45,
    isHot: true,
    isPinned: false,
    category: "후기",
  },
  {
    id: 4,
    title: "백엔드 API 설계 베스트 프랙티스",
    author: "백엔드엔지니어",
    createdAt: "2024-01-15 10:45",
    views: 1876,
    likes: 134,
    comments: 32,
    isHot: false,
    isPinned: false,
    category: "정보",
  },
  {
    id: 5,
    title: "프론트엔드 성능 최적화 팁",
    author: "프론트엔드개발자",
    createdAt: "2024-01-15 09:30",
    views: 1567,
    likes: 98,
    comments: 28,
    isHot: false,
    isPinned: false,
    category: "팁",
  },
];

const ChannelDetailPage = () => {
  const theme = useTheme();
  const router = useRouter();
  const params = useParams();
  const channelId = params?.id ? Number(params.id) : 0;

  const [currentTab, setCurrentTab] = useState(0);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isNotificationEnabled, setIsNotificationEnabled] = useState(false);

  const channelData = mockChannelData[channelId as keyof typeof mockChannelData];

  if (!channelData || channelId === 0) {
    return (
      <Box sx={{ textAlign: "center", py: 8 }}>
        <Typography variant="h6">채널을 찾을 수 없습니다.</Typography>
      </Box>
    );
  }

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
  };

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleSubscribe = () => {
    setIsSubscribed(!isSubscribed);
  };

  const handleNotificationToggle = () => {
    setIsNotificationEnabled(!isNotificationEnabled);
  };

  const handlePostClick = (postId: number) => {
    router.push(`/channels/${channelId}/posts/${postId}`);
  };

  const handleWritePost = () => {
    router.push(`/channels/${channelId}/write`);
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background:
          theme.palette.mode === "dark"
            ? "linear-gradient(135deg, rgba(26, 26, 46, 0.95), rgba(16, 16, 32, 0.98))"
            : "linear-gradient(135deg, #f8f9fa, #e9ecef)",
        padding: 3,
      }}
    >
      {/* 채널 헤더 */}
      <Card
        sx={{
          background: theme.palette.mode === "dark" ? "rgba(26, 26, 46, 0.95)" : "#ffffff",
          border: theme.palette.mode === "dark" ? "1px solid rgba(139, 92, 246, 0.4)" : "1px solid rgba(0, 0, 0, 0.1)",
          borderRadius: 3,
          marginBottom: 3,
          boxShadow:
            theme.palette.mode === "dark" ? "0px 8px 32px rgba(139, 92, 246, 0.3)" : "0px 4px 20px rgba(0, 0, 0, 0.1)",
        }}
      >
        <CardContent sx={{ p: 4 }}>
          {/* 채널 기본 정보 */}
          <Box sx={{ display: "flex", alignItems: "flex-start", gap: 3, mb: 3 }}>
            <Avatar
              sx={{
                width: 80,
                height: 80,
                fontSize: "2rem",
                background:
                  theme.palette.mode === "dark"
                    ? "linear-gradient(135deg, rgba(139, 92, 246, 0.8), rgba(6, 182, 212, 0.8))"
                    : "linear-gradient(135deg, #1976d2, #42a5f5)",
                boxShadow:
                  theme.palette.mode === "dark"
                    ? "0 0 20px rgba(139, 92, 246, 0.4)"
                    : "0 4px 12px rgba(25, 118, 210, 0.3)",
              }}
            >
              {channelData.name.charAt(0)}
            </Avatar>

            <Box sx={{ flex: 1 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 1 }}>
                <Typography
                  variant="h4"
                  sx={{
                    color: theme.palette.mode === "dark" ? "#ffffff" : "#1a1a2e",
                    fontWeight: "bold",
                    textShadow: theme.palette.mode === "dark" ? "0 0 10px rgba(139, 92, 246, 0.5)" : "none",
                  }}
                >
                  {channelData.name}
                </Typography>
                {channelData.isHot && (
                  <Chip
                    icon={<TrendingUpIcon />}
                    label="HOT"
                    size="small"
                    sx={{
                      background: "linear-gradient(135deg, #ff6b6b, #ff8e53)",
                      color: "#ffffff",
                      fontWeight: "bold",
                    }}
                  />
                )}
              </Box>

              <Typography
                variant="body1"
                sx={{
                  color: theme.palette.mode === "dark" ? "rgba(255, 255, 255, 0.8)" : "rgba(0, 0, 0, 0.7)",
                  mb: 2,
                  lineHeight: 1.6,
                }}
              >
                {channelData.description}
              </Typography>

              {/* 통계 정보 */}
              <Box sx={{ display: "flex", gap: 4, mb: 2 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <PeopleIcon sx={{ color: theme.palette.mode === "dark" ? "rgba(139, 92, 246, 0.7)" : "#666" }} />
                  <Typography
                    variant="body2"
                    sx={{ color: theme.palette.mode === "dark" ? "rgba(255, 255, 255, 0.7)" : "rgba(0, 0, 0, 0.7)" }}
                  >
                    멤버 {channelData.memberCount.toLocaleString()}명
                  </Typography>
                </Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <ArticleIcon sx={{ color: theme.palette.mode === "dark" ? "rgba(6, 182, 212, 0.7)" : "#666" }} />
                  <Typography
                    variant="body2"
                    sx={{ color: theme.palette.mode === "dark" ? "rgba(255, 255, 255, 0.7)" : "rgba(0, 0, 0, 0.7)" }}
                  >
                    게시글 {channelData.postCount.toLocaleString()}개
                  </Typography>
                </Box>
              </Box>

              {/* 태그 */}
              <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                {channelData.tags.map((tag) => (
                  <Chip
                    key={tag}
                    label={tag}
                    size="small"
                    sx={{
                      backgroundColor:
                        theme.palette.mode === "dark" ? "rgba(139, 92, 246, 0.2)" : "rgba(25, 118, 210, 0.1)",
                      color: theme.palette.mode === "dark" ? "rgba(139, 92, 246, 0.8)" : "#1976d2",
                    }}
                  />
                ))}
              </Box>
            </Box>

            {/* 액션 버튼들 */}
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
              <Button
                variant={isSubscribed ? "outlined" : "contained"}
                startIcon={isSubscribed ? <StarIcon /> : <PersonAddIcon />}
                onClick={handleSubscribe}
                sx={{
                  background:
                    !isSubscribed && theme.palette.mode === "dark"
                      ? "linear-gradient(135deg, rgba(139, 92, 246, 0.8), rgba(6, 182, 212, 0.8))"
                      : !isSubscribed
                        ? "linear-gradient(135deg, #1976d2, #42a5f5)"
                        : "transparent",
                  borderColor: theme.palette.mode === "dark" ? "rgba(139, 92, 246, 0.5)" : "#1976d2",
                  color: isSubscribed
                    ? theme.palette.mode === "dark"
                      ? "rgba(139, 92, 246, 0.8)"
                      : "#1976d2"
                    : "#ffffff",
                  "&:hover": {
                    background:
                      !isSubscribed && theme.palette.mode === "dark"
                        ? "linear-gradient(135deg, rgba(139, 92, 246, 1), rgba(6, 182, 212, 1))"
                        : !isSubscribed
                          ? "linear-gradient(135deg, #1565c0, #1976d2)"
                          : theme.palette.mode === "dark"
                            ? "rgba(139, 92, 246, 0.1)"
                            : "rgba(25, 118, 210, 0.1)",
                  },
                  minWidth: 120,
                }}
              >
                {isSubscribed ? "구독중" : "구독하기"}
              </Button>

              <Button
                variant="outlined"
                startIcon={isNotificationEnabled ? <NotificationsIcon /> : <NotificationsOffIcon />}
                onClick={handleNotificationToggle}
                size="small"
                sx={{
                  borderColor: theme.palette.mode === "dark" ? "rgba(139, 92, 246, 0.5)" : "#1976d2",
                  color: theme.palette.mode === "dark" ? "rgba(139, 92, 246, 0.8)" : "#1976d2",
                  "&:hover": {
                    backgroundColor:
                      theme.palette.mode === "dark" ? "rgba(139, 92, 246, 0.1)" : "rgba(25, 118, 210, 0.1)",
                  },
                  minWidth: 120,
                }}
              >
                {isNotificationEnabled ? "알림끄기" : "알림받기"}
              </Button>

              <IconButton
                onClick={handleMenuClick}
                sx={{
                  color: theme.palette.mode === "dark" ? "rgba(255, 255, 255, 0.7)" : "rgba(0, 0, 0, 0.7)",
                  "&:hover": {
                    backgroundColor:
                      theme.palette.mode === "dark" ? "rgba(139, 92, 246, 0.1)" : "rgba(25, 118, 210, 0.1)",
                  },
                }}
              >
                <MoreVertIcon />
              </IconButton>

              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
                sx={{
                  "& .MuiPaper-root": {
                    backgroundColor: theme.palette.mode === "dark" ? "rgba(26, 26, 46, 0.95)" : "#ffffff",
                    border:
                      theme.palette.mode === "dark"
                        ? "1px solid rgba(139, 92, 246, 0.3)"
                        : "1px solid rgba(0, 0, 0, 0.1)",
                  },
                }}
              >
                <MenuItem onClick={handleMenuClose}>
                  <SettingsIcon sx={{ mr: 1 }} />
                  채널 설정
                </MenuItem>
                <MenuItem onClick={handleMenuClose}>신고하기</MenuItem>
              </Menu>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* 탭 네비게이션 */}
      <Card
        sx={{
          background: theme.palette.mode === "dark" ? "rgba(26, 26, 46, 0.95)" : "#ffffff",
          border: theme.palette.mode === "dark" ? "1px solid rgba(139, 92, 246, 0.4)" : "1px solid rgba(0, 0, 0, 0.1)",
          borderRadius: 3,
          marginBottom: 3,
        }}
      >
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", p: 2 }}>
          <Tabs
            value={currentTab}
            onChange={handleTabChange}
            sx={{
              "& .MuiTab-root": {
                color: theme.palette.mode === "dark" ? "rgba(255, 255, 255, 0.7)" : "rgba(0, 0, 0, 0.7)",
                "&.Mui-selected": {
                  color: theme.palette.mode === "dark" ? "rgba(139, 92, 246, 1)" : "#1976d2",
                },
              },
              "& .MuiTabs-indicator": {
                backgroundColor: theme.palette.mode === "dark" ? "rgba(139, 92, 246, 1)" : "#1976d2",
              },
            }}
          >
            <Tab label="게시글" />
            <Tab label="공지사항" />
            <Tab label="채널 정보" />
          </Tabs>

          <Button
            variant="contained"
            startIcon={<CreateIcon />}
            onClick={handleWritePost}
            sx={{
              background:
                theme.palette.mode === "dark"
                  ? "linear-gradient(135deg, rgba(139, 92, 246, 0.8), rgba(6, 182, 212, 0.8))"
                  : "linear-gradient(135deg, #1976d2, #42a5f5)",
              "&:hover": {
                background:
                  theme.palette.mode === "dark"
                    ? "linear-gradient(135deg, rgba(139, 92, 246, 1), rgba(6, 182, 212, 1))"
                    : "linear-gradient(135deg, #1565c0, #1976d2)",
              },
              boxShadow:
                theme.palette.mode === "dark"
                  ? "0 0 20px rgba(139, 92, 246, 0.4)"
                  : "0 4px 12px rgba(25, 118, 210, 0.3)",
            }}
          >
            글쓰기
          </Button>
        </Box>
      </Card>

      {/* 탭 컨텐츠 */}
      {currentTab === 0 && (
        <Card
          sx={{
            background: theme.palette.mode === "dark" ? "rgba(26, 26, 46, 0.95)" : "#ffffff",
            border:
              theme.palette.mode === "dark" ? "1px solid rgba(139, 92, 246, 0.4)" : "1px solid rgba(0, 0, 0, 0.1)",
            borderRadius: 3,
          }}
        >
          <TableContainer component={Paper} sx={{ backgroundColor: "transparent" }}>
            <Table>
              <TableHead>
                <TableRow
                  sx={{
                    backgroundColor:
                      theme.palette.mode === "dark" ? "rgba(139, 92, 246, 0.2)" : "rgba(25, 118, 210, 0.1)",
                  }}
                >
                  <TableCell sx={{ color: theme.palette.mode === "dark" ? "#ffffff" : "#1a1a2e", fontWeight: "bold" }}>
                    제목
                  </TableCell>
                  <TableCell sx={{ color: theme.palette.mode === "dark" ? "#ffffff" : "#1a1a2e", fontWeight: "bold" }}>
                    작성자
                  </TableCell>
                  <TableCell sx={{ color: theme.palette.mode === "dark" ? "#ffffff" : "#1a1a2e", fontWeight: "bold" }}>
                    작성일
                  </TableCell>
                  <TableCell sx={{ color: theme.palette.mode === "dark" ? "#ffffff" : "#1a1a2e", fontWeight: "bold" }}>
                    조회
                  </TableCell>
                  <TableCell sx={{ color: theme.palette.mode === "dark" ? "#ffffff" : "#1a1a2e", fontWeight: "bold" }}>
                    추천
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {mockPosts.map((post) => (
                  <TableRow
                    key={post.id}
                    onClick={() => handlePostClick(post.id)}
                    sx={{
                      cursor: "pointer",
                      backgroundColor:
                        theme.palette.mode === "dark"
                          ? post.isPinned
                            ? "rgba(139, 92, 246, 0.1)"
                            : "transparent"
                          : post.isPinned
                            ? "rgba(25, 118, 210, 0.05)"
                            : "transparent",
                      "&:hover": {
                        backgroundColor:
                          theme.palette.mode === "dark" ? "rgba(139, 92, 246, 0.15)" : "rgba(25, 118, 210, 0.1)",
                      },
                    }}
                  >
                    <TableCell>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        {post.isPinned && (
                          <Chip
                            label="공지"
                            size="small"
                            sx={{
                              backgroundColor: theme.palette.mode === "dark" ? "rgba(139, 92, 246, 0.8)" : "#1976d2",
                              color: "#ffffff",
                              fontSize: "0.7rem",
                            }}
                          />
                        )}
                        {post.isHot && (
                          <Chip
                            label="HOT"
                            size="small"
                            sx={{
                              background: "linear-gradient(135deg, #ff6b6b, #ff8e53)",
                              color: "#ffffff",
                              fontSize: "0.7rem",
                            }}
                          />
                        )}
                        <Typography
                          sx={{
                            color: theme.palette.mode === "dark" ? "#ffffff" : "#1a1a2e",
                            fontWeight: post.isPinned ? "bold" : "normal",
                          }}
                        >
                          {post.title}
                        </Typography>
                        <Badge badgeContent={post.comments} color="primary" sx={{ ml: 1 }}>
                          <CommentIcon
                            sx={{
                              fontSize: 16,
                              color: theme.palette.mode === "dark" ? "rgba(255, 255, 255, 0.5)" : "rgba(0, 0, 0, 0.5)",
                            }}
                          />
                        </Badge>
                      </Box>
                    </TableCell>
                    <TableCell
                      sx={{ color: theme.palette.mode === "dark" ? "rgba(255, 255, 255, 0.7)" : "rgba(0, 0, 0, 0.7)" }}
                    >
                      {post.author}
                    </TableCell>
                    <TableCell
                      sx={{ color: theme.palette.mode === "dark" ? "rgba(255, 255, 255, 0.7)" : "rgba(0, 0, 0, 0.7)" }}
                    >
                      {post.createdAt}
                    </TableCell>
                    <TableCell
                      sx={{ color: theme.palette.mode === "dark" ? "rgba(255, 255, 255, 0.7)" : "rgba(0, 0, 0, 0.7)" }}
                    >
                      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                        <VisibilityIcon sx={{ fontSize: 16 }} />
                        {post.views.toLocaleString()}
                      </Box>
                    </TableCell>
                    <TableCell
                      sx={{ color: theme.palette.mode === "dark" ? "rgba(255, 255, 255, 0.7)" : "rgba(0, 0, 0, 0.7)" }}
                    >
                      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                        <ThumbUpIcon
                          sx={{
                            fontSize: 16,
                            color: theme.palette.mode === "dark" ? "rgba(139, 92, 246, 0.7)" : "#1976d2",
                          }}
                        />
                        {post.likes}
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      )}

      {currentTab === 1 && (
        <Card
          sx={{
            background: theme.palette.mode === "dark" ? "rgba(26, 26, 46, 0.95)" : "#ffffff",
            border:
              theme.palette.mode === "dark" ? "1px solid rgba(139, 92, 246, 0.4)" : "1px solid rgba(0, 0, 0, 0.1)",
            borderRadius: 3,
            p: 3,
          }}
        >
          <Typography
            variant="h6"
            sx={{
              color: theme.palette.mode === "dark" ? "#ffffff" : "#1a1a2e",
              mb: 2,
            }}
          >
            공지사항
          </Typography>
          <Typography
            sx={{
              color: theme.palette.mode === "dark" ? "rgba(255, 255, 255, 0.7)" : "rgba(0, 0, 0, 0.7)",
            }}
          >
            아직 공지사항이 없습니다.
          </Typography>
        </Card>
      )}

      {currentTab === 2 && (
        <Card
          sx={{
            background: theme.palette.mode === "dark" ? "rgba(26, 26, 46, 0.95)" : "#ffffff",
            border:
              theme.palette.mode === "dark" ? "1px solid rgba(139, 92, 246, 0.4)" : "1px solid rgba(0, 0, 0, 0.1)",
            borderRadius: 3,
            p: 3,
          }}
        >
          <Typography
            variant="h6"
            sx={{
              color: theme.palette.mode === "dark" ? "#ffffff" : "#1a1a2e",
              mb: 2,
            }}
          >
            채널 규칙
          </Typography>
          <Box sx={{ mb: 3 }}>
            {channelData.rules.map((rule, index) => (
              <Typography
                key={index}
                sx={{
                  color: theme.palette.mode === "dark" ? "rgba(255, 255, 255, 0.8)" : "rgba(0, 0, 0, 0.8)",
                  mb: 1,
                }}
              >
                {index + 1}. {rule}
              </Typography>
            ))}
          </Box>

          <Divider
            sx={{
              my: 3,
              borderColor: theme.palette.mode === "dark" ? "rgba(139, 92, 246, 0.3)" : "rgba(0, 0, 0, 0.1)",
            }}
          />

          <Typography
            variant="h6"
            sx={{
              color: theme.palette.mode === "dark" ? "#ffffff" : "#1a1a2e",
              mb: 2,
            }}
          >
            운영진
          </Typography>
          <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
            {channelData.moderators.map((moderator) => (
              <Chip
                key={moderator}
                avatar={
                  <Avatar
                    sx={{
                      background:
                        theme.palette.mode === "dark"
                          ? "linear-gradient(135deg, rgba(139, 92, 246, 0.8), rgba(6, 182, 212, 0.8))"
                          : "linear-gradient(135deg, #1976d2, #42a5f5)",
                    }}
                  >
                    {moderator.charAt(0)}
                  </Avatar>
                }
                label={moderator}
                sx={{
                  backgroundColor:
                    theme.palette.mode === "dark" ? "rgba(139, 92, 246, 0.2)" : "rgba(25, 118, 210, 0.1)",
                  color: theme.palette.mode === "dark" ? "#ffffff" : "#1a1a2e",
                }}
              />
            ))}
          </Box>
        </Card>
      )}
    </Box>
  );
};

export default ChannelDetailPage;
