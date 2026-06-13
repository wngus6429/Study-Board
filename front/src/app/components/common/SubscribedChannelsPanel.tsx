"use client";

import Link from "next/link";
import { Avatar, Box, Card, CardContent, CircularProgress, List, ListItem, ListItemButton, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useSubscriptionStore } from "@/app/store/subscriptionStore";

interface SubscribedChannelsPanelProps {
  onChannelClick?: () => void;
  variant?: "card" | "plain";
}

export default function SubscribedChannelsPanel({ onChannelClick, variant = "card" }: SubscribedChannelsPanelProps) {
  const theme = useTheme();
  const { subscribedChannels, loading } = useSubscriptionStore();

  const titleColor = theme.palette.mode === "dark" ? "rgba(139, 92, 246, 0.8)" : "#1976d2";
  const mutedColor = theme.palette.mode === "dark" ? "rgba(255, 255, 255, 0.5)" : "rgba(0, 0, 0, 0.5)";

  const content = (
    <Box>
      <Typography variant="subtitle2" sx={{ color: titleColor, fontWeight: 600, px: 1 }}>
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
                href={`/channels/${channel.slug}`}
                onClick={onChannelClick}
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
                    sx={{ color: theme.palette.mode === "dark" ? "rgba(255, 255, 255, 0.6)" : "rgba(0, 0, 0, 0.6)" }}
                  >
                    {`${channel.story_count}개 글`}
                  </Typography>
                </Box>
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      ) : (
        <Typography variant="caption" sx={{ color: mutedColor, px: 1, display: "block", mt: 1 }}>
          구독한 채널이 없습니다
        </Typography>
      )}
    </Box>
  );

  if (variant === "plain") {
    return content;
  }

  return (
    <Card
      sx={{
        mb: 2,
        bgcolor: theme.palette.mode === "dark" ? "rgba(26, 26, 46, 0.95)" : "rgba(255, 255, 255, 0.95)",
        border: theme.palette.mode === "dark" ? "1px solid rgba(139, 92, 246, 0.3)" : "1px solid rgba(0, 0, 0, 0.1)",
        borderRadius: "12px",
        boxShadow:
          theme.palette.mode === "dark" ? "0 8px 25px rgba(139, 92, 246, 0.15)" : "0 4px 20px rgba(0, 0, 0, 0.1)",
        backdropFilter: "blur(10px)",
      }}
    >
      <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
        {content}
      </CardContent>
    </Card>
  );
}
