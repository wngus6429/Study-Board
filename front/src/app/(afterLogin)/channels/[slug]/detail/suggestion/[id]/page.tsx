"use client";
import Loading from "@/app/components/common/Loading";
import {
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Typography,
  useTheme,
  Chip,
  Paper,
  Dialog,
  IconButton,
  Tooltip,
} from "@mui/material";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import dayjs from "dayjs";
import { useRouter } from "next/navigation";
import { ReactNode, useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { useMessage } from "@/app/store/messageStore";
import ConfirmDialog from "@/app/components/common/ConfirmDialog";
import ErrorView from "@/app/components/common/ErrorView";
import Link from "next/link";
import ImageCard from "@/app/components/ImageCard";
import { SuggestionImageType } from "@/app/types/imageTypes";
import LocalOfferIcon from "@mui/icons-material/LocalOffer";
import FeedbackIcon from "@mui/icons-material/Feedback";
import PersonIcon from "@mui/icons-material/Person";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import UpdateIcon from "@mui/icons-material/Update";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import CloseIcon from "@mui/icons-material/Close";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import ZoomInIcon from "@mui/icons-material/ZoomIn";
import ZoomOutIcon from "@mui/icons-material/ZoomOut";
import BookmarkIcon from "@mui/icons-material/Bookmark";
import BookmarkBorderIcon from "@mui/icons-material/BookmarkBorder";
import UserMenuPopover from "@/app/components/common/UserMenuPopover";
import UserBadge from "@/app/components/common/UserBadge";
import SendMessageModal from "@/app/components/common/SendMessageModal";
// MODIFIED: SuggestionType 타입 사용 (건의사항 상세 데이터)
// import { SuggestionType } from "@/app/types/suggestionDetailType";

export default function page({ params }: { params: { id: string; slug: string } }): ReactNode {
  const { showMessage } = useMessage((state) => state);
  const router = useRouter();
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const theme = useTheme();

  const [isDeleted, setIsDeleted] = useState<boolean>(false);

  // 이미지 뷰어 상태
  const [selectedImage, setSelectedImage] = useState<SuggestionImageType | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState<number>(0);
  const [openImageViewer, setOpenImageViewer] = useState(false);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [imagePosition, setImagePosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // 사용자 메뉴 관련 상태
  const [userMenuAnchorEl, setUserMenuAnchorEl] = useState<HTMLElement | null>(null);
  const [selectedUserNickname, setSelectedUserNickname] = useState<string>("");
  const [sendMessageModalOpen, setSendMessageModalOpen] = useState<boolean>(false);

  // 스크랩 관련 상태
  const [isScraped, setIsScraped] = useState<boolean>(false);
  const [scrapLoading, setScrapLoading] = useState<boolean>(false);

  //! 건의사항 상세 데이터 가져오기
  const {
    data: detail,
    isLoading,
    isError,
    error,
  } = useQuery<any>({
    queryKey: ["suggestion", "detail", params?.id],
    queryFn: async () => {
      const response = await axios.get(`${process.env.NEXT_PUBLIC_BASE_URL}/api/suggestion/detail/${params?.id}`, {
        withCredentials: true,
      });
      console.log("건의사항 상세", response);
      return response.data;
    },
    retry: 1,
    retryDelay: () => 2000,
    enabled: !!params?.id && !isDeleted,
    staleTime: 1000 * 60 * 4,
    gcTime: 1000 * 60 * 4,
  });

  useEffect(() => {
    if (detail) {
      console.log("detail", detail);
      document.title = `${detail.title}`;
    }
  }, [detail]);

  //! 에러 발생 시 404 처리 등
  useEffect(() => {
    if (isError && !isDeleted) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        router.replace("/not-found");
      } else {
        showMessage("오류가 발생했습니다. 다시 시도해주세요.", "error");
      }
    }
  }, [isError, error, router, isDeleted]);

  //! 건의사항 삭제
  const deleteData = useMutation({
    mutationFn: async (suggestionId: number) => {
      return await axios.delete(`${process.env.NEXT_PUBLIC_BASE_URL}/api/suggestion/${suggestionId}`, {
        withCredentials: true,
      });
    },
    onSuccess() {
      queryClient.removeQueries({ queryKey: ["suggestion", "detail", params?.id] });
      setIsDeleted(true);
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

  // 이미지 뷰어 관련 함수들
  const handleImageClick = (image: SuggestionImageType, index: number) => {
    setSelectedImage(image);
    setCurrentImageIndex(index);
    setOpenImageViewer(true);
    setZoomLevel(1);
    setImagePosition({ x: 0, y: 0 });
  };

  const handleCloseImageViewer = () => {
    setOpenImageViewer(false);
    setSelectedImage(null);
    setZoomLevel(1);
    setImagePosition({ x: 0, y: 0 });
  };

  const handleNextImage = () => {
    if (detail?.SuggestionImage && currentImageIndex < detail.SuggestionImage.length - 1) {
      const nextIndex = currentImageIndex + 1;
      setCurrentImageIndex(nextIndex);
      setSelectedImage(detail.SuggestionImage[nextIndex]);
      setZoomLevel(1);
      setImagePosition({ x: 0, y: 0 });
    }
  };

  const handlePrevImage = () => {
    if (currentImageIndex > 0) {
      const prevIndex = currentImageIndex - 1;
      setCurrentImageIndex(prevIndex);
      setSelectedImage(detail?.SuggestionImage[prevIndex]);
      setZoomLevel(1);
      setImagePosition({ x: 0, y: 0 });
    }
  };

  const handleZoomIn = () => {
    setZoomLevel((prev) => Math.min(prev + 0.5, 3));
  };

  const handleZoomOut = () => {
    setZoomLevel((prev) => Math.max(prev - 0.5, 0.5));
  };

  // 드래그 관련 함수들
  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoomLevel > 1) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - imagePosition.x, y: e.clientY - imagePosition.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && zoomLevel > 1) {
      setImagePosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
  };

  // 사용자 메뉴 관련 함수들
  const handleUserNicknameClick = (event: React.MouseEvent<HTMLElement>, nickname: string) => {
    setUserMenuAnchorEl(event.currentTarget);
    setSelectedUserNickname(nickname);
  };

  const handleUserMenuClose = () => {
    setUserMenuAnchorEl(null);
  };

  const handleSendMessageClick = () => {
    setSendMessageModalOpen(true);
    handleUserMenuClose();
  };

  const handleSendMessageModalClose = () => {
    setSendMessageModalOpen(false);
  };

  const handleGoToMain = () => {
    router.push("/");
  };

  // MODIFIED: 건의사항 이미지 처리 (SuggestionImage 배열 사용)
  const memoizedImageCards = useMemo(() => {
    if (!detail || !detail.SuggestionImage || detail.SuggestionImage.length === 0) {
      return null;
    }
    return detail.SuggestionImage.map((img: any, index: number) => {
      const isLastOddImage = index === detail.SuggestionImage.length - 1 && detail.SuggestionImage.length % 2 !== 0;
      return (
        <ImageCard
          key={`${img.id}-${index}`}
          img={img}
          isLastOddImage={isLastOddImage}
          onClick={(image) => handleImageClick(image, index)}
        />
      );
    });
  }, [detail?.SuggestionImage]);

  // 본문 내용 렌더링 (스토리와 비슷한 방식)
  const renderContentWithImageCards = () => {
    if (!detail?.content) return null;

    let content = detail.content;

    // 빈 src 속성과 blob URL을 서버 이미지 URL로 교체 (스토리와 동일한 로직)
    if (detail.SuggestionImage && detail.SuggestionImage.length > 0) {
      // 빈 src 속성을 가진 이미지 태그 처리
      content = content.replace(/<img[^>]*src=""[^>]*>/g, (imgTag: string) => {
        const altMatch = imgTag.match(/alt="([^"]*)"/);
        const titleMatch = imgTag.match(/title="([^"]*)"/);
        const fileName = altMatch?.[1] || titleMatch?.[1];

        console.log("🔍 빈 src 이미지 태그 발견:", { imgTag, fileName });

        if (fileName) {
          // 파일명에서 확장자 제거하여 기본 이름 추출
          const baseFileName = fileName.replace(/\.[^.]+$/, "");

          const matchingImage = detail.SuggestionImage.find((img: any) => {
            // 이미지 이름에서 확장자 제거
            const imgBaseName = img.image_name.replace(/\.[^.]+$/, "");
            const imgBaseNameWithoutDate = imgBaseName.replace(/_\d{8}$/, ""); // 날짜 제거

            console.log("🔍 이미지 매칭 시도:", {
              baseFileName,
              imgBaseName,
              imgBaseNameWithoutDate,
              imageName: img.image_name,
            });

            // 다양한 매칭 방식 시도
            return (
              imgBaseName.includes(baseFileName) ||
              baseFileName.includes(imgBaseName) ||
              imgBaseNameWithoutDate.includes(baseFileName) ||
              baseFileName.includes(imgBaseNameWithoutDate) ||
              img.image_name.includes(fileName) ||
              fileName.includes(img.image_name)
            );
          });

          if (matchingImage) {
            console.log("✅ 매칭된 이미지:", matchingImage);
            return imgTag.replace(/src=""/, `src="${process.env.NEXT_PUBLIC_BASE_URL}${matchingImage.link}"`);
          } else {
            console.warn("❌ 매칭 실패:", fileName);
          }
        }
        return imgTag; // 매칭 실패시 원본 반환
      });

      // blob URL을 서버 이미지 URL로 교체
      content = content.replace(/<img[^>]*src="blob:[^"]*"[^>]*>/g, (imgTag: string) => {
        const altMatch = imgTag.match(/alt="([^"]*)"/);
        const titleMatch = imgTag.match(/title="([^"]*)"/);
        const fileName = altMatch?.[1] || titleMatch?.[1];

        if (fileName) {
          const baseFileName = fileName.replace(/\.[^.]+$/, "");
          const matchingImage = detail.SuggestionImage.find((img: any) => {
            const imgBaseName = img.image_name.replace(/\.[^.]+$/, "");
            return imgBaseName.includes(baseFileName) || baseFileName.includes(imgBaseName);
          });

          if (matchingImage) {
            return imgTag.replace(/src="blob:[^"]*"/, `src="${process.env.NEXT_PUBLIC_BASE_URL}${matchingImage.link}"`);
          }
        }
        return "";
      });
    }

    console.log("🔄 처리된 content:", content);

    // content에 나타나는 순서대로 이미지 배열 재구성
    const contentImageOrder: SuggestionImageType[] = [];
    const imageMatches = content.match(/<img[^>]*>/g);

    if (imageMatches) {
      imageMatches.forEach((imgTag: string) => {
        const srcMatch = imgTag.match(/src="([^"]*)"/);
        if (srcMatch && srcMatch[1]) {
          const imageSrc = srcMatch[1];
          const matchingImage = detail.SuggestionImage?.find((img: any) => {
            // 정확한 링크 매칭
            if (imageSrc.includes(img.link)) return true;

            // 파일명 기반 매칭
            const srcFileName = imageSrc.split("/").pop();
            const imgFileName = img.link.split("/").pop();
            if (srcFileName && imgFileName && srcFileName === imgFileName) return true;

            return false;
          });

          if (matchingImage && !contentImageOrder.find((img) => img.id === matchingImage.id)) {
            contentImageOrder.push(matchingImage);
          }
        }
      });
    }

    console.log(
      "📸 Content 순서대로 재구성된 이미지 배열:",
      contentImageOrder.map((img: any) => img.image_name)
    );

    // HTML을 파싱하여 이미지 태그를 카드뷰로 교체
    const parts = content.split(/(<img[^>]*>)/);
    const elements: React.ReactNode[] = [];

    // 연속된 이미지들을 그룹화하기 위한 변수
    let currentImageGroup: Array<{
      img: SuggestionImageType;
      index: number;
      originalIndex: number;
      customWidth?: string;
      customMargin?: string;
    }> = [];

    const processImageGroup = () => {
      if (currentImageGroup.length === 0) return;

      elements.push(
        <Box key={`image-group-${elements.length}`} sx={{ my: 3 }}>
          <Box
            sx={{
              display: "flex",
              flexWrap: "wrap",
              gap: 2,
              justifyContent: "center",
            }}
          >
            {currentImageGroup.map((item, idx) => {
              const isLastOddImage = idx === currentImageGroup.length - 1 && currentImageGroup.length % 2 !== 0;
              return (
                <ImageCard
                  key={`image-${item.img.id}-${item.originalIndex}`}
                  img={item.img}
                  isLastOddImage={isLastOddImage}
                  onClick={(img) => handleImageClick(img, item.index)}
                  customWidth={item.customWidth}
                  customMargin={item.customMargin}
                />
              );
            })}
          </Box>
        </Box>
      );

      currentImageGroup = [];
    };

    parts.forEach((part: string, index: number) => {
      if (part.match(/^<img[^>]*>$/)) {
        // 이미지 태그인 경우
        const srcMatch = part.match(/src="([^"]*)"/);

        if (srcMatch && srcMatch[1]) {
          const imageSrc = srcMatch[1];
          console.log(
            `📋 사용 가능한 SuggestionImage:`,
            detail.SuggestionImage?.map((img: any) => img.link)
          );

          // 서버 이미지 URL에서 실제 SuggestionImage 찾기
          let matchingImage = detail.SuggestionImage?.find((img: any) => {
            // 1. 정확한 링크 매칭
            if (imageSrc.includes(img.link)) return true;

            // 2. 파일명 기반 매칭
            const srcFileName = imageSrc.split("/").pop();
            const imgFileName = img.link.split("/").pop();
            if (srcFileName && imgFileName && srcFileName === imgFileName) return true;

            // 3. 이미지 이름 기반 매칭 (확장자 제거)
            const srcBaseName = srcFileName?.replace(/\.[^.]+$/, "");
            const imgBaseName = img.image_name?.replace(/\.[^.]+$/, "");
            if (srcBaseName && imgBaseName && imgBaseName.includes(srcBaseName)) return true;

            return false;
          });

          // 매칭되는 이미지를 찾지 못한 경우, 첫 번째 이미지를 기본값으로 사용
          if (!matchingImage && detail.SuggestionImage && detail.SuggestionImage.length > 0) {
            console.warn(`이미지 매칭 실패, 기본 이미지 사용: ${imageSrc}`);
            matchingImage = detail.SuggestionImage[currentImageGroup.length % detail.SuggestionImage.length];
          }

          if (matchingImage) {
            // content 순서 기준으로 인덱스 찾기
            const imageIndex = contentImageOrder.findIndex((img) => img.id === matchingImage.id);

            // 이미지 태그에서 width와 margin 정보 추출
            const styleMatch = part.match(/style="([^"]*)"/);
            let customWidth = undefined;
            let customMargin = undefined;
            if (styleMatch && styleMatch[1]) {
              const styleText = styleMatch[1];
              // CSS 속성들을 세미콜론으로 분리
              const styleProperties = styleText.split(";");

              // width 속성만 찾기 (max-width 제외)
              const widthProperty = styleProperties.find((prop) => {
                const trimmed = prop.trim();
                return trimmed.startsWith("width:") && !trimmed.startsWith("max-width:");
              });

              if (widthProperty) {
                const widthValue = widthProperty.split(":")[1]?.trim();
                if (widthValue) {
                  customWidth = widthValue;
                }
              }

              // margin 속성 찾기
              const marginProperty = styleProperties.find((prop) => {
                const trimmed = prop.trim();
                return trimmed.startsWith("margin:");
              });

              if (marginProperty) {
                const marginValue = marginProperty.split(":")[1]?.trim();
                if (marginValue) {
                  customMargin = marginValue;
                }
              }
            }

            // 현재 이미지 그룹에 추가
            currentImageGroup.push({
              img: matchingImage,
              index: imageIndex >= 0 ? imageIndex : 0,
              originalIndex: index,
              customWidth: customWidth,
              customMargin: customMargin,
            });
          } else {
            // 정말로 매칭되는 이미지가 없는 경우, 클릭 가능한 이미지로 렌더링
            processImageGroup();
            elements.push(
              <Box key={`img-fallback-${index}`} sx={{ my: 2, textAlign: "center" }}>
                <Box
                  component="img"
                  src={imageSrc}
                  alt="이미지"
                  sx={{
                    maxWidth: "100%",
                    height: "auto",
                    borderRadius: "8px",
                    cursor: "pointer",
                    "&:hover": {
                      opacity: 0.8,
                      transform: "scale(1.02)",
                    },
                    transition: "all 0.2s ease",
                  }}
                  onClick={() => {
                    // 폴백 이미지에 대한 임시 객체 생성
                    const tempImage: SuggestionImageType = {
                      id: Date.now(),
                      image_name: imageSrc.split("/").pop() || "unknown",
                      link: imageSrc.startsWith("http")
                        ? imageSrc.replace(process.env.NEXT_PUBLIC_BASE_URL || "", "")
                        : imageSrc,
                      file_size: 0,
                      mime_type: "image/jpeg",
                      created_at: new Date().toISOString(),
                    };
                    handleImageClick(tempImage, 0);
                  }}
                />
              </Box>
            );
          }
        }
      } else if (part.trim()) {
        // 텍스트 내용인 경우, 현재 이미지 그룹을 먼저 처리
        processImageGroup();

        elements.push(
          <Box
            key={`text-${index}`}
            sx={{
              lineHeight: 1.8,
              fontSize: "1.1rem",
              color: theme.palette.text.primary,
              "& p": {
                margin: "16px 0",
              },
              "& ol, & ul": {
                paddingLeft: "28px",
                margin: "16px 0",
                listStylePosition: "outside",
              },
              "& ol": {
                listStyleType: "decimal",
              },
              "& ul": {
                listStyleType: "disc",
              },
              "& li": {
                margin: "8px 0",
                paddingLeft: "4px",
                lineHeight: 1.7,
              },
              "& h1, & h2, & h3, & h4, & h5, & h6": {
                margin: "24px 0 16px 0",
                fontWeight: "bold",
                color: theme.palette.mode === "dark" ? "#8b5cf6" : "#7c3aed",
              },
              "& blockquote": {
                borderLeft: `4px solid ${theme.palette.mode === "dark" ? "#8b5cf6" : "#7c3aed"}`,
                paddingLeft: "16px",
                margin: "16px 0",
                fontStyle: "italic",
                background: theme.palette.mode === "dark" ? "rgba(139, 92, 246, 0.1)" : "rgba(139, 92, 246, 0.05)",
                borderRadius: "0 8px 8px 0",
                padding: "12px 16px",
              },
            }}
            dangerouslySetInnerHTML={{ __html: part }}
          />
        );
      }
    });

    // 마지막 이미지 그룹 처리
    processImageGroup();

    return elements;
  };

  if (isLoading) return <Loading />;
  if (isError) return <ErrorView />;

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background:
          theme.palette.mode === "dark"
            ? "linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.95) 50%, rgba(51, 65, 85, 0.95) 100%)"
            : "linear-gradient(135deg, #f8fafc 0%, #e2e8f0 50%, #cbd5e1 100%)",
        py: 4,
        px: 2,
      }}
    >
      {openConfirmDialog && (
        <ConfirmDialog
          open={openConfirmDialog}
          title="건의사항 삭제"
          description="이 건의사항을 삭제하시겠습니까? 삭제된 건의사항은 복구할 수 없습니다."
          onConfirm={confirmDelete}
          onCancel={cancelDelete}
          confirmText="삭제"
          cancelText="취소"
        />
      )}

      {detail && (
        <Box sx={{ maxWidth: "1200px", margin: "0 auto" }}>
          <Card sx={{ width: "100%", boxShadow: 4, padding: 3, borderRadius: 2, bgcolor: "background.paper" }}>
            <CardContent>
              {/* 뒤로가기와 메인으로 버튼 */}
              <Box sx={{ mb: 2, display: "flex", gap: 1 }}>
                <Button
                  onClick={() => router.back()}
                  startIcon={<ArrowBackIcon />}
                  variant="outlined"
                  size="small"
                  sx={{
                    borderColor: theme.palette.mode === "dark" ? "rgba(139, 92, 246, 0.5)" : "rgba(139, 92, 246, 0.3)",
                    color: theme.palette.mode === "dark" ? "#8b5cf6" : "#7c3aed",
                    "&:hover": {
                      borderColor:
                        theme.palette.mode === "dark" ? "rgba(139, 92, 246, 0.8)" : "rgba(139, 92, 246, 0.5)",
                      background:
                        theme.palette.mode === "dark" ? "rgba(139, 92, 246, 0.1)" : "rgba(139, 92, 246, 0.05)",
                    },
                  }}
                >
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

              {/* 제목과 액션 버튼 */}
              <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={3}>
                <Box flex={1} mr={3}>
                  <Box display="flex" alignItems="center" gap={2} mb={2}>
                    <FeedbackIcon
                      sx={{
                        fontSize: 32,
                        color: theme.palette.mode === "dark" ? "#8b5cf6" : "#7c3aed",
                      }}
                    />
                    <Typography
                      variant="h3"
                      component="h1"
                      sx={{
                        fontWeight: "bold",
                        background:
                          theme.palette.mode === "dark"
                            ? "linear-gradient(135deg, #8b5cf6, #06b6d4)"
                            : "linear-gradient(135deg, #7c3aed, #0891b2)",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                        backgroundClip: "text",
                      }}
                    >
                      {detail.title}
                    </Typography>
                  </Box>

                  {/* 카테고리 칩 */}
                  <Chip
                    icon={<LocalOfferIcon />}
                    label={`카테고리: ${detail.category}`}
                    variant="outlined"
                    sx={{
                      borderColor:
                        theme.palette.mode === "dark" ? "rgba(139, 92, 246, 0.5)" : "rgba(139, 92, 246, 0.3)",
                      color: theme.palette.mode === "dark" ? "#8b5cf6" : "#7c3aed",
                      backgroundColor:
                        theme.palette.mode === "dark" ? "rgba(139, 92, 246, 0.1)" : "rgba(139, 92, 246, 0.05)",
                      fontWeight: 600,
                      "& .MuiChip-icon": {
                        color: theme.palette.mode === "dark" ? "#8b5cf6" : "#7c3aed",
                      },
                    }}
                  />
                </Box>

                {/* 수정/삭제 버튼 */}
                {detail?.User?.id === session?.user?.id && (
                  <Box display="flex" gap={1.5}>
                    <Button
                      variant="outlined"
                      color="warning"
                      startIcon={<EditIcon />}
                      onClick={(e) => {
                        e.preventDefault();
                        router.push(`/edit/suggestion/${detail.id}`);
                      }}
                      sx={{
                        borderRadius: 3,
                        px: 3,
                        fontWeight: 600,
                        textTransform: "none",
                      }}
                    >
                      수정
                    </Button>
                    <Button
                      variant="outlined"
                      color="error"
                      startIcon={<DeleteIcon />}
                      onClick={(e) => {
                        e.preventDefault();
                        handleDeleteClick(detail.id);
                      }}
                      sx={{
                        borderRadius: 3,
                        px: 3,
                        fontWeight: 600,
                        textTransform: "none",
                      }}
                    >
                      삭제
                    </Button>
                  </Box>
                )}
              </Box>

              {/* 작성자 정보와 날짜 */}
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Box display="flex" alignItems="center" gap={3}>
                  <Avatar
                    src={`${process.env.NEXT_PUBLIC_BASE_URL}${detail.User.userImage}`}
                    sx={{
                      width: 70,
                      height: 70,
                      boxShadow:
                        theme.palette.mode === "dark"
                          ? "0 0 20px rgba(139, 92, 246, 0.3)"
                          : "0 4px 20px rgba(0, 0, 0, 0.15)",
                      border: `3px solid ${theme.palette.mode === "dark" ? "rgba(139, 92, 246, 0.3)" : "rgba(139, 92, 246, 0.2)"}`,
                    }}
                  />
                  <Box>
                    <Box display="flex" alignItems="center" gap={1} mb={1}>
                      <PersonIcon sx={{ color: theme.palette.mode === "dark" ? "#8b5cf6" : "#7c3aed" }} />
                      <Box display="flex" alignItems="center" gap={1}>
                        <Typography
                          variant="h6"
                          sx={{
                            fontWeight: "bold",
                            cursor: "pointer",
                            color: theme.palette.mode === "dark" ? "#8b5cf6" : "#7c3aed",
                          }}
                          onClick={(e) => handleUserNicknameClick(e, detail.User.nickname)}
                        >
                          {detail.User.nickname}
                        </Typography>
                        <UserBadge totalExperience={detail.User?.experience_points ?? 0} showText={false} />
                      </Box>
                    </Box>
                    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500, mb: 1 }}>
                      건의사항 작성자
                    </Typography>
                  </Box>
                </Box>

                {/* 날짜 정보 */}
                <Box textAlign="right">
                  <Box display="flex" alignItems="center" gap={1} mb={1}>
                    <AccessTimeIcon fontSize="small" sx={{ color: "text.secondary" }} />
                    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                      등록일: {dayjs(detail.created_at).format("YYYY년 MM월 DD일 HH:mm")}
                    </Typography>
                  </Box>
                  <Box display="flex" alignItems="center" gap={1}>
                    <UpdateIcon fontSize="small" sx={{ color: "text.secondary" }} />
                    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                      수정일: {dayjs(detail.updated_at).format("YYYY년 MM월 DD일 HH:mm")}
                    </Typography>
                  </Box>
                </Box>
              </Box>

              {/* 본문 내용 */}
              <Box
                sx={{
                  bgcolor: theme.palette.mode === "dark" ? "rgba(26, 26, 46, 0.6)" : "grey.50",
                  p: 3,
                  borderRadius: 3,
                  boxShadow: theme.palette.mode === "dark" ? "0 0 15px rgba(139, 92, 246, 0.2)" : 1,
                  mb: 3,
                  border: theme.palette.mode === "dark" ? "1px solid rgba(139, 92, 246, 0.3)" : "none",
                }}
              >
                {renderContentWithImageCards()}
              </Box>

              {/* 첨부 이미지 섹션 (이미지가 본문에 없을 때만 표시) */}
              {memoizedImageCards && detail.content && !detail.content.includes("<img") && (
                <Box sx={{ mt: 4 }}>
                  <Typography
                    variant="h5"
                    sx={{
                      fontWeight: "bold",
                      mb: 3,
                      textAlign: "center",
                      color: theme.palette.mode === "dark" ? "#8b5cf6" : "#7c3aed",
                      borderBottom: `2px solid ${theme.palette.mode === "dark" ? "rgba(139, 92, 246, 0.3)" : "rgba(139, 92, 246, 0.2)"}`,
                      pb: 1,
                    }}
                  >
                    🖼️ 첨부된 이미지
                  </Typography>

                  <Box
                    sx={{
                      display: "flex",
                      flexWrap: "wrap",
                      justifyContent: "center",
                      gap: 2,
                      mt: 3,
                    }}
                  >
                    {memoizedImageCards}
                  </Box>
                </Box>
              )}
            </CardContent>
          </Card>
        </Box>
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
              fontSize: "1.8rem",
            }}
          >
            <ZoomOutIcon sx={{ fontSize: "1.8rem" }} />
          </IconButton>

          <Typography
            variant="body1"
            sx={{
              color: "silver",
              mx: 1,
              fontSize: "1.1rem",
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
              fontSize: "1.8rem",
            }}
          >
            <ZoomInIcon sx={{ fontSize: "1.8rem" }} />
          </IconButton>

          {/* 닫기 버튼 */}
          <IconButton
            onClick={handleCloseImageViewer}
            sx={{
              color: "silver",
              "&:hover": { color: "white" },
              fontSize: "1.8rem",
            }}
          >
            <CloseIcon sx={{ fontSize: "1.8rem" }} />
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
                fontSize: "2rem",
              }}
            >
              <ArrowBackIosNewIcon sx={{ fontSize: "2rem" }} />
            </IconButton>
          )}

          {/* 이미지 */}
          {selectedImage && (
            <Box
              component="img"
              src={`${process.env.NEXT_PUBLIC_BASE_URL}${selectedImage.link}`}
              alt="Selected"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseLeave}
              sx={{
                maxWidth: "90%",
                maxHeight: "80vh",
                objectFit: "contain",
                transform: `scale(${zoomLevel}) translate(${imagePosition.x / zoomLevel}px, ${imagePosition.y / zoomLevel}px)`,
                transition: isDragging ? "none" : "transform 0.2s ease-out",
                border: "1px solid rgba(192, 192, 192, 0.2)",
                cursor: zoomLevel > 1 ? (isDragging ? "grabbing" : "grab") : "default",
                userSelect: "none",
              }}
              draggable={false}
            />
          )}

          {/* 다음 이미지 네비게이션 버튼 */}
          {detail?.SuggestionImage && currentImageIndex < detail.SuggestionImage.length - 1 && (
            <IconButton
              onClick={handleNextImage}
              sx={{
                position: "absolute",
                right: { xs: 8, md: 24 },
                color: "silver",
                "&:hover": { color: "white" },
                fontSize: "2rem",
              }}
            >
              <ArrowForwardIosIcon sx={{ fontSize: "2rem" }} />
            </IconButton>
          )}
        </Box>
      </Dialog>

      {/* 사용자 메뉴 팝오버 */}
      <UserMenuPopover
        open={Boolean(userMenuAnchorEl)}
        anchorEl={userMenuAnchorEl}
        onClose={handleUserMenuClose}
        nickname={selectedUserNickname}
        onSendMessage={handleSendMessageClick}
      />

      {/* 쪽지 보내기 모달 */}
      <SendMessageModal
        open={sendMessageModalOpen}
        onClose={handleSendMessageModalClose}
        receiverNickname={selectedUserNickname}
      />
    </Box>
  );
}
