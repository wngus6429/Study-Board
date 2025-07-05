"use client";
// 채널 테이블 뷰 페이지
import React, { useState, useEffect, useMemo } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
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
  TrendingUp as TrendingUpIcon,
  ViewList as ViewListIcon,
  ViewModule as ViewModuleIcon,
  EmojiEvents as EmojiEventsIcon,
  Verified as VerifiedIcon,
  Person as PersonIcon,
  Edit as EditIcon,
  Announcement as AnnouncementIcon,
  FiberNew as FiberNewIcon,
  Chat as ChatIcon,
  Hub as HubIcon,
  AutoAwesome as AutoAwesomeIcon,
  Diamond as DiamondIcon,
  Psychology as PsychologyIcon,
  Bolt as BoltIcon,
} from "@mui/icons-material";
import { useRouter, useParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { useMessage } from "@/app/store/messageStore";
import usePageStore from "@/app/store/pageStore";
import { useSubscriptionStore } from "@/app/store/subscriptionStore";
import { useChannelNotificationStore } from "@/app/store/channelNotificationStore";
import { useChannelPageStore } from "@/app/store/channelPageStore";
import { TABLE_VIEW_COUNT } from "@/app/const/VIEW_COUNT";
import { TAB_SELECT_OPTIONS } from "@/app/const/WRITE_CONST";
import CustomizedTables from "@/app/components/table/CustomizedTables";
import CustomizedCardView from "@/app/components/table/CustomizedCardView";
import CustomizedSuggestionTable from "@/app/components/table/CustomizedSuggestionTable";
import Pagination from "@/app/components/common/Pagination";
import SearchBar from "@/app/components/common/SearchBar";
import Loading from "@/app/components/common/Loading";
import ErrorView from "@/app/components/common/ErrorView";
// API 함수들 import
import { getChannelBySlug, subscribeChannel, unsubscribeChannel, Channel } from "@/app/api/channelsApi";
// 기존 커스텀 훅들 import
import { useStories } from "@/app/components/api/useStories";
import { useCardStories } from "@/app/components/api/useCardStories";

// 채팅 컴포넌트 import
import ChannelChat from "@/app/components/chat/ChannelChat";

// 스타일 컴포넌트 import
import {
  MainContainer,
  ChannelInfoCard,
  LoadingContainer,
  MetallicAvatar,
  MetallicTitle,
  MetallicSubtitle,
} from "./components";

const ChannelDetailPage = () => {
  const theme = useTheme();
  const router = useRouter();
  const params = useParams();
  const channelSlug = params?.slug as string;
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

  const { subscribeToChannel, unsubscribeFromChannel, isSubscribedToNotifications } = useChannelNotificationStore();
  const { setChannelPageData } = useChannelPageStore();

  // 상태 관리
  const [currentTab, setCurrentTab] = useState("all");
  const [viewMode, setViewMode] = useState<"table" | "card">("table");
  const [sortOrder, setSortOrder] = useState<"recent" | "view" | "recommend">("recent");
  const [recommendRankingMode, setRecommendRankingMode] = useState(false);
  const [searchParamsState, setSearchParamsState] = useState<{ type: string; query: string } | null>(null);
  const [showChannelInfo, setShowChannelInfo] = useState(false);
  const [showNotice, setShowNotice] = useState(false);
  const [showUnsubscribeConfirm, setShowUnsubscribeConfirm] = useState(false);
  const [showChat, setShowChat] = useState(false);

  const viewCount = TABLE_VIEW_COUNT;

  // 채널 정보 조회 (먼저 slug로 채널 정보 가져오기)
  const {
    data: channelData,
    isLoading: channelLoading,
    isError: channelError,
    error: channelApiError,
  } = useQuery<Channel>({
    queryKey: ["channel", channelSlug],
    queryFn: () => getChannelBySlug(channelSlug),
    enabled: !!channelSlug,
    staleTime: 1000 * 60 * 5, // 5분간 캐시
    retry: 2,
  });

  // 채널 ID 가져오기 (채널 데이터가 로드된 후)
  const channelId = channelData?.id || 0;

  // 현재 채널의 구독 상태
  const isSubscribed = checkIsSubscribed(channelId);

  // 현재 채널의 알림 구독 상태
  const isNotificationEnabled = isSubscribedToNotifications(channelId);

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

      // 페이지 초기화 - URL에 페이지 파라미터가 있으면 사용, 없으면 1로 설정
      const pageParam = urlParams.get("page");
      const pageNumber = pageParam ? Number(pageParam) : 1;
      setCurrentPage(pageNumber);

      // 검색 상태 초기화
      const searchType = urlParams.get("searchType");
      const searchQuery = urlParams.get("searchQuery");
      if (searchType && searchQuery) {
        setSearchParamsState({ type: searchType, query: searchQuery });
      }
    }
  }, [channelSlug, setCurrentPage]); // channelSlug 의존성 추가

  // 건의사항 데이터 조회 (별도 관리)
  const [suggestionData, setSuggestionData] = useState<{ results: any[]; total: number } | null>(null);
  const [suggestionLoading, setSuggestionLoading] = useState(false);

  // 건의사항 데이터 가져오기
  useEffect(() => {
    if (currentTab === "suggestion" && channelId && session?.user?.id) {
      const fetchSuggestionData = async () => {
        setSuggestionLoading(true);
        try {
          const offset = (currentPage - 1) * viewCount;

          const queryString = `offset=${offset}&limit=${viewCount}&channelId=${channelId}&userId=${session.user.id}`;
          const response = await fetch(
            `${process.env.NEXT_PUBLIC_BASE_URL}/api/suggestion/pageTableData?${queryString}`,
            {
              method: "GET",
              credentials: "include",
              headers: {
                "Content-Type": "application/json",
              },
            }
          );

          if (!response.ok) {
            throw new Error("Failed to fetch suggestion data");
          }

          const data = await response.json();
          setSuggestionData(data);
        } catch (error) {
          console.error("Error fetching suggestion data:", error);
          setSuggestionData({ results: [], total: 0 });
        } finally {
          setSuggestionLoading(false);
        }
      };

      fetchSuggestionData();
    }
  }, [currentTab, currentPage, viewCount, channelId, session?.user?.id]);

  // 채널 테이블 데이터 조회 (기존 커스텀 훅 사용)
  const {
    data: tableData,
    error: tableError,
    isLoading: tableLoading,
  } = useStories({
    category: currentTab,
    currentPage,
    searchParamsState,
    recommendRankingMode,
    viewCount,
    viewMode,
    channelId, // 채널 ID 추가
  });

  // 채널 카드 데이터 조회 (기존 커스텀 훅 사용)
  const {
    data: cardData,
    error: cardError,
    isLoading: cardLoading,
  } = useCardStories({
    category: currentTab,
    currentPage,
    searchParamsState,
    recommendRankingMode,
    viewCount,
    viewMode,
    channelId, // 채널 ID 추가
  });

  // MainView 스타일로 데이터 처리
  const getCurrentData = () => {
    if (currentTab === "suggestion") {
      return suggestionData;
    }
    return viewMode === "card" ? cardData : tableData;
  };

  const getCurrentError = () => {
    if (currentTab === "suggestion") {
      return null; // 건의사항은 별도 에러 처리
    }
    return viewMode === "card" ? cardError : tableError;
  };

  const getCurrentLoading = () => {
    if (currentTab === "suggestion") {
      return suggestionLoading;
    }
    return viewMode === "card" ? cardLoading : tableLoading;
  };

  const currentData = getCurrentData();
  const currentError = getCurrentError();
  const currentLoading = getCurrentLoading();
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

  // 초기 페이지 설정 - channelId가 변경될 때만 URL에 페이지 파라미터가 없는 경우에만 1로 설정
  useEffect(() => {
    if (channelId && typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const pageParam = urlParams.get("page");

      // URL에 페이지 파라미터가 없는 경우에만 1로 설정
      if (!pageParam) {
        setCurrentPage(1);
      }
    }
  }, [channelId, setCurrentPage]);

  // 구독 데이터 로드 (로그인한 경우에만)
  useEffect(() => {
    if (session?.user) {
      loadSubscriptions();
    }
  }, [session?.user, loadSubscriptions]);

  // 채널 페이지 데이터를 스토어에 저장
  useEffect(() => {
    if (currentData && currentData.results && channelSlug) {
      console.log("채널 페이지 데이터", currentData);
      const storyData = currentData.results.map((story) => ({
        id: story.id,
        title: story.title,
        nickname: story.nickname,
        category: story.category,
        created_at: story.created_at,
        read_count: story.read_count,
        recommend_Count: story.recommend_Count,
        comments_count: story.comments_count || 0,
        channelSlug: channelSlug,
      }));

      setChannelPageData(channelSlug, currentPage, currentTab, storyData);
    }
  }, [currentData, channelSlug, currentPage, currentTab, setChannelPageData]);

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
    router.push(`/channels/${channelSlug}?${params.toString()}`, { scroll: false });
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

  // 채널 알림 구독 mutation
  const notificationSubscribeMutation = useMutation({
    mutationFn: async () => {
      const { subscribeToChannelNotifications } = await import("@/app/api/channelNotificationApi");
      return subscribeToChannelNotifications(channelId);
    },
    onSuccess: () => {
      if (channelData) {
        subscribeToChannel(channelId, channelData.channel_name, channelData.slug);
      }
      showMessage("채널 알림을 켰습니다!", "success");
    },
    onError: (error: any) => {
      console.error("채널 알림 구독 실패:", error);
      showMessage(error.response?.data?.message || "채널 알림 구독에 실패했습니다.", "error");
    },
  });

  // 채널 알림 구독 해제 mutation
  const notificationUnsubscribeMutation = useMutation({
    mutationFn: async () => {
      const { unsubscribeFromChannelNotifications } = await import("@/app/api/channelNotificationApi");
      return unsubscribeFromChannelNotifications(channelId);
    },
    onSuccess: () => {
      unsubscribeFromChannel(channelId);
      showMessage("채널 알림을 끝습니다.", "info");
    },
    onError: (error: any) => {
      console.error("채널 알림 구독 해제 실패:", error);
      showMessage(error.response?.data?.message || "채널 알림 구독 해제에 실패했습니다.", "error");
    },
  });

  // 알림 토글 핸들러
  const handleNotificationToggle = () => {
    if (!session?.user) {
      showMessage("로그인이 필요합니다.", "warning");
      return;
    }

    if (!channelData) {
      showMessage("채널 정보를 불러오는 중입니다. 잠시 후 다시 시도해주세요.", "warning");
      return;
    }

    if (isNotificationEnabled) {
      notificationUnsubscribeMutation.mutate();
    } else {
      notificationSubscribeMutation.mutate();
    }
  };

  // 게시글 클릭 핸들러
  const handlePostClick = (postId: number) => {
    // 현재 채널 페이지 URL을 세션 스토리지에 저장
    if (typeof window !== "undefined") {
      sessionStorage.setItem("previousMainPageUrl", window.location.href);
    }
    router.push(`/channels/${channelSlug}/detail/story/${postId}`);
  };

  // 글쓰기 핸들러
  const handleWritePost = () => {
    if (!session?.user) {
      showMessage("로그인이 필요합니다.", "warning");
      return;
    }
    if (!channelId || channelId === 0) {
      showMessage("채널 정보를 불러오는 중입니다. 잠시 후 다시 시도해주세요.", "warning");
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

    router.push(`/channels/${channelSlug}?${params.toString()}`, { scroll: false });
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
    router.push(`/channels/${channelSlug}?${params.toString()}`, { scroll: false });
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

    router.push(`/channels/${channelSlug}?${params.toString()}`, { scroll: false });
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

    router.push(`/channels/${channelSlug}?${params.toString()}`, { scroll: false });
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

    router.push(`/channels/${channelSlug}?${params.toString()}`, { scroll: false });
  };

  // 뷰 모드 변경 핸들러 (URL 업데이트 포함)
  const handleViewModeChange = (mode: "table" | "card") => {
    setViewMode(mode);

    // 기존 URL의 쿼리 파라미터를 유지하고, viewMode 업데이트
    const params = new URLSearchParams(window.location.search);
    params.set("viewMode", mode);

    router.push(`/channels/${channelSlug}?${params.toString()}`, { scroll: false });
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
    if (!channelId || channelId === 0) {
      showMessage("채널 정보를 불러오는 중입니다. 잠시 후 다시 시도해주세요.", "warning");
      return;
    }
    router.push(`/write/notice?channel=${channelId}`);
    setShowNotice(false);
  };

  // 채팅 토글 핸들러
  const handleChatToggle = () => {
    if (!session?.user) {
      showMessage("로그인이 필요합니다.", "warning");
      return;
    }

    setShowChat(!showChat);
  };

  // 로딩 처리
  if (channelLoading) {
    return (
      <LoadingContainer>
        <CircularProgress
          size={60}
          sx={{
            color: theme.palette.mode === "dark" ? "rgba(139, 92, 246, 0.8)" : "#1976d2",
          }}
        />
      </LoadingContainer>
    );
  }

  // 에러 처리
  if (channelError || !channelData) {
    return <ErrorView />;
  }

  return (
    <MainContainer>
      {/* 채널 정보 헤더 (MainView 스타일) */}
      <ChannelInfoCard>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            {/* 왼쪽: 채널 정보 */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <MetallicAvatar>
                <Box
                  sx={{
                    position: "relative",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "100%",
                    height: "100%",
                  }}
                >
                  {/* 메인 아이콘 */}
                  <HubIcon
                    sx={{
                      fontSize: "2.2rem",
                      position: "relative",
                      zIndex: 2,
                      filter: "drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3))",
                    }}
                  />

                  {/* 배경 장식 아이콘들 */}
                  <AutoAwesomeIcon
                    sx={{
                      position: "absolute",
                      top: "8px",
                      right: "12px",
                      fontSize: "0.8rem",
                      opacity: 0.7,
                      animation: "sparkle 2s ease-in-out infinite",
                      "@keyframes sparkle": {
                        "0%, 100%": { opacity: 0.4, transform: "scale(0.8)" },
                        "50%": { opacity: 1, transform: "scale(1.2)" },
                      },
                    }}
                  />

                  <DiamondIcon
                    sx={{
                      position: "absolute",
                      bottom: "6px",
                      left: "8px",
                      fontSize: "0.6rem",
                      opacity: 0.6,
                      animation: "sparkle 2.5s ease-in-out infinite",
                      animationDelay: "0.5s",
                    }}
                  />

                  <BoltIcon
                    sx={{
                      position: "absolute",
                      top: "6px",
                      left: "10px",
                      fontSize: "0.7rem",
                      opacity: 0.5,
                      animation: "sparkle 3s ease-in-out infinite",
                      animationDelay: "1s",
                    }}
                  />
                </Box>
              </MetallicAvatar>

              <Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
                  {/* 채널 이름 컨테이너 - 빛나는 배경 효과 */}
                  <Box
                    sx={{
                      position: "relative",
                      padding: "8px 16px",
                      borderRadius: "12px",
                      background:
                        theme.palette.mode === "dark"
                          ? "linear-gradient(135deg, rgba(26, 26, 46, 0.8) 0%, rgba(45, 48, 71, 0.9) 100%)"
                          : "linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(248, 250, 252, 0.95) 100%)",
                      border:
                        theme.palette.mode === "dark"
                          ? "2px solid rgba(139, 92, 246, 0.3)"
                          : "2px solid rgba(139, 92, 246, 0.2)",
                      boxShadow:
                        theme.palette.mode === "dark"
                          ? "0 0 20px rgba(139, 92, 246, 0.3), 0 0 40px rgba(139, 92, 246, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.1)"
                          : "0 0 20px rgba(139, 92, 246, 0.2), 0 4px 12px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.8)",
                      "&::before": {
                        content: '""',
                        position: "absolute",
                        top: "-2px",
                        left: "-2px",
                        right: "-2px",
                        bottom: "-2px",
                        background:
                          theme.palette.mode === "dark"
                            ? "linear-gradient(45deg, #8b5cf6, #06b6d4, #8b5cf6, #06b6d4)"
                            : "linear-gradient(45deg, #8b5cf6, #06b6d4, #8b5cf6, #06b6d4)",
                        borderRadius: "14px",
                        opacity: 0.6,
                        animation: "borderGlow 3s linear infinite",
                        zIndex: -1,
                      },
                      "&::after": {
                        content: '""',
                        position: "absolute",
                        top: "50%",
                        left: "-50%",
                        width: "200%",
                        height: "2px",
                        background:
                          theme.palette.mode === "dark"
                            ? "linear-gradient(90deg, transparent, rgba(139, 92, 246, 0.8), transparent)"
                            : "linear-gradient(90deg, transparent, rgba(139, 92, 246, 0.6), transparent)",
                        transform: "translateY(-50%)",
                        animation: "scanLine 2s ease-in-out infinite",
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
                          filter: "hue-rotate(180deg)",
                        },
                        "100%": {
                          backgroundPosition: "0% 50%",
                          filter: "hue-rotate(360deg)",
                        },
                      },
                      "@keyframes scanLine": {
                        "0%": { left: "-50%", opacity: 0 },
                        "50%": { left: "50%", opacity: 1 },
                        "100%": { left: "150%", opacity: 0 },
                      },
                    }}
                  >
                    <MetallicTitle variant="h5" sx={{ position: "relative", zIndex: 2 }}>
                      {channelData.channel_name}
                    </MetallicTitle>
                  </Box>

                  <VerifiedIcon
                    sx={{
                      color: theme.palette.mode === "dark" ? "#22d3ee" : "#06b6d4",
                      fontSize: 20,
                      filter: "drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3))",
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
                        boxShadow: "0 4px 12px rgba(255, 107, 107, 0.4)",
                      }}
                    />
                  )}
                </Box>

                <MetallicSubtitle
                  variant="body2"
                  sx={{
                    mb: 1,
                    maxWidth: "500px",
                    lineHeight: 1.5,
                  }}
                >
                  {`${channelData.creator?.nickname || "알수없음"}님이 만든 채널입니다. 다양한 주제로 소통해보세요! ✨`}
                </MetallicSubtitle>

                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                    <PeopleIcon
                      sx={{
                        fontSize: 16,
                        color: theme.palette.mode === "dark" ? "#94a3b8" : "text.secondary",
                      }}
                    />
                    <MetallicSubtitle
                      variant="body2"
                      sx={{
                        fontWeight: 600,
                      }}
                    >
                      구독자 {formatSubscriberCount(channelData.subscriber_count)}명
                    </MetallicSubtitle>
                  </Box>

                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                    <PersonIcon
                      sx={{
                        fontSize: 16,
                        color: theme.palette.mode === "dark" ? "#94a3b8" : "text.secondary",
                      }}
                    />
                    <MetallicSubtitle variant="body2">
                      생성자: {channelData.creator?.nickname || "알수없음"}
                    </MetallicSubtitle>
                    {/* 생성자에게 쪽지 보내기 버튼 */}
                    {session?.user && channelData.creator?.nickname && session.user.id !== channelData.creator.id && (
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => router.push(`/messages?to=${channelData.creator.nickname}`)}
                        sx={{
                          ml: 1,
                          fontSize: "0.7rem",
                          padding: "2px 8px",
                          minWidth: "auto",
                          borderColor: theme.palette.mode === "dark" ? "rgba(139, 92, 246, 0.5)" : "#8b5cf6",
                          color: theme.palette.mode === "dark" ? "#a78bfa" : "#8b5cf6",
                          "&:hover": {
                            backgroundColor:
                              theme.palette.mode === "dark" ? "rgba(139, 92, 246, 0.1)" : "rgba(139, 92, 246, 0.05)",
                          },
                        }}
                      >
                        쪽지
                      </Button>
                    )}
                  </Box>

                  <MetallicSubtitle variant="body2">
                    게시글 {channelData.story_count.toLocaleString()}개
                  </MetallicSubtitle>
                </Box>
              </Box>
            </Box>

            {/* 오른쪽: 버튼 그리드 */}
            <Box sx={{ display: "flex", gap: 1.5 }}>
              {/* 왼쪽 열: 실시간 채팅 버튼 */}
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                {/* 실시간 채팅 버튼 */}
                <Button
                  variant="contained"
                  startIcon={<ChatIcon sx={{ fontSize: 22 }} />}
                  onClick={handleChatToggle}
                  sx={{
                    minWidth: "130px",
                    height: "95px",
                    fontSize: "0.95rem",
                    fontWeight: 700,
                    borderRadius: "16px",
                    position: "relative",
                    overflow: "hidden",
                    transition: "all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
                    textTransform: "none",
                    boxShadow: showChat
                      ? theme.palette.mode === "dark"
                        ? "0 8px 32px rgba(239, 68, 68, 0.4), 0 0 20px rgba(239, 68, 68, 0.3)"
                        : "0 8px 28px rgba(239, 68, 68, 0.3), 0 0 16px rgba(239, 68, 68, 0.2)"
                      : theme.palette.mode === "dark"
                        ? "0 8px 32px rgba(34, 197, 94, 0.4), 0 0 20px rgba(34, 197, 94, 0.3)"
                        : "0 8px 28px rgba(34, 197, 94, 0.3), 0 0 16px rgba(34, 197, 94, 0.2)",
                    background: showChat
                      ? "linear-gradient(135deg, #ef4444, #dc2626, #b91c1c)"
                      : "linear-gradient(135deg, #22c55e, #16a34a, #15803d)",
                    color: "white",
                    border: showChat
                      ? theme.palette.mode === "dark"
                        ? "2px solid rgba(239, 68, 68, 0.6)"
                        : "2px solid rgba(239, 68, 68, 0.4)"
                      : theme.palette.mode === "dark"
                        ? "2px solid rgba(34, 197, 94, 0.6)"
                        : "2px solid rgba(34, 197, 94, 0.4)",
                    "&::before": {
                      content: '""',
                      position: "absolute",
                      top: 0,
                      left: "-100%",
                      width: "100%",
                      height: "100%",
                      background: showChat
                        ? "linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent)"
                        : "linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent)",
                      transition: "left 0.6s ease",
                    },
                    "&:hover": {
                      transform: "translateY(-3px) scale(1.02)",
                      background: showChat
                        ? "linear-gradient(135deg, #dc2626, #b91c1c, #991b1b)"
                        : "linear-gradient(135deg, #16a34a, #15803d, #166534)",
                      boxShadow: showChat
                        ? theme.palette.mode === "dark"
                          ? "0 12px 40px rgba(239, 68, 68, 0.5), 0 0 25px rgba(239, 68, 68, 0.4)"
                          : "0 12px 35px rgba(239, 68, 68, 0.4), 0 0 20px rgba(239, 68, 68, 0.3)"
                        : theme.palette.mode === "dark"
                          ? "0 12px 40px rgba(34, 197, 94, 0.5), 0 0 25px rgba(34, 197, 94, 0.4)"
                          : "0 12px 35px rgba(34, 197, 94, 0.4), 0 0 20px rgba(34, 197, 94, 0.3)",
                      "&::before": {
                        left: "100%",
                      },
                    },
                    "&:active": {
                      transform: "translateY(-1px) scale(0.98)",
                    },
                    "& .MuiButton-startIcon": {
                      marginRight: "8px",
                      filter: "drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3))",
                    },
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: 0.5,
                      position: "relative",
                      zIndex: 1,
                    }}
                  >
                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: 800,
                        fontSize: "1rem",
                        textShadow: "0 2px 4px rgba(0, 0, 0, 0.3)",
                        letterSpacing: "0.5px",
                      }}
                    >
                      {showChat ? "채팅 종료" : "실시간채팅"}
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{
                        fontSize: "0.7rem",
                        opacity: 0.9,
                        fontWeight: 600,
                        textShadow: "0 1px 2px rgba(0, 0, 0, 0.3)",
                      }}
                    >
                      {showChat ? "클릭하여 나가기" : "참여하기"}
                    </Typography>
                  </Box>
                </Button>
              </Box>

              {/* 가운데 열: 공지사항, 채널정보 - 항상 표시 */}
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                {/* 공지사항 버튼 */}
                <Button
                  variant="contained"
                  startIcon={<AnnouncementIcon sx={{ fontSize: 20 }} />}
                  onClick={() => setShowNotice(!showNotice)}
                  sx={{
                    minWidth: "110px",
                    height: "60px",
                    fontSize: "0.9rem",
                    fontWeight: 700,
                    borderRadius: "14px",
                    position: "relative",
                    overflow: "hidden",
                    textTransform: "none",
                    background: "linear-gradient(135deg, #f59e0b, #f97316, #ea580c)",
                    color: "white",
                    border:
                      theme.palette.mode === "dark"
                        ? "2px solid rgba(245, 158, 11, 0.5)"
                        : "2px solid rgba(245, 158, 11, 0.3)",
                    boxShadow:
                      theme.palette.mode === "dark"
                        ? "0 6px 24px rgba(245, 158, 11, 0.4), 0 0 16px rgba(245, 158, 11, 0.2)"
                        : "0 6px 20px rgba(245, 158, 11, 0.3), 0 0 12px rgba(245, 158, 11, 0.15)",
                    transition: "all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
                    "&::before": {
                      content: '""',
                      position: "absolute",
                      top: 0,
                      left: "-100%",
                      width: "100%",
                      height: "100%",
                      background: "linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.25), transparent)",
                      transition: "left 0.5s ease",
                    },
                    "&:hover": {
                      transform: "translateY(-2px) scale(1.05)",
                      background: "linear-gradient(135deg, #f97316, #ea580c, #dc2626)",
                      boxShadow:
                        theme.palette.mode === "dark"
                          ? "0 8px 32px rgba(245, 158, 11, 0.5), 0 0 20px rgba(245, 158, 11, 0.3)"
                          : "0 8px 28px rgba(245, 158, 11, 0.4), 0 0 16px rgba(245, 158, 11, 0.2)",
                      "&::before": {
                        left: "100%",
                      },
                    },
                    "&:active": {
                      transform: "translateY(-1px) scale(1.02)",
                    },
                    "& .MuiButton-startIcon": {
                      filter: "drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3))",
                    },
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 0.5,
                      position: "relative",
                      zIndex: 1,
                    }}
                  >
                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: 800,
                        fontSize: "0.9rem",
                        textShadow: "0 2px 4px rgba(0, 0, 0, 0.3)",
                        letterSpacing: "0.3px",
                      }}
                    >
                      공지사항
                    </Typography>
                  </Box>
                </Button>

                {/* 채널 정보 버튼 */}
                <Button
                  variant="contained"
                  startIcon={<PeopleIcon sx={{ fontSize: 18 }} />}
                  onClick={() => setShowChannelInfo(!showChannelInfo)}
                  sx={{
                    minWidth: "110px",
                    height: "35px",
                    fontSize: "0.85rem",
                    fontWeight: 700,
                    borderRadius: "12px",
                    position: "relative",
                    overflow: "hidden",
                    textTransform: "none",
                    background: "linear-gradient(135deg, #0ea5e9, #0284c7, #0369a1)",
                    color: "white",
                    border:
                      theme.palette.mode === "dark"
                        ? "2px solid rgba(14, 165, 233, 0.5)"
                        : "2px solid rgba(14, 165, 233, 0.3)",
                    boxShadow:
                      theme.palette.mode === "dark"
                        ? "0 4px 20px rgba(14, 165, 233, 0.4), 0 0 12px rgba(14, 165, 233, 0.2)"
                        : "0 4px 16px rgba(14, 165, 233, 0.3), 0 0 8px rgba(14, 165, 233, 0.15)",
                    transition: "all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
                    "&::before": {
                      content: '""',
                      position: "absolute",
                      top: 0,
                      left: "-100%",
                      width: "100%",
                      height: "100%",
                      background: "linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.25), transparent)",
                      transition: "left 0.5s ease",
                    },
                    "&:hover": {
                      transform: "translateY(-2px) scale(1.05)",
                      background: "linear-gradient(135deg, #0284c7, #0369a1, #075985)",
                      boxShadow:
                        theme.palette.mode === "dark"
                          ? "0 6px 28px rgba(14, 165, 233, 0.5), 0 0 16px rgba(14, 165, 233, 0.3)"
                          : "0 6px 24px rgba(14, 165, 233, 0.4), 0 0 12px rgba(14, 165, 233, 0.2)",
                      "&::before": {
                        left: "100%",
                      },
                    },
                    "&:active": {
                      transform: "translateY(-1px) scale(1.02)",
                    },
                    "& .MuiButton-startIcon": {
                      filter: "drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3))",
                    },
                  }}
                >
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: 800,
                      fontSize: "0.85rem",
                      textShadow: "0 2px 4px rgba(0, 0, 0, 0.3)",
                      letterSpacing: "0.3px",
                      position: "relative",
                      zIndex: 1,
                    }}
                  >
                    채널정보
                  </Typography>
                </Button>
              </Box>

              {/* 오른쪽 열: 구독하기, 알림받기 - 로그인시에만 표시 */}
              {session?.user && (
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                  {/* 구독하기 버튼 */}
                  <Button
                    variant="contained"
                    onClick={handleSubscribeToggle}
                    disabled={subscribeMutation.isPending || unsubscribeMutation.isPending}
                    startIcon={
                      isSubscribed ? <StarIcon sx={{ fontSize: 22 }} /> : <PersonAddIcon sx={{ fontSize: 22 }} />
                    }
                    sx={{
                      borderRadius: "16px",
                      fontWeight: 700,
                      px: 3,
                      py: 1.5,
                      minWidth: 150,
                      height: "60px",
                      fontSize: "1rem",
                      position: "relative",
                      overflow: "hidden",
                      textTransform: "none",
                      transition: "all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
                      background: isSubscribed
                        ? "linear-gradient(135deg, #ef4444, #dc2626, #b91c1c)"
                        : "linear-gradient(135deg, #8b5cf6, #7c3aed, #6366f1)",
                      color: "white",
                      border: isSubscribed
                        ? theme.palette.mode === "dark"
                          ? "2px solid rgba(239, 68, 68, 0.6)"
                          : "2px solid rgba(239, 68, 68, 0.4)"
                        : theme.palette.mode === "dark"
                          ? "2px solid rgba(139, 92, 246, 0.6)"
                          : "2px solid rgba(139, 92, 246, 0.4)",
                      boxShadow: isSubscribed
                        ? theme.palette.mode === "dark"
                          ? "0 6px 28px rgba(239, 68, 68, 0.4), 0 0 16px rgba(239, 68, 68, 0.3)"
                          : "0 6px 24px rgba(239, 68, 68, 0.3), 0 0 12px rgba(239, 68, 68, 0.2)"
                        : theme.palette.mode === "dark"
                          ? "0 6px 28px rgba(139, 92, 246, 0.4), 0 0 16px rgba(139, 92, 246, 0.3)"
                          : "0 6px 24px rgba(139, 92, 246, 0.3), 0 0 12px rgba(139, 92, 246, 0.2)",
                      "&::before": {
                        content: '""',
                        position: "absolute",
                        top: 0,
                        left: "-100%",
                        width: "100%",
                        height: "100%",
                        background: "linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent)",
                        transition: "left 0.6s ease",
                      },
                      "&:hover": {
                        transform: "translateY(-3px) scale(1.02)",
                        background: isSubscribed
                          ? "linear-gradient(135deg, #dc2626, #b91c1c, #991b1b)"
                          : "linear-gradient(135deg, #7c3aed, #6366f1, #4f46e5)",
                        boxShadow: isSubscribed
                          ? theme.palette.mode === "dark"
                            ? "0 8px 35px rgba(239, 68, 68, 0.5), 0 0 20px rgba(239, 68, 68, 0.4)"
                            : "0 8px 30px rgba(239, 68, 68, 0.4), 0 0 16px rgba(239, 68, 68, 0.3)"
                          : theme.palette.mode === "dark"
                            ? "0 8px 35px rgba(139, 92, 246, 0.5), 0 0 20px rgba(139, 92, 246, 0.4)"
                            : "0 8px 30px rgba(139, 92, 246, 0.4), 0 0 16px rgba(139, 92, 246, 0.3)",
                        "&::before": {
                          left: "100%",
                        },
                      },
                      "&:active": {
                        transform: "translateY(-1px) scale(0.98)",
                      },
                      "&:disabled": {
                        background: isSubscribed
                          ? "linear-gradient(135deg, rgba(239, 68, 68, 0.5), rgba(220, 38, 38, 0.5))"
                          : "linear-gradient(135deg, rgba(139, 92, 246, 0.5), rgba(124, 58, 237, 0.5))",
                        transform: "none",
                        boxShadow: "none",
                      },
                      "& .MuiButton-startIcon": {
                        filter: "drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3))",
                      },
                    }}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: 0.5,
                        position: "relative",
                        zIndex: 1,
                      }}
                    >
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: 800,
                          fontSize: "1rem",
                          textShadow: "0 2px 4px rgba(0, 0, 0, 0.3)",
                          letterSpacing: "0.5px",
                        }}
                      >
                        {subscribeMutation.isPending || unsubscribeMutation.isPending ? (
                          <CircularProgress size={20} sx={{ color: "inherit" }} />
                        ) : isSubscribed ? (
                          "구독 중"
                        ) : (
                          "구독하기"
                        )}
                      </Typography>
                    </Box>
                  </Button>

                  {/* 알림받기 버튼 */}
                  <Button
                    variant="contained"
                    startIcon={
                      notificationSubscribeMutation.isPending || notificationUnsubscribeMutation.isPending ? (
                        <CircularProgress size={18} sx={{ color: "inherit" }} />
                      ) : isNotificationEnabled ? (
                        <NotificationsIcon sx={{ fontSize: 20 }} />
                      ) : (
                        <NotificationsOffIcon sx={{ fontSize: 20 }} />
                      )
                    }
                    onClick={handleNotificationToggle}
                    disabled={notificationSubscribeMutation.isPending || notificationUnsubscribeMutation.isPending}
                    sx={{
                      minWidth: 150,
                      height: "35px",
                      fontSize: "0.85rem",
                      fontWeight: 700,
                      borderRadius: "12px",
                      position: "relative",
                      overflow: "hidden",
                      textTransform: "none",
                      transition: "all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
                      background: isNotificationEnabled
                        ? "linear-gradient(135deg, #f59e0b, #f97316, #ea580c)"
                        : "linear-gradient(135deg, #6b7280, #4b5563, #374151)",
                      color: "white",
                      border: isNotificationEnabled
                        ? theme.palette.mode === "dark"
                          ? "2px solid rgba(245, 158, 11, 0.5)"
                          : "2px solid rgba(245, 158, 11, 0.3)"
                        : theme.palette.mode === "dark"
                          ? "2px solid rgba(107, 114, 128, 0.5)"
                          : "2px solid rgba(107, 114, 128, 0.3)",
                      boxShadow: isNotificationEnabled
                        ? theme.palette.mode === "dark"
                          ? "0 4px 20px rgba(245, 158, 11, 0.4), 0 0 12px rgba(245, 158, 11, 0.2)"
                          : "0 4px 16px rgba(245, 158, 11, 0.3), 0 0 8px rgba(245, 158, 11, 0.15)"
                        : theme.palette.mode === "dark"
                          ? "0 4px 20px rgba(107, 114, 128, 0.3), 0 0 8px rgba(107, 114, 128, 0.2)"
                          : "0 4px 16px rgba(107, 114, 128, 0.2), 0 0 6px rgba(107, 114, 128, 0.1)",
                      "&::before": {
                        content: '""',
                        position: "absolute",
                        top: 0,
                        left: "-100%",
                        width: "100%",
                        height: "100%",
                        background: "linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.25), transparent)",
                        transition: "left 0.5s ease",
                      },
                      "&:hover": {
                        transform: "translateY(-2px) scale(1.05)",
                        background: isNotificationEnabled
                          ? "linear-gradient(135deg, #f97316, #ea580c, #dc2626)"
                          : "linear-gradient(135deg, #4b5563, #374151, #1f2937)",
                        boxShadow: isNotificationEnabled
                          ? theme.palette.mode === "dark"
                            ? "0 6px 28px rgba(245, 158, 11, 0.5), 0 0 16px rgba(245, 158, 11, 0.3)"
                            : "0 6px 24px rgba(245, 158, 11, 0.4), 0 0 12px rgba(245, 158, 11, 0.2)"
                          : theme.palette.mode === "dark"
                            ? "0 6px 28px rgba(107, 114, 128, 0.4), 0 0 12px rgba(107, 114, 128, 0.3)"
                            : "0 6px 24px rgba(107, 114, 128, 0.3), 0 0 8px rgba(107, 114, 128, 0.2)",
                        "&::before": {
                          left: "100%",
                        },
                      },
                      "&:active": {
                        transform: "translateY(-1px) scale(1.02)",
                      },
                      "&:disabled": {
                        background: isNotificationEnabled
                          ? "linear-gradient(135deg, rgba(245, 158, 11, 0.5), rgba(249, 115, 22, 0.5))"
                          : "linear-gradient(135deg, rgba(107, 114, 128, 0.5), rgba(75, 85, 99, 0.5))",
                        transform: "none",
                        boxShadow: "none",
                      },
                      "& .MuiButton-startIcon": {
                        filter: "drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3))",
                      },
                    }}
                  >
                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: 800,
                        fontSize: "0.85rem",
                        textShadow: "0 2px 4px rgba(0, 0, 0, 0.3)",
                        letterSpacing: "0.3px",
                        position: "relative",
                        zIndex: 1,
                      }}
                    >
                      {isNotificationEnabled ? "알림 끄기" : "알림 받기"}
                    </Typography>
                  </Button>
                </Box>
              )}
            </Box>
          </Box>
        </CardContent>
      </ChannelInfoCard>

      {/* 공지사항 모달 */}
      {showNotice && (
        <Card
          sx={{
            borderRadius: "20px",
            position: "relative",
            overflow: "hidden",
            background:
              theme.palette.mode === "dark"
                ? "linear-gradient(135deg, rgba(26, 26, 46, 0.95) 0%, rgba(45, 48, 71, 0.98) 100%)"
                : "linear-gradient(135deg, rgba(255, 255, 255, 0.98) 0%, rgba(248, 250, 252, 0.99) 100%)",
            backdropFilter: "blur(20px)",
            border:
              theme.palette.mode === "dark"
                ? "2px solid rgba(139, 92, 246, 0.4)"
                : "2px solid rgba(139, 92, 246, 0.25)",
            boxShadow:
              theme.palette.mode === "dark"
                ? "0 0 40px rgba(139, 92, 246, 0.3), 0 0 80px rgba(139, 92, 246, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.1)"
                : "0 0 40px rgba(139, 92, 246, 0.2), 0 20px 60px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.9)",
            "&::before": {
              content: '""',
              position: "absolute",
              top: "-2px",
              left: "-2px",
              right: "-2px",
              bottom: "-2px",
              background: "linear-gradient(45deg, #8a2387, #e94057, #f27121, #8a2387)",
              borderRadius: "22px",
              opacity: 0.7,
              animation: "borderGlow 4s linear infinite",
              zIndex: -1,
            },
            "&::after": {
              content: '""',
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: "6px",
              background: "linear-gradient(90deg, #8a2387, #e94057, #f27121)",
              animation: "gradientShift 3s ease-in-out infinite",
            },
            "@keyframes gradientShift": {
              "0%": {
                background: "linear-gradient(90deg, #8a2387, #e94057, #f27121)",
                filter: "hue-rotate(0deg)",
              },
              "50%": {
                background: "linear-gradient(90deg, #e94057, #f27121, #8a2387)",
                filter: "hue-rotate(60deg)",
              },
              "100%": {
                background: "linear-gradient(90deg, #8a2387, #e94057, #f27121)",
                filter: "hue-rotate(0deg)",
              },
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
              {session?.user && channelData.creator?.id === session.user.id && (
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
            borderRadius: "20px",
            position: "relative",
            overflow: "hidden",
            p: 4,
            background:
              theme.palette.mode === "dark"
                ? "linear-gradient(135deg, rgba(26, 26, 46, 0.95) 0%, rgba(45, 48, 71, 0.98) 100%)"
                : "linear-gradient(135deg, rgba(255, 255, 255, 0.98) 0%, rgba(248, 250, 252, 0.99) 100%)",
            backdropFilter: "blur(20px)",
            border:
              theme.palette.mode === "dark"
                ? "2px solid rgba(139, 92, 246, 0.4)"
                : "2px solid rgba(139, 92, 246, 0.25)",
            boxShadow:
              theme.palette.mode === "dark"
                ? "0 0 30px rgba(139, 92, 246, 0.3), 0 0 60px rgba(139, 92, 246, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.1)"
                : "0 0 30px rgba(139, 92, 246, 0.2), 0 15px 45px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.9)",
            "&::before": {
              content: '""',
              position: "absolute",
              top: "-2px",
              left: "-2px",
              right: "-2px",
              bottom: "-2px",
              background: "linear-gradient(45deg, #06b6d4, #8b5cf6, #06b6d4, #8b5cf6)",
              borderRadius: "22px",
              opacity: 0.6,
              animation: "borderGlow 5s linear infinite",
              zIndex: -1,
            },
            "&::after": {
              content: '""',
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: "4px",
              background: "linear-gradient(90deg, #06b6d4, #8b5cf6, #22c55e)",
              animation: "gradientShift 4s ease-in-out infinite",
            },
          }}
        >
          <Typography
            variant="h6"
            sx={{
              color: theme.palette.mode === "dark" ? "#ffffff" : "#1a1a2e",
              mb: 3,
              fontWeight: 800,
              fontSize: "1.4rem",
              display: "flex",
              alignItems: "center",
              gap: 1.5,
              textShadow: theme.palette.mode === "dark" ? "0 2px 4px rgba(0, 0, 0, 0.3)" : "none",
              position: "relative",
              zIndex: 2,
            }}
          >
            <Box
              sx={{
                position: "relative",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 48,
                height: 48,
                borderRadius: "12px",
                background:
                  theme.palette.mode === "dark"
                    ? "linear-gradient(135deg, rgba(139, 92, 246, 0.3), rgba(6, 182, 212, 0.2))"
                    : "linear-gradient(135deg, rgba(139, 92, 246, 0.15), rgba(6, 182, 212, 0.1))",
                border:
                  theme.palette.mode === "dark"
                    ? "2px solid rgba(139, 92, 246, 0.5)"
                    : "2px solid rgba(139, 92, 246, 0.3)",
                boxShadow:
                  theme.palette.mode === "dark"
                    ? "0 0 20px rgba(139, 92, 246, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1)"
                    : "0 0 20px rgba(139, 92, 246, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.8)",
              }}
            >
              <PeopleIcon
                sx={{
                  color: theme.palette.mode === "dark" ? "#a78bfa" : "#8b5cf6",
                  fontSize: 28,
                  filter: "drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3))",
                }}
              />
            </Box>
            채널 정보
          </Typography>

          {/* 한 줄로 간격을 띄워서 표시 */}
          <Box
            sx={{
              position: "relative",
              zIndex: 2,
              p: 3,
              borderRadius: "16px",
              background:
                theme.palette.mode === "dark"
                  ? "linear-gradient(135deg, rgba(139, 92, 246, 0.08), rgba(6, 182, 212, 0.04))"
                  : "linear-gradient(135deg, rgba(255, 255, 255, 0.7), rgba(248, 250, 252, 0.9))",
              border:
                theme.palette.mode === "dark"
                  ? "1px solid rgba(139, 92, 246, 0.2)"
                  : "1px solid rgba(139, 92, 246, 0.15)",
              boxShadow:
                theme.palette.mode === "dark"
                  ? "0 4px 15px rgba(139, 92, 246, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.05)"
                  : "0 4px 15px rgba(139, 92, 246, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.8)",
            }}
          >
            <Typography
              variant="body1"
              sx={{
                color: theme.palette.mode === "dark" ? "#e2e8f0" : "#374151",
                textAlign: "center",
                lineHeight: 1.8,
                fontSize: "1.1rem",
                fontWeight: 600,
                textShadow: theme.palette.mode === "dark" ? "0 1px 2px rgba(0, 0, 0, 0.3)" : "none",
              }}
            >
              📅 생성일:{" "}
              <Box
                component="span"
                sx={{
                  color: theme.palette.mode === "dark" ? "#a78bfa" : "#8b5cf6",
                  fontWeight: 700,
                }}
              >
                {new Date(channelData.created_at).toLocaleDateString("ko-KR", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </Box>
              &nbsp;&nbsp;&nbsp;&nbsp; 👤 생성자:{" "}
              <Box
                component="span"
                sx={{
                  color: theme.palette.mode === "dark" ? "#22d3ee" : "#06b6d4",
                  fontWeight: 700,
                }}
              >
                {channelData.creator?.nickname || "알수없음"}
              </Box>
              &nbsp;&nbsp;&nbsp;&nbsp; 📊 통계:{" "}
              <Box
                component="span"
                sx={{
                  color: theme.palette.mode === "dark" ? "#22c55e" : "#16a34a",
                  fontWeight: 700,
                }}
              >
                구독자 {channelData.subscriber_count.toLocaleString()}명 · 게시글{" "}
                {channelData.story_count.toLocaleString()}개
              </Box>
            </Typography>
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

        <DialogContent sx={{ mt: 1, mb: -1 }}>
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

      {/* 탭 네비게이션 - 채팅 모드가 아닐 때만 표시 */}
      {!showChat && (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            width: "100%",
            borderRadius: "16px",
            position: "relative",
            overflow: "hidden",
            background:
              theme.palette.mode === "dark"
                ? "linear-gradient(135deg, rgba(26, 26, 46, 0.9) 0%, rgba(45, 48, 71, 0.95) 100%)"
                : "linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.98) 100%)",
            border:
              theme.palette.mode === "dark" ? "2px solid rgba(139, 92, 246, 0.3)" : "2px solid rgba(139, 92, 246, 0.2)",
            boxShadow:
              theme.palette.mode === "dark"
                ? "0 0 30px rgba(139, 92, 246, 0.3), 0 0 60px rgba(139, 92, 246, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.1)"
                : "0 0 30px rgba(139, 92, 246, 0.2), 0 8px 32px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.8)",
            "&::before": {
              content: '""',
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background:
                theme.palette.mode === "dark"
                  ? "linear-gradient(45deg, #8b5cf6, #06b6d4, #8b5cf6, #06b6d4)"
                  : "linear-gradient(45deg, #8b5cf6, #06b6d4, #8b5cf6, #06b6d4)",
              opacity: 0.1,
              animation: "borderGlow 4s linear infinite",
              zIndex: 0,
            },
            "&::after": {
              content: '""',
              position: "absolute",
              top: "50%",
              left: "-100%",
              width: "200%",
              height: "2px",
              background:
                theme.palette.mode === "dark"
                  ? "linear-gradient(90deg, transparent, rgba(139, 92, 246, 0.6), transparent)"
                  : "linear-gradient(90deg, transparent, rgba(139, 92, 246, 0.4), transparent)",
              transform: "translateY(-50%)",
              animation: "scanLine 3s ease-in-out infinite",
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
                filter: "hue-rotate(180deg)",
              },
              "100%": {
                backgroundPosition: "0% 50%",
                filter: "hue-rotate(360deg)",
              },
            },
            "@keyframes scanLine": {
              "0%": { left: "-100%", opacity: 0 },
              "50%": { left: "50%", opacity: 1 },
              "100%": { left: "200%", opacity: 0 },
            },
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
              position: "relative",
              zIndex: 2,
              "& .MuiTab-root": {
                fontWeight: 700,
                fontSize: "1.1rem",
                py: 1,
                position: "relative",
                overflow: "hidden",
                borderRadius: "12px",
                margin: "6px 4px",
                transition: "all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
                color: theme.palette.mode === "dark" ? "#e2e8f0" : "#374151",
                textShadow: theme.palette.mode === "dark" ? "0 2px 4px rgba(0, 0, 0, 0.3)" : "none",
                "&::before": {
                  content: '""',
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background:
                    theme.palette.mode === "dark"
                      ? "linear-gradient(135deg, rgba(139, 92, 246, 0.05), rgba(6, 182, 212, 0.05))"
                      : "linear-gradient(135deg, rgba(139, 92, 246, 0.03), rgba(6, 182, 212, 0.03))",
                  borderRadius: "12px",
                  opacity: 0,
                  transition: "opacity 0.3s ease",
                  zIndex: -1,
                },
                "&:hover": {
                  transform: "translateY(-2px) scale(1.02)",
                  color: theme.palette.mode === "dark" ? "#a78bfa" : "#8b5cf6",
                  boxShadow:
                    theme.palette.mode === "dark"
                      ? "0 8px 25px rgba(139, 92, 246, 0.3), 0 0 15px rgba(139, 92, 246, 0.2)"
                      : "0 8px 25px rgba(139, 92, 246, 0.2), 0 0 15px rgba(139, 92, 246, 0.1)",
                  "&::before": {
                    opacity: 1,
                  },
                },
                "&.Mui-selected": {
                  color: theme.palette.mode === "dark" ? "#ffffff" : "#8b5cf6",
                  fontWeight: 800,
                  background:
                    theme.palette.mode === "dark"
                      ? "linear-gradient(135deg, rgba(139, 92, 246, 0.3), rgba(6, 182, 212, 0.2))"
                      : "linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(6, 182, 212, 0.05))",
                  boxShadow:
                    theme.palette.mode === "dark"
                      ? "0 0 20px rgba(139, 92, 246, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1)"
                      : "0 0 20px rgba(139, 92, 246, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.8)",
                  border:
                    theme.palette.mode === "dark"
                      ? "1px solid rgba(139, 92, 246, 0.4)"
                      : "1px solid rgba(139, 92, 246, 0.3)",
                  transform: "translateY(-1px)",
                },
              },
              "& .MuiTabs-indicator": {
                display: "none",
              },
            }}
          >
            {TAB_SELECT_OPTIONS.filter((option) => {
              // "건의" 탭은 로그인 상태일 때만 표시
              if (option.value === "suggestion" && !session?.user) return false;
              return true;
            }).map((option) => (
              <Tab key={option.value} icon={option.icon} label={option.name} value={option.value} />
            ))}
          </Tabs>

          {/* 뷰 모드 토글 버튼 - 채팅 모드가 아니고 건의사항 탭이 아닐 때만 표시 */}
          {!showChat && currentTab !== "suggestion" && (
            <Box sx={{ display: "flex", gap: 1, mr: 1, position: "relative", zIndex: 2 }}>
              <IconButton
                onClick={() => handleViewModeChange("table")}
                sx={{
                  borderRadius: "12px",
                  p: 1.5,
                  position: "relative",
                  overflow: "hidden",
                  background:
                    viewMode === "table"
                      ? theme.palette.mode === "dark"
                        ? "linear-gradient(135deg, rgba(139, 92, 246, 0.3), rgba(6, 182, 212, 0.2))"
                        : "linear-gradient(135deg, rgba(139, 92, 246, 0.15), rgba(6, 182, 212, 0.1))"
                      : "transparent",
                  border:
                    viewMode === "table"
                      ? theme.palette.mode === "dark"
                        ? "2px solid rgba(139, 92, 246, 0.5)"
                        : "2px solid rgba(139, 92, 246, 0.3)"
                      : theme.palette.mode === "dark"
                        ? "2px solid rgba(255, 255, 255, 0.1)"
                        : "2px solid rgba(0, 0, 0, 0.1)",
                  color:
                    viewMode === "table"
                      ? theme.palette.mode === "dark"
                        ? "#a78bfa"
                        : "#8b5cf6"
                      : theme.palette.mode === "dark"
                        ? "#94a3b8"
                        : "#64748b",
                  transition: "all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
                  boxShadow:
                    viewMode === "table"
                      ? theme.palette.mode === "dark"
                        ? "0 0 20px rgba(139, 92, 246, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1)"
                        : "0 0 20px rgba(139, 92, 246, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.8)"
                      : "none",
                  "&:hover": {
                    transform: "translateY(-2px) scale(1.05)",
                    background:
                      theme.palette.mode === "dark"
                        ? "linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(6, 182, 212, 0.1))"
                        : "linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(6, 182, 212, 0.05))",
                    boxShadow:
                      theme.palette.mode === "dark"
                        ? "0 8px 25px rgba(139, 92, 246, 0.3)"
                        : "0 8px 25px rgba(139, 92, 246, 0.2)",
                    color: theme.palette.mode === "dark" ? "#a78bfa" : "#8b5cf6",
                  },
                }}
                aria-label="table view"
              >
                <ViewListIcon sx={{ fontSize: 28, filter: "drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3))" }} />
              </IconButton>
              <IconButton
                onClick={() => handleViewModeChange("card")}
                sx={{
                  borderRadius: "12px",
                  p: 1.5,
                  position: "relative",
                  overflow: "hidden",
                  background:
                    viewMode === "card"
                      ? theme.palette.mode === "dark"
                        ? "linear-gradient(135deg, rgba(139, 92, 246, 0.3), rgba(6, 182, 212, 0.2))"
                        : "linear-gradient(135deg, rgba(139, 92, 246, 0.15), rgba(6, 182, 212, 0.1))"
                      : "transparent",
                  border:
                    viewMode === "card"
                      ? theme.palette.mode === "dark"
                        ? "2px solid rgba(139, 92, 246, 0.5)"
                        : "2px solid rgba(139, 92, 246, 0.3)"
                      : theme.palette.mode === "dark"
                        ? "2px solid rgba(255, 255, 255, 0.1)"
                        : "2px solid rgba(0, 0, 0, 0.1)",
                  color:
                    viewMode === "card"
                      ? theme.palette.mode === "dark"
                        ? "#a78bfa"
                        : "#8b5cf6"
                      : theme.palette.mode === "dark"
                        ? "#94a3b8"
                        : "#64748b",
                  transition: "all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
                  boxShadow:
                    viewMode === "card"
                      ? theme.palette.mode === "dark"
                        ? "0 0 20px rgba(139, 92, 246, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1)"
                        : "0 0 20px rgba(139, 92, 246, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.8)"
                      : "none",
                  "&:hover": {
                    transform: "translateY(-2px) scale(1.05)",
                    background:
                      theme.palette.mode === "dark"
                        ? "linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(6, 182, 212, 0.1))"
                        : "linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(6, 182, 212, 0.05))",
                    boxShadow:
                      theme.palette.mode === "dark"
                        ? "0 8px 25px rgba(139, 92, 246, 0.3)"
                        : "0 8px 25px rgba(139, 92, 246, 0.2)",
                    color: theme.palette.mode === "dark" ? "#a78bfa" : "#8b5cf6",
                  },
                }}
                aria-label="card view"
              >
                <ViewModuleIcon sx={{ fontSize: 28, filter: "drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3))" }} />
              </IconButton>
            </Box>
          )}

          {/* 글쓰기 버튼 */}
          {session?.user && (
            <Button
              variant="contained"
              startIcon={<CreateIcon sx={{ fontSize: 22 }} />}
              onClick={handleWritePost}
              sx={{
                mr: 2,
                position: "relative",
                zIndex: 2,
                borderRadius: "14px",
                fontWeight: 700,
                fontSize: "1rem",
                px: 3,
                py: 1.5,
                minWidth: "120px",
                overflow: "hidden",
                textTransform: "none",
                transition: "all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
                background: "linear-gradient(135deg, #8b5cf6, #06b6d4, #22c55e)",
                color: "white",
                border:
                  theme.palette.mode === "dark"
                    ? "2px solid rgba(139, 92, 246, 0.6)"
                    : "2px solid rgba(139, 92, 246, 0.4)",
                boxShadow:
                  theme.palette.mode === "dark"
                    ? "0 0 25px rgba(139, 92, 246, 0.4), 0 0 50px rgba(139, 92, 246, 0.2)"
                    : "0 0 25px rgba(139, 92, 246, 0.3), 0 8px 32px rgba(0, 0, 0, 0.1)",
                textShadow: "0 2px 4px rgba(0, 0, 0, 0.3)",
                "&::before": {
                  content: '""',
                  position: "absolute",
                  top: 0,
                  left: "-100%",
                  width: "100%",
                  height: "100%",
                  background: "linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent)",
                  transition: "left 0.6s ease",
                },
                "&:hover": {
                  transform: "translateY(-3px) scale(1.05)",
                  background: "linear-gradient(135deg, #7c3aed, #0891b2, #16a34a)",
                  boxShadow:
                    theme.palette.mode === "dark"
                      ? "0 0 35px rgba(139, 92, 246, 0.6), 0 0 70px rgba(139, 92, 246, 0.3)"
                      : "0 0 35px rgba(139, 92, 246, 0.4), 0 12px 40px rgba(0, 0, 0, 0.15)",
                  "&::before": {
                    left: "100%",
                  },
                },
                "&:active": {
                  transform: "translateY(-1px) scale(1.02)",
                },
                "& .MuiButton-startIcon": {
                  filter: "drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3))",
                },
              }}
            >
              글쓰기
            </Button>
          )}
        </Box>
      )}

      {/* 메인 콘텐츠 - 채팅 모드와 기본 모드 전환 */}
      {showChat ? (
        /* 채팅 UI */
        <ChannelChat
          channelId={channelId}
          channelName={channelData.channel_name}
          showMessage={showMessage}
          onClose={() => setShowChat(false)}
        />
      ) : (
        /* 기본 탭 + 테이블 UI */
        <>
          {/* 게시글 목록 */}
          {currentLoading && !currentData ? (
            <Loading />
          ) : currentTab === "suggestion" ? (
            <CustomizedSuggestionTable tableData={sortedTableData} channelSlug={channelSlug} />
          ) : viewMode === "card" ? (
            <CustomizedCardView tableData={sortedTableData} onRowClick={handlePostClick} />
          ) : (
            <CustomizedTables tableData={sortedTableData} onRowClick={handlePostClick} />
          )}

          {/* 로딩 인디케이터 (데이터가 있을 때는 작은 로딩 표시) */}
          {currentLoading && currentData && (
            <Box sx={{ display: "flex", justifyContent: "center", py: 1 }}>
              <Typography variant="caption" sx={{ color: "text.secondary" }}>
                데이터 업데이트 중...
              </Typography>
            </Box>
          )}

          {/* 하단 컨트롤 영역 (메탈릭 테마) */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              borderRadius: "16px",
              position: "relative",
              overflow: "hidden",
              background:
                theme.palette.mode === "dark"
                  ? "linear-gradient(135deg, rgba(26, 26, 46, 0.9) 0%, rgba(45, 48, 71, 0.95) 100%)"
                  : "linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.98) 100%)",
              border:
                theme.palette.mode === "dark"
                  ? "2px solid rgba(139, 92, 246, 0.25)"
                  : "2px solid rgba(139, 92, 246, 0.15)",
              boxShadow:
                theme.palette.mode === "dark"
                  ? "0 0 25px rgba(139, 92, 246, 0.2), 0 0 50px rgba(139, 92, 246, 0.05), inset 0 1px 0 rgba(255, 255, 255, 0.08)"
                  : "0 0 25px rgba(139, 92, 246, 0.15), 0 8px 32px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.8)",
              "&::before": {
                content: '""',
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background:
                  theme.palette.mode === "dark"
                    ? "linear-gradient(45deg, #8b5cf6, #06b6d4, #8b5cf6, #06b6d4)"
                    : "linear-gradient(45deg, #8b5cf6, #06b6d4, #8b5cf6, #06b6d4)",
                opacity: 0.05,
                animation: "borderGlow 5s linear infinite",
                zIndex: 0,
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
                    ? "linear-gradient(90deg, transparent, rgba(139, 92, 246, 0.4), transparent)"
                    : "linear-gradient(90deg, transparent, rgba(139, 92, 246, 0.3), transparent)",
                transform: "translateY(-50%)",
                animation: "scanLine 4s ease-in-out infinite",
                zIndex: 1,
                pointerEvents: "none",
              },
            }}
          >
            {/* 왼쪽: 정렬 옵션과 추천 랭킹 버튼 - 건의사항 탭이 아닐 때만 표시 */}
            <Box sx={{ flex: 1, display: "flex", gap: 2, position: "relative", zIndex: 2 }}>
              {currentTab !== "suggestion" && (
                <>
                  <FormControl size="small">
                    <Select
                      value={sortOrder}
                      onChange={handleSortChange}
                      sx={{
                        ml: 2,
                        borderRadius: "12px",
                        background:
                          theme.palette.mode === "dark"
                            ? "linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(6, 182, 212, 0.05))"
                            : "linear-gradient(135deg, rgba(255, 255, 255, 0.9), rgba(248, 250, 252, 0.95))",
                        border:
                          theme.palette.mode === "dark"
                            ? "1px solid rgba(139, 92, 246, 0.3)"
                            : "1px solid rgba(139, 92, 246, 0.2)",
                        boxShadow:
                          theme.palette.mode === "dark"
                            ? "0 4px 15px rgba(139, 92, 246, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.05)"
                            : "0 4px 15px rgba(139, 92, 246, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.8)",
                        "& .MuiSelect-select": {
                          color: theme.palette.mode === "dark" ? "#e2e8f0" : "#374151",
                          fontWeight: 600,
                          textShadow: theme.palette.mode === "dark" ? "0 1px 2px rgba(0, 0, 0, 0.3)" : "none",
                        },
                        "& .MuiOutlinedInput-notchedOutline": {
                          border: "none",
                        },
                        "&:hover": {
                          transform: "translateY(-1px)",
                          boxShadow:
                            theme.palette.mode === "dark"
                              ? "0 6px 20px rgba(139, 92, 246, 0.3)"
                              : "0 6px 20px rgba(139, 92, 246, 0.15)",
                        },
                      }}
                    >
                      <MenuItem value="recent">최신순</MenuItem>
                      <MenuItem value="view">조회순</MenuItem>
                      <MenuItem value="recommend">추천순</MenuItem>
                    </Select>
                  </FormControl>
                  <Button
                    variant="contained"
                    startIcon={
                      <EmojiEventsIcon sx={{ fontSize: 24, filter: "drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3))" }} />
                    }
                    sx={{
                      borderRadius: "12px",
                      fontWeight: 700,
                      fontSize: "0.95rem",
                      position: "relative",
                      overflow: "hidden",
                      textTransform: "none",
                      transition: "all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
                      background: recommendRankingMode
                        ? "linear-gradient(135deg, #ef4444, #f97316, #eab308)"
                        : "linear-gradient(135deg, #8b5cf6, #06b6d4, #22c55e)",
                      color: "white",

                      boxShadow: recommendRankingMode
                        ? theme.palette.mode === "dark"
                          ? "0 0 20px rgba(239, 68, 68, 0.4), 0 0 40px rgba(239, 68, 68, 0.2)"
                          : "0 0 20px rgba(239, 68, 68, 0.3), 0 6px 20px rgba(0, 0, 0, 0.1)"
                        : theme.palette.mode === "dark"
                          ? "0 0 20px rgba(139, 92, 246, 0.4), 0 0 40px rgba(139, 92, 246, 0.2)"
                          : "0 0 20px rgba(139, 92, 246, 0.3), 0 6px 20px rgba(0, 0, 0, 0.1)",
                      textShadow: "0 2px 4px rgba(0, 0, 0, 0.3)",
                      "&::before": {
                        content: '""',
                        position: "absolute",
                        top: 0,
                        left: "-100%",
                        width: "100%",
                        height: "100%",
                        background: "linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.25), transparent)",
                        transition: "left 0.6s ease",
                      },
                      "&:hover": {
                        transform: "translateY(-3px) scale(1.02)",
                        background: recommendRankingMode
                          ? "linear-gradient(135deg, #dc2626, #ea580c, #d97706)"
                          : "linear-gradient(135deg, #7c3aed, #0891b2, #16a34a)",
                        boxShadow: recommendRankingMode
                          ? theme.palette.mode === "dark"
                            ? "0 0 30px rgba(239, 68, 68, 0.6), 0 0 60px rgba(239, 68, 68, 0.3)"
                            : "0 0 30px rgba(239, 68, 68, 0.4), 0 10px 30px rgba(0, 0, 0, 0.15)"
                          : theme.palette.mode === "dark"
                            ? "0 0 30px rgba(139, 92, 246, 0.6), 0 0 60px rgba(139, 92, 246, 0.3)"
                            : "0 0 30px rgba(139, 92, 246, 0.4), 0 10px 30px rgba(0, 0, 0, 0.15)",
                        "&::before": {
                          left: "100%",
                        },
                      },
                      "&:active": {
                        transform: "translateY(-1px) scale(0.98)",
                      },
                    }}
                    onClick={toggleRecommendRanking}
                  >
                    {recommendRankingMode ? "추천 랭킹 해제" : "추천 랭킹"}
                  </Button>
                </>
              )}
            </Box>

            {/* 가운데: 페이지네이션 */}
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                flex: 1,
                position: "relative",
                zIndex: 2,
              }}
            >
              <Box
                sx={{
                  borderRadius: "12px",
                  p: 1,
                  background:
                    theme.palette.mode === "dark"
                      ? "linear-gradient(135deg, rgba(139, 92, 246, 0.08), rgba(6, 182, 212, 0.04))"
                      : "linear-gradient(135deg, rgba(255, 255, 255, 0.8), rgba(248, 250, 252, 0.9))",
                  border:
                    theme.palette.mode === "dark"
                      ? "1px solid rgba(139, 92, 246, 0.2)"
                      : "1px solid rgba(139, 92, 246, 0.15)",
                  boxShadow:
                    theme.palette.mode === "dark"
                      ? "0 4px 15px rgba(139, 92, 246, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.05)"
                      : "0 4px 15px rgba(139, 92, 246, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.8)",
                }}
              >
                <Pagination
                  pageCount={Math.ceil(currentTotal / viewCount)}
                  onPageChange={handlePageClick}
                  currentPage={currentPage}
                />
              </Box>
            </Box>

            {/* 오른쪽: 검색바 (건의사항 탭이 아닐 때) 또는 건의하기 버튼 (건의사항 탭일 때) */}
            <Box sx={{ flex: 1, display: "flex", justifyContent: "flex-end", position: "relative", zIndex: 2 }}>
              {currentTab === "suggestion" && session?.user ? (
                <Button
                  variant="contained"
                  startIcon={<CreateIcon sx={{ fontSize: 22, filter: "drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3))" }} />}
                  onClick={() => router.push(`/write/suggestion?channel=${params?.slug || ""}`)}
                  sx={{
                    borderRadius: "14px",
                    fontWeight: 700,
                    fontSize: "1rem",
                    px: 3,
                    py: 1.5,
                    position: "relative",
                    overflow: "hidden",
                    textTransform: "none",
                    transition: "all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
                    background: "linear-gradient(135deg, #8a2387, #e94057, #f27121)",
                    color: "white",
                    border:
                      theme.palette.mode === "dark"
                        ? "2px solid rgba(233, 64, 87, 0.5)"
                        : "2px solid rgba(233, 64, 87, 0.3)",
                    boxShadow:
                      theme.palette.mode === "dark"
                        ? "0 0 25px rgba(233, 64, 87, 0.4), 0 0 50px rgba(233, 64, 87, 0.2)"
                        : "0 0 25px rgba(233, 64, 87, 0.3), 0 8px 32px rgba(0, 0, 0, 0.1)",
                    textShadow: "0 2px 4px rgba(0, 0, 0, 0.3)",
                    "&::before": {
                      content: '""',
                      position: "absolute",
                      top: 0,
                      left: "-100%",
                      width: "100%",
                      height: "100%",
                      background: "linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent)",
                      transition: "left 0.6s ease",
                    },
                    "&:hover": {
                      transform: "translateY(-3px) scale(1.05)",
                      background: "linear-gradient(135deg, #7a1d77, #d93a4f, #e2671e)",
                      boxShadow:
                        theme.palette.mode === "dark"
                          ? "0 0 35px rgba(233, 64, 87, 0.6), 0 0 70px rgba(233, 64, 87, 0.3)"
                          : "0 0 35px rgba(233, 64, 87, 0.4), 0 12px 40px rgba(0, 0, 0, 0.15)",
                      "&::before": {
                        left: "100%",
                      },
                    },
                    "&:active": {
                      transform: "translateY(-1px) scale(1.02)",
                    },
                  }}
                >
                  건의하기
                </Button>
              ) : (
                currentTab !== "suggestion" && (
                  <Box
                    sx={{
                      borderRadius: "12px",
                      p: 1.5,
                      background:
                        theme.palette.mode === "dark"
                          ? "linear-gradient(135deg, rgba(139, 92, 246, 0.08), rgba(6, 182, 212, 0.04))"
                          : "linear-gradient(135deg, rgba(255, 255, 255, 0.8), rgba(248, 250, 252, 0.9))",
                      border:
                        theme.palette.mode === "dark"
                          ? "1px solid rgba(139, 92, 246, 0.2)"
                          : "1px solid rgba(139, 92, 246, 0.15)",
                      boxShadow:
                        theme.palette.mode === "dark"
                          ? "0 4px 15px rgba(139, 92, 246, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.05)"
                          : "0 4px 15px rgba(139, 92, 246, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.8)",
                      maxWidth: "320px",
                    }}
                  >
                    <SearchBar
                      onSearch={handleSearch}
                      onClearSearch={handleClearSearch}
                      currentQuery={searchParamsState?.query || ""}
                      currentCategory={searchParamsState?.type || "title"}
                    />
                  </Box>
                )
              )}
            </Box>
          </Box>
        </>
      )}
    </MainContainer>
  );
};

export default ChannelDetailPage;
