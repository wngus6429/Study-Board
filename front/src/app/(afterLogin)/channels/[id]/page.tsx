"use client";
// 채널 상세 페이지
import React, { useState, useEffect, useMemo } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Avatar,
  Chip,
  Tab,
  Tabs,
  IconButton,
  useTheme,
  FormControl,
  Select,
  MenuItem,
  SelectChangeEvent,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import {
  PersonAdd as PersonAddIcon,
  Notifications as NotificationsIcon,
  NotificationsOff as NotificationsOffIcon,
  Create as CreateIcon,
  Star as StarIcon,
  People as PeopleIcon,
  Article as ArticleIcon,
  TrendingUp as TrendingUpIcon,
  ViewList as ViewListIcon,
  ViewModule as ViewModuleIcon,
  EmojiEvents as EmojiEventsIcon,
  Verified as VerifiedIcon,
  Person as PersonIcon,
  Edit as EditIcon,
  Announcement as AnnouncementIcon,
  FiberNew as FiberNewIcon,
} from "@mui/icons-material";
import { useRouter, useParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { useMessage } from "@/app/store/messageStore";
import usePageStore from "@/app/store/pageStore";
import { useSubscriptionStore } from "@/app/store/subscriptionStore";
import { TABLE_VIEW_COUNT } from "@/app/const/VIEW_COUNT";
import { TAB_SELECT_OPTIONS } from "@/app/const/WRITE_CONST";
import CustomizedTables from "@/app/components/table/CustomizedTables";
import CustomizedCardView from "@/app/components/table/CustomizedCardView";
import Pagination from "@/app/components/common/Pagination";
import SearchBar from "@/app/components/common/SearchBar";
import Loading from "@/app/components/common/Loading";
import ErrorView from "@/app/components/common/ErrorView";
// API 함수들 import
import { getChannel, subscribeChannel, unsubscribeChannel, Channel } from "@/app/api/channelsApi";
// 새로운 커스텀 훅들 import
import { useChannelStories } from "@/app/components/api/useChannelStories";
import { useChannelCardStories } from "@/app/components/api/useChannelCardStories";

const ChannelDetailPage = () => {
  const theme = useTheme();
  const router = useRouter();
  const params = useParams();
  const channelId = params?.id ? Number(params.id) : 0;
  const { data: session } = useSession();
  const { showMessage } = useMessage();
  const queryClient = useQueryClient();
  const { currentPage, setCurrentPage } = usePageStore();
  const {
    isSubscribed: checkIsSubscribed,
    addSubscription,
    removeSubscription,
    loadSubscriptions,
  } = useSubscriptionStore();

  // 상태 관리
  const [currentTab, setCurrentTab] = useState("all");
  const [isNotificationEnabled, setIsNotificationEnabled] = useState(false);
  const [viewMode, setViewMode] = useState<"table" | "card">("table");
  const [sortOrder, setSortOrder] = useState<"recent" | "view" | "recommend">("recent");
  const [recommendRankingMode, setRecommendRankingMode] = useState(false);
  const [searchParamsState, setSearchParamsState] = useState<{ type: string; query: string } | null>(null);
  const [showChannelInfo, setShowChannelInfo] = useState(false);
  const [showNotice, setShowNotice] = useState(false);
  const [showUnsubscribeConfirm, setShowUnsubscribeConfirm] = useState(false);

  const viewCount = TABLE_VIEW_COUNT;

  // 현재 채널의 구독 상태
  const isSubscribed = checkIsSubscribed(channelId);

  // URL 파라미터에서 상태 초기화 (MainView 방식)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);

      // 카테고리 초기화
      const categoryParam = urlParams.get("category");
      if (categoryParam) {
        setCurrentTab(categoryParam);
      }

      // 뷰 모드 초기화
      const viewModeParam = urlParams.get("viewMode");
      if (viewModeParam === "card") {
        setViewMode("card");
      }

      // 추천 랭킹 모드 초기화
      const recommendRankingParam = urlParams.get("recommendRanking");
      if (recommendRankingParam === "true") {
        setRecommendRankingMode(true);
      }

      // 정렬 순서 초기화
      const sortOrderParam = urlParams.get("sortOrder");
      if (sortOrderParam && ["recent", "view", "recommend"].includes(sortOrderParam)) {
        setSortOrder(sortOrderParam as "recent" | "view" | "recommend");
      }

      // 페이지 초기화
      const pageParam = urlParams.get("page");
      if (pageParam) {
        setCurrentPage(Number(pageParam));
      }

      // 검색 상태 초기화
      const searchType = urlParams.get("searchType");
      const searchQuery = urlParams.get("searchQuery");
      if (searchType && searchQuery) {
        setSearchParamsState({ type: searchType, query: searchQuery });
      }
    }
  }, [setCurrentPage]);

  // 채널 정보 조회
  const {
    data: channelData,
    isLoading: channelLoading,
    isError: channelError,
    error: channelApiError,
  } = useQuery<Channel>({
    queryKey: ["channel", channelId],
    queryFn: () => getChannel(channelId),
    enabled: !!channelId,
    staleTime: 1000 * 60 * 5, // 5분간 캐시
    retry: 2,
  });

  // 채널 테이블 데이터 조회 (새로운 커스텀 훅 사용)
  const {
    data: tableData,
    error: tableError,
    isLoading: tableLoading,
  } = useChannelStories({
    channelId,
    category: currentTab,
    currentPage,
    searchParamsState,
    recommendRankingMode,
    viewCount,
    viewMode,
  });

  // 채널 카드 데이터 조회 (새로운 커스텀 훅 사용)
  const {
    data: cardData,
    error: cardError,
    isLoading: cardLoading,
  } = useChannelCardStories({
    channelId,
    category: currentTab,
    currentPage,
    searchParamsState,
    recommendRankingMode,
    viewCount,
    viewMode,
  });

  // MainView 스타일로 데이터 처리
  const currentData = viewMode === "card" ? cardData : tableData;
  const currentError = viewMode === "card" ? cardError : tableError;
  const currentLoading = viewMode === "card" ? cardLoading : tableLoading;
  const currentTotal = currentData?.total || 0;

  // 구독 mutation
  const subscribeMutation = useMutation({
    mutationFn: subscribeChannel,
    onSuccess: () => {
      if (channelData) {
        addSubscription(channelData);
      }
      showMessage("채널을 구독했습니다!", "success");
      queryClient.invalidateQueries({ queryKey: ["channel", channelId] });
    },
    onError: (error: any) => {
      console.error("구독 실패:", error);
      showMessage(error.response?.data?.message || "구독에 실패했습니다.", "error");
    },
  });

  // 구독 취소 mutation
  const unsubscribeMutation = useMutation({
    mutationFn: unsubscribeChannel,
    onSuccess: () => {
      removeSubscription(channelId);
      showMessage("채널 구독을 취소했습니다.", "info");
      queryClient.invalidateQueries({ queryKey: ["channel", channelId] });
    },
    onError: (error: any) => {
      console.error("구독 취소 실패:", error);
      showMessage(error.response?.data?.message || "구독 취소에 실패했습니다.", "error");
    },
  });

  // 에러 처리
  useEffect(() => {
    if (channelError) {
      console.error("채널 조회 실패:", channelApiError);
      showMessage("채널을 불러오는데 실패했습니다.", "error");
    }
    if (currentError) {
      console.error("게시글 조회 실패:", currentError);
      showMessage("게시글을 불러오는데 실패했습니다.", "error");
    }
  }, [channelError, currentError, channelApiError, showMessage]);

  // 초기 페이지 설정
  useEffect(() => {
    setCurrentPage(1);
  }, [channelId, setCurrentPage]);

  // 구독 데이터 로드
  useEffect(() => {
    loadSubscriptions();
  }, [loadSubscriptions]);

  // 탭 변경 핸들러 (MainView 방식 적용)
  const handleTabChange = (event: React.SyntheticEvent, newValue: string) => {
    // 선택한 탭 값 업데이트
    setCurrentTab(newValue);
    // 페이지 번호 초기화
    setCurrentPage(1);

    // URL 쿼리 파라미터 구성
    const params = new URLSearchParams();
    params.set("category", newValue);

    // 검색 상태가 있으면 URL에 유지
    if (searchParamsState) {
      params.set("searchType", searchParamsState.type);
      params.set("searchQuery", searchParamsState.query);
    }

    // 추천 랭킹 모드 상태 유지
    params.set("recommendRanking", recommendRankingMode.toString());

    // 현재 뷰 모드 상태 유지
    params.set("viewMode", viewMode);

    // 정렬 순서 유지
    params.set("sortOrder", sortOrder);

    // URL 업데이트
    router.push(`/channels/${channelId}?${params.toString()}`, { scroll: false });
  };

  // 구독 토글 핸들러
  const handleSubscribeToggle = () => {
    if (!session?.user) {
      showMessage("로그인이 필요합니다.", "warning");
      return;
    }

    if (isSubscribed) {
      setShowUnsubscribeConfirm(true);
    } else {
      subscribeMutation.mutate(channelId);
    }
  };

  // 구독 취소 확인 핸들러
  const handleUnsubscribeConfirm = () => {
    unsubscribeMutation.mutate(channelId);
    setShowUnsubscribeConfirm(false);
  };

  // 구독 취소 취소 핸들러
  const handleUnsubscribeCancel = () => {
    setShowUnsubscribeConfirm(false);
  };

  // 알림 토글 핸들러
  const handleNotificationToggle = () => {
    setIsNotificationEnabled(!isNotificationEnabled);
    showMessage(isNotificationEnabled ? "알림을 끄셨습니다." : "알림을 켜셨습니다.", "info");
  };

  // 게시글 클릭 핸들러
  const handlePostClick = (postId: number) => {
    // 현재 채널 페이지 URL을 세션 스토리지에 저장
    if (typeof window !== "undefined") {
      sessionStorage.setItem("previousMainPageUrl", window.location.href);
    }
    router.push(`/detail/${postId}`);
  };

  // 글쓰기 핸들러
  const handleWritePost = () => {
    if (!session?.user) {
      showMessage("로그인이 필요합니다.", "warning");
      return;
    }
    router.push(`/write/story?channel=${channelId}`);
  };

  // 페이지네이션 핸들러 (URL 업데이트 포함)
  const handlePageClick = (selectedItem: { selected: number }) => {
    const newPage = selectedItem.selected + 1;
    setCurrentPage(newPage);

    // 기존 쿼리 파라미터들을 유지하면서 페이지 번호만 업데이트
    const params = new URLSearchParams(window.location.search);
    params.set("page", newPage.toString());

    router.push(`/channels/${channelId}?${params.toString()}`, { scroll: false });
  };

  // 정렬 변경 핸들러 (URL 업데이트 포함)
  const handleSortChange = (event: SelectChangeEvent<"recent" | "view" | "recommend">) => {
    const newSortOrder = event.target.value as "recent" | "view" | "recommend";
    setSortOrder(newSortOrder);

    // 현재 URL 쿼리 파라미터 가져오기
    const params = new URLSearchParams(window.location.search);
    // sortOrder 파라미터 추가 또는 업데이트
    params.set("sortOrder", newSortOrder);
    // URL 업데이트
    router.push(`/channels/${channelId}?${params.toString()}`, { scroll: false });
  };

  // 추천 랭킹 토글 (URL 업데이트 포함)
  const toggleRecommendRanking = () => {
    const newMode = !recommendRankingMode;
    setRecommendRankingMode(newMode);
    setCurrentPage(1);

    // URL 쿼리 파라미터 구성
    const params = new URLSearchParams();
    params.set("category", currentTab);

    if (searchParamsState) {
      params.set("searchType", searchParamsState.type);
      params.set("searchQuery", searchParamsState.query);
    }

    params.set("recommendRanking", newMode.toString());
    params.set("viewMode", viewMode);
    params.set("sortOrder", sortOrder);

    router.push(`/channels/${channelId}?${params.toString()}`, { scroll: false });
  };

  // 검색 핸들러 (URL 업데이트 포함)
  const handleSearch = ({ category, query }: { category: string; query: string }) => {
    setSearchParamsState({ type: category, query });
    setCurrentPage(1);

    const params = new URLSearchParams();
    params.set("category", currentTab);
    params.set("searchType", category);
    params.set("searchQuery", query);
    params.set("recommendRanking", recommendRankingMode.toString());
    params.set("viewMode", viewMode);
    params.set("sortOrder", sortOrder);

    router.push(`/channels/${channelId}?${params.toString()}`, { scroll: false });
  };

  // 검색 초기화 (URL 업데이트 포함)
  const handleClearSearch = () => {
    setSearchParamsState(null);
    setCurrentPage(1);

    const params = new URLSearchParams();
    params.set("category", currentTab);
    params.set("recommendRanking", recommendRankingMode.toString());
    params.set("viewMode", viewMode);
    params.set("sortOrder", sortOrder);

    router.push(`/channels/${channelId}?${params.toString()}`, { scroll: false });
  };

  // 뷰 모드 변경 핸들러 (URL 업데이트 포함)
  const handleViewModeChange = (mode: "table" | "card") => {
    setViewMode(mode);

    // 기존 URL의 쿼리 파라미터를 유지하고, viewMode 업데이트
    const params = new URLSearchParams(window.location.search);
    params.set("viewMode", mode);

    router.push(`/channels/${channelId}?${params.toString()}`, { scroll: false });
  };

  // 구독자 수 포맷팅
  const formatSubscriberCount = (count: number) => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    } else if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  };

  // 정렬된 테이블 데이터
  const sortedTableData = useMemo(() => {
    if (!currentData) return [];
    return [...currentData.results]
      .sort((a, b) => {
        if (sortOrder === "view") {
          return b.read_count - a.read_count;
        } else if (sortOrder === "recommend") {
          return b.recommend_Count - a.recommend_Count;
        }
        return 0;
      })
      .map((item) => ({
        ...item,
        isRecommendRanking: recommendRankingMode,
      }));
  }, [currentData, sortOrder, recommendRankingMode]);

  // 채널 공지사항 조회
  const {
    data: channelNoticesData,
    isLoading: noticesLoading,
    isError: noticesError,
  } = useQuery({
    queryKey: ["channelNotices", channelId],
    queryFn: async () => {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/api/story/notices?channel=${channelId}&limit=20`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch notices");
      }
      return response.json();
    },
    enabled: !!channelId && showNotice,
    staleTime: 1000 * 60 * 5, // 5분간 캐시
  });

  const channelNotices = channelNoticesData?.results || [];

  // 공지사항 관련 헬퍼 함수들
  const isNewNotice = (createdAt: string) => {
    const noticeDate = new Date(createdAt);
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    return noticeDate > threeDaysAgo;
  };

  const truncateTitle = (title: string, maxLength: number = 35) => {
    return title.length > maxLength ? `${title.substring(0, maxLength)}...` : title;
  };

  const handleNoticeClick = (noticeId: number) => {
    router.push(`/notice/${noticeId}`);
    setShowNotice(false);
  };

  const handleWriteNotice = () => {
    if (!session?.user) {
      showMessage("로그인이 필요합니다.", "warning");
      return;
    }
    router.push(`/write/notice?channel=${channelId}`);
    setShowNotice(false);
  };

  // 로딩 처리
  if (channelLoading) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          background:
            theme.palette.mode === "dark"
              ? "linear-gradient(135deg, rgba(26, 26, 46, 0.95), rgba(16, 16, 32, 0.98))"
              : "linear-gradient(135deg, #f8f9fa, #e9ecef)",
        }}
      >
        <CircularProgress
          size={60}
          sx={{
            color: theme.palette.mode === "dark" ? "rgba(139, 92, 246, 0.8)" : "#1976d2",
          }}
        />
      </Box>
    );
  }

  // 에러 처리
  if (channelError || !channelData) {
    return <ErrorView />;
  }

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background:
          theme.palette.mode === "dark"
            ? "linear-gradient(135deg, rgba(26, 26, 46, 0.95), rgba(16, 16, 32, 0.98))"
            : "linear-gradient(135deg, #f8f9fa, #e9ecef)",
        // padding: 1,
      }}
    >
      {/* 채널 정보 헤더 (MainView 스타일) */}
      <Card
        sx={{
          borderRadius: "16px",
          background:
            theme.palette.mode === "dark"
              ? "linear-gradient(135deg, rgba(26, 26, 46, 0.95) 0%, rgba(45, 48, 71, 0.95) 100%)"
              : "linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)",
          border: theme.palette.mode === "dark" ? "1px solid rgba(139, 92, 246, 0.2)" : "1px solid rgba(0, 0, 0, 0.08)",
          boxShadow:
            theme.palette.mode === "dark" ? "0 8px 32px rgba(139, 92, 246, 0.15)" : "0 8px 24px rgba(0, 0, 0, 0.08)",
          position: "relative",
          overflow: "hidden",
          // marginBottom: 3,
          "&::before": {
            content: '""',
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "4px",
            background: "linear-gradient(90deg, #8b5cf6, #06b6d4)",
          },
        }}
      >
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            {/* 왼쪽: 채널 정보 */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <Avatar
                sx={{
                  width: 64,
                  height: 64,
                  background: "linear-gradient(135deg, #8b5cf6, #06b6d4)",
                  fontSize: "1.5rem",
                  fontWeight: "bold",
                  boxShadow:
                    theme.palette.mode === "dark"
                      ? "0 4px 20px rgba(139, 92, 246, 0.3)"
                      : "0 4px 12px rgba(139, 92, 246, 0.2)",
                }}
              >
                {channelData.channel_name.charAt(0)}
              </Avatar>

              <Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
                  <Typography
                    variant="h5"
                    sx={{
                      fontWeight: 700,
                      background:
                        theme.palette.mode === "dark"
                          ? "linear-gradient(135deg, #a78bfa, #22d3ee)"
                          : "linear-gradient(135deg, #8b5cf6, #06b6d4)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      backgroundClip: "text",
                    }}
                  >
                    {channelData.channel_name}
                  </Typography>
                  <VerifiedIcon
                    sx={{
                      color: theme.palette.mode === "dark" ? "#22d3ee" : "#06b6d4",
                      fontSize: 20,
                    }}
                  />
                  {channelData.story_count > 50 && (
                    <Chip
                      icon={<TrendingUpIcon />}
                      label="HOT"
                      size="small"
                      sx={{
                        background: "linear-gradient(135deg, #ff6b6b, #ff8e53)",
                        color: "#ffffff",
                        fontWeight: "bold",
                      }}
                    />
                  )}
                </Box>

                <Typography
                  variant="body2"
                  sx={{
                    color: theme.palette.mode === "dark" ? "#cbd5e1" : "text.secondary",
                    mb: 1,
                    maxWidth: "500px",
                    lineHeight: 1.5,
                  }}
                >
                  {`${channelData.creator?.nickname || "알수없음"}님이 만든 채널입니다. 다양한 주제로 소통해보세요! 🚀`}
                </Typography>

                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                    <PeopleIcon
                      sx={{
                        fontSize: 16,
                        color: theme.palette.mode === "dark" ? "#94a3b8" : "text.secondary",
                      }}
                    />
                    <Typography
                      variant="body2"
                      sx={{
                        color: theme.palette.mode === "dark" ? "#94a3b8" : "text.secondary",
                        fontWeight: 600,
                      }}
                    >
                      구독자 {formatSubscriberCount(channelData.subscriber_count)}명
                    </Typography>
                  </Box>

                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                    <PersonIcon
                      sx={{
                        fontSize: 16,
                        color: theme.palette.mode === "dark" ? "#94a3b8" : "text.secondary",
                      }}
                    />
                    <Typography
                      variant="body2"
                      sx={{
                        color: theme.palette.mode === "dark" ? "#94a3b8" : "text.secondary",
                      }}
                    >
                      생성자: {channelData.creator?.nickname || "알수없음"}
                    </Typography>
                  </Box>

                  <Typography
                    variant="body2"
                    sx={{
                      color: theme.palette.mode === "dark" ? "#94a3b8" : "text.secondary",
                    }}
                  >
                    게시글 {channelData.story_count.toLocaleString()}개
                  </Typography>
                </Box>
              </Box>
            </Box>

            {/* 오른쪽: 버튼 그리드 (2x2) */}
            <Box sx={{ display: "flex", gap: 1.5 }}>
              {/* 왼쪽 열: 공지사항, 채널정보 - 항상 표시 */}
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                {/* 공지사항 버튼 */}
                <Button
                  variant="outlined"
                  startIcon={<NotificationsIcon />}
                  onClick={() => setShowNotice(!showNotice)}
                  sx={{
                    borderColor: theme.palette.mode === "dark" ? "rgba(139, 92, 246, 0.5)" : "#1976d2",
                    color: theme.palette.mode === "dark" ? "rgba(139, 92, 246, 0.8)" : "#1976d2",
                    minWidth: "100px",
                    height: "60px",
                    fontSize: "0.875rem",
                    fontWeight: 600,
                    borderRadius: "12px",
                    transition: "all 0.3s ease",
                    "&:hover": {
                      transform: "translateY(-1px)",
                      backgroundColor:
                        theme.palette.mode === "dark" ? "rgba(139, 92, 246, 0.1)" : "rgba(25, 118, 210, 0.1)",
                    },
                  }}
                >
                  공지사항
                </Button>

                {/* 채널 정보 버튼 */}
                <Button
                  variant="outlined"
                  startIcon={<PeopleIcon />}
                  onClick={() => setShowChannelInfo(!showChannelInfo)}
                  sx={{
                    borderColor: theme.palette.mode === "dark" ? "rgba(139, 92, 246, 0.5)" : "#1976d2",
                    color: theme.palette.mode === "dark" ? "rgba(139, 92, 246, 0.8)" : "#1976d2",
                    minWidth: "100px",
                    height: "35px",
                    fontSize: "0.875rem",
                    fontWeight: 600,
                    borderRadius: "12px",
                    transition: "all 0.3s ease",
                    "&:hover": {
                      transform: "translateY(-1px)",
                      backgroundColor:
                        theme.palette.mode === "dark" ? "rgba(139, 92, 246, 0.1)" : "rgba(25, 118, 210, 0.1)",
                    },
                  }}
                >
                  채널정보
                </Button>
              </Box>

              {/* 오른쪽 열: 구독하기, 알림받기 - 로그인시에만 표시 */}
              {session?.user && (
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                  {/* 구독하기 버튼 */}
                  <Button
                    variant={isSubscribed ? "outlined" : "contained"}
                    onClick={handleSubscribeToggle}
                    disabled={subscribeMutation.isPending || unsubscribeMutation.isPending}
                    startIcon={
                      isSubscribed ? <StarIcon sx={{ fontSize: 20 }} /> : <PersonAddIcon sx={{ fontSize: 20 }} />
                    }
                    sx={{
                      borderRadius: "12px",
                      fontWeight: 600,
                      px: 3,
                      py: 1.5,
                      transition: "all 0.3s ease",
                      minWidth: 140,
                      height: "60px",
                      fontSize: "1rem",
                      ...(isSubscribed
                        ? {
                            color: theme.palette.mode === "dark" ? "#a78bfa" : "#8b5cf6",
                            borderColor: theme.palette.mode === "dark" ? "#a78bfa" : "#8b5cf6",
                            "&:hover": {
                              background:
                                theme.palette.mode === "dark" ? "rgba(139, 92, 246, 0.1)" : "rgba(139, 92, 246, 0.1)",
                              transform: "translateY(-2px)",
                              boxShadow:
                                theme.palette.mode === "dark"
                                  ? "0 6px 20px rgba(139, 92, 246, 0.3)"
                                  : "0 6px 16px rgba(139, 92, 246, 0.3)",
                            },
                          }
                        : {
                            background: "linear-gradient(135deg, #8b5cf6, #06b6d4)",
                            boxShadow:
                              theme.palette.mode === "dark"
                                ? "0 4px 15px rgba(139, 92, 246, 0.4)"
                                : "0 4px 12px rgba(139, 92, 246, 0.3)",
                            "&:hover": {
                              background: "linear-gradient(135deg, #7c3aed, #0891b2)",
                              boxShadow:
                                theme.palette.mode === "dark"
                                  ? "0 6px 20px rgba(139, 92, 246, 0.5)"
                                  : "0 6px 16px rgba(139, 92, 246, 0.4)",
                              transform: "translateY(-2px)",
                            },
                          }),
                    }}
                  >
                    {subscribeMutation.isPending || unsubscribeMutation.isPending ? (
                      <CircularProgress size={20} sx={{ color: "inherit" }} />
                    ) : isSubscribed ? (
                      "구독중"
                    ) : (
                      "구독하기"
                    )}
                  </Button>

                  {/* 알림받기 버튼 */}
                  <Button
                    variant="outlined"
                    startIcon={isNotificationEnabled ? <NotificationsIcon /> : <NotificationsOffIcon />}
                    onClick={handleNotificationToggle}
                    sx={{
                      borderColor: theme.palette.mode === "dark" ? "rgba(139, 92, 246, 0.5)" : "#1976d2",
                      color: theme.palette.mode === "dark" ? "rgba(139, 92, 246, 0.8)" : "#1976d2",
                      minWidth: 140,
                      height: "35px",
                      fontSize: "0.875rem",
                      fontWeight: 600,
                      borderRadius: "12px",
                      transition: "all 0.3s ease",
                      "&:hover": {
                        transform: "translateY(-1px)",
                        backgroundColor:
                          theme.palette.mode === "dark" ? "rgba(139, 92, 246, 0.1)" : "rgba(25, 118, 210, 0.1)",
                      },
                    }}
                  >
                    {isNotificationEnabled ? "알림끄기" : "알림받기"}
                  </Button>
                </Box>
              )}
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* 공지사항 모달 */}
      {showNotice && (
        <Card
          sx={{
            borderRadius: "16px",
            background: theme.palette.mode === "dark" ? "rgba(30, 32, 38, 0.98)" : "rgba(255, 255, 255, 0.98)",
            backdropFilter: "blur(12px)",
            boxShadow:
              theme.palette.mode === "dark"
                ? "0 20px 40px rgba(0, 0, 0, 0.5), 0 0 20px rgba(139, 92, 246, 0.2)"
                : "0 20px 40px rgba(0, 0, 0, 0.15), 0 0 20px rgba(233, 64, 87, 0.1)",
            border:
              theme.palette.mode === "dark" ? "1px solid rgba(255, 255, 255, 0.1)" : "1px solid rgba(0, 0, 0, 0.05)",
            position: "relative",
            overflow: "hidden",
            mb: 3,
            "&::after": {
              content: '""',
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: "4px",
              background: "linear-gradient(90deg, #8a2387, #e94057, #f27121)",
            },
          }}
        >
          {/* 헤더 섹션 */}
          <Box sx={{ p: 3, pb: 2 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 1 }}>
              {/* 왼쪽: 제목과 설명 */}
              <Box>
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 700,
                    color: theme.palette.mode === "dark" ? "#ffffff" : "#1a1a2e",
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    mb: 1,
                  }}
                >
                  <AnnouncementIcon sx={{ color: "#e94057" }} />
                  {channelData.channel_name} 채널 공지사항
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    color: theme.palette.mode === "dark" ? "rgba(255, 255, 255, 0.6)" : "rgba(0, 0, 0, 0.6)",
                    fontSize: "0.875rem",
                  }}
                >
                  채널의 최신 공지사항을 확인하세요
                </Typography>
              </Box>

              {/* 오른쪽: 공지사항 작성 버튼 */}
              {session?.user && (
                <Button
                  onClick={handleWriteNotice}
                  variant="outlined"
                  startIcon={<EditIcon />}
                  sx={{
                    borderRadius: "12px",
                    px: 3,
                    py: 1.5,
                    background:
                      theme.palette.mode === "dark"
                        ? "linear-gradient(135deg, rgba(233, 64, 87, 0.1), rgba(242, 113, 33, 0.1))"
                        : "linear-gradient(135deg, rgba(233, 64, 87, 0.05), rgba(242, 113, 33, 0.05))",
                    border:
                      theme.palette.mode === "dark"
                        ? "1px solid rgba(233, 64, 87, 0.3)"
                        : "1px solid rgba(233, 64, 87, 0.2)",
                    color: "#e94057",
                    fontWeight: "600",
                    fontSize: "0.9rem",
                    transition: "all 0.3s ease",
                    minWidth: "160px",
                    "&:hover": {
                      background:
                        theme.palette.mode === "dark"
                          ? "linear-gradient(135deg, rgba(233, 64, 87, 0.2), rgba(242, 113, 33, 0.2))"
                          : "linear-gradient(135deg, rgba(233, 64, 87, 0.1), rgba(242, 113, 33, 0.1))",
                      transform: "translateY(-2px)",
                      boxShadow:
                        theme.palette.mode === "dark"
                          ? "0 8px 25px rgba(233, 64, 87, 0.3)"
                          : "0 8px 25px rgba(233, 64, 87, 0.2)",
                    },
                  }}
                >
                  새 공지사항 작성
                </Button>
              )}
            </Box>
          </Box>

          {/* 공지사항 목록 */}
          <Box sx={{ px: 3, pb: 3, maxHeight: "400px", overflowY: "auto" }}>
            {noticesLoading ? (
              <Box sx={{ textAlign: "center", py: 3 }}>
                <Typography
                  variant="body2"
                  sx={{
                    color: theme.palette.mode === "dark" ? "rgba(255, 255, 255, 0.6)" : "rgba(0, 0, 0, 0.6)",
                    fontStyle: "italic",
                  }}
                >
                  공지사항을 불러오는 중...
                </Typography>
              </Box>
            ) : channelNotices.length > 0 ? (
              channelNotices.map((notice: any, index: number) => (
                <Box
                  key={notice.id}
                  onClick={() => handleNoticeClick(notice.id)}
                  sx={{
                    borderRadius: "10px",
                    p: 2,
                    mb: 1,
                    backgroundColor:
                      theme.palette.mode === "dark" ? "rgba(45, 48, 56, 0.6)" : "rgba(249, 250, 251, 0.8)",
                    border:
                      theme.palette.mode === "dark"
                        ? "1px solid rgba(255, 255, 255, 0.05)"
                        : "1px solid rgba(0, 0, 0, 0.05)",
                    transition: "all 0.3s ease",
                    cursor: "pointer",
                    "&:hover": {
                      backgroundColor:
                        theme.palette.mode === "dark" ? "rgba(55, 58, 66, 0.8)" : "rgba(233, 64, 87, 0.05)",
                      transform: "translateX(8px)",
                      boxShadow:
                        theme.palette.mode === "dark"
                          ? "0 4px 15px rgba(0, 0, 0, 0.3)"
                          : "0 4px 15px rgba(0, 0, 0, 0.1)",
                      borderColor: theme.palette.mode === "dark" ? "rgba(139, 92, 246, 0.3)" : "rgba(233, 64, 87, 0.2)",
                    },
                    "&:last-child": {
                      mb: 0,
                    },
                  }}
                >
                  <Box sx={{ width: "100%" }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
                      <Typography
                        variant="body1"
                        sx={{
                          fontWeight: 600,
                          color: theme.palette.mode === "dark" ? "#ffffff" : "#1a1a2e",
                          fontSize: "0.95rem",
                          lineHeight: 1.3,
                        }}
                      >
                        {truncateTitle(notice.title)}
                      </Typography>
                      {isNewNotice(notice.created_at) && (
                        <Chip
                          icon={<FiberNewIcon sx={{ fontSize: "0.8rem" }} />}
                          label="NEW"
                          size="small"
                          sx={{
                            height: "22px",
                            fontSize: "0.7rem",
                            fontWeight: "bold",
                            backgroundColor: "#e94057",
                            color: "white",
                            "& .MuiChip-icon": {
                              color: "white",
                            },
                          }}
                        />
                      )}
                    </Box>
                    <Typography
                      variant="caption"
                      sx={{
                        color: theme.palette.mode === "dark" ? "rgba(255, 255, 255, 0.5)" : "rgba(0, 0, 0, 0.5)",
                        fontSize: "0.8rem",
                      }}
                    >
                      {new Date(notice.created_at).toLocaleDateString("ko-KR", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </Typography>
                  </Box>
                </Box>
              ))
            ) : (
              <Box sx={{ textAlign: "center", py: 4 }}>
                <AnnouncementIcon
                  sx={{
                    fontSize: "3rem",
                    color: theme.palette.mode === "dark" ? "rgba(255, 255, 255, 0.3)" : "rgba(0, 0, 0, 0.3)",
                    mb: 2,
                  }}
                />
                <Typography
                  variant="body2"
                  sx={{
                    color: theme.palette.mode === "dark" ? "rgba(255, 255, 255, 0.6)" : "rgba(0, 0, 0, 0.6)",
                    fontStyle: "italic",
                  }}
                >
                  등록된 공지사항이 없습니다
                </Typography>
              </Box>
            )}
          </Box>
        </Card>
      )}

      {/* 채널 정보 모달 */}
      {showChannelInfo && (
        <Card
          sx={{
            background: theme.palette.mode === "dark" ? "rgba(26, 26, 46, 0.95)" : "#ffffff",
            border:
              theme.palette.mode === "dark" ? "1px solid rgba(139, 92, 246, 0.4)" : "1px solid rgba(0, 0, 0, 0.1)",
            borderRadius: 3,
            p: 4,
          }}
        >
          <Typography
            variant="h6"
            sx={{
              color: theme.palette.mode === "dark" ? "#ffffff" : "#1a1a2e",
              mb: 2,
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              gap: 1,
            }}
          >
            <PeopleIcon sx={{ color: theme.palette.mode === "dark" ? "#a78bfa" : "#8b5cf6" }} />
            채널 정보
          </Typography>

          {/* 2열 그리드 레이아웃 */}
          <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 3 }}>
            {/* 왼쪽 열 */}
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <Box>
                <Typography
                  variant="subtitle2"
                  sx={{
                    fontWeight: "bold",
                    mb: 0.5,
                    color: theme.palette.mode === "dark" ? "#a78bfa" : "#8b5cf6",
                  }}
                >
                  📝 채널 이름
                </Typography>
                <Typography variant="body2" sx={{ color: theme.palette.mode === "dark" ? "#e2e8f0" : "#374151" }}>
                  {channelData.channel_name}
                </Typography>
              </Box>

              <Box>
                <Typography
                  variant="subtitle2"
                  sx={{
                    fontWeight: "bold",
                    mb: 0.5,
                    color: theme.palette.mode === "dark" ? "#a78bfa" : "#8b5cf6",
                  }}
                >
                  👤 생성자
                </Typography>
                <Typography variant="body2" sx={{ color: theme.palette.mode === "dark" ? "#e2e8f0" : "#374151" }}>
                  {channelData.creator?.nickname || "알수없음"}
                </Typography>
              </Box>
            </Box>

            {/* 오른쪽 열 */}
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <Box>
                <Typography
                  variant="subtitle2"
                  sx={{
                    fontWeight: "bold",
                    mb: 0.5,
                    color: theme.palette.mode === "dark" ? "#a78bfa" : "#8b5cf6",
                  }}
                >
                  📅 생성일
                </Typography>
                <Typography variant="body2" sx={{ color: theme.palette.mode === "dark" ? "#e2e8f0" : "#374151" }}>
                  {new Date(channelData.created_at).toLocaleDateString("ko-KR", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </Typography>
              </Box>

              <Box>
                <Typography
                  variant="subtitle2"
                  sx={{
                    fontWeight: "bold",
                    mb: 0.5,
                    color: theme.palette.mode === "dark" ? "#a78bfa" : "#8b5cf6",
                  }}
                >
                  📊 통계
                </Typography>
                <Typography variant="body2" sx={{ color: theme.palette.mode === "dark" ? "#e2e8f0" : "#374151" }}>
                  구독자 {channelData.subscriber_count.toLocaleString()}명 · 게시글{" "}
                  {channelData.story_count.toLocaleString()}개
                </Typography>
              </Box>
            </Box>
          </Box>

          {/* 하단 추가 정보 */}
          <Box
            sx={{
              mt: 2,
              pt: 2,
              borderTop: `1px solid ${theme.palette.mode === "dark" ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)"}`,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              gap: 2,
            }}
          >
            {channelData.story_count > 50 && (
              <Chip
                icon={<TrendingUpIcon />}
                label="인기 채널"
                size="small"
                sx={{
                  background: "linear-gradient(135deg, #ff6b6b, #ff8e53)",
                  color: "#ffffff",
                  fontWeight: "bold",
                  fontSize: "0.75rem",
                }}
              />
            )}
          </Box>
        </Card>
      )}

      {/* 구독 취소 확인 모달 */}
      <Dialog
        open={showUnsubscribeConfirm}
        onClose={handleUnsubscribeCancel}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: "16px",
            background: theme.palette.mode === "dark" ? "rgba(30, 32, 38, 0.98)" : "rgba(255, 255, 255, 0.98)",
            backdropFilter: "blur(12px)",
            border:
              theme.palette.mode === "dark" ? "1px solid rgba(255, 255, 255, 0.1)" : "1px solid rgba(0, 0, 0, 0.05)",
          },
        }}
      >
        <DialogTitle
          sx={{
            fontWeight: 700,
            color: theme.palette.mode === "dark" ? "#ffffff" : "#1a1a2e",
            display: "flex",
            alignItems: "center",
            gap: 1,
            pb: 1,
          }}
        >
          <PersonIcon sx={{ color: "#e94057" }} />
          구독 취소 확인
        </DialogTitle>

        <DialogContent sx={{ py: 3 }}>
          <Typography
            variant="body1"
            sx={{
              color: theme.palette.mode === "dark" ? "#e2e8f0" : "#374151",
              lineHeight: 1.6,
              textAlign: "center",
            }}
          >
            <strong>{channelData.channel_name}</strong> 채널의 구독을 취소하시겠습니까?
          </Typography>
          <Typography
            variant="body2"
            sx={{
              color: theme.palette.mode === "dark" ? "#94a3b8" : "#6b7280",
              mt: 1,
              textAlign: "center",
            }}
          >
            구독을 취소하면 새로운 게시글 알림을 받을 수 없습니다.
          </Typography>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 3, gap: 1, justifyContent: "center" }}>
          <Button
            onClick={handleUnsubscribeCancel}
            variant="outlined"
            sx={{
              borderRadius: "12px",
              px: 3,
              py: 1,
              borderColor: theme.palette.mode === "dark" ? "rgba(255, 255, 255, 0.3)" : "rgba(0, 0, 0, 0.3)",
              color: theme.palette.mode === "dark" ? "#e2e8f0" : "#374151",
              "&:hover": {
                backgroundColor: theme.palette.mode === "dark" ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.05)",
              },
            }}
          >
            아니오
          </Button>

          <Button
            onClick={handleUnsubscribeConfirm}
            variant="contained"
            disabled={unsubscribeMutation.isPending}
            sx={{
              borderRadius: "12px",
              px: 3,
              py: 1,
              background: "linear-gradient(135deg, #e94057, #f27121)",
              color: "white",
              fontWeight: 600,
              "&:hover": {
                background: "linear-gradient(135deg, #dc2626, #ea580c)",
              },
              "&:disabled": {
                background: "rgba(233, 64, 87, 0.5)",
              },
            }}
          >
            {unsubscribeMutation.isPending ? <CircularProgress size={20} sx={{ color: "inherit" }} /> : "예, 구독 취소"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 탭 네비게이션 (MainView 스타일 - TAB_SELECT_OPTIONS 사용) */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          width: "100%",
          borderRadius: 2,
          boxShadow:
            theme.palette.mode === "dark" ? "0 4px 20px rgba(139, 92, 246, 0.15)" : "0 4px 12px rgba(0,0,0,0.08)",
          overflow: "hidden",
          bgcolor: theme.palette.mode === "dark" ? "rgba(26, 26, 46, 0.95)" : "background.paper",
          border: theme.palette.mode === "dark" ? "1px solid rgba(139, 92, 246, 0.3)" : "none",
          // marginBottom: 3,
        }}
      >
        <Tabs
          value={currentTab}
          onChange={handleTabChange}
          textColor="secondary"
          indicatorColor="secondary"
          aria-label="channel tabs"
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            flexGrow: 1,
            "& .MuiTab-root": {
              fontWeight: 600,
              fontSize: "1rem",
              py: 2,
              px: 3,
              transition: "all 0.2s ease",
              color: theme.palette.mode === "dark" ? "#e2e8f0" : "inherit",
              "&:hover": {
                backgroundColor: theme.palette.mode === "dark" ? "rgba(139, 92, 246, 0.1)" : "rgba(156, 39, 176, 0.04)",
                color: theme.palette.mode === "dark" ? "#a78bfa" : "secondary.dark",
              },
              "&.Mui-selected": {
                color: theme.palette.mode === "dark" ? "#a78bfa" : "secondary.main",
                fontWeight: 700,
              },
            },
            "& .MuiTabs-indicator": {
              height: 3,
              borderTopLeftRadius: 3,
              borderTopRightRadius: 3,
              backgroundColor: theme.palette.mode === "dark" ? "#8b5cf6" : undefined,
            },
          }}
        >
          {TAB_SELECT_OPTIONS.filter((option) => option.value !== "suggestion").map((option) => (
            <Tab key={option.value} icon={option.icon} label={option.name} value={option.value} />
          ))}
        </Tabs>

        {/* 뷰 모드 토글 버튼 - 모든 탭에서 표시 */}
        <IconButton
          onClick={() => handleViewModeChange("table")}
          color={viewMode === "table" ? "primary" : "default"}
          sx={{ ml: 2 }}
          aria-label="table view"
        >
          <ViewListIcon sx={{ fontSize: 32 }} />
        </IconButton>
        <IconButton
          onClick={() => handleViewModeChange("card")}
          color={viewMode === "card" ? "primary" : "default"}
          sx={{ ml: 1 }}
          aria-label="card view"
        >
          <ViewModuleIcon sx={{ fontSize: 32 }} />
        </IconButton>

        {/* 글쓰기 버튼 */}
        {session?.user && (
          <Button
            variant="contained"
            startIcon={<CreateIcon />}
            onClick={handleWritePost}
            sx={{
              background:
                theme.palette.mode === "dark"
                  ? "linear-gradient(135deg, rgba(139, 92, 246, 0.8), rgba(6, 182, 212, 0.8))"
                  : "linear-gradient(135deg, #1976d2, #42a5f5)",
              "&:hover": {
                background:
                  theme.palette.mode === "dark"
                    ? "linear-gradient(135deg, rgba(139, 92, 246, 1), rgba(6, 182, 212, 1))"
                    : "linear-gradient(135deg, #1565c0, #1976d2)",
              },
              boxShadow:
                theme.palette.mode === "dark"
                  ? "0 0 20px rgba(139, 92, 246, 0.4)"
                  : "0 4px 12px rgba(25, 118, 210, 0.3)",
              ml: 1,
              mr: 2,
            }}
          >
            글쓰기
          </Button>
        )}
      </Box>

      {/* 탭 컨텐츠 - 모든 탭에서 게시글 표시 */}
      <>
        {/* 게시글 목록 */}
        {currentLoading && !currentData ? (
          <Loading />
        ) : viewMode === "card" ? (
          <CustomizedCardView tableData={sortedTableData} />
        ) : (
          <CustomizedTables tableData={sortedTableData} />
        )}

        {/* 로딩 인디케이터 (데이터가 있을 때는 작은 로딩 표시) */}
        {currentLoading && currentData && (
          <Box sx={{ display: "flex", justifyContent: "center", py: 1 }}>
            <Typography variant="caption" sx={{ color: "text.secondary" }}>
              데이터 업데이트 중...
            </Typography>
          </Box>
        )}

        {/* 하단 컨트롤 영역 (MainView 스타일) */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mt: 2,
            height: "35px",
          }}
        >
          {/* 왼쪽: 정렬 옵션과 추천 랭킹 버튼 */}
          <Box sx={{ flex: 1, display: "flex", gap: 1 }}>
            <FormControl size="small">
              <Select value={sortOrder} onChange={handleSortChange}>
                <MenuItem value="recent">최신순</MenuItem>
                <MenuItem value="view">조회순</MenuItem>
                <MenuItem value="recommend">추천순</MenuItem>
              </Select>
            </FormControl>
            <Button
              variant="contained"
              startIcon={<EmojiEventsIcon sx={{ fontSize: 24, color: "rgba(255, 255, 255, 0.8)" }} />}
              sx={{
                backgroundImage:
                  theme.palette.mode === "dark"
                    ? "linear-gradient(45deg, #8b5cf6, #06b6d4)"
                    : "linear-gradient(45deg, #ff9800, #f77d58)",
                color: "white",
                fontWeight: "bold",
                borderRadius: "8px",
                padding: "8px 16px",
                boxShadow:
                  theme.palette.mode === "dark"
                    ? "0px 4px 15px rgba(139, 92, 246, 0.4)"
                    : "0px 4px 10px rgba(0,0,0,0.2)",
                "&:hover": {
                  backgroundImage:
                    theme.palette.mode === "dark"
                      ? "linear-gradient(45deg, #7c3aed, #0891b2)"
                      : "linear-gradient(45deg, #e65100, #bf360c)",
                  boxShadow: theme.palette.mode === "dark" ? "0px 6px 20px rgba(139, 92, 246, 0.6)" : undefined,
                  transform: theme.palette.mode === "dark" ? "translateY(-1px)" : undefined,
                },
              }}
              onClick={toggleRecommendRanking}
            >
              {recommendRankingMode ? "추천 랭킹 해제" : "추천 랭킹"}
            </Button>
          </Box>

          {/* 가운데: 페이지네이션 */}
          <Box sx={{ display: "flex", justifyContent: "center", flex: 1 }}>
            <Pagination
              pageCount={Math.ceil(currentTotal / viewCount)}
              onPageChange={handlePageClick}
              currentPage={currentPage}
            />
          </Box>

          {/* 오른쪽: 여백 */}
          <Box sx={{ flex: 1 }} />
        </Box>

        {/* 검색바 */}
        <Box sx={{ display: "flex", justifyContent: "center", mt: 2, mb: 2 }}>
          <SearchBar
            onSearch={handleSearch}
            onClearSearch={handleClearSearch}
            currentQuery={searchParamsState?.query || ""}
            currentCategory={searchParamsState?.type || "all"}
          />
        </Box>
      </>
    </Box>
  );
};

export default ChannelDetailPage;
