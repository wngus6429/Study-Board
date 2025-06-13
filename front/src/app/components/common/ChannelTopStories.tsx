"use client";
import React from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { Box, Typography, List, ListItem, ListItemText, Chip, Divider, Card, CardContent } from "@mui/material";
import { Favorite } from "@mui/icons-material";
import axios from "axios";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { CHANNEL_TOP_STORIES_COUNT } from "@/app/const/CHANNEL_SETTINGS";

dayjs.extend(relativeTime);

interface TopStory {
  id: number;
  title: string;
  like_count: number;
  created_at: string;
  category: string;
  User: {
    nickname: string;
  };
}

export default function ChannelTopStories() {
  const params = useParams();
  const router = useRouter();
  const channelSlug = params?.slug as string;

  // 채널별 개념글 조회
  const { data: topStories, isLoading } = useQuery<TopStory[]>({
    queryKey: ["channelTopStories", channelSlug],
    queryFn: async () => {
      if (!channelSlug) return [];
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_BASE_URL}/api/channels/slug/${channelSlug}/top-stories?limit=${CHANNEL_TOP_STORIES_COUNT}`
      );
      return response.data;
    },
    enabled: !!channelSlug,
    staleTime: 1000 * 60 * 5, // 5분간 캐시 유지
  });

  if (isLoading || !topStories || topStories.length === 0) {
    return null;
  }

  const handleStoryClick = (storyId: number) => {
    router.push(`/channels/${channelSlug}/detail/story/${storyId}`);
  };

  return (
    <Card sx={{ mb: 2, boxShadow: 2 }}>
      <CardContent sx={{ p: 2 }}>
        <Typography
          variant="h6"
          gutterBottom
          sx={{
            fontWeight: "bold",
            color: "primary.main",
            display: "flex",
            alignItems: "center",
            gap: 1,
            mb: 2,
          }}
        >
          🔥 이 채널의 개념글
        </Typography>
        <List sx={{ p: 0 }}>
          {topStories.map((story, index) => (
            <React.Fragment key={story.id}>
              <ListItem
                sx={{
                  p: 1,
                  cursor: "pointer",
                  borderRadius: 1,
                  "&:hover": {
                    bgcolor: "action.hover",
                  },
                }}
                onClick={() => handleStoryClick(story.id)}
              >
                <ListItemText
                  primary={
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
                  }
                  secondary={
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <Typography variant="caption" color="text.secondary">
                        {story.User.nickname} · {dayjs(story.created_at).fromNow()}
                      </Typography>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                        <Favorite sx={{ fontSize: "14px", color: "error.main" }} />
                        <Typography variant="caption" color="error.main" sx={{ fontWeight: "bold" }}>
                          {story.like_count}
                        </Typography>
                      </Box>
                    </Box>
                  }
                />
              </ListItem>
              {index < topStories.length - 1 && <Divider sx={{ mx: 1 }} />}
            </React.Fragment>
          ))}
        </List>
      </CardContent>
    </Card>
  );
}
