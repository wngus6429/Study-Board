"use client";
import React, { useState } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardMedia,
  Grid,
  Chip,
  Button,
  TextField,
  InputAdornment,
  useTheme,
  Avatar,
  IconButton,
  Tooltip,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import PeopleIcon from "@mui/icons-material/People";
import ArticleIcon from "@mui/icons-material/Article";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import AddIcon from "@mui/icons-material/Add";
import { useRouter } from "next/navigation";

// Mock 데이터
const mockChannels = [
  {
    id: 1,
    name: "프로그래밍",
    description: "개발자들의 소통 공간입니다. 코딩 팁, 기술 토론, 프로젝트 공유 등",
    image: "/api/placeholder/300/200",
    memberCount: 15420,
    postCount: 8934,
    category: "기술",
    isHot: true,
    tags: ["개발", "코딩", "IT"],
    lastActivity: "5분 전",
    owner: "코딩마스터",
  },
  {
    id: 2,
    name: "게임 토론",
    description: "최신 게임 정보와 리뷰, 공략을 공유하는 채널",
    image: "/api/placeholder/300/200",
    memberCount: 23150,
    postCount: 12456,
    category: "게임",
    isHot: true,
    tags: ["게임", "리뷰", "공략"],
    lastActivity: "2분 전",
    owner: "게임러버",
  },
  {
    id: 3,
    name: "요리 레시피",
    description: "맛있는 요리 레시피와 요리 팁을 나누는 공간",
    image: "/api/placeholder/300/200",
    memberCount: 8750,
    postCount: 5623,
    category: "생활",
    isHot: false,
    tags: ["요리", "레시피", "음식"],
    lastActivity: "15분 전",
    owner: "셰프김",
  },
  {
    id: 4,
    name: "여행 정보",
    description: "국내외 여행 정보와 후기를 공유하는 채널",
    image: "/api/placeholder/300/200",
    memberCount: 12340,
    postCount: 7890,
    category: "여행",
    isHot: false,
    tags: ["여행", "관광", "후기"],
    lastActivity: "1시간 전",
    owner: "여행가",
  },
  {
    id: 5,
    name: "운동 & 헬스",
    description: "건강한 운동 정보와 헬스 팁을 나누는 공간",
    image: "/api/placeholder/300/200",
    memberCount: 9876,
    postCount: 4567,
    category: "건강",
    isHot: false,
    tags: ["운동", "헬스", "건강"],
    lastActivity: "30분 전",
    owner: "헬스트레이너",
  },
  {
    id: 6,
    name: "영화 & 드라마",
    description: "최신 영화와 드라마 리뷰, 추천을 공유하는 채널",
    image: "/api/placeholder/300/200",
    memberCount: 18765,
    postCount: 11234,
    category: "엔터테인먼트",
    isHot: true,
    tags: ["영화", "드라마", "리뷰"],
    lastActivity: "8분 전",
    owner: "영화광",
  },
];

const categories = ["전체", "기술", "게임", "생활", "여행", "건강", "엔터테인먼트"];

