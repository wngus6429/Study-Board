"use client";
import { FormEvent, useEffect, useState } from "react";
import { TextField, Button, Avatar, Typography, Box, Container } from "@mui/material";
import { dehydrate, HydrationBoundary, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import Loading from "@/app/components/common/Loading";
import { useMessage } from "@/app/store/messageStore";
import { USER_TABLE_VIEW_COUNT } from "@/app/const/TABLE_VIEW_COUNT";
import CustomizedUserTables from "@/app/components/CustomizedUserStoryTables";
import CustomizedUserCommentsTables from "@/app/components/CustomizedUserCommentsTables";
import { useRouter } from "next/navigation";
import { useParams } from "next/navigation";
import AnotherUserProfile from "../components/anotherUserProfile";

interface ApiStoryResponse {
  StoryResults: any[];
}

interface ApiCommentsResponse {
  CommentsResults: any[];
}

type Props = {
  params: Promise<{ username: string }>;
};

export default function UserProfileDetail({ props }: { props: { username: string } }) {
  const params = useParams();
  const username = params?.username as string;
  const queryClient = useQueryClient();

  // 프로필 정보 불러옴
  const fetchUserDetail = async (username: string) => {
    console.log("씨발?", username);
    const response = await axios.get(`${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/profile/${username}`);
    return response.data;
  };

  useEffect(() => {
    if (username != null) {
      queryClient.prefetchQuery({
        queryKey: ["userProfileInfo", username],
        queryFn: () => fetchUserDetail(username),
      });
    }
  }, [username]);

  // 세션이 인증된 상태에서만 요청을 수행합니다.
  // 위에 프리패칭된 데이터를 사용, 키가 일치하니까. 새로고침 시에도 데이터가 날라가지 않음
  const {
    data: userDetail,
    error,
    isLoading,
  } = useQuery<any>({
    queryKey: ["userProfileInfo", username],
    queryFn: () => {
      console.log("유즈쿼리");
      fetchUserDetail(username);
    },
    // F5 새로고침 시 세션이 인증된 상태에서만 요청을 수행합니다.
    // 이거 안하니까. F5 새로고침 시 세션이 인증되지 않은 상태에서 API요청을 수행해서 안 불러옴
    enabled: !!username,
    staleTime: 1000 * 20 * 1,
    gcTime: 1000 * 20 * 1,
  });

  console.log("야잌", userDetail);

  //   useEffect(() => {
  //     if (error) {
  //       if (axios.isAxiosError(error) && error.response?.status === 404) {
  //         router.replace("/not-found"); // 404 페이지로 이동
  //       } else {
  //         showMessage("오류가 발생했습니다. 다시 시도해주세요.", "error");
  //       }
  //     }
  //   }, [error, router]);

  // await queryClient.prefetchQuery({ queryKey: ["users", username], queryFn: getUserServer });

  // React Query 캐시 직렬화
  const dehydratedState = dehydrate(queryClient);

  return (
    <HydrationBoundary state={dehydratedState}>
      <AnotherUserProfile userDetail={userDetail} />
    </HydrationBoundary>
  );
}
