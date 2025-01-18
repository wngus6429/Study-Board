"use client";
import Loading from "@/app/components/common/Loading";
import { StoryImageType, StoryType } from "@/app/types/types";
import { Avatar, Box, Button, Card, CardContent, CardMedia, Typography } from "@mui/material";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import dayjs from "dayjs";
import { useRouter } from "next/navigation";
import { ReactNode, useEffect, useState } from "react";
import LocalOfferIcon from "@mui/icons-material/LocalOffer";
import { useSession } from "next-auth/react";
import { useMessage } from "@/app/store/messageStore";
import { useComment } from "@/app/store/commentStore";
import ConfirmDialog from "@/app/components/common/ConfirmDialog";
import ErrorView from "@/app/components/common/ErrorView";
import RecommendButtonsWithCount from "@/app/components/RecommendButton";
import ThumbUpAlt from "@mui/icons-material/ThumbUp";

export default function page({ params }: { params: { id: string } }): ReactNode {
  // const params = useParams(); // Next.js 13 이상에서 App Directory를 사용하면, page 컴포넌트는 URL 매개변수(파라미터)를 props로 받을 수 있습니다.
  const { showMessage } = useMessage((state) => state);
  const router = useRouter();
  const { data: session } = useSession();
  const queryClient = useQueryClient();

  const [isDeleted, setIsDeleted] = useState<boolean>(false); // 삭제 상태 추가
  const { openCloseComments } = useComment();

  //! 상세 데이터 가져오기
  const {
    data: detail,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery<StoryType>({
    queryKey: ["story", "detail", params?.id],
    queryFn: async () => {
      const response = await axios.get(`${process.env.NEXT_PUBLIC_BASE_URL}/api/story/detail/${params?.id}`);
      return response.data;
    },
    // isDeleted 안 쓰면 삭제 후 API 요청이 되어 오류 발생
    enabled: !!params?.id && !isDeleted,
    staleTime: 1000 * 60 * 1, // 5분 동안 데이터 신선 상태 유지
    gcTime: 1000 * 60 * 1,
  });

  useEffect(() => {
    if (detail != null) {
      console.log("상세데이터", detail);
      openCloseComments(true);
    }
    return () => {
      openCloseComments(false);
    };
  }, [detail]);

  //! 데이터 없으면 not-found 위치로 이동
  useEffect(() => {
    if (isError && !isDeleted) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        router.replace("/not-found"); // 404 페이지로 이동
      } else {
        showMessage("오류가 발생했습니다. 다시 시도해주세요.", "error");
      }
    }
  }, [isError, error, router, isDeleted]);

  const deleteData = useMutation({
    mutationFn: async (storyId: number) => {
      return await axios.delete(`${process.env.NEXT_PUBLIC_BASE_URL}/api/story/${storyId}`, { withCredentials: true });
    },
    onSuccess() {
      queryClient.removeQueries({ queryKey: ["story", "detail", params?.id] });
      setIsDeleted(true); // 삭제 상태 업데이트, 다시 API 요청 방지
      showMessage("삭제 성공", "success");
      router.push("/");
    },
    onError: (error: any) => {
      if (error.response && error.response.data.code === 404) {
        showMessage(`${error.response.data.data}`, "error");
      } else if (error.response && error.response.data.code === 401) {
        showMessage(`${error.response.data.data}`, "error");
      } else {
        showMessage("삭제 중 오류가 발생했습니다.", "error");
      }
    },
  });

  // 추천, 비추 로직
  const likeOrUnlike = useMutation({
    mutationFn: async ({ storyId, vote }: { storyId: number; vote: "like" | "dislike" }) => {
      console.log("좋아요 API 호출", storyId, vote);

      if (!session?.user?.id) {
        showMessage("로그인 해야합니다.");
        throw new Error("로그인이 필요합니다."); // 예외 처리
      }

      return await axios.put(
        `${process.env.NEXT_PUBLIC_BASE_URL}/api/story/likeOrUnlike/${storyId}`,
        { userId: session.user.id, vote },
        { withCredentials: true }
      );
    },
    // onMutate의 동작 방식
    // onMutate 호출 시점: mutationFn 실행 전에 호출됩니다.
    // variables를 매개변수로 받아, 요청 전에 실행해야 할 로직을 처리할 수 있습니다.
    // onMutate에서 반환한 값은 context로 저장됩니다.
    // onError나 onSuccess에서 이 값을 참조할 수 있습니다.
    onMutate: (variables) => {
      // `onMutate`에서 `context`로 전달할 데이터를 반환
      return { vote: variables.vote };
    },
    onSuccess: (_, variables, context) => {
      queryClient.setQueryData(["story", "detail", String(variables.storyId)], (oldData: StoryType | undefined) => {
        if (!oldData) return oldData;

        // 좋아요/싫어요 카운트 계산
        let likeCount = oldData.like_count;
        let dislikeCount = oldData.dislike_count;

        if (variables.vote === "like") {
          // 반대를 취소하고 좋아요 추가
          dislikeCount = Math.max(0, dislikeCount - 1);
          likeCount += 1;
        } else if (variables.vote === "dislike") {
          likeCount = Math.max(0, likeCount - 1);
          dislikeCount += 1;
        }
        return {
          ...oldData,
          like_count: likeCount, // 업데이트된 좋아요 수
          dislike_count: dislikeCount, // 업데이트된 싫어요 수
        };
      });
      if (context?.vote === "like") {
        showMessage("추천 했습니다.", "success");
      } else if (context?.vote === "dislike") {
        showMessage("비추천 했습니다.", "error");
      }
    },
    onError: (error: any, context) => {
      console.error("좋아요 API 호출 실패", context);
      // context를 사용해 vote 값 참조
      if (context?.vote) {
        showMessage(`이미 ${context.vote === "like" ? "추천" : "비추천"} 하셨습니다.`, "error");
      } else {
        showMessage(`${error}업데이트에 실패했습니다. 다시 시도해주세요.`, "error");
      }
    },
  });

  const [openConfirmDialog, setOpenConfirmDialog] = useState(false);
  const [detailToDelete, setDetailToDelete] = useState<number | null>(null);

  const handleDeleteClick = (id: number) => {
    setDetailToDelete(id);
    setOpenConfirmDialog(true);
  };

  const confirmDelete = () => {
    if (detailToDelete !== null) {
      deleteData.mutate(detailToDelete);
      setDetailToDelete(null);
      setOpenConfirmDialog(false);
    }
  };

  const cancelDelete = () => {
    setDetailToDelete(null);
    setOpenConfirmDialog(false);
  };

  if (isLoading) return <Loading />;

  if (isError) return <ErrorView />;

  return (
    <Box display="flex" justifyContent="center" alignItems="center" sx={{ padding: 2, overflow: "hidden" }}>
      {openConfirmDialog && (
        <ConfirmDialog
          open={openConfirmDialog}
          title="글 삭제"
          description="글을 삭제하시겠습니까? 삭제된 글은 복구할 수 없습니다."
          onConfirm={confirmDelete}
          onCancel={cancelDelete}
          confirmText="삭제"
          cancelText="취소"
        />
      )}
      {detail && (
        <Card sx={{ width: "100%", boxShadow: 4, padding: 3, borderRadius: 2, bgcolor: "background.paper" }}>
          <CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
              <Typography variant="h4" component="div" sx={{ fontWeight: "bold" }}>
                {detail.title}
              </Typography>
              {detail?.category !== "question" && detail.User?.id === session?.user?.id && (
                <Box display="flex" gap={1}>
                  <Button
                    size="medium"
                    variant="outlined"
                    color="warning"
                    onClick={(e) => {
                      e.preventDefault();
                      router.push(`/edit/${detail.id}`);
                    }}
                  >
                    修正
                  </Button>
                  <Button
                    size="medium"
                    variant="outlined"
                    color="error"
                    onClick={(e) => {
                      e.preventDefault();
                      handleDeleteClick(detail.id);
                    }}
                  >
                    削除
                  </Button>
                </Box>
              )}
            </Box>
            <Typography
              variant="subtitle2"
              color="text.secondary"
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                bgcolor: "grey.100",
                p: 1,
                borderRadius: 1,
                mb: 3,
              }}
            >
              <LocalOfferIcon fontSize="small" />
              종류: {detail.category}
            </Typography>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
              <Box display="flex" alignItems="center" gap={2}>
                <Avatar
                  src={`${process.env.NEXT_PUBLIC_BASE_URL}${detail.User.avatar}`}
                  sx={{ width: 50, height: 50, boxShadow: 2 }}
                />
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: "bold" }}>
                    작성자: {detail.User.nickname}
                  </Typography>
                  <Button
                    onClick={() => router.push("/")}
                    size="small"
                    variant="contained"
                    color="primary"
                    sx={{ mt: 1 }}
                  >
                    뒤로가기
                  </Button>
                </Box>
              </Box>
              <Box
                sx={{
                  display: "flex",
                  backgroundColor: "linear-gradient(135deg, #FFD700, #FFB300)", // 골드 그라데이션
                  borderRadius: 2, // 테두리 라운드 처리
                  boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.2)", // 그림자
                  padding: "4px", // 내부 여백
                  width: 100, // 고정된 넓이
                }}
              >
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: "bold",
                    color: "#4A4A4A", // 진한 회색으로 텍스트 색상 변경
                    textTransform: "uppercase", // 대문자로 표시
                    letterSpacing: 1.5, // 글자 간격 추가
                  }}
                >
                  추천
                </Typography>
                <Typography>
                  {/* {detail.recommend_count} */}
                  10
                </Typography>
              </Box>
              <Box textAlign="right">
                <Typography variant="subtitle2" color="text.secondary">
                  작성일: {dayjs(detail.created_at).format("YYYY/MM/DD HH:mm:ss")}
                </Typography>
                <Typography variant="subtitle2" color="text.secondary">
                  조회수: {detail.read_count}
                </Typography>
              </Box>
            </Box>
            <Typography
              variant="body1"
              color="text.primary"
              sx={{
                lineHeight: 1.7,
                bgcolor: "grey.50",
                p: 2,
                borderRadius: 1,
                boxShadow: 1,
                mb: 3,
              }}
            >
              {detail.content}
            </Typography>
            {detail.StoryImage && detail.StoryImage.length > 0 && (
              <Box>
                <Typography
                  variant="h6"
                  gutterBottom
                  sx={{
                    fontWeight: "bold",
                    textAlign: "center",
                    color: "primary.main",
                    mb: 2,
                  }}
                >
                  첨부된 이미지:
                </Typography>
                <Box
                  sx={{
                    display: "flex",
                    flexWrap: "wrap", // 줄바꿈 처리
                    justifyContent: "center", // 중앙 정렬
                    gap: 1, // 이미지 간 간격
                  }}
                >
                  {detail.StoryImage.map((img: StoryImageType, index: number) => {
                    const isLastOddImage = index === detail.StoryImage.length - 1 && detail.StoryImage.length % 2 !== 0;

                    return (
                      <CardMedia
                        key={`${img.id}-${index}`}
                        component="img"
                        image={`${img.link}?timestamp=${new Date().getTime()}`}
                        alt={`イメージ${img.image_name}`}
                        sx={{
                          flexBasis: isLastOddImage ? "100%" : "calc(50% - 8px)", // 마지막 홀수 이미지는 100% 너비
                          maxWidth: isLastOddImage ? "100%" : "calc(50% - 8px)", // 최대 50% 너비
                          margin: isLastOddImage ? "0 auto" : undefined, // 홀수 마지막 이미지를 가운데 정렬
                          borderRadius: 4,
                          objectFit: "contain", // 이미지 비율 유지
                          boxShadow: 4,
                          transition: "transform 0.3s ease, box-shadow 0.3s ease", // 애니메이션 추가
                          "&:hover": {
                            transform: "translateY(-5px)", // 위로 살짝 이동
                            boxShadow: 8, // 그림자 강도 증가
                          },
                        }}
                      />
                    );
                  })}
                </Box>
              </Box>
            )}
          </CardContent>
        </Card>
      )}
      {detail && (
        <RecommendButtonsWithCount
          like={detail?.like_count} // 초기 추천 수
          dislike={detail?.dislike_count} // 초기 비추천 수
          likeFunc={(vote: "like" | "dislike") => {
            likeOrUnlike.mutate({ storyId: detail?.id, vote }); // API 호출
          }}
        />
      )}
    </Box>
  );
}
