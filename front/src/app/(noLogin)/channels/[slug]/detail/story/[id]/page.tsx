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
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
  useTheme,
} from "@mui/material";
import ImageViewer from "@/app/(noLogin)/channels/[slug]/detail/story/[id]/components/ImageViewer";
import StoryActions from "@/app/(noLogin)/channels/[slug]/detail/story/[id]/components/StoryActions";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import dayjs from "dayjs";
import { useRouter } from "next/navigation";
import React, { ReactNode, useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { sanitizeRichText } from "@/app/utils/sanitizer";
import LocalOfferIcon from "@mui/icons-material/LocalOffer";
import { useSession } from "next-auth/react";
import { useMessage } from "@/app/store/messageStore";
import { useComment } from "@/app/store/commentStore";
import ConfirmDialog from "@/app/components/common/ConfirmDialog";
import LevelBadge from "@/app/components/common/LevelBadge";
import ErrorView from "@/app/components/common/ErrorView";
import RecommendButtonsWithCount from "@/app/components/RecommendButton";
import ImageCard from "@/app/components/ImageCard";
import VideoCard from "@/app/components/VideoCard";
import { StoryType } from "@/app/types/storyDetailType";
import UserMenuPopover from "@/app/components/common/UserMenuPopover";
import SendMessageModal from "@/app/components/common/SendMessageModal";
import ReportModal from "@/app/components/common/ReportModal";
import { useRecentViews } from "@/app/store/recentViewsStore";
import FlagIcon from "@mui/icons-material/Flag";
import { MIN_RECOMMEND_COUNT } from "@/app/const/VIEW_COUNT";
import { useAdmin } from "@/app/hooks/useAdmin";
import { getChannelBySlug } from "@/app/api/channelsApi";
import { addBlindUser } from "@/app/api/blind";

export default function page({ params }: { params: { id: string; slug: string } }): ReactNode {
  // const params = useParams(); // Next.js 13 이상에서 App Directory를 사용하면, page 컴포넌트는 URL 매개변수(파라미터)를 props로 받을 수 있습니다.
  const { showMessage } = useMessage((state) => state);
  const router = useRouter();
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const theme = useTheme();
  const admin = useAdmin();

  const [isDeleted, setIsDeleted] = useState<boolean>(false); // 삭제 상태 추가
  const { openCloseComments } = useComment();
  // 버튼 여러번 연속 클릭 방지
  const [editFlag, setEditFlag] = useState<boolean>(false);

  // 이미지 뷰어 상태 추가
  const [selectedImage, setSelectedImage] = useState<StoryImageType | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState<number>(0);
  const [openImageViewer, setOpenImageViewer] = useState(false);

  // 이미지 뷰어 관련 상태들은 ImageViewer 컴포넌트로 이동됨

  // 사용자 메뉴 관련 상태
  const [userMenuAnchorEl, setUserMenuAnchorEl] = useState<HTMLElement | null>(null);
  const [selectedUserNickname, setSelectedUserNickname] = useState<string>("");
  const [sendMessageModalOpen, setSendMessageModalOpen] = useState<boolean>(false);
  // 블라인드 다이얼로그
  const [blindDialogOpen, setBlindDialogOpen] = useState(false);
  const [blindTargetNickname, setBlindTargetNickname] = useState<string>("");

  // 최근 본 게시물 관리
  const { addRecentView } = useRecentViews();

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

  //! 채널 정보 조회 (관리자 권한 확인용)
  const { data: channelData } = useQuery({
    queryKey: ["channel", "slug", params?.slug],
    queryFn: () => getChannelBySlug(params.slug),
    enabled: !!params?.slug,
    staleTime: 1000 * 60 * 5, // 5분 캐시
  });

  // likeCalculate를 상태 대신 메모이제이션된 계산값으로 변경
  const likeCalculate = useMemo(() => {
    if (!detail) return 0;
    return detail.like_count - detail.dislike_count;
  }, [detail?.like_count, detail?.dislike_count]);

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

  // 특정 댓글로 스크롤하는 함수 (메모이제이션)
  const scrollToComment = useCallback((commentId: string) => {
    const element = document.getElementById(`comment-${commentId}`);
    if (element) {
      element.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
      // 댓글 하이라이트 효과
      element.style.border = "4px solid #ffc107";
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
  }, []);

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

  // 관리자 삭제 관련 상태
  const [openAdminDeleteDialog, setOpenAdminDeleteDialog] = useState(false);
  const [adminDeleteTarget, setAdminDeleteTarget] = useState<number | null>(null);

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

  // 관리자 삭제 핸들러들
  const handleAdminDeleteClick = (id: number) => {
    setAdminDeleteTarget(id);
    setOpenAdminDeleteDialog(true);
  };

  const confirmAdminDelete = async () => {
    if (adminDeleteTarget !== null) {
      await admin.deleteStory(
        adminDeleteTarget,
        undefined, // 채널 ID (현재 상세 페이지에서는 불필요)
        () => {
          setAdminDeleteTarget(null);
          setOpenAdminDeleteDialog(false);
          setIsDeleted(true);
          showMessage("관리자 권한으로 게시글이 삭제되었습니다.", "success");
          // 채널 페이지가 있으면 해당 채널로, 없으면 메인으로 이동
          if (params.slug) {
            router.push(`/channels/${params.slug}`);
          } else {
            router.push("/");
          }
        },
        (error) => {
          showMessage(`관리자 삭제 실패: ${error.message}`, "error");
        }
      );
    }
  };

  const cancelAdminDelete = () => {
    setAdminDeleteTarget(null);
    setOpenAdminDeleteDialog(false);
  };

  // 이미지 클릭 핸들러 (메모이제이션)
  const handleImageClick = useCallback((image: StoryImageType, index: number) => {
    setSelectedImage(image);
    setCurrentImageIndex(index);
    setOpenImageViewer(true);
  }, []);

  // 이미지 뷰어 닫기 (메모이제이션)
  const handleCloseImageViewer = useCallback(() => {
    setOpenImageViewer(false);
    setSelectedImage(null);
  }, []);

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

  // 이미지 변경 핸들러 (ImageViewer 컴포넌트에서 사용) - 메모이제이션
  // 폴라로이드 배열 선언 이후에 정의해야 하므로 아래에서 재정의됨
  let handleImageChange = useCallback((index: number) => {
    setCurrentImageIndex(index);
  }, []);

  // 이미지 네비게이션과 줌/드래그 기능은 ImageViewer 컴포넌트로 이동됨

  // Slide 트랜지션은 ImageViewer 컴포넌트에서 더 이상 사용하지 않음

  // ★ 모든 훅은 조건부 return 전에 호출되어야 합니다.
  // 폴라로이드 미리보기용 이미지 소스 (content 순서 우선, 없으면 원본 배열)
  const polaroidImages = useMemo(() => {
    if (contentOrderedImages && contentOrderedImages.length > 0) {
      return contentOrderedImages;
    }
    return detail?.StoryImage || [];
  }, [contentOrderedImages, detail?.StoryImage]);

  // polaroidImages가 정해진 뒤에 selectedImage를 맞춰주는 변경 핸들러 정의
  handleImageChange = useCallback(
    (index: number) => {
      setCurrentImageIndex(index);
      if (polaroidImages && polaroidImages[index]) {
        setSelectedImage(polaroidImages[index]);
      }
    },
    [polaroidImages]
  );

  // 각 카드에 안정적인 기울기(회전) 값을 부여하기 위한 유틸
  const getPolaroidRotation = useCallback((id: number | undefined, index: number) => {
    const seed = (id ?? 0) + index * 13;
    // -4 ~ +4도 사이의 기울기, 0도는 피해서 1도로 치환
    const angle = (seed % 9) - 4 || 1;
    return `${angle}deg`;
  }, []);
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
          onClick={(img) => {
            const idxInPolaroid = polaroidImages.findIndex((p) => p.id === img.id);
            handleImageClick(img, idxInPolaroid >= 0 ? idxInPolaroid : 0);
          }}
        />
      );
    });
  }, [detail?.StoryImage, polaroidImages]);

  // 메인으로 이동하는 함수 (이전 페이지 상태 유지) - 메모이제이션
  const handleGoToMain = useCallback(() => {
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

    // 저장된 URL이 없거나 오류가 발생한 경우 해당 채널 페이지로 이동
    router.push(`/channels/${params.slug}`);
  }, [router, params.slug]);

  // 사용자 메뉴 관련 핸들러 (메모이제이션)
  const handleUserNicknameClick = useCallback((event: React.MouseEvent<HTMLElement>, nickname: string) => {
    event.preventDefault();
    event.stopPropagation();
    setUserMenuAnchorEl(event.currentTarget);
    setSelectedUserNickname(nickname);
  }, []);

  const handleUserMenuClose = useCallback(() => {
    setUserMenuAnchorEl(null);
    setSelectedUserNickname("");
  }, []);

  const handleSendMessageClick = useCallback(() => {
    setSendMessageModalOpen(true);
  }, []);

  const handleSendMessageModalClose = useCallback(() => {
    setSendMessageModalOpen(false);
  }, []);

  // 블라인드: 팝오버 항목 클릭 시 다이얼로그 오픈
  const handleOpenBlindDialog = useCallback(() => {
    if (!session?.user) {
      showMessage("로그인이 필요합니다.", "warning");
      return;
    }
    // 자기 자신 블라인드 방지
    if (detail?.User?.id && detail?.User?.id === session?.user?.id) {
      showMessage("자기 자신은 블라인드할 수 없습니다.", "warning");
      return;
    }
    setBlindTargetNickname(detail?.User?.nickname || selectedUserNickname);
    setBlindDialogOpen(true);
  }, [session?.user, detail?.User?.id, detail?.User?.nickname, selectedUserNickname, showMessage]);

  const handleCloseBlindDialog = useCallback(() => {
    setBlindDialogOpen(false);
  }, []);

  const blindMutation = useMutation({
    mutationFn: addBlindUser,
    onSuccess: () => {
      showMessage("블라인드에 추가했습니다.", "success");
      queryClient.invalidateQueries({ queryKey: ["blindUsers"] });
      setBlindDialogOpen(false);
    },
    onError: (error: any) => {
      showMessage(error.response?.data?.message || "블라인드 추가 실패", "error");
    },
  });

  const handleConfirmBlind = useCallback(() => {
    const nickname = blindTargetNickname?.trim();
    if (!nickname) {
      showMessage("닉네임을 확인해주세요.", "warning");
      return;
    }
    blindMutation.mutate({ targetUserNickname: nickname });
  }, [blindTargetNickname, blindMutation, showMessage]);

  // 스크랩 버튼 클릭 핸들러 (메모이제이션)
  const handleScrapClick = useCallback(() => {
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
  }, [session?.user, detail?.User?.id, showMessage, scrapMutation, isScraped]);

  // 신고 버튼 클릭 핸들러 (메모이제이션)
  const handleReportClick = useCallback(() => {
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
  }, [session?.user, detail?.User?.id, showMessage]);

  // 신고 모달 닫기 (메모이제이션)
  const handleReportModalClose = useCallback(() => {
    setReportModalOpen(false);
  }, []);

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

  // 본문 내용에서 이미지 태그를 카드뷰로 교체하는 함수 (간결화)
  const renderContentWithImageCards = useMemo(() => {
    if (!detail?.content) return null;

    // 1) blob 이미지 src를 서버 URL로 교체
    let content = detail.content;
    if (detail.StoryImage?.length) {
      content = content.replace(/<img[^>]*src="blob:[^"]*"[^>]*>/g, (imgTag) => {
        const fileName = imgTag.match(/alt="([^"]*)"/)?.[1] || imgTag.match(/title="([^"]*)"/)?.[1];
        if (!fileName) return "";
        const base = fileName.replace(/\.[^.]+$/, "");
        const matched = detail.StoryImage.find(
          (img) =>
            img.image_name.replace(/\.[^.]+$/, "").includes(base) ||
            base.includes(img.image_name.replace(/\.[^.]+$/, ""))
        );
        return matched
          ? imgTag.replace(/src="blob:[^"]*"/, `src="${process.env.NEXT_PUBLIC_BASE_URL}${matched.link}"`)
          : "";
      });
    }

    // 2) 동영상 상대 경로 절대화
    if (detail.StoryVideo?.length) {
      content = content
        .replace(
          /<source([^>]*)src="\/videoUpload\/([^"]+)"([^>]*)>/g,
          `<source$1src="${process.env.NEXT_PUBLIC_BASE_URL}/videoUpload/$2"$3>`
        )
        .replace(/src="\/videoUpload\/([^"]+)"/g, `src="${process.env.NEXT_PUBLIC_BASE_URL}/videoUpload/$1"`);
    }

    // 3) 매칭 및 속성 파싱 유틸
    const orderedImages = contentOrderedImages.length > 0 ? contentOrderedImages : detail.StoryImage || [];

    const parseImgAttrs = (imgTag: string) => {
      const src = imgTag.match(/src="([^"]*)"/)?.[1];
      const style = imgTag.match(/style="([^"]*)"/)?.[1] || "";
      let customWidth: string | undefined;
      let customMargin: string | undefined;
      style.split(";").forEach((prop) => {
        const p = prop.trim();
        if (!p) return;
        if (p.startsWith("width:") && !p.startsWith("max-width:")) customWidth = p.split(":")[1]?.trim();
        if (p.startsWith("margin:")) customMargin = p.split(":")[1]?.trim();
      });
      return { src, customWidth, customMargin };
    };

    const findMatchingImage = (imageSrc: string): StoryImageType | undefined => {
      if (!detail.StoryImage?.length) return undefined;
      const srcFileName = imageSrc.split("/").pop();
      const srcBase = srcFileName?.replace(/\.[^.]+$/, "");
      return (
        detail.StoryImage.find((img) => imageSrc.includes(img.link)) ||
        detail.StoryImage.find((img) => srcFileName && img.link.split("/").pop() === srcFileName) ||
        detail.StoryImage.find((img) => srcBase && img.image_name.replace(/\.[^.]+$/, "").includes(srcBase))
      );
    };

    // 4) 토큰화 후 이미지 그룹 렌더링
    const parts = content.split(/(<img[^>]*>)/);
    const elements: React.ReactNode[] = [];
    let group: Array<{
      img: StoryImageType;
      index: number;
      keyIdx: number;
      customWidth?: string;
      customMargin?: string;
    }> = [];

    const flush = () => {
      if (group.length === 0) return;
      elements.push(
        <Box key={`image-group-${elements.length}`} sx={{ my: 3 }}>
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, justifyContent: "center" }}>
            {group.map((g, i) => (
              <ImageCard
                key={`image-${g.img.id}-${g.keyIdx}`}
                img={g.img}
                isLastOddImage={i === group.length - 1 && group.length % 2 !== 0}
                onClick={(img) => handleImageClick(img, g.index)}
                customWidth={g.customWidth}
                customMargin={g.customMargin}
              />
            ))}
          </Box>
        </Box>
      );
      group = [];
    };

    parts.forEach((part, idx) => {
      const isImg = /^<img[^>]*>$/.test(part);
      if (!isImg) {
        if (part.trim()) {
          flush();
          elements.push(
            <Box
              key={`text-${idx}`}
              sx={{
                lineHeight: 1.7,
                color: theme.palette.text.primary,
                "& img": { maxWidth: "100%", height: "auto", borderRadius: "8px", margin: "8px 0" },
                "& video": { maxWidth: "100%", height: "auto", borderRadius: "8px", margin: "8px 0" },
                "& ol, & ul": { paddingLeft: "24px", margin: "12px 0", listStylePosition: "outside" },
                "& ol": { listStyleType: "decimal" },
                "& ul": { listStyleType: "disc" },
                "& li": { margin: "6px 0", paddingLeft: "4px" },
              }}
              dangerouslySetInnerHTML={{ __html: sanitizeRichText(part) }}
            />
          );
        }
        return;
      }

      const { src, customWidth, customMargin } = parseImgAttrs(part);
      if (!src) return;
      const matched = findMatchingImage(src);
      if (matched) {
        const indexInOrder = Math.max(
          0,
          orderedImages.findIndex((im) => im.id === matched.id)
        );
        group.push({ img: matched, index: indexInOrder, keyIdx: idx, customWidth, customMargin });
        return;
      }

      // 매칭 실패 시 즉시 단일 이미지로 렌더링
      flush();
      elements.push(
        <Box key={`img-fallback-${idx}`} sx={{ my: 2, textAlign: "center" }}>
          <Box
            component="img"
            src={src}
            alt="이미지"
            sx={{
              maxWidth: "100%",
              height: "auto",
              borderRadius: "8px",
              cursor: "pointer",
              "&:hover": { opacity: 0.8, transform: "scale(1.02)" },
              transition: "all 0.2s ease",
            }}
            onClick={() => {
              const tempImage: StoryImageType = {
                id: Date.now(),
                image_name: src.split("/").pop() || "unknown",
                link: src.startsWith("http") ? src.replace(process.env.NEXT_PUBLIC_BASE_URL || "", "") : src,
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
    });

    flush();
    return elements;
  }, [
    detail?.content,
    detail?.StoryImage,
    detail?.StoryVideo,
    theme.palette.text.primary,
    contentOrderedImages,
    handleImageClick,
  ]);

  // 페이지 렌더링 - 조건부 렌더링을 JSX에서 처리
  if (isLoading) return <Loading />;
  if (isError) return <ErrorView />;

  return (
    <Box 
      display="flex" 
      justifyContent="center" 
      alignItems="center" 
      sx={{ 
        padding: { xs: 0, sm: 1 }, // 모바일에서는 padding 제거
        overflow: "hidden" 
      }}
    >
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
        <Card sx={{ 
          width: "100%", 
          boxShadow: { xs: 0, sm: 4 }, // 모바일에서 그림자 제거
          padding: { xs: 0.5, sm: 3 }, // 모바일에서 padding 최소화
          borderRadius: { xs: 0, sm: 2 }, // 모바일에서 borderRadius 제거
          bgcolor: "background.paper" 
        }}>
          <CardContent>
            {/* 제목 */}
            <Box mb={{ xs: 2, sm: 3 }}>
              <Typography variant="h4" component="div" sx={{ fontWeight: "bold" }}>
                {detail.title}
              </Typography>
            </Box>

            {/* 버튼 영역 - 모바일에서는 제목 바로 아래, PC/태블릿에서는 오른쪽 */}
            <Box 
              sx={{ 
                display: { xs: "block", sm: "flex" },
                justifyContent: { sm: "flex-end" },
                mb: 3,
                mt: { xs: 0, sm: -11 } // PC/태블릿에서 제목 옆으로 위치
              }}
            >
              <StoryActions
                currentUserId={session?.user?.id}
                authorId={detail.User?.id}
                category={detail.category}
                storyId={detail.id}
                isScraped={isScraped}
                scrapLoading={scrapLoading}
                onScrapClick={handleScrapClick}
                onReportClick={handleReportClick}
                editFlag={editFlag}
                onEditClick={() => {
                  setEditFlag(true);
                  router.push(`/edit/story/${detail.id}`);
                }}
                onDeleteClick={() => handleDeleteClick(detail.id)}
                hasAdminPermission={admin.hasAdminPermission({
                  channelId: channelData?.id,
                  creatorId: channelData?.creator?.id,
                })}
                adminLoading={admin.isLoading}
                adminBadgeText={admin.getAdminBadgeText({
                  channelId: channelData?.id,
                  creatorId: channelData?.creator?.id,
                })}
                onAdminDeleteClick={() => handleAdminDeleteClick(detail.id)}
              />
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
                    sx={{ fontWeight: "bold", cursor: "pointer", display: "flex", alignItems: "center", gap: 1 }}
                    onClick={(e) => handleUserNicknameClick(e, detail.User.nickname)}
                  >
                    작성자: {detail.User.nickname}
                    <LevelBadge level={detail.User.level} size="small" />
                  </Typography>
                  <Box sx={{ display: "flex", gap: 1, mt: 1 }}>
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

            {/* 폴라로이드 카드 프리뷰 (Masonry-like columns) */}
            {polaroidImages.length > 0 && (
              <Box sx={{ 
                mb: { xs: 2, sm: 3 }, 
                mx: { xs: -0.5, sm: 0 } // 모바일에서 좌우 여백 제거
              }}>
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: "bold",
                    mb: 1.5,
                    ml: { xs: 0.5, sm: 0 }, // 타이틀은 약간의 왼쪽 여백 유지
                    color: theme.palette.mode === "dark" ? "#e5e7eb" : "#374151",
                  }}
                >
                  폴라로이드 프리뷰
                </Typography>
                <Box
                  sx={{
                    columnCount: { xs: 1, sm: 2, md: 3 },
                    columnGap: { xs: 0.5, sm: 2 }, // 모바일에서 간격 최소화
                    px: { xs: 0.5, sm: 0 }, // 모바일에서 최소 padding만 유지
                  }}
                >
                  {polaroidImages.map((img, idx) => {
                    const src = `${process.env.NEXT_PUBLIC_BASE_URL}${img.link}`;
                    const rotation = getPolaroidRotation(img.id, idx);
                    return (
                      <Box key={`polaroid-${img.id}-${idx}`} sx={{ breakInside: "avoid", mb: { xs: 1.5, sm: 2 } }}>
                        <Box
                          onClick={() => handleImageClick(img, idx)}
                          sx={{
                            cursor: "pointer",
                            bgcolor: "#ffffff",
                            border: "1px solid",
                            borderColor: theme.palette.mode === "dark" ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)",
                            borderRadius: 1.5,
                            boxShadow:
                              theme.palette.mode === "dark"
                                ? "0 6px 18px rgba(0,0,0,0.5)"
                                : "0 8px 18px rgba(0,0,0,0.15)",
                            p: 1,
                            pt: 1,
                            pb: 2.5,
                            transform: `rotate(${rotation})`,
                            transition: "transform 220ms ease, box-shadow 220ms ease",
                            "&:hover": {
                              transform: "translateY(-8px) rotate(0deg) scale(1.02)",
                              boxShadow:
                                theme.palette.mode === "dark"
                                  ? "0 14px 30px rgba(0,0,0,0.65)"
                                  : "0 16px 30px rgba(0,0,0,0.22)",
                            },
                          }}
                        >
                          <Box
                            component="img"
                            src={src}
                            alt={img.image_name || "image"}
                            loading="lazy"
                            sx={{
                              width: "100%",
                              display: "block",
                              borderRadius: 1,
                              boxShadow:
                                theme.palette.mode === "dark"
                                  ? "0 1px 6px rgba(0,0,0,0.6)"
                                  : "0 1px 6px rgba(0,0,0,0.15)",
                            }}
                          />
                        </Box>
                      </Box>
                    );
                  })}
                </Box>
              </Box>
            )}

            {/* 본문 내용 - 이미지가 중간중간에 카드뷰로 표시됨 */}
            <Box
              sx={{
                bgcolor: { 
                  xs: "transparent", // 모바일에서 배경색 제거
                  sm: theme.palette.mode === "dark" ? "rgba(26, 26, 46, 0.6)" : "grey.50" 
                },
                p: { xs: 0, sm: 2 }, // 모바일에서 padding 제거
                mx: { xs: -0.5, sm: 0 }, // 모바일에서 좌우로 확장
                borderRadius: { xs: 0, sm: 1 }, // 모바일에서 borderRadius 제거
                boxShadow: { 
                  xs: "none", // 모바일에서 그림자 제거
                  sm: theme.palette.mode === "dark" ? "0 0 15px rgba(139, 92, 246, 0.2)" : 1 
                },
                mb: { xs: 2, sm: 3 },
                border: { 
                  xs: "none", // 모바일에서 테두리 제거
                  sm: theme.palette.mode === "dark" ? "1px solid rgba(139, 92, 246, 0.3)" : "none" 
                },
              }}
            >
              {renderContentWithImageCards}
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

      {/* 새로운 ImageViewer 컴포넌트 사용 */}
      <ImageViewer
        open={openImageViewer}
        selectedImage={selectedImage}
        currentImageIndex={currentImageIndex}
        images={polaroidImages}
        onClose={handleCloseImageViewer}
        onImageChange={handleImageChange}
      />

      {/* 사용자 메뉴 팝오버 */}
      <UserMenuPopover
        open={Boolean(userMenuAnchorEl)}
        anchorEl={userMenuAnchorEl}
        onClose={handleUserMenuClose}
        nickname={selectedUserNickname}
        onSendMessage={handleSendMessageClick}
        onBlindUser={handleOpenBlindDialog}
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

      {/* 블라인드 확인 다이얼로그 */}
      <Dialog open={blindDialogOpen} onClose={handleCloseBlindDialog} maxWidth="xs" fullWidth>
        <DialogTitle>사용자 블라인드</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            아래 사용자를 블라인드 목록에 추가하시겠습니까?
          </Typography>
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
            {blindTargetNickname}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseBlindDialog}>취소</Button>
          <Button onClick={handleConfirmBlind} variant="contained" disabled={blindMutation.isPending}>
            {blindMutation.isPending ? "처리 중..." : "블라인드"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 관리자 삭제 확인 다이얼로그 */}
      <Dialog open={openAdminDeleteDialog} onClose={cancelAdminDelete} aria-labelledby="admin-delete-dialog-title">
        <DialogTitle
          id="admin-delete-dialog-title"
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            color: "error.main",
          }}
        >
          <FlagIcon />
          관리자 권한으로 게시글 삭제
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2, color: "text.primary" }}>
            부적절한 내용으로 판단되어 이 게시글을 삭제하시겠습니까?
          </Typography>
          {detail && (
            <Typography
              variant="body2"
              sx={{
                p: 2,
                bgcolor: "action.hover",
                borderRadius: 1,
                maxWidth: "400px",
                wordBreak: "break-word",
                color: "text.primary",
                border: "1px solid",
                borderColor: "divider",
              }}
            >
              "{detail.title}"
            </Typography>
          )}
          <Typography variant="caption" color="error" sx={{ mt: 1, display: "block" }}>
            ⚠️ 이 작업은 되돌릴 수 없습니다. 관리자 권한으로 실행됩니다.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={cancelAdminDelete} color="primary">
            취소
          </Button>
          <Button onClick={confirmAdminDelete} color="error" variant="contained" disabled={admin.isLoading}>
            {admin.isLoading ? "삭제 중..." : "관리자 삭제"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
