"use client";
import Loading from "@/app/components/common/Loading";
import { StoryImageType } from "@/app/types/imageTypes";
import {
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Dialog,
  Fade,
  IconButton,
  Slide,
  Tooltip,
  Typography,
  Zoom,
} from "@mui/material";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import dayjs from "dayjs";
import { useRouter } from "next/navigation";
import React, { ReactNode, useCallback, useEffect, useMemo, useState } from "react";
import LocalOfferIcon from "@mui/icons-material/LocalOffer";
import { useSession } from "next-auth/react";
import { useMessage } from "@/app/store/messageStore";
import { useComment } from "@/app/store/commentStore";
import ConfirmDialog from "@/app/components/common/ConfirmDialog";
import ErrorView from "@/app/components/common/ErrorView";
import RecommendButtonsWithCount from "@/app/components/RecommendButton";
import Link from "next/link";
import ImageCard from "@/app/components/ImageCard";
import { StoryType } from "@/app/types/storyDetailType";
import CloseIcon from "@mui/icons-material/Close";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import ZoomInIcon from "@mui/icons-material/ZoomIn";
import ZoomOutIcon from "@mui/icons-material/ZoomOut";
import { TransitionProps } from "@mui/material/transitions";

export default function page({ params }: { params: { id: string } }): ReactNode {
  // const params = useParams(); // Next.js 13 이상에서 App Directory를 사용하면, page 컴포넌트는 URL 매개변수(파라미터)를 props로 받을 수 있습니다.
  const { showMessage } = useMessage((state) => state);
  const router = useRouter();
  const { data: session } = useSession();
  const queryClient = useQueryClient();

  const [isDeleted, setIsDeleted] = useState<boolean>(false); // 삭제 상태 추가
  const { openCloseComments } = useComment();
  const [likeCalculate, setLikeCalculate] = useState<number>(0);
  // 버튼 여러번 연속 클릭 방지
  const [editFlag, setEditFlag] = useState<boolean>(false);

  // 이미지 뷰어 상태 추가
  const [selectedImage, setSelectedImage] = useState<StoryImageType | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState<number>(0);
  const [openImageViewer, setOpenImageViewer] = useState(false);

  // handleImageClick 함수 근처에 줌 관련 상태와 함수 추가
  const [zoomLevel, setZoomLevel] = useState<number>(1);

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
    retry: 1,
    retryDelay: () => 2000,
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

  // URL 해시 변경 감지 및 댓글 스크롤 처리
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (hash.startsWith("#comment-")) {
        const commentId = hash.replace("#comment-", "");
        // 댓글이 포함된 페이지를 찾아서 이동하는 로직은 CommentsView 컴포넌트에서 처리
        // 여기서는 단순히 스크롤만 처리
        setTimeout(() => {
          scrollToComment(commentId);
        }, 2000); // 댓글 컴포넌트 로딩 대기
      }
    };

    // 초기 로드 시 해시 확인
    handleHashChange();

    // 해시 변경 이벤트 리스너 추가
    window.addEventListener("hashchange", handleHashChange);

    return () => {
      window.removeEventListener("hashchange", handleHashChange);
    };
  }, []);

  // 특정 댓글로 스크롤하는 함수
  const scrollToComment = (commentId: string) => {
    const element = document.getElementById(`comment-${commentId}`);
    if (element) {
      element.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
      // 댓글 하이라이트 효과
      element.style.backgroundColor = "#fff3cd";
      element.style.border = "2px solid #ffc107";
      setTimeout(() => {
        element.style.backgroundColor = "";
        element.style.border = "";
      }, 3000);
    } else {
      // 댓글이 현재 페이지에 없을 수 있으므로 재시도
      setTimeout(() => {
        const retryElement = document.getElementById(`comment-${commentId}`);
        if (retryElement) {
          retryElement.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });
          retryElement.style.backgroundColor = "#fff3cd";
          retryElement.style.border = "2px solid #ffc107";
          setTimeout(() => {
            retryElement.style.backgroundColor = "";
            retryElement.style.border = "";
          }, 3000);
        }
      }, 3000); // 더 긴 대기 시간
    }
  };

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
      return await axios.put(
        `${process.env.NEXT_PUBLIC_BASE_URL}/api/story/likeOrUnlike/${storyId}`,
        { userId: session?.user.id, vote },
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
      showMessage(`추천 및 비추천에 실패했습니다. ${error}`, "error");
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

  // 이미지 클릭 핸들러
  const handleImageClick = (image: StoryImageType, index: number) => {
    setSelectedImage(image);
    setCurrentImageIndex(index);
    setZoomLevel(1); // 줌 레벨 초기화
    setOpenImageViewer(true);
  };

  // 이미지 뷰어 닫기
  const handleCloseImageViewer = () => {
    setOpenImageViewer(false);
    setSelectedImage(null);
    setZoomLevel(1); // 줌 레벨 초기화
  };

  // 다음 이미지로 이동
  const handleNextImage = () => {
    if (detail?.StoryImage && currentImageIndex < detail.StoryImage.length - 1) {
      const nextIndex = currentImageIndex + 1;
      setCurrentImageIndex(nextIndex);
      setSelectedImage(detail.StoryImage[nextIndex]);
    }
  };

  // 이전 이미지로 이동
  const handlePrevImage = () => {
    if (detail?.StoryImage && currentImageIndex > 0) {
      const prevIndex = currentImageIndex - 1;
      setCurrentImageIndex(prevIndex);
      setSelectedImage(detail.StoryImage[prevIndex]);
    }
  };

  // 확대/축소 기능 추가
  const handleZoomIn = () => {
    setZoomLevel((prev) => Math.min(prev + 0.25, 3)); // 최대 3배까지 확대
  };

  const handleZoomOut = () => {
    setZoomLevel((prev) => Math.max(prev - 0.25, 0.5)); // 최소 0.5배까지 축소
  };

  // 키보드 이벤트 처리 업데이트
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!openImageViewer) return;

      if (e.key === "ArrowRight") {
        handleNextImage();
      } else if (e.key === "ArrowLeft") {
        handlePrevImage();
      } else if (e.key === "Escape") {
        handleCloseImageViewer();
      } else if (e.key === "+" || e.key === "=") {
        handleZoomIn();
      } else if (e.key === "-") {
        handleZoomOut();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [openImageViewer, currentImageIndex, detail?.StoryImage, zoomLevel]);

  // Slide 트랜지션 커스텀 컴포넌트
  const SlideTransition = React.forwardRef(function Transition(
    props: TransitionProps & {
      children: React.ReactElement;
    },
    ref: React.Ref<unknown>
  ) {
    return <Slide direction="up" ref={ref} {...props} />;
  });

  // ★ 모든 훅은 조건부 return 전에 호출되어야 합니다.
  const memoizedImageCards = useMemo(() => {
    if (!detail || !detail.StoryImage || detail.StoryImage.length === 0) {
      return null;
    }
    return detail.StoryImage.map((img: StoryImageType, index: number) => {
      const isLastOddImage = index === detail.StoryImage.length - 1 && detail.StoryImage.length % 2 !== 0;
      return (
        <ImageCard
          key={`${img.id}-${index}`}
          img={img}
          isLastOddImage={isLastOddImage}
          onClick={(img) => handleImageClick(img, index)}
        />
      );
    });
  }, [detail?.StoryImage]);

  // ★ 조건부 return은 훅 선언 이후에 배치합니다.
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
                      setEditFlag(true);
                      e.preventDefault();
                      router.push(`/edit/story/${detail.id}`);
                    }}
                    disabled={editFlag}
                    startIcon={editFlag ? <CircularProgress size={20} /> : null}
                  >
                    수정
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
                    삭제
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
                  <Box sx={{ display: "flex", gap: 1, mt: 1 }}>
                    <Button onClick={() => router.back()} size="small" variant="contained" color="primary">
                      뒤로가기
                    </Button>
                    <Button
                      onClick={() => router.push("/")}
                      size="small"
                      variant="contained"
                      sx={{
                        backgroundColor: "#ff9800",
                        "&:hover": { backgroundColor: "#f57c00" },
                      }}
                    >
                      메인으로
                    </Button>
                  </Box>
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
                  width: 100,
                }}
              >
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: "bold",
                    color: "#4A4A4A",
                    textTransform: "none", // 텍스트 변환 없음
                    fontSize: "16px",
                  }}
                >
                  추천
                </Typography>
                <Typography
                  sx={{
                    fontWeight: "bold",
                    color: "#4A4A4A",
                    fontSize: "16px",
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
            {memoizedImageCards && (
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
                    flexWrap: "wrap",
                    justifyContent: "center",
                    gap: 1,
                  }}
                >
                  {memoizedImageCards}
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
            if (!session?.user?.id) {
              showMessage("로그인 해야합니다.", "error");
              return;
            }
            // 자신이 작성한 글인지 체크
            if (detail?.User?.id === session?.user?.id) {
              showMessage("자신이 작성한 글에는 추천/비추천을 할 수 없습니다.", "warning");
              return;
            }
            likeOrUnlike.mutate({ storyId: detail?.id, vote }); // API 호출
          }}
        />
      )}

      {/* 이미지 뷰어 다이얼로그 */}
      <Dialog
        open={openImageViewer}
        onClose={handleCloseImageViewer}
        maxWidth={false}
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: "rgba(0, 0, 0, 0.92)",
            border: "1px solid rgba(192, 192, 192, 0.5)",
            boxShadow: "0 0 20px rgba(255, 255, 255, 0.1)",
            position: "relative",
            height: "85vh",
            width: "80vw",
            margin: "20px",
            borderRadius: "8px",
            overflow: "hidden",
          },
        }}
      >
        {/* 상단 컨트롤 바 */}
        <Box
          sx={{
            position: "absolute",
            top: 0,
            right: 0,
            display: "flex",
            justifyContent: "flex-end",
            alignItems: "center",
            p: 1.5,
            zIndex: 10,
          }}
        >
          {/* 줌 컨트롤 */}
          <IconButton
            onClick={handleZoomOut}
            sx={{
              color: "silver",
              "&:hover": { color: "white" },
              mr: 1,
            }}
          >
            <ZoomOutIcon />
          </IconButton>

          <Typography
            variant="body2"
            sx={{
              color: "silver",
              mx: 1,
            }}
          >
            {(zoomLevel * 100).toFixed(0)}%
          </Typography>

          <IconButton
            onClick={handleZoomIn}
            sx={{
              color: "silver",
              "&:hover": { color: "white" },
              mr: 1,
            }}
          >
            <ZoomInIcon />
          </IconButton>

          {/* 닫기 버튼 */}
          <IconButton
            onClick={handleCloseImageViewer}
            sx={{
              color: "silver",
              "&:hover": { color: "white" },
            }}
          >
            <CloseIcon />
          </IconButton>
        </Box>

        {/* 이미지 컨테이너 */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            height: "100%",
            width: "100%",
            position: "relative",
          }}
        >
          {/* 이전 이미지 네비게이션 버튼 */}
          {currentImageIndex > 0 && (
            <IconButton
              onClick={handlePrevImage}
              sx={{
                position: "absolute",
                left: { xs: 8, md: 24 },
                color: "silver",
                "&:hover": { color: "white" },
              }}
            >
              <ArrowBackIosNewIcon />
            </IconButton>
          )}

          {/* 이미지 */}
          {selectedImage && (
            <Box
              component="img"
              src={`${process.env.NEXT_PUBLIC_BASE_URL}${selectedImage.link}`}
              alt="Selected"
              sx={{
                maxWidth: "90%",
                maxHeight: "80vh",
                objectFit: "contain",
                transform: `scale(${zoomLevel})`,
                transition: "transform 0.2s ease-out",
                border: "1px solid rgba(192, 192, 192, 0.2)",
              }}
            />
          )}

          {/* 다음 이미지 네비게이션 버튼 */}
          {detail?.StoryImage && currentImageIndex < detail.StoryImage.length - 1 && (
            <IconButton
              onClick={handleNextImage}
              sx={{
                position: "absolute",
                right: { xs: 8, md: 24 },
                color: "silver",
                "&:hover": { color: "white" },
              }}
            >
              <ArrowForwardIosIcon />
            </IconButton>
          )}
        </Box>
      </Dialog>
    </Box>
  );
}
