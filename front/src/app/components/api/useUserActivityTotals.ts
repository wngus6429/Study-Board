"use client";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";

export interface ActivityTotals {
  totalPosts: number;
  totalComments: number;
}

export function useUserActivityTotals(nickname?: string) {
  return useQuery<ActivityTotals>({
    queryKey: ["userActivityTotals", nickname],
    enabled: !!nickname,
    queryFn: async () => {
      const base = process.env.NEXT_PUBLIC_BASE_URL;
      const [storyRes, commentsRes] = await Promise.all([
        axios.post(
          `${base}/api/auth/userProfileStoryTableData`,
          { offset: 0, limit: 1, username: nickname },
          { withCredentials: true }
        ),
        axios.post(
          `${base}/api/auth/userProfileCommentsTableData`,
          { offset: 0, limit: 1, username: nickname },
          { withCredentials: true }
        ),
      ]);
      return {
        totalPosts: storyRes.data?.StoryTotal ?? 0,
        totalComments: commentsRes.data?.CommentsTotal ?? 0,
      };
    },
    staleTime: 1000 * 60, // 1분
  });
}
