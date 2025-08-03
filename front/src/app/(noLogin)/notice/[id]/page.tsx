"use client";
import Loading from "@/app/components/common/Loading";
import { StoryImageType } from "@/app/types/imageTypes";
import {
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Dialog,
  IconButton,
  Tooltip,
  Typography,
  useTheme,
} from "@mui/material";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import dayjs from "dayjs";
import { useRouter } from "next/navigation";
import React, { ReactNode, useEffect, useState } from "react";
import LocalOfferIcon from "@mui/icons-material/LocalOffer";
import { useSession } from "next-auth/react";
import { useMessage } from "@/app/store/messageStore";
import { useComment } from "@/app/store/commentStore";
import ConfirmDialog from "@/app/components/common/ConfirmDialog";
import ErrorView from "@/app/components/common/ErrorView";
import ImageCard from "@/app/components/ImageCard";
import { StoryType } from "@/app/types/storyDetailType";
import CloseIcon from "@mui/icons-material/Close";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import ZoomInIcon from "@mui/icons-material/ZoomIn";
import ZoomOutIcon from "@mui/icons-material/ZoomOut";
import UserMenuPopover from "@/app/components/common/UserMenuPopover";
import SendMessageModal from "@/app/components/common/SendMessageModal";
import { useRecentViews } from "@/app/store/recentViewsStore";
import CommentsView from "@/app/components/comment/CommentsView";
import Link from "next/link";

