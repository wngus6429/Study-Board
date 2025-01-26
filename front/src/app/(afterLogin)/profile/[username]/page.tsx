"use client";
import { useEffect } from "react";
import { dehydrate, HydrationBoundary, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import Loading from "@/app/components/common/Loading";
import { useMessage } from "@/app/store/messageStore";
import { useRouter } from "next/navigation";
import { useParams } from "next/navigation";
import AnotherUserProfile from "../components/AnotherUserProfile";

export default function UserProfileDetail() {
  const params = useParams();
  const username = params?.username as string;
  const router = useRouter();
  const queryClient = useQueryClient();
  const { showMessage } = useMessage((state) => state);

  // 프로필 정보 불러옴
  const fetchUserDetail = async (username: string) => {
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
      fetchUserDetail(username);
    },
    // F5 새로고침 시 세션이 인증된 상태에서만 요청을 수행합니다.
    // 이거 안하니까. F5 새로고침 시 세션이 인증되지 않은 상태에서 API요청을 수행해서 안 불러옴
    enabled: !!username,
    staleTime: 1000 * 20 * 1,
    gcTime: 1000 * 20 * 1,
  });

  useEffect(() => {
    if (error) {
      showMessage("오류가 발생했습니다. 다시 시도해주세요.", "error");
      router.replace("/not-found"); // 404 페이지로 이동
    }
  }, [error, router]);

  // React Query 캐시 직렬화
  const dehydratedState = dehydrate(queryClient);

  return (
    <HydrationBoundary state={dehydratedState}>
      {userDetail != null ? <AnotherUserProfile userDetail={userDetail} /> : <Loading />}
    </HydrationBoundary>
  );
}
