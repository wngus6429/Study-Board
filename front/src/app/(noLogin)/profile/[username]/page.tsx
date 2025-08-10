"use client";
import { useEffect, useState } from "react";
import { dehydrate, HydrationBoundary, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import Loading from "@/app/components/common/Loading";
import { useMessage } from "@/app/store/messageStore";
import { useRouter } from "next/navigation";
import { useParams } from "next/navigation";
import { USER_TABLE_VIEW_COUNT } from "@/app/const/VIEW_COUNT";
import CustomizedUserTables from "@/app/components/table/CustomizedUserStoryTables";
import CustomizedUserCommentsTables from "@/app/components/table/CustomizedUserCommentsTables";
import ProfilePagination from "@/app/components/common/ProfilePagination";
import { Avatar, Box, Typography, CircularProgress, useTheme } from "@mui/material";
import UserBadge from "@/app/components/common/UserBadge";

interface ApiStoryResponse {
  StoryResults: any[];
  StoryTotal: number;
}

interface ApiCommentsResponse {
  CommentsResults: any[];
  CommentsTotal: number;
}

export default function UserProfileDetail() {
  const params = useParams();
  const rawUsername = params?.username as string;
  // URL 인코딩된 username을 디코딩
  const username = rawUsername ? decodeURIComponent(rawUsername) : "";
  const router = useRouter();
  const queryClient = useQueryClient();
  const { showMessage } = useMessage((state) => state);
  const theme = useTheme();

  const [storyCurrentPage, setStoryCurrentPage] = useState<number>(1);
  const [commentsCurrentPage, setCommentsCurrentPage] = useState<number>(1);
  const viewCount: number = USER_TABLE_VIEW_COUNT;

  // 프로필 정보 불러옴
  const fetchUserDetail = async (username: string) => {
    const response = await axios.get(`${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/profile/${username}`, {
      headers: { "Cache-Control": "no-cache" },
    });
    return response.data; // user.level, user.experience_points 포함됨
  };

  useEffect(() => {
    if (username != null) {
      queryClient.prefetchQuery({
        queryKey: ["userProfileInfo", username],
        queryFn: () => fetchUserDetail(username),
      });
    }
  }, [username, queryClient]);

  // 사용자 기본 정보 조회
  const {
    data: userDetail,
    error,
    isLoading,
  } = useQuery<any>({
    queryKey: ["userProfileInfo", username],
    queryFn: () => fetchUserDetail(username),
    retry: 1,
    retryDelay: () => 2000,
    enabled: !!username,
    staleTime: 1000 * 10, // 10초간 캐시 유지 (게시판 실시간성 고려)
    gcTime: 1000 * 30, // 30초간 가비지 컬렉션 방지
  });

  // 사용자 작성 글 조회 (페이지네이션)
  const {
    data: UserStory,
    error: UserTableError,
    isLoading: UserStoryIsLoading,
    isFetching: UserStoryIsFetching,
    isPlaceholderData: UserStoryIsPlaceholderData,
  } = useQuery<ApiStoryResponse>({
    queryKey: ["userProfile", "stories", username, storyCurrentPage],
    queryFn: async () => {
      console.log("유저 프로필 스토리 불러옴");
      const offset = (storyCurrentPage - 1) * viewCount;
      const response = await axios.post<ApiStoryResponse>(
        `${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/userProfileStoryTableData`,
        {
          offset,
          limit: viewCount,
          username: username,
        },
        { withCredentials: true }
      );
      return response.data;
    },
    enabled: !!username,
    retry: 1,
    retryDelay: () => 2000,
    staleTime: 1000 * 10, // 10초간 캐시 유지 (게시판 실시간성 고려)
    gcTime: 1000 * 30, // 30초간 가비지 컬렉션 방지
    placeholderData: (previousData) => previousData, // 이전 데이터 유지로 깜빡임 방지
    refetchOnWindowFocus: false, // 윈도우 포커스 시 재요청 방지
  });

  // 사용자 작성 댓글 조회 (페이지네이션)
  const {
    data: UserComments,
    error: UserCommentsTableError,
    isLoading: UserCommentsIsLoading,
    isFetching: UserCommentsIsFetching,
    isPlaceholderData: UserCommentsIsPlaceholderData,
  } = useQuery<ApiCommentsResponse>({
    queryKey: ["userProfile", "comments", username, commentsCurrentPage],
    queryFn: async () => {
      console.log("유저 프로필 코멘트 불러옴");
      const offset = (commentsCurrentPage - 1) * viewCount;
      const response = await axios.post<ApiCommentsResponse>(
        `${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/userProfileCommentsTableData`,
        {
          offset,
          limit: viewCount,
          username: username,
        },
        { withCredentials: true }
      );
      return response.data;
    },
    enabled: !!username,
    retry: 1,
    retryDelay: () => 2000,
    staleTime: 1000 * 10, // 10초간 캐시 유지 (게시판 실시간성 고려)
    gcTime: 1000 * 30, // 30초간 가비지 컬렉션 방지
    placeholderData: (previousData) => previousData, // 이전 데이터 유지로 깜빡임 방지
    refetchOnWindowFocus: false, // 윈도우 포커스 시 재요청 방지
  });

  const handleStoryPageClick = (selectedItem: { selected: number }) => {
    const newPage = selectedItem.selected + 1;
    setStoryCurrentPage(newPage);
  };

  const handleCommentsPageClick = (selectedItem: { selected: number }) => {
    const newPage = selectedItem.selected + 1;
    setCommentsCurrentPage(newPage);
  };

  useEffect(() => {
    if (error) {
      showMessage("오류가 발생했습니다. 다시 시도해주세요.", "error");
      router.replace("/not-found"); // 404 페이지로 이동
    }
  }, [error, router, showMessage]);

  // React Query 캐시 직렬화
  const dehydratedState = dehydrate(queryClient);

  if (isLoading) return <Loading />;

  return (
    <HydrationBoundary state={dehydratedState}>
      {userDetail != null ? (
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            mt: 3,
            minHeight: "75vh",
            gap: 4,
          }}
        >
          {/* 첫 번째 행: 프로필 보기 + 작성한 글 테이블 */}
          <Box
            sx={{
              display: "flex",
              flexDirection: "row",
              gap: 4,
              width: "100%",
              maxWidth: "1400px",
              alignItems: "flex-start",
            }}
          >
            {/* 왼쪽: 프로필 영역 */}
            <Box sx={{ width: "400px", flexShrink: 0 }}>
              <Box
                sx={{
                  bgcolor: "background.paper",
                  boxShadow: 3,
                  p: 3,
                  borderRadius: 2,
                }}
              >
                <Typography
                  variant="h6"
                  gutterBottom
                  sx={{ fontWeight: "bold", mb: 2, color: "primary.main", textAlign: "center" }}
                >
                  프로필 보기
                </Typography>
                <Box display="flex" flexDirection="column" alignItems="center" sx={{ gap: 2 }}>
                  <Avatar
                    src={
                      userDetail?.user?.image?.link
                        ? `${process.env.NEXT_PUBLIC_BASE_URL}${userDetail.user.image.link}`
                        : "/assets/noprofileImage.png"
                    }
                    sx={{
                      width: 120,
                      height: 120,
                      boxShadow: 2,
                      border: "3px solid",
                      borderColor: "primary.main",
                    }}
                  />
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Typography variant="h6" sx={{ fontWeight: "bold", textAlign: "center" }}>
                      {userDetail?.user?.nickname}
                    </Typography>
                    <UserBadge
                      totalExperience={userDetail?.user?.experience_points ?? 0}
                      size="medium"
                      showText={false}
                    />
                  </Box>
                </Box>
              </Box>
            </Box>

            {/* 오른쪽: 작성한 글 테이블 */}
            <Box sx={{ flexGrow: 1 }}>
              <Box
                sx={{
                  bgcolor: "background.paper",
                  boxShadow: 2,
                  borderRadius: 2,
                  p: 3,
                  position: "relative",
                  minHeight: "400px",
                }}
              >
                <Typography
                  variant="h6"
                  gutterBottom
                  sx={{ fontWeight: "bold", mb: 2, color: "primary.main", textAlign: "center" }}
                >
                  작성한 글
                </Typography>
                {UserStoryIsFetching && !UserStoryIsPlaceholderData && (
                  <Box
                    sx={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      bgcolor: theme.palette.mode === "dark" ? "rgba(26, 26, 46, 0.9)" : "rgba(255, 255, 255, 0.8)",
                      zIndex: 1,
                      borderRadius: 2,
                    }}
                  >
                    <CircularProgress
                      size={40}
                      sx={{
                        color: theme.palette.mode === "dark" ? "#a78bfa" : "primary.main",
                      }}
                    />
                  </Box>
                )}
                <CustomizedUserTables tableData={UserStory?.StoryResults || []} />
                <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
                  <ProfilePagination
                    pageCount={Math.ceil((UserStory?.StoryTotal || 0) / viewCount)}
                    onPageChange={handleStoryPageClick}
                    currentPage={storyCurrentPage}
                  />
                </Box>
              </Box>
            </Box>
          </Box>

          {/* 두 번째 행: 작성한 댓글 테이블 (전체 너비) */}
          <Box sx={{ width: "100%", maxWidth: "1400px" }}>
            <Box
              sx={{
                bgcolor: "background.paper",
                boxShadow: 2,
                borderRadius: 2,
                p: 3,
                position: "relative",
                minHeight: "400px",
              }}
            >
              <Typography
                variant="h6"
                gutterBottom
                sx={{ fontWeight: "bold", mb: 2, color: "primary.main", textAlign: "center" }}
              >
                작성한 댓글
              </Typography>
              {UserCommentsIsFetching && !UserCommentsIsPlaceholderData && (
                <Box
                  sx={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    bgcolor: theme.palette.mode === "dark" ? "rgba(26, 26, 46, 0.9)" : "rgba(255, 255, 255, 0.8)",
                    zIndex: 1,
                    borderRadius: 2,
                  }}
                >
                  <CircularProgress
                    size={40}
                    sx={{
                      color: theme.palette.mode === "dark" ? "#a78bfa" : "primary.main",
                    }}
                  />
                </Box>
              )}
              <CustomizedUserCommentsTables tableData={UserComments?.CommentsResults || []} commentsFlag={true} />
              <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
                <ProfilePagination
                  pageCount={Math.ceil((UserComments?.CommentsTotal || 0) / viewCount)}
                  onPageChange={handleCommentsPageClick}
                  currentPage={commentsCurrentPage}
                />
              </Box>
            </Box>
          </Box>
        </Box>
      ) : (
        <Loading />
      )}
    </HydrationBoundary>
  );
}