export default function page({ params }: { params: { id: string } }): ReactNode {
  // const params = useParams(); // Next.js 13 이상에서 App Directory를 사용하면, page 컴포넌트는 URL 매개변수(파라미터)를 props로 받을 수 있습니다.
  const { showMessage } = useMessage((state) => state);
  const router = useRouter();
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const theme = useTheme();

  const [isDeleted, setIsDeleted] = useState<boolean>(false); // 삭제 상태 추가
  const { openCloseComments } = useComment();
  // 버튼 여러번 연속 클릭 방지
  const [editFlag, setEditFlag] = useState<boolean>(false);

  // 이미지 뷰어 상태 추가
  const [selectedImage, setSelectedImage] = useState<StoryImageType | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState<number>(0);
  const [openImageViewer, setOpenImageViewer] = useState(false);

  // handleImageClick 함수 근처에 줌 관련 상태와 함수 추가
  const [zoomLevel, setZoomLevel] = useState<number>(1);

  // 드래그 관련 상태 추가
  const [imagePosition, setImagePosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // 사용자 메뉴 관련 상태
  const [userMenuAnchorEl, setUserMenuAnchorEl] = useState<HTMLElement | null>(null);
  const [selectedUserNickname, setSelectedUserNickname] = useState<string>("");
  const [sendMessageModalOpen, setSendMessageModalOpen] = useState<boolean>(false);

  // 최근 본 게시물 관리
  const { addRecentView } = useRecentViews();

  //! 상세 데이터 가져오기
  const {
    data: notice,
    isLoading,
    isError,
    error,
  } = useQuery<StoryType>({
    queryKey: ["story", "notice", params?.id],
    queryFn: async () => {
      const response = await axios.get(`${process.env.NEXT_PUBLIC_BASE_URL}/api/story/notice/${params?.id}`);
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
    if (notice != null) {
      console.log("상세데이터", notice);
      document.title = `${notice.title}`;
      openCloseComments(true);

      // 로그인한 사용자의 경우 최근 본 게시물에 추가
      if (session?.user) {
        addRecentView({
          id: notice.id,
          title: notice.title,
          category: "notice",
          created_at: notice.created_at,
          channelSlug: "notice", // 공지사항 전용 구분자
        });
      }
    }
    return () => {
      openCloseComments(false);
    };
  }, [notice, session, addRecentView]);

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
      queryClient.removeQueries({ queryKey: ["story", "notice", params?.id] });
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

  const [openConfirmDialog, setOpenConfirmDialog] = useState(false);
  const [detailToDelete, setDetailToDelete] = useState<number | null>(null);

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
    setOpenImageViewer(true);
    setZoomLevel(1);
    setImagePosition({ x: 0, y: 0 });
  };

  // 이미지 뷰어 닫기
  const handleCloseImageViewer = () => {
    setOpenImageViewer(false);
    setSelectedImage(null);
    setZoomLevel(1);
    setImagePosition({ x: 0, y: 0 });
    setIsDragging(false);
  };

  // 다음 이미지
  const handleNextImage = () => {
    if (notice && notice.StoryImage && currentImageIndex < notice.StoryImage.length - 1) {
      const nextIndex = currentImageIndex + 1;
      setCurrentImageIndex(nextIndex);
      setSelectedImage(notice.StoryImage[nextIndex]);
      setZoomLevel(1);
      setImagePosition({ x: 0, y: 0 });
    }
  };

  // 이전 이미지
  const handlePrevImage = () => {
    if (currentImageIndex > 0) {
      const prevIndex = currentImageIndex - 1;
      setCurrentImageIndex(prevIndex);
      setSelectedImage(notice?.StoryImage?.[prevIndex] || null);
      setZoomLevel(1);
      setImagePosition({ x: 0, y: 0 });
    }
  };

  // 줌 인
  const handleZoomIn = () => {
    setZoomLevel((prev) => Math.min(prev + 0.5, 3));
  };

  // 줌 아웃
  const handleZoomOut = () => {
    setZoomLevel((prev) => Math.max(prev - 0.5, 0.5));
  };

  // 사용자 메뉴 관련 핸들러
  const handleUserNicknameClick = (event: React.MouseEvent<HTMLElement>, nickname: string) => {
    setUserMenuAnchorEl(event.currentTarget);
    setSelectedUserNickname(nickname);
  };

  const handleUserMenuClose = () => {
    setUserMenuAnchorEl(null);
    setSelectedUserNickname("");
  };

  const handleSendMessageClick = () => {
    setSendMessageModalOpen(true);
    handleUserMenuClose();
  };

  const handleSendMessageModalClose = () => {
    setSendMessageModalOpen(false);
  };

  // 메인으로 이동하는 함수 (이전 페이지 상태 유지)
  const handleGoToMain = () => {
    // 세션 스토리지에서 이전 메인 페이지 URL 확인
    if (typeof window !== "undefined") {
      const previousMainPageUrl = sessionStorage.getItem("previousMainPageUrl");

      if (previousMainPageUrl) {
        // 저장된 URL에서 현재 도메인 부분을 제거하고 경로만 추출
        try {
          const url = new URL(previousMainPageUrl);
          const pathWithQuery = url.pathname + url.search;

          // 세션 스토리지에서 URL 제거 (한 번 사용 후 삭제)
          sessionStorage.removeItem("previousMainPageUrl");

          // 이전 페이지로 이동
          router.push(pathWithQuery);
          return;
        } catch (error) {
          console.error("Invalid URL in session storage:", error);
        }
      }
    }

    // 저장된 URL이 없거나 오류가 발생한 경우 기본 메인으로 이동
    router.push("/");
  };

  // 컨텐츠와 이미지 카드를 함께 렌더링하는 함수
  const renderContentWithImageCards = () => {
    if (!notice?.content) return null;

    // HTML content에서 이미지 태그 찾기
    const imgTagRegex = /<img[^>]*src="([^"]*)"[^>]*>/g;
    const images: Array<{ src: string; style?: string }> = [];
    let match;

    while ((match = imgTagRegex.exec(notice.content)) !== null) {
      const fullTag = match[0];
      const src = match[1];

      // style 속성에서 width 추출
      const styleMatch = fullTag.match(/style="([^"]*)"/);
      const style = styleMatch ? styleMatch[1] : undefined;

      images.push({ src, style });
    }

    // 이미지 태그를 플레이스홀더로 교체
    let processedContent = notice.content;
    let imageIndex = 0;

    processedContent = processedContent.replace(imgTagRegex, () => {
      return `__IMAGE_PLACEHOLDER_${imageIndex++}__`;
    });

    // 텍스트와 이미지를 분리
    const parts = processedContent.split(/(__IMAGE_PLACEHOLDER_\d+__)/);

    return (
      <Box>
        {parts.map((part, index) => {
          if (part.startsWith("__IMAGE_PLACEHOLDER_")) {
            const imgIndex = parseInt(part.match(/\d+/)?.[0] || "0");
            const storyImage = notice.StoryImage?.[imgIndex];
            const imageInfo = images[imgIndex];

            if (storyImage) {
              // HTML content에서 추출한 width 정보 사용
              let customWidth: string | undefined = undefined;
              if (imageInfo?.style) {
                const widthMatch = imageInfo.style.match(/width:\s*([^;]+)/);
                if (widthMatch) {
                  const widthStr = widthMatch[1].trim();
                  // px가 포함된 width만 처리 (max-width는 제외)
                  if (widthStr.includes("px") && !widthStr.includes("max-width")) {
                    customWidth = widthStr;
                  }
                }
              }

              return (
                <Box
                  key={`image-${imgIndex}`}
                  sx={{
                    my: 2,
                    display: "flex",
                    justifyContent: "center",
                  }}
                >
                  <ImageCard
                    img={storyImage}
                    customWidth={customWidth}
                    onClick={() => handleImageClick(storyImage, imgIndex)}
                    isLastOddImage={false}
                  />
                </Box>
              );
            }
            return null;
          } else {
            return (
              <Typography
                key={index}
                component="div"
                sx={{
                  lineHeight: 1.8,
                  fontSize: "1rem",
                  "& p": { marginBottom: 1 },
                  "& h1, & h2, & h3, & h4, & h5, & h6": {
                    marginTop: 2,
                    marginBottom: 1,
                    fontWeight: "bold",
                  },
                  "& ul, & ol": {
                    paddingLeft: 2,
                    marginBottom: 1,
                  },
                  "& li": { marginBottom: 0.5 },
                  "& blockquote": {
                    borderLeft: "4px solid #ddd",
                    paddingLeft: 2,
                    margin: "1rem 0",
                    fontStyle: "italic",
                  },
                  "& code": {
                    backgroundColor: theme.palette.mode === "dark" ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)",
                    padding: "2px 4px",
                    borderRadius: "4px",
                    fontSize: "0.9em",
                  },
                  "& pre": {
                    backgroundColor: theme.palette.mode === "dark" ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)",
                    padding: 2,
                    borderRadius: 1,
                    overflow: "auto",
                    "& code": {
                      backgroundColor: "transparent",
                      padding: 0,
                    },
                  },
                }}
                dangerouslySetInnerHTML={{ __html: part }}
              />
            );
          }
        })}
      </Box>
    );
  };

  // ★ 조건부 return은 훅 선언 이후에 배치합니다.
  if (isLoading) return <Loading />;
  if (isError) return <ErrorView />;

  return (
    <Box display="flex" justifyContent="center" alignItems="center" sx={{ padding: 2, overflow: "hidden" }}>
      {openConfirmDialog && (
        <ConfirmDialog
          open={openConfirmDialog}
          title="공지사항 삭제"
          description="이 공지사항을 삭제하시겠습니까? 삭제된 공지사항은 복구할 수 없습니다."
          onConfirm={confirmDelete}
          onCancel={cancelDelete}
          confirmText="삭제"
          cancelText="취소"
        />
      )}
      {notice && (
        <Card sx={{ width: "100%", boxShadow: 4, padding: 3, borderRadius: 2, bgcolor: "background.paper" }}>
          <CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
              <Typography variant="h4" component="div" sx={{ fontWeight: "bold" }}>
                {notice.title}
              </Typography>
              {/* 공지사항에서는 수정/삭제 버튼을 일반적으로 제공하지 않습니다 */}
            </Box>
            <Typography
              variant="subtitle2"
              color="text.secondary"
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                bgcolor: theme.palette.mode === "dark" ? "rgba(26, 26, 46, 0.8)" : "grey.100",
                p: 1,
                borderRadius: 1,
                mb: 3,
                border: theme.palette.mode === "dark" ? "1px solid rgba(139, 92, 246, 0.3)" : "none",
                boxShadow: theme.palette.mode === "dark" ? "0 0 10px rgba(139, 92, 246, 0.2)" : "none",
              }}
            >
              <LocalOfferIcon fontSize="small" />
              종류: 공지사항
            </Typography>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
              <Box display="flex" alignItems="center" gap={2}>
                <Avatar
                  src={`${process.env.NEXT_PUBLIC_BASE_URL}${notice.User.avatar}`}
                  sx={{ width: 50, height: 50, boxShadow: 2 }}
                />
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: "bold", cursor: "pointer" }}>
                    <Link href={`/profile/${encodeURIComponent(notice.User.nickname)}`} passHref>
                      작성자: {notice.User.nickname}
                    </Link>
                  </Typography>
                  <Box sx={{ display: "flex", gap: 1, mt: 1 }}>
                    <Button onClick={() => router.back()} size="small" variant="contained" color="primary">
                      뒤로가기
                    </Button>
                    <Button
                      onClick={handleGoToMain}
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
              <Box textAlign="right">
                <Typography variant="subtitle2" color="text.secondary">
                  작성일: {dayjs(notice.created_at).format("YYYY/MM/DD HH:mm:ss")}
                </Typography>
                <Typography variant="subtitle2" color="text.secondary">
                  조회수: {notice.read_count}
                </Typography>
              </Box>
            </Box>
            {/* 컨텐츠와 이미지를 함께 렌더링 */}
            <Box
              sx={{
                lineHeight: 1.7,
                bgcolor: theme.palette.mode === "dark" ? "rgba(26, 26, 46, 0.6)" : "grey.50",
                p: 2,
                borderRadius: 1,
                boxShadow: theme.palette.mode === "dark" ? "0 0 15px rgba(139, 92, 246, 0.2)" : 1,
                mb: 3,
                border: theme.palette.mode === "dark" ? "1px solid rgba(139, 92, 246, 0.3)" : "none",
              }}
            >
              {renderContentWithImageCards()}
            </Box>

            {/* 댓글 섹션 추가 */}
            <Box sx={{ mt: 4 }}>
              <CommentsView />
            </Box>
          </CardContent>
        </Card>
      )}

      {/* 이미지 뷰어 다이얼로그 */}
      <Dialog
        open={openImageViewer}
        onClose={handleCloseImageViewer}
        maxWidth={false}
        fullWidth
        sx={{
          "& .MuiDialog-paper": {
            backgroundColor: "rgba(0, 0, 0, 0.9)",
            maxWidth: "95vw",
            maxHeight: "95vh",
            margin: 1,
          },
        }}
      >
        <Box
          sx={{
            position: "relative",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "80vh",
            backgroundColor: "transparent",
          }}
        >
          {/* 닫기 버튼 */}
          <IconButton
            onClick={handleCloseImageViewer}
            sx={{
              position: "absolute",
              top: 8,
              right: 8,
              color: "white",
              zIndex: 2,
              backgroundColor: "rgba(0, 0, 0, 0.5)",
              "&:hover": {
                backgroundColor: "rgba(0, 0, 0, 0.7)",
              },
            }}
          >
            <CloseIcon />
          </IconButton>

          {/* 이전 이미지 버튼 */}
          {notice && notice.StoryImage && notice.StoryImage.length > 1 && currentImageIndex > 0 && (
            <IconButton
              onClick={handlePrevImage}
              sx={{
                position: "absolute",
                left: 16,
                color: "white",
                zIndex: 2,
                backgroundColor: "rgba(0, 0, 0, 0.5)",
                "&:hover": {
                  backgroundColor: "rgba(0, 0, 0, 0.7)",
                },
              }}
            >
              <ArrowBackIosNewIcon />
            </IconButton>
          )}

          {/* 다음 이미지 버튼 */}
          {notice &&
            notice.StoryImage &&
            notice.StoryImage.length > 1 &&
            currentImageIndex < notice.StoryImage.length - 1 && (
              <IconButton
                onClick={handleNextImage}
                sx={{
                  position: "absolute",
                  right: 16,
                  color: "white",
                  zIndex: 2,
                  backgroundColor: "rgba(0, 0, 0, 0.5)",
                  "&:hover": {
                    backgroundColor: "rgba(0, 0, 0, 0.7)",
                  },
                }}
              >
                <ArrowForwardIosIcon />
              </IconButton>
            )}

          {/* 줌 컨트롤 */}
          <Box
            sx={{
              position: "absolute",
              bottom: 16,
              left: 16,
              display: "flex",
              gap: 1,
              zIndex: 2,
            }}
          >
            <Tooltip title="축소">
              <IconButton
                onClick={handleZoomOut}
                sx={{
                  color: "white",
                  backgroundColor: "rgba(0, 0, 0, 0.5)",
                  "&:hover": {
                    backgroundColor: "rgba(0, 0, 0, 0.7)",
                  },
                }}
              >
                <ZoomOutIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="확대">
              <IconButton
                onClick={handleZoomIn}
                sx={{
                  color: "white",
                  backgroundColor: "rgba(0, 0, 0, 0.5)",
                  "&:hover": {
                    backgroundColor: "rgba(0, 0, 0, 0.7)",
                  },
                }}
              >
                <ZoomInIcon />
              </IconButton>
            </Tooltip>
          </Box>

          {/* 현재 이미지 */}
          {selectedImage && (
            <Box
              component="img"
              src={`${process.env.NEXT_PUBLIC_BASE_URL}${selectedImage.link}`}
              alt={selectedImage.image_name}
              sx={{
                maxWidth: "100%",
                maxHeight: "100%",
                objectFit: "contain",
                transform: `scale(${zoomLevel}) translate(${imagePosition.x}px, ${imagePosition.y}px)`,
                cursor: zoomLevel > 1 ? (isDragging ? "grabbing" : "grab") : "default",
                transition: isDragging ? "none" : "transform 0.2s ease",
              }}
            />
          )}

          {/* 이미지 정보 */}
          {selectedImage && (
            <Box
              sx={{
                position: "absolute",
                bottom: 16,
                right: 16,
                color: "white",
                backgroundColor: "rgba(0, 0, 0, 0.5)",
                padding: 1,
                borderRadius: 1,
                fontSize: "0.875rem",
                zIndex: 2,
              }}
            >
              {notice && notice.StoryImage && notice.StoryImage.length > 1
                ? `${currentImageIndex + 1} / ${notice.StoryImage.length}`
                : "1 / 1"}
            </Box>
          )}
        </Box>
      </Dialog>

      {/* 사용자 메뉴 팝오버 */}
      <UserMenuPopover
        anchorEl={userMenuAnchorEl}
        open={Boolean(userMenuAnchorEl)}
        onClose={handleUserMenuClose}
        nickname={selectedUserNickname}
        onSendMessage={handleSendMessageClick}
      />

      {/* 메시지 전송 모달 */}
      <SendMessageModal
        open={sendMessageModalOpen}
        onClose={handleSendMessageModalClose}
        receiverNickname={selectedUserNickname}
      />
    </Box>
  );
}
