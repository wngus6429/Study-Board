"use client";
// 채널 상세 페이지
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
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  IconButton,
  Radio,
  RadioGroup,
  Slide,
  TextField,
  Tooltip,
  Typography,
  useTheme,
} from "@mui/material";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import dayjs from "dayjs";
import { useRouter } from "next/navigation";
import React, { ReactNode, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import LocalOfferIcon from "@mui/icons-material/LocalOffer";
import { useSession } from "next-auth/react";
import { useMessage } from "@/app/store/messageStore";
import { useComment } from "@/app/store/commentStore";
import ConfirmDialog from "@/app/components/common/ConfirmDialog";
import ErrorView from "@/app/components/common/ErrorView";
import RecommendButtonsWithCount from "@/app/components/RecommendButton";
import ImageCard from "@/app/components/ImageCard";
import VideoCard from "@/app/components/VideoCard";
import { StoryType } from "@/app/types/storyDetailType";
import CloseIcon from "@mui/icons-material/Close";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import ZoomInIcon from "@mui/icons-material/ZoomIn";
import ZoomOutIcon from "@mui/icons-material/ZoomOut";
import { TransitionProps } from "@mui/material/transitions";
import UserMenuPopover from "@/app/components/common/UserMenuPopover";
import SendMessageModal from "@/app/components/common/SendMessageModal";
import ReportModal from "@/app/components/common/ReportModal";
import { useRecentViews } from "@/app/store/recentViewsStore";
import { useChannelPageStore } from "@/app/store/channelPageStore";
import BookmarkIcon from "@mui/icons-material/Bookmark";
import BookmarkBorderIcon from "@mui/icons-material/BookmarkBorder";
import ReportIcon from "@mui/icons-material/Report";
import FlagIcon from "@mui/icons-material/Flag";
import { MIN_RECOMMEND_COUNT } from "@/app/const/VIEW_COUNT";

export default function page({ params }: { params: { id: string; slug: string } }): ReactNode {
  // const params = useParams(); // Next.js 13 이상에서 App Directory를 사용하면, page 컴포넌트는 URL 매개변수(파라미터)를 props로 받을 수 있습니다.
  const { showMessage } = useMessage((state) => state);
  const router = useRouter();
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const theme = useTheme();

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

  // 채널 페이지 스토어 (localStorage로 자동 저장/복원)
  const { currentChannelSlug, currentPage, stories } = useChannelPageStore();

  // 스크랩 관련 상태
  const [isScraped, setIsScraped] = useState<boolean>(false);
  const [scrapLoading, setScrapLoading] = useState<boolean>(false);

  // 신고 관련 상태
  const [reportModalOpen, setReportModalOpen] = useState<boolean>(false);
  const [reportLoading, setReportLoading] = useState<boolean>(false);

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

  //! 스크랩 여부 확인
  const { data: scrapStatus } = useQuery({
    queryKey: ["scrap", "check", params?.id],
    queryFn: async () => {
      const response = await axios.get(`${process.env.NEXT_PUBLIC_BASE_URL}/api/scrap/check/${params?.id}`, {
        withCredentials: true,
      });
      return response.data;
    },
    enabled: !!session?.user && !!params?.id && !isDeleted,
    staleTime: 1000 * 60 * 2,
  });

  useEffect(() => {
    if (scrapStatus) {
      setIsScraped(scrapStatus.isScraped);
    }
  }, [scrapStatus]);

  useEffect(() => {
    if (detail != null) {
      console.log("상세데이터", detail);
      document.title = `${detail.title}`;
      openCloseComments(true);
      setLikeCalculate(detail.like_count + -detail.dislike_count);

      // 로그인한 사용자의 경우 최근 본 게시물에 추가
      if (session?.user) {
        addRecentView({
          id: detail.id,
          title: detail.title,
          category: detail.category,
          created_at: detail.created_at,
          channelSlug: params.slug,
        });
      }
    }
    return () => {
      openCloseComments(false);
    };
  }, [detail, session, addRecentView]);

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
      // 채널 페이지가 있으면 해당 채널로, 없으면 메인으로 이동
      if (params.slug) {
        router.push(`/channels/${params.slug}`);
      } else {
        router.push("/");
      }
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

  // 스크랩 추가/삭제 로직
  const scrapMutation = useMutation({
    mutationFn: async (action: "add" | "remove") => {
      if (action === "add") {
        console.log("스크랩 추가 요청 받음");
        return await axios.post(
          `${process.env.NEXT_PUBLIC_BASE_URL}/api/scrap/${params?.id}`,
          {},
          { withCredentials: true }
        );
      } else {
        return await axios.delete(`${process.env.NEXT_PUBLIC_BASE_URL}/api/scrap/${params?.id}`, {
          withCredentials: true,
        });
      }
    },
    onMutate: () => {
      setScrapLoading(true);
    },
    onSuccess: (response, action) => {
      setIsScraped(action === "add");
      queryClient.invalidateQueries({ queryKey: ["scrap", "check", params?.id] });
      showMessage(
        action === "add" ? "스크랩되었습니다." : "스크랩이 취소되었습니다.",
        action === "add" ? "success" : "info"
      );
    },
    onError: (error: any) => {
      console.error("스크랩 API 호출 실패", error);
      showMessage(error.response?.data?.message || "스크랩 처리 중 오류가 발생했습니다.", "error");
    },
    onSettled: () => {
      setScrapLoading(false);
    },
  });

  // 추천, 비추 로직
  const likeOrUnlike = useMutation({
    mutationFn: async ({ storyId, vote }: { storyId: number; vote: "like" | "dislike" }) => {
      console.log("좋아요 API 호출", storyId, vote);
      return await axios.put(
        `${process.env.NEXT_PUBLIC_BASE_URL}/api/story/likeOrUnlike/${storyId}`,
        { userId: session?.user.id, vote, minRecommend: MIN_RECOMMEND_COUNT },
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
    setImagePosition({ x: 0, y: 0 }); // 이미지 위치 초기화
    setOpenImageViewer(true);
  };

  // 이미지 뷰어 닫기
  const handleCloseImageViewer = () => {
    setOpenImageViewer(false);
    setSelectedImage(null);
    setZoomLevel(1); // 줌 레벨 초기화
    setImagePosition({ x: 0, y: 0 }); // 이미지 위치 초기화
    setIsDragging(false); // 드래그 상태 초기화
  };

  // content 순서대로 재구성된 이미지 배열 생성
  const contentOrderedImages = useMemo(() => {
    if (!detail?.content || !detail?.StoryImage) return [];

    const contentImageOrder: StoryImageType[] = [];
    const imageMatches = detail.content.match(/<img[^>]*>/g);

    if (imageMatches) {
      imageMatches.forEach((imgTag) => {
        const srcMatch = imgTag.match(/src="([^"]*)"/);
        if (srcMatch && srcMatch[1]) {
          const imageSrc = srcMatch[1];
          const matchingImage = detail.StoryImage?.find((img) => {
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

    return contentImageOrder;
  }, [detail?.content, detail?.StoryImage]);

  // 다음 이미지로 이동
  const handleNextImage = () => {
    if (contentOrderedImages && currentImageIndex < contentOrderedImages.length - 1) {
      const nextIndex = currentImageIndex + 1;
      setCurrentImageIndex(nextIndex);
      setSelectedImage(contentOrderedImages[nextIndex]);
      setZoomLevel(1); // 줌 레벨 초기화
      setImagePosition({ x: 0, y: 0 }); // 이미지 위치 초기화
    }
  };

  // 이전 이미지로 이동
  const handlePrevImage = () => {
    if (contentOrderedImages && currentImageIndex > 0) {
      const prevIndex = currentImageIndex - 1;
      setCurrentImageIndex(prevIndex);
      setSelectedImage(contentOrderedImages[prevIndex]);
      setZoomLevel(1); // 줌 레벨 초기화
      setImagePosition({ x: 0, y: 0 }); // 이미지 위치 초기화
    }
  };

  // 확대/축소 기능 추가
  const handleZoomIn = () => {
    setZoomLevel((prev) => Math.min(prev + 0.25, 3)); // 최대 3배까지 확대
  };

  const handleZoomOut = () => {
    const newZoomLevel = Math.max(zoomLevel - 0.25, 0.5);
    setZoomLevel(newZoomLevel);

    // 줌 레벨이 1배 이하가 되면 이미지 위치도 초기화
    if (newZoomLevel <= 1) {
      setImagePosition({ x: 0, y: 0 });
    }
  };

  // 드래그 관련 핸들러들
  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoomLevel <= 1) return; // 확대된 상태에서만 드래그 가능

    setIsDragging(true);
    setDragStart({
      x: e.clientX - imagePosition.x,
      y: e.clientY - imagePosition.y,
    });
    e.preventDefault();
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || zoomLevel <= 1) return;

    setImagePosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
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
      } else if (e.key === "r" || e.key === "R") {
        // R키로 이미지 위치 리셋
        setImagePosition({ x: 0, y: 0 });
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [openImageViewer, currentImageIndex, contentOrderedImages, zoomLevel]);

  // 드래그 상태를 전역 마우스 이벤트로도 처리 (이미지 밖으로 나가도 처리)
  useEffect(() => {
    if (!isDragging) return;

    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (!isDragging || zoomLevel <= 1) return;

      setImagePosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    };

    const handleGlobalMouseUp = () => {
      setIsDragging(false);
    };

    document.addEventListener("mousemove", handleGlobalMouseMove);
    document.addEventListener("mouseup", handleGlobalMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleGlobalMouseMove);
      document.removeEventListener("mouseup", handleGlobalMouseUp);
    };
  }, [isDragging, dragStart, zoomLevel]);

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

  // 사용자 메뉴 관련 핸들러
  const handleUserNicknameClick = (event: React.MouseEvent<HTMLElement>, nickname: string) => {
    event.preventDefault();
    event.stopPropagation();
    setUserMenuAnchorEl(event.currentTarget);
    setSelectedUserNickname(nickname);
  };

  const handleUserMenuClose = () => {
    setUserMenuAnchorEl(null);
    setSelectedUserNickname("");
  };

  const handleSendMessageClick = () => {
    setSendMessageModalOpen(true);
  };

  const handleSendMessageModalClose = () => {
    setSendMessageModalOpen(false);
  };

  // 스크랩 버튼 클릭 핸들러
  const handleScrapClick = () => {
    if (!session?.user) {
      showMessage("로그인이 필요합니다.", "warning");
      return;
    }

    // 자신이 작성한 글인지 체크
    if (detail?.User?.id === session?.user?.id) {
      showMessage("자신이 작성한 글은 스크랩할 수 없습니다.", "warning");
      return;
    }

    scrapMutation.mutate(isScraped ? "remove" : "add");
  };

  // 신고 버튼 클릭 핸들러
  const handleReportClick = () => {
    if (!session?.user) {
      showMessage("로그인이 필요합니다.", "warning");
      return;
    }

    // 자신이 작성한 글인지 체크
    if (detail?.User?.id === session?.user?.id) {
      showMessage("자신이 작성한 글은 신고할 수 없습니다.", "warning");
      return;
    }

    setReportModalOpen(true);
  };

  // 신고 모달 닫기
  const handleReportModalClose = () => {
    setReportModalOpen(false);
  };

  // 신고 제출
  const handleReportSubmit = async (reason: string, customReason?: string) => {
    if (!reason) {
      showMessage("신고 사유를 선택해주세요.", "warning");
      return;
    }

    if (reason === "기타" && !customReason?.trim()) {
      showMessage("기타 사유를 입력해주세요.", "warning");
      return;
    }

    setReportLoading(true);

    try {
      // 실제 신고 API 호출
      const requestData = {
        reason: reason,
        custom_reason: reason === "기타" ? customReason : undefined,
      };

      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_BASE_URL}/api/story/report/${params?.id}`,
        requestData,
        { withCredentials: true }
      );

      if (response.status === 201) {
        showMessage("신고가 접수되었습니다. 검토 후 적절한 조치를 취하겠습니다.", "success");
        setReportModalOpen(false); // 신고 모달 닫기
      }
    } catch (error: any) {
      console.error("신고 실패:", error);

      // 서버에서 온 에러 메시지 처리
      if (error.response?.data?.message) {
        showMessage(error.response.data.message, "error");
      } else if (error.response?.status === 400) {
        showMessage("이미 신고한 게시글입니다.", "warning");
      } else if (error.response?.status === 404) {
        showMessage("게시글을 찾을 수 없습니다.", "error");
      } else if (error.response?.status === 401) {
        showMessage("로그인이 필요합니다.", "warning");
      } else {
        showMessage("신고 처리 중 오류가 발생했습니다.", "error");
      }
    } finally {
      setReportLoading(false);
    }
  };

  // ★ 조건부 return은 훅 선언 이후에 배치합니다.
  if (isLoading) return <Loading />;
  if (isError) return <ErrorView />;

  // 본문 내용에서 이미지 태그를 카드뷰로 교체하는 함수
  const renderContentWithImageCards = () => {
    if (!detail?.content) return null;

    let content = detail.content;

    // Object URL을 서버 이미지 URL로 교체 (기존 로직)
    if (detail.StoryImage && detail.StoryImage.length > 0) {
      content = content.replace(/<img[^>]*src="blob:[^"]*"[^>]*>/g, (imgTag) => {
        const altMatch = imgTag.match(/alt="([^"]*)"/);
        const titleMatch = imgTag.match(/title="([^"]*)"/);
        const fileName = altMatch?.[1] || titleMatch?.[1];

        if (fileName) {
          const baseFileName = fileName.replace(/\.[^.]+$/, "");
          const matchingImage = detail.StoryImage.find((img) => {
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

    // 동영상 URL도 처리 - 상대 경로를 절대 경로로 변환
    if (detail.StoryVideo && detail.StoryVideo.length > 0) {
      // <source> 태그 내의 상대 경로를 절대 경로로 변환
      content = content.replace(
        /<source([^>]*)src="\/videoUpload\/([^"]+)"([^>]*)>/g,
        `<source$1src="${process.env.NEXT_PUBLIC_BASE_URL}/videoUpload/$2"$3>`
      );

      // <video> 태그 내의 상대 경로를 절대 경로로 변환
      content = content.replace(
        /src="\/videoUpload\/([^"]+)"/g,
        `src="${process.env.NEXT_PUBLIC_BASE_URL}/videoUpload/$1"`
      );
    }

    // content에 나타나는 순서대로 이미지 배열 재구성
    const contentImageOrder: StoryImageType[] = [];
    const imageMatches = content.match(/<img[^>]*>/g);

    if (imageMatches) {
      imageMatches.forEach((imgTag) => {
        const srcMatch = imgTag.match(/src="([^"]*)"/);
        if (srcMatch && srcMatch[1]) {
          const imageSrc = srcMatch[1];
          const matchingImage = detail.StoryImage?.find((img) => {
            // 정확한 링크 매칭
            if (imageSrc.includes(img.link)) return true;

            // 파일명 기반 매칭
            const srcFileName = imageSrc.split("/").pop();
            const imgFileName = img.link.split("/").pop();
            if (srcFileName && imgFileName && srcFileName === imgFileName) return true;

            // 이미지 이름 기반 매칭 (확장자 제거)
            const srcBaseName = srcFileName?.replace(/\.[^.]+$/, "");
            const imgBaseName = img.image_name?.replace(/\.[^.]+$/, "");
            if (srcBaseName && imgBaseName && imgBaseName.includes(srcBaseName)) return true;

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
      contentImageOrder.map((img) => img.image_name)
    );

    // HTML을 파싱하여 이미지 태그를 카드뷰로 교체
    const parts = content.split(/(<img[^>]*>)/);
    const elements: React.ReactNode[] = [];

    // 연속된 이미지들을 그룹화하기 위한 변수
    let currentImageGroup: Array<{
      img: StoryImageType;
      index: number;
      originalIndex: number;
      customWidth?: string;
      customMargin?: string;
    }> = [];

    const processImageGroup = () => {
      if (currentImageGroup.length === 0) return;

      // 이미지 그룹을 카드뷰로 렌더링 (원래 카드뷰 로직 적용)
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
                  customWidth={item.customWidth} // 추출된 width 정보 전달
                  customMargin={item.customMargin} // 추출된 margin 정보 전달
                />
              );
            })}
          </Box>
        </Box>
      );

      // 그룹 초기화
      currentImageGroup = [];
    };

    parts.forEach((part, index) => {
      if (part.match(/^<img[^>]*>$/)) {
        // 이미지 태그인 경우
        const srcMatch = part.match(/src="([^"]*)"/);

        if (srcMatch && srcMatch[1]) {
          const imageSrc = srcMatch[1];
          console.log(
            `📋 사용 가능한 StoryImage:`,
            detail.StoryImage?.map((img) => img.link)
          );

          // 서버 이미지 URL에서 실제 StoryImage 찾기
          let matchingImage = detail.StoryImage?.find((img) => {
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
          if (!matchingImage && detail.StoryImage && detail.StoryImage.length > 0) {
            console.warn(`이미지 매칭 실패, 기본 이미지 사용: ${imageSrc}`);
            matchingImage = detail.StoryImage[currentImageGroup.length % detail.StoryImage.length];
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
              customWidth: customWidth, // width 정보 추가
              customMargin: customMargin, // margin 정보 추가
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
                    const tempImage: StoryImageType = {
                      id: Date.now(), // 임시 ID
                      image_name: imageSrc.split("/").pop() || "unknown",
                      link: imageSrc.startsWith("http")
                        ? imageSrc.replace(process.env.NEXT_PUBLIC_BASE_URL || "", "")
                        : imageSrc,
                      file_size: 0,
                      mime_type: "image/jpeg",
                      upload_order: 0,
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
              lineHeight: 1.7,
              color: theme.palette.text.primary,
              "& img": {
                maxWidth: "100%",
                height: "auto",
                borderRadius: "8px",
                margin: "8px 0",
              },
              "& video": {
                maxWidth: "100%",
                height: "auto",
                borderRadius: "8px",
                margin: "8px 0",
              },
              "& ol, & ul": {
                paddingLeft: "24px",
                margin: "12px 0",
                listStylePosition: "outside",
              },
              "& ol": {
                listStyleType: "decimal",
              },
              "& ul": {
                listStyleType: "disc",
              },
              "& li": {
                margin: "6px 0",
                paddingLeft: "4px",
              },
            }}
            dangerouslySetInnerHTML={{ __html: part }}
          />
        );
      }
    });

    // 마지막에 남은 이미지 그룹 처리
    processImageGroup();

    return elements;
  };

  return (
    <Box display="flex" justifyContent="center" alignItems="center" sx={{ padding: 1, overflow: "hidden" }}>
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
              <Box display="flex" gap={1.5}>
                {/* 신고 버튼 - 로그인한 사용자이고 자신의 글이 아닐 때만 표시 */}
                {session?.user && detail.User?.id !== session?.user?.id && (
                  <Tooltip title="신고하기">
                    <Button
                      size="medium"
                      variant="outlined"
                      onClick={handleReportClick}
                      startIcon={<ReportIcon sx={{ fontSize: 22 }} />}
                      sx={{
                        borderRadius: "14px",
                        fontWeight: 700,
                        px: 3,
                        py: 1.5,
                        position: "relative",
                        overflow: "hidden",
                        textTransform: "none",
                        transition: "all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
                        background:
                          theme.palette.mode === "dark"
                            ? "linear-gradient(135deg, rgba(239, 68, 68, 0.1), rgba(220, 38, 38, 0.05))"
                            : "linear-gradient(135deg, rgba(255, 255, 255, 0.9), rgba(248, 250, 252, 0.95))",
                        border:
                          theme.palette.mode === "dark"
                            ? "2px solid rgba(239, 68, 68, 0.4)"
                            : "2px solid rgba(239, 68, 68, 0.3)",
                        color: theme.palette.mode === "dark" ? "#fca5a5" : "#dc2626",
                        boxShadow:
                          theme.palette.mode === "dark"
                            ? "0 0 10px rgba(239, 68, 68, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.05)"
                            : "0 0 10px rgba(239, 68, 68, 0.1), 0 2px 8px rgba(0, 0, 0, 0.05), inset 0 1px 0 rgba(255, 255, 255, 0.6)",
                        "&::before": {
                          content: '""',
                          position: "absolute",
                          top: "-2px",
                          left: "-2px",
                          right: "-2px",
                          bottom: "-2px",
                          background: "linear-gradient(45deg, #ef4444, #dc2626, #b91c1c, #ef4444)",
                          borderRadius: "16px",
                          opacity: 0.15,
                          animation: "borderGlow 6s linear infinite",
                          zIndex: -1,
                        },
                        "&::after": {
                          content: '""',
                          position: "absolute",
                          top: "50%",
                          left: "-100%",
                          width: "200%",
                          height: "1px",
                          background:
                            theme.palette.mode === "dark"
                              ? "linear-gradient(90deg, transparent, rgba(239, 68, 68, 0.4), transparent)"
                              : "linear-gradient(90deg, transparent, rgba(239, 68, 68, 0.3), transparent)",
                          transform: "translateY(-50%)",
                          animation: "scanLine 5s ease-in-out infinite",
                          zIndex: 1,
                          pointerEvents: "none",
                        },
                        "@keyframes borderGlow": {
                          "0%": {
                            backgroundPosition: "0% 50%",
                            filter: "hue-rotate(0deg)",
                          },
                          "50%": {
                            backgroundPosition: "100% 50%",
                            filter: "hue-rotate(60deg)",
                          },
                          "100%": {
                            backgroundPosition: "0% 50%",
                            filter: "hue-rotate(0deg)",
                          },
                        },
                        "@keyframes scanLine": {
                          "0%": { left: "-100%", opacity: 0 },
                          "50%": { left: "50%", opacity: 1 },
                          "100%": { left: "200%", opacity: 0 },
                        },
                        "&:hover": {
                          transform: "translateY(-1px) scale(1.01)",
                          background:
                            theme.palette.mode === "dark"
                              ? "linear-gradient(135deg, rgba(239, 68, 68, 0.15), rgba(220, 38, 38, 0.08))"
                              : "linear-gradient(135deg, rgba(239, 68, 68, 0.03), rgba(220, 38, 38, 0.01))",
                          boxShadow:
                            theme.palette.mode === "dark"
                              ? "0 0 15px rgba(239, 68, 68, 0.25)"
                              : "0 0 15px rgba(239, 68, 68, 0.15), 0 4px 12px rgba(0, 0, 0, 0.08)",
                        },
                        "&:active": {
                          transform: "translateY(-1px) scale(0.98)",
                        },
                        "& .MuiButton-startIcon": {
                          filter: "drop-shadow(0 1px 2px rgba(0, 0, 0, 0.2))",
                        },
                      }}
                    >
                      신고하기
                    </Button>
                  </Tooltip>
                )}

                {/* 스크랩 버튼 - 로그인한 사용자이고 자신의 글이 아닐 때만 표시 */}
                {session?.user && detail.User?.id !== session?.user?.id && (
                  <Tooltip title={isScraped ? "스크랩 취소" : "스크랩"}>
                    <Button
                      size="medium"
                      variant={isScraped ? "contained" : "outlined"}
                      onClick={handleScrapClick}
                      disabled={scrapLoading}
                      startIcon={
                        scrapLoading ? (
                          <CircularProgress size={20} />
                        ) : isScraped ? (
                          <BookmarkIcon sx={{ fontSize: 22 }} />
                        ) : (
                          <BookmarkBorderIcon sx={{ fontSize: 22 }} />
                        )
                      }
                      sx={{
                        borderRadius: "14px",
                        fontWeight: 700,
                        px: 3,
                        py: 1.5,
                        position: "relative",
                        overflow: "hidden",
                        textTransform: "none",
                        transition: "all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
                        background: isScraped
                          ? theme.palette.mode === "dark"
                            ? "linear-gradient(135deg, rgba(34, 197, 94, 0.3), rgba(22, 163, 74, 0.2))"
                            : "linear-gradient(135deg, #22c55e, #16a34a, #15803d)"
                          : theme.palette.mode === "dark"
                            ? "linear-gradient(135deg, rgba(34, 197, 94, 0.1), rgba(22, 163, 74, 0.05))"
                            : "linear-gradient(135deg, rgba(255, 255, 255, 0.9), rgba(248, 250, 252, 0.95))",
                        border: isScraped
                          ? theme.palette.mode === "dark"
                            ? "2px solid rgba(34, 197, 94, 0.6)"
                            : "2px solid rgba(34, 197, 94, 0.4)"
                          : theme.palette.mode === "dark"
                            ? "2px solid rgba(34, 197, 94, 0.4)"
                            : "2px solid rgba(34, 197, 94, 0.3)",
                        color: isScraped ? "white" : theme.palette.mode === "dark" ? "#86efac" : "#16a34a",
                        boxShadow: isScraped
                          ? theme.palette.mode === "dark"
                            ? "0 0 12px rgba(34, 197, 94, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.05)"
                            : "0 0 12px rgba(34, 197, 94, 0.15), 0 2px 8px rgba(0, 0, 0, 0.05), inset 0 1px 0 rgba(255, 255, 255, 0.6)"
                          : theme.palette.mode === "dark"
                            ? "0 0 10px rgba(34, 197, 94, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.05)"
                            : "0 0 10px rgba(34, 197, 94, 0.1), 0 2px 8px rgba(0, 0, 0, 0.05), inset 0 1px 0 rgba(255, 255, 255, 0.6)",
                        "&::before": {
                          content: '""',
                          position: "absolute",
                          top: "-2px",
                          left: "-2px",
                          right: "-2px",
                          bottom: "-2px",
                          background: "linear-gradient(45deg, #22c55e, #16a34a, #15803d, #22c55e)",
                          borderRadius: "16px",
                          opacity: 0.2,
                          animation: "borderGlow 6s linear infinite",
                          zIndex: -1,
                        },
                        "&::after": {
                          content: '""',
                          position: "absolute",
                          top: "50%",
                          left: "-100%",
                          width: "200%",
                          height: "1px",
                          background:
                            theme.palette.mode === "dark"
                              ? "linear-gradient(90deg, transparent, rgba(34, 197, 94, 0.4), transparent)"
                              : "linear-gradient(90deg, transparent, rgba(34, 197, 94, 0.3), transparent)",
                          transform: "translateY(-50%)",
                          animation: "scanLine 5s ease-in-out infinite",
                          animationDelay: "1s",
                          zIndex: 1,
                          pointerEvents: "none",
                        },
                        "@keyframes borderGlow": {
                          "0%": {
                            backgroundPosition: "0% 50%",
                            filter: "hue-rotate(0deg)",
                          },
                          "50%": {
                            backgroundPosition: "100% 50%",
                            filter: "hue-rotate(120deg)",
                          },
                          "100%": {
                            backgroundPosition: "0% 50%",
                            filter: "hue-rotate(0deg)",
                          },
                        },
                        "@keyframes scanLine": {
                          "0%": { left: "-100%", opacity: 0 },
                          "50%": { left: "50%", opacity: 1 },
                          "100%": { left: "200%", opacity: 0 },
                        },
                        "&:hover": {
                          transform: "translateY(-1px) scale(1.01)",
                          background: isScraped
                            ? theme.palette.mode === "dark"
                              ? "linear-gradient(135deg, rgba(34, 197, 94, 0.2), rgba(22, 163, 74, 0.15))"
                              : "linear-gradient(135deg, #16a34a, #15803d, #166534)"
                            : theme.palette.mode === "dark"
                              ? "linear-gradient(135deg, rgba(34, 197, 94, 0.15), rgba(22, 163, 74, 0.08))"
                              : "linear-gradient(135deg, rgba(34, 197, 94, 0.03), rgba(22, 163, 74, 0.01))",
                          boxShadow: isScraped
                            ? theme.palette.mode === "dark"
                              ? "0 0 18px rgba(34, 197, 94, 0.3)"
                              : "0 0 18px rgba(34, 197, 94, 0.2), 0 4px 12px rgba(0, 0, 0, 0.08)"
                            : theme.palette.mode === "dark"
                              ? "0 0 15px rgba(34, 197, 94, 0.25)"
                              : "0 0 15px rgba(34, 197, 94, 0.15), 0 4px 12px rgba(0, 0, 0, 0.08)",
                        },
                        "&:active": {
                          transform: "translateY(-1px) scale(0.98)",
                        },
                        "&:disabled": {
                          background: isScraped
                            ? "linear-gradient(135deg, rgba(34, 197, 94, 0.3), rgba(22, 163, 74, 0.2))"
                            : "linear-gradient(135deg, rgba(34, 197, 94, 0.1), rgba(22, 163, 74, 0.05))",
                          transform: "none",
                          boxShadow: "none",
                        },
                        "& .MuiButton-startIcon": {
                          filter: "drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3))",
                        },
                      }}
                    >
                      {isScraped ? "스크랩 취소" : "스크랩"}
                    </Button>
                  </Tooltip>
                )}

                {/* 수정/삭제 버튼 - 자신의 글일 때만 표시 */}
                {detail?.category !== "question" && detail.User?.id === session?.user?.id && (
                  <>
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
                  </>
                )}
              </Box>
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
              종류: {detail.category}
            </Typography>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
              <Box display="flex" alignItems="center" gap={2}>
                <Avatar
                  src={`${process.env.NEXT_PUBLIC_BASE_URL}${detail.User.avatar}`}
                  sx={{ width: 50, height: 50, boxShadow: 2 }}
                />
                <Box>
                  <Typography
                    variant="subtitle1"
                    sx={{ fontWeight: "bold", cursor: "pointer" }}
                    onClick={(e) => handleUserNicknameClick(e, detail.User.nickname)}
                  >
                    작성자: {detail.User.nickname}
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
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  background:
                    theme.palette.mode === "dark"
                      ? "linear-gradient(135deg, rgba(139, 92, 246, 0.8), rgba(6, 182, 212, 0.8))"
                      : "linear-gradient(135deg, #FFE08A, #FFC547)",
                  borderRadius: "12px",
                  boxShadow:
                    theme.palette.mode === "dark"
                      ? "0px 4px 15px rgba(139, 92, 246, 0.3)"
                      : "0px 4px 10px rgba(0, 0, 0, 0.2)",
                  padding: "6px 12px",
                  width: 100,
                  border: theme.palette.mode === "dark" ? "1px solid rgba(139, 92, 246, 0.4)" : "none",
                }}
              >
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: "bold",
                    color: theme.palette.mode === "dark" ? "#ffffff" : "#4A4A4A",
                    textTransform: "none",
                    fontSize: "16px",
                    textShadow: theme.palette.mode === "dark" ? "0 0 8px rgba(255, 255, 255, 0.3)" : "none",
                  }}
                >
                  추천
                </Typography>
                <Typography
                  sx={{
                    fontWeight: "bold",
                    color: theme.palette.mode === "dark" ? "#ffffff" : "#4A4A4A",
                    fontSize: "16px",
                    textShadow: theme.palette.mode === "dark" ? "0 0 8px rgba(255, 255, 255, 0.3)" : "none",
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

            {/* 본문 내용 - 이미지가 중간중간에 카드뷰로 표시됨 */}
            <Box
              sx={{
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

            {/* 비디오 파일이 있는 경우에만 별도 섹션으로 표시 */}
            {detail.StoryVideo && detail.StoryVideo.length > 0 && (
              <Box sx={{ mt: 4 }}>
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
                  첨부된 동영상:
                </Typography>
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 2,
                    justifyContent: "center",
                  }}
                >
                  {detail.StoryVideo.map((video, index) => (
                    <Box
                      key={`video-${video.id}`}
                      sx={{
                        display: "flex",
                        justifyContent: "center",
                        width: "100%",
                      }}
                    >
                      <VideoCard video={video} isLastOddVideo={true} />
                    </Box>
                  ))}
                </Box>
              </Box>
            )}
          </CardContent>
        </Card>
      )}
      {detail &&
        typeof window !== "undefined" &&
        createPortal(
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
          />,
          document.body
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
                userSelect: "none", // 텍스트 선택 방지
              }}
              draggable={false} // HTML 드래그 방지
            />
          )}

          {/* 다음 이미지 네비게이션 버튼 */}
          {contentOrderedImages && currentImageIndex < contentOrderedImages.length - 1 && (
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

      {/* 신고하기 모달 */}
      <ReportModal
        open={reportModalOpen}
        onClose={handleReportModalClose}
        onSubmit={handleReportSubmit}
        loading={reportLoading}
      />
    </Box>
  );
}