const ChannelsPage = () => {
  const theme = useTheme();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("전체");

  // 필터링된 채널 목록
  const filteredChannels = mockChannels.filter((channel) => {
    const matchesSearch =
      channel.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      channel.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "전체" || channel.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleChannelClick = (channelId: number) => {
    router.push(`/channels/${channelId}`);
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
      {/* 헤더 */}
      <Box
        sx={{
          background: theme.palette.mode === "dark" ? "rgba(26, 26, 46, 0.95)" : "#ffffff",
          borderRadius: 3,
          padding: 3,
          marginBottom: 3,
          border: theme.palette.mode === "dark" ? "1px solid rgba(139, 92, 246, 0.4)" : "1px solid rgba(0, 0, 0, 0.1)",
          boxShadow:
            theme.palette.mode === "dark" ? "0px 8px 32px rgba(139, 92, 246, 0.3)" : "0px 4px 20px rgba(0, 0, 0, 0.1)",
        }}
      >
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
          <Typography
            variant="h4"
            sx={{
              color: theme.palette.mode === "dark" ? "#ffffff" : "#1a1a2e",
              fontWeight: "bold",
              textShadow: theme.palette.mode === "dark" ? "0 0 10px rgba(139, 92, 246, 0.5)" : "none",
            }}
          >
            채널 목록
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
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
                transform: "translateY(-1px)",
              },
              boxShadow:
                theme.palette.mode === "dark"
                  ? "0 0 20px rgba(139, 92, 246, 0.4)"
                  : "0 4px 12px rgba(25, 118, 210, 0.3)",
              borderRadius: 2,
              px: 3,
            }}
          >
            채널 만들기
          </Button>
        </Box>

        {/* 검색바 */}
        <TextField
          fullWidth
          placeholder="채널 검색..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: theme.palette.mode === "dark" ? "rgba(139, 92, 246, 0.7)" : "#666" }} />
              </InputAdornment>
            ),
          }}
          sx={{
            "& .MuiOutlinedInput-root": {
              backgroundColor: theme.palette.mode === "dark" ? "rgba(26, 26, 46, 0.8)" : "#f8f9fa",
              "& fieldset": {
                borderColor: theme.palette.mode === "dark" ? "rgba(139, 92, 246, 0.5)" : "rgba(0, 0, 0, 0.2)",
              },
              "&:hover fieldset": {
                borderColor: theme.palette.mode === "dark" ? "rgba(139, 92, 246, 0.8)" : "#1976d2",
              },
              "&.Mui-focused fieldset": {
                borderColor: theme.palette.mode === "dark" ? "rgba(139, 92, 246, 1)" : "#1976d2",
              },
            },
            "& .MuiOutlinedInput-input": {
              color: theme.palette.mode === "dark" ? "#ffffff" : "#1a1a2e",
              "&::placeholder": {
                color: theme.palette.mode === "dark" ? "rgba(255, 255, 255, 0.5)" : "rgba(0, 0, 0, 0.5)",
              },
            },
          }}
        />
      </Box>

      {/* 카테고리 필터 */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
          {categories.map((category) => (
            <Chip
              key={category}
              label={category}
              onClick={() => setSelectedCategory(category)}
              variant={selectedCategory === category ? "filled" : "outlined"}
              sx={{
                backgroundColor:
                  selectedCategory === category
                    ? theme.palette.mode === "dark"
                      ? "rgba(139, 92, 246, 0.8)"
                      : "#1976d2"
                    : "transparent",
                color:
                  selectedCategory === category
                    ? "#ffffff"
                    : theme.palette.mode === "dark"
                      ? "rgba(139, 92, 246, 0.8)"
                      : "#1976d2",
                borderColor: theme.palette.mode === "dark" ? "rgba(139, 92, 246, 0.5)" : "#1976d2",
                "&:hover": {
                  backgroundColor:
                    selectedCategory === category
                      ? theme.palette.mode === "dark"
                        ? "rgba(139, 92, 246, 1)"
                        : "#1565c0"
                      : theme.palette.mode === "dark"
                        ? "rgba(139, 92, 246, 0.1)"
                        : "rgba(25, 118, 210, 0.1)",
                },
                transition: "all 0.2s ease-in-out",
              }}
            />
          ))}
        </Box>
      </Box>

      {/* 채널 카드 그리드 */}
      <Grid container spacing={3}>
        {filteredChannels.map((channel) => (
          <Grid item xs={12} sm={6} md={4} key={channel.id}>
            <Card
              sx={{
                height: "100%",
                background: theme.palette.mode === "dark" ? "rgba(26, 26, 46, 0.95)" : "#ffffff",
                border:
                  theme.palette.mode === "dark" ? "1px solid rgba(139, 92, 246, 0.3)" : "1px solid rgba(0, 0, 0, 0.1)",
                borderRadius: 3,
                overflow: "hidden",
                cursor: "pointer",
                transition: "all 0.3s ease-in-out",
                "&:hover": {
                  transform: "translateY(-4px)",
                  boxShadow:
                    theme.palette.mode === "dark"
                      ? "0px 12px 40px rgba(139, 92, 246, 0.4)"
                      : "0px 8px 30px rgba(0, 0, 0, 0.15)",
                  border:
                    theme.palette.mode === "dark"
                      ? "1px solid rgba(139, 92, 246, 0.6)"
                      : "1px solid rgba(25, 118, 210, 0.3)",
                },
              }}
              onClick={() => handleChannelClick(channel.id)}
            >
              {/* 채널 이미지 */}
              <Box sx={{ position: "relative" }}>
                <CardMedia
                  component="div"
                  sx={{
                    height: 160,
                    background:
                      theme.palette.mode === "dark"
                        ? "linear-gradient(135deg, rgba(139, 92, 246, 0.3), rgba(6, 182, 212, 0.3))"
                        : "linear-gradient(135deg, #e3f2fd, #f3e5f5)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Typography
                    variant="h3"
                    sx={{
                      color: theme.palette.mode === "dark" ? "rgba(139, 92, 246, 0.8)" : "#1976d2",
                      fontWeight: "bold",
                    }}
                  >
                    {channel.name.charAt(0)}
                  </Typography>
                </CardMedia>
                {channel.isHot && (
                  <Chip
                    icon={<TrendingUpIcon />}
                    label="HOT"
                    size="small"
                    sx={{
                      position: "absolute",
                      top: 8,
                      right: 8,
                      background: "linear-gradient(135deg, #ff6b6b, #ff8e53)",
                      color: "#ffffff",
                      fontWeight: "bold",
                    }}
                  />
                )}
              </Box>

              <CardContent sx={{ p: 2 }}>
                {/* 채널 이름 */}
                <Typography
                  variant="h6"
                  sx={{
                    color: theme.palette.mode === "dark" ? "#ffffff" : "#1a1a2e",
                    fontWeight: "bold",
                    mb: 1,
                    textShadow: theme.palette.mode === "dark" ? "0 0 5px rgba(139, 92, 246, 0.3)" : "none",
                  }}
                >
                  {channel.name}
                </Typography>

                {/* 채널 설명 */}
                <Typography
                  variant="body2"
                  sx={{
                    color: theme.palette.mode === "dark" ? "rgba(255, 255, 255, 0.7)" : "rgba(0, 0, 0, 0.6)",
                    mb: 2,
                    height: 40,
                    overflow: "hidden",
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                  }}
                >
                  {channel.description}
                </Typography>

                {/* 통계 정보 */}
                <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                    <PeopleIcon
                      sx={{
                        fontSize: 16,
                        color: theme.palette.mode === "dark" ? "rgba(139, 92, 246, 0.7)" : "#666",
                      }}
                    />
                    <Typography
                      variant="caption"
                      sx={{
                        color: theme.palette.mode === "dark" ? "rgba(255, 255, 255, 0.6)" : "rgba(0, 0, 0, 0.6)",
                      }}
                    >
                      {channel.memberCount.toLocaleString()}
                    </Typography>
                  </Box>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                    <ArticleIcon
                      sx={{
                        fontSize: 16,
                        color: theme.palette.mode === "dark" ? "rgba(6, 182, 212, 0.7)" : "#666",
                      }}
                    />
                    <Typography
                      variant="caption"
                      sx={{
                        color: theme.palette.mode === "dark" ? "rgba(255, 255, 255, 0.6)" : "rgba(0, 0, 0, 0.6)",
                      }}
                    >
                      {channel.postCount.toLocaleString()}
                    </Typography>
                  </Box>
                </Box>

                {/* 태그 */}
                <Box sx={{ display: "flex", gap: 0.5, mb: 2, flexWrap: "wrap" }}>
                  {channel.tags.map((tag) => (
                    <Chip
                      key={tag}
                      label={tag}
                      size="small"
                      sx={{
                        backgroundColor:
                          theme.palette.mode === "dark" ? "rgba(139, 92, 246, 0.2)" : "rgba(25, 118, 210, 0.1)",
                        color: theme.palette.mode === "dark" ? "rgba(139, 92, 246, 0.8)" : "#1976d2",
                        fontSize: "0.7rem",
                      }}
                    />
                  ))}
                </Box>

                {/* 채널 소유자와 마지막 활동 */}
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Avatar
                      sx={{
                        width: 20,
                        height: 20,
                        fontSize: "0.7rem",
                        background:
                          theme.palette.mode === "dark"
                            ? "linear-gradient(135deg, rgba(139, 92, 246, 0.8), rgba(6, 182, 212, 0.8))"
                            : "linear-gradient(135deg, #1976d2, #42a5f5)",
                      }}
                    >
                      {channel.owner.charAt(0)}
                    </Avatar>
                    <Typography
                      variant="caption"
                      sx={{
                        color: theme.palette.mode === "dark" ? "rgba(255, 255, 255, 0.6)" : "rgba(0, 0, 0, 0.6)",
                      }}
                    >
                      {channel.owner}
                    </Typography>
                  </Box>
                  <Typography
                    variant="caption"
                    sx={{
                      color: theme.palette.mode === "dark" ? "rgba(255, 255, 255, 0.5)" : "rgba(0, 0, 0, 0.5)",
                    }}
                  >
                    {channel.lastActivity}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* 검색 결과가 없을 때 */}
      {filteredChannels.length === 0 && (
        <Box
          sx={{
            textAlign: "center",
            py: 8,
            background: theme.palette.mode === "dark" ? "rgba(26, 26, 46, 0.95)" : "#ffffff",
            borderRadius: 3,
            border:
              theme.palette.mode === "dark" ? "1px solid rgba(139, 92, 246, 0.3)" : "1px solid rgba(0, 0, 0, 0.1)",
          }}
        >
          <Typography
            variant="h6"
            sx={{
              color: theme.palette.mode === "dark" ? "rgba(255, 255, 255, 0.6)" : "rgba(0, 0, 0, 0.6)",
              mb: 2,
            }}
          >
            검색 결과가 없습니다
          </Typography>
          <Typography
            variant="body2"
            sx={{
              color: theme.palette.mode === "dark" ? "rgba(255, 255, 255, 0.4)" : "rgba(0, 0, 0, 0.4)",
            }}
          >
            다른 검색어나 카테고리를 시도해보세요
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default ChannelsPage;
