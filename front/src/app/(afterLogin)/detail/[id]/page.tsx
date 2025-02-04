"use client";
import Loading from "@/app/components/common/Loading";
import { StoryImageType, StoryType } from "@/app/types/types";
import { Avatar, Box, Button, Card, CardContent, CardMedia, Typography } from "@mui/material";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import dayjs from "dayjs";
import { useRouter } from "next/navigation";
import { ReactNode, useEffect, useMemo, useState } from "react";
import LocalOfferIcon from "@mui/icons-material/LocalOffer";
import { useSession } from "next-auth/react";
import { useMessage } from "@/app/store/messageStore";
import { useComment } from "@/app/store/commentStore";
import ConfirmDialog from "@/app/components/common/ConfirmDialog";
import ErrorView from "@/app/components/common/ErrorView";
import RecommendButtonsWithCount from "@/app/components/RecommendButton";
import Link from "next/link";

export default function page({ params }: { params: { id: string } }): ReactNode {
  // const params = useParams(); // Next.js 13 이상에서 App Directory를 사용하면, page 컴포넌트는 URL 매개변수(파라미터)를 props로 받을 수 있습니다.
  const { showMessage } = useMessage((state) => state);
  const router = useRouter();
  const { data: session } = useSession();
  const queryClient = useQueryClient();

  const [isDeleted, setIsDeleted] = useState<boolean>(false); // 삭제 상태 추가
  const { openCloseComments } = useComment();
  const [likeCalculate, setLikeCalculate] = useState<number>(0);

  //! 상세 데이터 가져오기
  const {
    data: detail,
    isLoading,
    isError,
    error,
  } = useQuery<StoryType>({
    queryKey: ["story", "detail", params?.id],
    queryFn: async () => {
      const response = await axios.get(`${process.env.NEXT_PUBLIC_BASE_URL}/api/story/detail/${params?.id}`);
      return response.data;
    },
    // isDeleted 안 쓰면 삭제 후 API 요청이 되어 오류 발생
    enabled: !!params?.id && !isDeleted,
    staleTime: 1000 * 60 * 4,
    gcTime: 1000 * 60 * 4,
  });

  useEffect(() => {
    if (detail != null) {
      console.log("상세데이터", detail);
      document.title = `${detail.title}`;
      openCloseComments(true);
      setLikeCalculate(detail.like_count + -detail.dislike_count);
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
    //! onMutate의 동작 방식
    //! onMutate 호출 시점: mutationFn 실행 전에 호출됩니다.
    //! variables를 매개변수로 받아, 요청 전에 실행해야 할 로직을 처리할 수 있습니다.
    //! onMutate에서 반환한 값은 context로 저장됩니다.
    //! onError나 onSuccess에서 이 값을 참조할 수 있습니다.
    onMutate: (variables) => {
      // `onMutate`에서 `context`로 전달할 데이터를 반환
      return { vote: variables.vote };
    },
    onSuccess: (response, variables) => {
      const { action, vote } = response.data;

      queryClient.setQueryData(["story", "detail", String(variables.storyId)], (oldData: StoryType | undefined) => {
        if (!oldData) return oldData;

        let likeCount = oldData.like_count;
        let dislikeCount = oldData.dislike_count;

        switch (action) {
          case "add":
            // 새로운 투표 추가
            if (vote === "like") {
              likeCount += 1;
            } else {
              dislikeCount += 1;
            }
            break;
          case "remove":
            // 기존 투표 취소
            if (vote === "like") {
              likeCount -= 1;
            } else {
              dislikeCount -= 1;
            }
            break;
          case "change":
            // 투표 변경 (like → dislike 또는 그 반대)
            if (vote === "like") {
              likeCount += 1;
              dislikeCount -= 1;
            } else {
              likeCount -= 1;
              dislikeCount += 1;
            }
            break;
        }

        return {
          ...oldData,
          like_count: Math.max(0, likeCount),
          dislike_count: Math.max(0, dislikeCount),
        };
      });

      // 메시지 표시
      switch (action) {
        case "add":
          showMessage(`${vote === "like" ? "추천" : "비추천"} 했습니다.`, vote === "like" ? "success" : "error");
          break;
        case "remove":
          showMessage(`${vote === "like" ? "추천" : "비추천"}을 취소했습니다.`, "info");
          break;
        case "change":
          showMessage(
            `${vote === "like" ? "추천" : "비추천"}으로 변경했습니다.`,
            vote === "like" ? "success" : "error"
          );
          break;
      }
    },
    onError: (error: any) => {
      console.error("좋아요 API 호출 실패");
      showMessage(`추천, 비추천에 실패했습니다. ${error}`, "error");
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

  const ImageCard: React.FC<{ img: StoryImageType; isLastOddImage: boolean }> = ({ img, isLastOddImage }) => {
    const [dimensions, setDimensions] = useState<{ width: number; height: number } | null>(null);

    // img.link가 GIF이면 타임스탬프 없이, 아니라면 타임스탬프를 한 번만 생성하여 사용
    const imageSrc = useMemo(() => {
      const lowerLink = img.link.toLowerCase();
      if (lowerLink.endsWith(".gif")) {
        return img.link;
      }
      return `${img.link}?timestamp=${Date.now()}`;
    }, [img.link]);

    const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
      const { naturalWidth, naturalHeight } = e.currentTarget;
      setDimensions({ width: naturalWidth, height: naturalHeight });
    };

    const isWideImage = dimensions ? dimensions.width / dimensions.height >= 1.3 : false;
    const fullWidth = isWideImage || isLastOddImage;

    return (
      <CardMedia
        component="img"
        image={imageSrc}
        alt={`イメージ${img.image_name}`}
        onLoad={handleImageLoad}
        sx={{
          flexBasis: fullWidth ? "100%" : "calc(50% - 8px)",
          maxWidth: fullWidth ? "100%" : "calc(50% - 8px)",
          margin: fullWidth ? "0 auto" : undefined,
          borderRadius: 4,
          objectFit: "contain",
          boxShadow: 4,
          transition: "transform 0.3s ease, box-shadow 0.3s ease",
          "&:hover": {
            transform: "translateY(-10px)",
            boxShadow: 8,
          },
        }}
      />
    );
  };

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
                  <Typography variant="subtitle1" sx={{ fontWeight: "bold", cursor: "pointer" }}>
                    <Link href={`/profile/${detail.User.nickname}`} passHref>
                      작성자: {detail.User.nickname}
                    </Link>
                  </Typography>
                  <Button onClick={() => router.back()} size="small" variant="contained" color="primary" sx={{ mt: 1 }}>
                    뒤로가기
                  </Button>
                </Box>
              </Box>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  background: "linear-gradient(135deg, #FFE08A, #FFC547)", // 부드러운 골드 그라데이션
                  borderRadius: "12px",
                  boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.2)", // 그림자 효과
                  padding: "6px 12px",
                  width: 100, // 고정된 넓이
                }}
              >
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: "bold",
                    color: "#4A4A4A", // 진한 회색 텍스트 색상
                    textTransform: "none", // 텍스트 변환 없음
                    fontSize: "16px", // 폰트 크기
                  }}
                >
                  추천
                </Typography>
                <Typography
                  sx={{
                    fontWeight: "bold",
                    color: "#4A4A4A", // 진한 회색 숫자 색상
                    fontSize: "16px", // 숫자 크기
                  }}
                >
                  {likeCalculate}
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
                    return <ImageCard key={`${img.id}-${index}`} img={img} isLastOddImage={isLastOddImage} />;
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
