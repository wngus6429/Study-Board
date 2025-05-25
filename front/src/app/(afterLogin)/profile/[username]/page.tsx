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
import { Avatar, Box, Container, Typography } from "@mui/material";

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
  const username = params?.username as string;
  const router = useRouter();
  const queryClient = useQueryClient();
  const { showMessage } = useMessage((state) => state);

  const [storyCurrentPage, setStoryCurrentPage] = useState<number>(1);
  const [commentsCurrentPage, setCommentsCurrentPage] = useState<number>(1);
  const viewCount: number = USER_TABLE_VIEW_COUNT;

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
    staleTime: 1000 * 20 * 1,
    gcTime: 1000 * 20 * 1,
  });

  // 사용자 작성 글 조회 (페이지네이션)
  const {
    data: UserStory,
    error: UserTableError,
    isLoading: UserStoryIsLoading,
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
  });

  // 사용자 작성 댓글 조회 (페이지네이션)
  const {
    data: UserComments,
    error: UserCommentsTableError,
    isLoading: UserCommentsIsLoading,
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
            flexDirection: "row", // 한 줄에 나란히 배치
            alignItems: "flex-start", // 수직 정렬
            mt: 3,
            minHeight: "75vh",
          }}
        >
          <Box>
            <Typography
              variant="h6"
              gutterBottom
              sx={{ fontWeight: "bold", mb: 2, color: "primary.main", textAlign: "center" }}
            >
              작성한 글
            </Typography>
            <Box
              sx={{
                bgcolor: "background.paper",
                boxShadow: 2,
                borderRadius: 2,
                p: 3,
              }}
            >
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

          <Container component="main" sx={{ mt: 8, width: "300px", marginLeft: "none", marginTop: "48px" }}>
            <Box
              display="flex"
              flexDirection="column"
              alignItems="center"
              sx={{
                bgcolor: "background.paper",
                boxShadow: 3,
                p: 3,
                borderRadius: 2,
              }}
            >
              <Typography variant="h5" gutterBottom sx={{ fontWeight: "bold", mb: 2 }}>
                프로필 보기
              </Typography>
              <Avatar
                src={`${process.env.NEXT_PUBLIC_BASE_URL}${userDetail.user.image?.link}`}
                sx={{
                  width: 120,
                  height: 120,
                  mb: 2,
                  boxShadow: 2,
                  border: "3px solid",
                  borderColor: "primary.main",
                }}
              />
              <Typography variant="h6" gutterBottom sx={{ fontWeight: "bold", mb: 1, textAlign: "center" }}>
                {userDetail.user.nickname}
              </Typography>
            </Box>
          </Container>

          <Box>
            <Typography
              variant="h6"
              gutterBottom
              sx={{ fontWeight: "bold", mb: 2, color: "primary.main", textAlign: "center" }}
            >
              작성한 댓글
            </Typography>
            <Box
              sx={{
                bgcolor: "background.paper",
                boxShadow: 2,
                borderRadius: 2,
                p: 3,
              }}
            >
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
