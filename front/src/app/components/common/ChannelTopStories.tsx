"use client";
import React from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { Box, Typography, List, ListItem, Chip, Divider, Card, CardContent } from "@mui/material";
import { Favorite } from "@mui/icons-material";
import axios from "axios";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { CHANNEL_TOP_STORIES_COUNT, MIN_RECOMMEND_COUNT } from "@/app/const/VIEW_COUNT";

dayjs.extend(relativeTime);

interface TopStory {
  id: number;
  title: string;
  like_count: number;
  created_at: string;
  category: string;
  nickname: string;
  recommend_Count: number;
}

interface ChannelInfo {
  id: number;
  channel_name: string;
  slug: string;
}

export default function ChannelTopStories() {
  const params = useParams();
  const router = useRouter();
  const channelSlug = params?.slug as string;

  // 먼저 채널 정보를 가져와서 channelId를 얻습니다
  const { data: channelInfo } = useQuery<ChannelInfo>({
    queryKey: ["channelInfo", channelSlug],
    queryFn: async () => {
      if (!channelSlug) throw new Error("Channel slug is required");
      const response = await axios.get(`${process.env.NEXT_PUBLIC_BASE_URL}/api/channels/slug/${channelSlug}`);
      return response.data;
    },
    enabled: !!channelSlug,
    staleTime: 1000 * 60 * 10, // 10분간 캐시 유지
  });

  // 채널별 개념글 조회 (기존 추천 랭킹 API 사용)
  const {
    data: storiesData,
    isLoading,
    error,
  } = useQuery<{ results: TopStory[]; total: number }>({
    queryKey: ["channelTopStories", channelInfo?.id, MIN_RECOMMEND_COUNT, CHANNEL_TOP_STORIES_COUNT],
    queryFn: async () => {
      if (!channelInfo?.id) return { results: [], total: 0 };
      const apiUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/api/story/pageTableData?channelId=${channelInfo.id}&minRecommend=${MIN_RECOMMEND_COUNT}&limit=${CHANNEL_TOP_STORIES_COUNT}&offset=0`;
      console.log("🔥 채널 개념글 API 호출:", apiUrl);
      console.log("🔥 채널 정보:", channelInfo);
      console.log("🔥 MIN_RECOMMEND_COUNT:", MIN_RECOMMEND_COUNT);

      const response = await axios.get(apiUrl);
      console.log("🔥 채널 개념글 응답 데이터:", response.data);
      return response.data;
    },
    enabled: !!channelInfo?.id,
    staleTime: 1000 * 60 * 5, // 5분간 캐시 유지
  });

  const topStories = storiesData?.results || [];

  // 로딩 중이거나 에러가 있을 때도 표시하도록 수정 (디버깅용)
  if (isLoading) {
    return (
      <Card sx={{ mb: 2, boxShadow: 2 }}>
        <CardContent sx={{ p: 2 }}>
          <Typography variant="h6" color="text.secondary">
            🔄 개념글 로딩 중...
          </Typography>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card sx={{ mb: 2, boxShadow: 2 }}>
        <CardContent sx={{ p: 2 }}>
          <Typography variant="h6" color="error">
            {`❌ 개념글 로딩 에러: ${(error as Error).message}`}
          </Typography>
        </CardContent>
      </Card>
    );
  }

  if (!topStories || topStories.length === 0) {
    return (
      <Card sx={{ mb: 2, boxShadow: 2 }}>
        <CardContent sx={{ p: 2, display: "flex", justifyContent: "center" }}>
          <Typography variant="h6" color="text.secondary">
            📭 추천 개념글이 없습니다
          </Typography>
        </CardContent>
      </Card>
    );
  }

  const handleStoryClick = (storyId: number) => {
    router.push(`/channels/${channelSlug}/detail/story/${storyId}`);
  };

  return (
    <Card sx={{ mb: 1, boxShadow: 2 }}>
      <CardContent sx={{ p: 2 }}>
        <Typography
          variant="h6"
          gutterBottom
          sx={{
            fontWeight: "bold",
            color: "primary.main",
            display: "flex",
            alignItems: "center",
          }}
        >
          🔥 이 채널의 개념글
        </Typography>
        <List sx={{ p: 0 }}>
          {topStories.map((story, index) => (
            <React.Fragment key={story.id}>
              <ListItem
                sx={{
                  p: 0,
                  cursor: "pointer",
                  borderRadius: 1,
                  "&:hover": {
                    bgcolor: "action.hover",
                  },
                }}
                onClick={() => handleStoryClick(story.id)}
              >
                <Box sx={{ width: "100%" }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: "medium",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        flex: 1,
                      }}
                    >
                      {story.title}
                    </Typography>
                    {story.category === "question" && (
                      <Chip label="질문" size="small" color="primary" sx={{ fontSize: "0.7rem", height: "20px" }} />
                    )}
                  </Box>
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <Typography variant="caption" color="text.secondary">
                      {story.nickname} · {dayjs(story.created_at).fromNow()}
                    </Typography>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mr: 1 }}>
                      <Favorite sx={{ fontSize: "14px", color: "error.main" }} />
                      <Typography variant="caption" color="error.main" sx={{ fontWeight: "bold" }}>
                        {story.recommend_Count}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </ListItem>
              {index < topStories.length - 1 && <Divider sx={{ mx: 1 }} />}
            </React.Fragment>
          ))}
        </List>
      </CardContent>
    </Card>
  );
}
