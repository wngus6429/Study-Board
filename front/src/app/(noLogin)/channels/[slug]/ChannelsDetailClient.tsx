"use client";
// 채널 테이블 뷰 페이지
import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  useTheme,
  SelectChangeEvent,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import { People as PeopleIcon, Person as PersonIcon } from "@mui/icons-material";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useSession } from "next-auth/react";
import { useMessage } from "@/app/store/messageStore";
import usePageStore from "@/app/store/pageStore";
import { useSubscriptionStore } from "@/app/store/subscriptionStore";
import { useChannelNotificationStore } from "@/app/store/channelNotificationStore";
import { useChannelPageStore } from "@/app/store/channelPageStore";
import { TABLE_VIEW_COUNT } from "@/app/const/VIEW_COUNT";
import CustomizedTables from "@/app/components/table/CustomizedTables";
import CustomizedCardView from "@/app/components/table/CustomizedCardView";
import CustomizedSuggestionTable from "@/app/components/table/CustomizedSuggestionTable";
import Loading from "@/app/components/common/Loading";
import ErrorView from "@/app/components/common/ErrorView";
import ChannelNoticeModal from "@/app/components/common/ChannelNoticeModal";
// API 함수들 import
import { getChannelBySlug, subscribeChannel, unsubscribeChannel, Channel } from "@/app/api/channelsApi";
import {
  subscribeToChannelNotifications,
  unsubscribeFromChannelNotifications,
  getChannelNotificationStatus,
} from "@/app/api/channelNotificationApi";
// 기존 커스텀 훅들 import
import { useStories } from "@/app/components/api/useStories";
import { useCardStories } from "@/app/components/api/useCardStories";
// 채팅 컴포넌트 import
import ChannelChat from "@/app/components/chat/ChannelChat";
// 스타일 컴포넌트 import
import { MainContainer, ChannelInfoCard, LoadingContainer } from "./components";
// 분리된 컴포넌트들 import
import ChannelHeader from "./components/ChannelHeader";
import ChannelActionButtons from "./components/ChannelActionButtons";
import ChannelTabNavigation from "./components/ChannelTabNavigation";
import ChannelControlPanel from "./components/ChannelControlPanel";

type NavigatorWithUAData = Navigator & {
  userAgentData?: {
    mobile?: boolean;
  };
};

const MOBILE_VIEW_BREAKPOINT = 768;
const MOBILE_UA_REGEX = /iphone|ipod|android.*mobile|windows phone|blackberry|iemobile|opera mini/i;

const ChannelDetailPage = () => {
  const theme = useTheme(); // 테마 상태 가져오기
  const router = useRouter(); // 라우터 인스턴스 가져오기
  const params = useParams(); // 파라미터 가져오기
  const channelSlug = params?.slug as string; // 채널 슬러그 가져오기
  const { data: session } = useSession(); // 세션 데이터 가져오기
  const { showMessage } = useMessage(); // 메시지 표시 함수 가져오기
  const queryClient = useQueryClient(); // 쿼리 클라이언트 인스턴스 가져오기
  const { currentPage, setCurrentPage } = usePageStore(); // 페이지 스토어 상태 가져오기
  const {
    isSubscribed: checkIsSubscribed,
    addSubscription,
    removeSubscription,
    loadSubscriptions,
  } = useSubscriptionStore(); // 구독 스토어 상태 가져오기

  const { subscribeToChannel, unsubscribeFromChannel, isSubscribedToNotifications } = useChannelNotificationStore(); // 채널 알림 스토어 상태 가져오기
  const { setChannelPageData } = useChannelPageStore(); // 채널 페이지 스토어 상태 가져오기

  // 상태 관리
  const [currentTab, setCurrentTab] = useState("all");
  const [viewMode, setViewMode] = useState<"table" | "card">("table");
  const [isMobileDevice, setIsMobileDevice] = useState(false);
  const [sortOrder, setSortOrder] = useState<"recent" | "view" | "recommend">("recent");
  const [recommendRankingMode, setRecommendRankingMode] = useState(false);
  const [searchParamsState, setSearchParamsState] = useState<{ type: string; query: string } | null>(null);
  const [showChannelInfo, setShowChannelInfo] = useState(false);
  const [showNotice, setShowNotice] = useState(false);
  const [showUnsubscribeConfirm, setShowUnsubscribeConfirm] = useState(false);
  const [showChat, setShowChat] = useState(false);

  const viewCount = TABLE_VIEW_COUNT;
  const activeViewMode = isMobileDevice ? "card" : viewMode;

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

  // 실제 백엔드 알림 구독 상태 확인 및 동기화
  useEffect(() => {
    const syncNotificationStatus = async () => {
      if (!channelId || !session?.user || !channelData) return;

      try {
        const response = await getChannelNotificationStatus(channelId);
        const actualStatus = response.isSubscribed;
        const frontendStatus = isSubscribedToNotifications(channelId);

        // 상태가 다르면 프론트엔드 상태를 실제 상태로 동기화
        if (actualStatus !== frontendStatus) {
          if (actualStatus) {
            // 실제로는 구독되어 있는데 프론트엔드에서 구독되지 않은 것으로 표시된 경우
            subscribeToChannel(channelId, channelData.channel_name, channelData.slug);
          } else {
            // 실제로는 구독되지 않았는데 프론트엔드에서 구독된 것으로 표시된 경우
            unsubscribeFromChannel(channelId);
          }
        }
      } catch (error) {
        console.error("알림 상태 확인 실패:", error);
      }
    };

    // 약간의 딜레이를 두어 채널 데이터가 완전히 로드된 후 실행
    const timeoutId = setTimeout(syncNotificationStatus, 500);

    return () => clearTimeout(timeoutId);
  }, [channelId, session?.user?.id, channelData?.id]);

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
  useEffect(() => {
    if (typeof window === "undefined" || typeof navigator === "undefined") return;

    const detectMobileDevice = () => {
      const nav = navigator as NavigatorWithUAData;
      const userAgent = (nav.userAgent || "").toLowerCase();
      const isAgentMobile = Boolean(nav.userAgentData?.mobile) || MOBILE_UA_REGEX.test(userAgent);
      const hasTouchSupport =
        typeof nav.maxTouchPoints === "number" ? nav.maxTouchPoints > 1 : "ontouchstart" in window;
      const isSmallViewport = window.innerWidth < MOBILE_VIEW_BREAKPOINT;
      setIsMobileDevice(isAgentMobile || (isSmallViewport && hasTouchSupport));
    };

    detectMobileDevice();
    window.addEventListener("resize", detectMobileDevice);
    return () => window.removeEventListener("resize", detectMobileDevice);
  }, []);

  useEffect(() => {
    if (!channelSlug || typeof window === "undefined") return;

    const params = new URLSearchParams(window.location.search);
    if (params.get("viewMode") === activeViewMode) {
      return;
    }

    params.set("viewMode", activeViewMode);
    router.replace(`/channels/${channelSlug}?${params.toString()}`, { scroll: false });
  }, [activeViewMode, channelSlug, router]);

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
            },
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
    viewMode: activeViewMode,
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
    viewMode: activeViewMode,
    channelId, // 채널 ID 추가
  });

  // MainView 스타일로 데이터 처리 (memoized)
  const currentData = useMemo(() => {
    if (currentTab === "suggestion") {
      return suggestionData;
    }
    return activeViewMode === "card" ? cardData : tableData;
  }, [currentTab, suggestionData, activeViewMode, cardData, tableData]);

  const currentError = useMemo(() => {
    if (currentTab === "suggestion") {
      return null; // 건의사항은 별도 에러 처리
    }
    return activeViewMode === "card" ? cardError : tableError;
  }, [currentTab, activeViewMode, cardError, tableError]);

  const currentLoading = useMemo(() => {
    if (currentTab === "suggestion") {
      return suggestionLoading;
    }
    return activeViewMode === "card" ? cardLoading : tableLoading;
  }, [currentTab, suggestionLoading, activeViewMode, cardLoading, tableLoading]);

  const currentTotal = useMemo(() => currentData?.total || 0, [currentData?.total]);

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
        userId: story.userId, // 블라인드 판별용 사용자 ID 저장
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

  // 탭 변경 핸들러 (MainView 방식 적용) - memoized
  const handleTabChange = useCallback(
    (event: React.SyntheticEvent, newValue: string) => {
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
      params.set("viewMode", activeViewMode);

      // 정렬 순서 유지
      params.set("sortOrder", sortOrder);

      // URL 업데이트
      router.push(`/channels/${channelSlug}?${params.toString()}`, { scroll: false });
    },
    [channelSlug, searchParamsState, recommendRankingMode, activeViewMode, sortOrder, router, setCurrentPage],
  );

  // 구독 토글 핸들러 - memoized
  const handleSubscribeToggle = useCallback(() => {
    if (!session?.user) {
      showMessage("로그인이 필요합니다.", "warning");
      return;
    }

    if (isSubscribed) {
      setShowUnsubscribeConfirm(true);
    } else {
      subscribeMutation.mutate(channelId);
    }
  }, [session?.user, isSubscribed, showMessage, subscribeMutation, channelId]);

  // 구독 취소 확인 핸들러 - memoized
  const handleUnsubscribeConfirm = useCallback(() => {
    unsubscribeMutation.mutate(channelId);
    setShowUnsubscribeConfirm(false);
  }, [unsubscribeMutation, channelId]);

  // 구독 취소 취소 핸들러 - memoized
  const handleUnsubscribeCancel = useCallback(() => {
    setShowUnsubscribeConfirm(false);
  }, []);

  // 채널 알림 구독 mutation
  const notificationSubscribeMutation = useMutation({
    mutationFn: () => subscribeToChannelNotifications(channelId),
    onSuccess: () => {
      if (channelData) {
        subscribeToChannel(channelId, channelData.channel_name, channelData.slug);
      }
      showMessage("채널 알림을 켰습니다!", "success");
    },
    onError: (error: any) => {
      console.error("채널 알림 구독 실패:", error);

      // 409 에러 (이미 구독된 상태)인 경우 정상적으로 처리
      if (error.response?.status === 409) {
        if (channelData) {
          subscribeToChannel(channelId, channelData.channel_name, channelData.slug);
        }
        showMessage("채널 알림이 이미 켜져있었습니다.", "info");
      } else {
        showMessage(error.response?.data?.message || "채널 알림 구독에 실패했습니다.", "error");
      }
    },
  });

  // 채널 알림 구독 해제 mutation
  const notificationUnsubscribeMutation = useMutation({
    mutationFn: () => unsubscribeFromChannelNotifications(channelId),
    onSuccess: () => {
      unsubscribeFromChannel(channelId);
      showMessage("채널 알림을 끝습니다.", "info");
    },
    onError: (error: any) => {
      console.error("채널 알림 구독 해제 실패:", error);

      // 404 에러 (이미 구독하지 않은 상태)인 경우 정상적으로 처리
      if (error.response?.status === 404) {
        unsubscribeFromChannel(channelId);
        showMessage("채널 알림이 이미 꺼져있었습니다.", "info");
      } else {
        showMessage(error.response?.data?.message || "채널 알림 구독 해제에 실패했습니다.", "error");
      }
    },
  });

  // 알림 토글 핸들러 - memoized
  const handleNotificationToggle = useCallback(() => {
    if (!session?.user) {
      showMessage("로그인이 필요합니다.", "warning");
      return;
    }

    if (!channelData) {
      showMessage("채널 정보를 불러오는 중입니다. 잠시 후 다시 시도해주세요.", "warning");
      return;
    }

    if (!channelId || channelId === 0) {
      showMessage("채널 ID를 확인할 수 없습니다. 잠시 후 다시 시도해주세요.", "warning");
      return;
    }

    if (isNotificationEnabled) {
      notificationUnsubscribeMutation.mutate();
    } else {
      notificationSubscribeMutation.mutate();
    }
  }, [
    session?.user,
    channelData,
    channelId,
    isNotificationEnabled,
    showMessage,
    notificationUnsubscribeMutation,
    notificationSubscribeMutation,
  ]);

  // 게시글 클릭 핸들러 - memoized
  const handlePostClick = useCallback(
    async (postId: number) => {
      // 현재 채널 페이지 URL을 세션 스토리지에 저장
      if (typeof window !== "undefined") {
        sessionStorage.setItem("previousMainPageUrl", window.location.href);
      }
      const href = `/channels/${channelSlug}/detail/story/${postId}`;
      // 라우트 파일/번들 프리페치
      try {
        // router.prefetch: 페이지 “코드/리소스”를 미리 로드
        router.prefetch(href);
      } catch {}
      // 상세 데이터 프리페치(React Query 캐시 채우기)
      // queryClient.prefetchQuery: 페이지 “데이터”를 미리 로드
      try {
        await queryClient.prefetchQuery({
          queryKey: ["story", "detail", String(postId)],
          queryFn: async () => {
            const res = await axios.get(`${process.env.NEXT_PUBLIC_BASE_URL}/api/story/detail/${postId}`);
            return res.data;
          },
          staleTime: 1000 * 60 * 4,
        });
        console.log(`✅ 게시글 ${postId} 프리패치 성공`);
      } catch (error) {
        console.warn(`⚠️ 게시글 ${postId} 프리패치 실패:`, error);
      }
      router.push(href);
    },
    [router, channelSlug, queryClient],
  );

  // 글쓰기 핸들러 - memoized
  const handleWritePost = useCallback(() => {
    if (!session?.user) {
      showMessage("로그인이 필요합니다.", "warning");
      return;
    }
    if (!channelId || channelId === 0) {
      showMessage("채널 정보를 불러오는 중입니다. 잠시 후 다시 시도해주세요.", "warning");
      return;
    }
    router.push(`/write/story?channel=${channelId}`);
  }, [session?.user, channelId, showMessage, router]);

  // 페이지네이션 핸들러 (URL 업데이트 포함) - memoized
  const handlePageClick = useCallback(
    (selectedItem: { selected: number }) => {
      const newPage = selectedItem.selected + 1;
      setCurrentPage(newPage);

      // 기존 쿼리 파라미터들을 유지하면서 페이지 번호만 업데이트
      const params = new URLSearchParams(window.location.search);
      params.set("page", newPage.toString());

      router.push(`/channels/${channelSlug}?${params.toString()}`, { scroll: false });
    },
    [setCurrentPage, router, channelSlug],
  );

  // 정렬 변경 핸들러 (URL 업데이트 포함) - memoized
  const handleSortChange = useCallback(
    (event: SelectChangeEvent<"recent" | "view" | "recommend">) => {
      const newSortOrder = event.target.value as "recent" | "view" | "recommend";
      setSortOrder(newSortOrder);

      // 현재 URL 쿼리 파라미터 가져오기
      const params = new URLSearchParams(window.location.search);
      // sortOrder 파라미터 추가 또는 업데이트
      params.set("sortOrder", newSortOrder);
      // URL 업데이트
      router.push(`/channels/${channelSlug}?${params.toString()}`, { scroll: false });
    },
    [router, channelSlug],
  );

  // 추천 랭킹 토글 (URL 업데이트 포함) - memoized
  const toggleRecommendRanking = useCallback(() => {
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
    params.set("viewMode", activeViewMode);
    params.set("sortOrder", sortOrder);

    router.push(`/channels/${channelSlug}?${params.toString()}`, { scroll: false });
  }, [
    recommendRankingMode,
    currentTab,
    searchParamsState,
    activeViewMode,
    sortOrder,
    router,
    channelSlug,
    setCurrentPage,
  ]);

  // 검색 핸들러 (URL 업데이트 포함) - memoized
  const handleSearch = useCallback(
    ({ category, query }: { category: string; query: string }) => {
      setSearchParamsState({ type: category, query });
      setCurrentPage(1);

      const params = new URLSearchParams();
      params.set("category", currentTab);
      params.set("searchType", category);
      params.set("searchQuery", query);
      params.set("recommendRanking", recommendRankingMode.toString());
      params.set("viewMode", activeViewMode);
      params.set("sortOrder", sortOrder);

      router.push(`/channels/${channelSlug}?${params.toString()}`, { scroll: false });
    },
    [currentTab, recommendRankingMode, activeViewMode, sortOrder, router, channelSlug, setCurrentPage],
  );

  // 검색 초기화 (URL 업데이트 포함) - memoized
  const handleClearSearch = useCallback(() => {
    setSearchParamsState(null);
    setCurrentPage(1);

    const params = new URLSearchParams();
    params.set("category", currentTab);
    params.set("recommendRanking", recommendRankingMode.toString());
    params.set("viewMode", activeViewMode);
    params.set("sortOrder", sortOrder);

    router.push(`/channels/${channelSlug}?${params.toString()}`, { scroll: false });
  }, [currentTab, recommendRankingMode, activeViewMode, sortOrder, router, channelSlug, setCurrentPage]);

  // 뷰 모드 변경 핸들러 (URL 업데이트 포함) - memoized
  const handleViewModeChange = useCallback(
    (mode: "table" | "card") => {
      if (isMobileDevice && mode === "table") {
        showMessage("모바일에서는 카드형 보기만 지원합니다.", "info");
        return;
      }

      setViewMode(mode);

      if (typeof window === "undefined") {
        return;
      }

      // 기존 URL의 쿼리 파라미터를 유지하고, viewMode 업데이트
      const params = new URLSearchParams(window.location.search);
      params.set("viewMode", mode);

      router.push(`/channels/${channelSlug}?${params.toString()}`, { scroll: false });
    },
    [router, channelSlug, isMobileDevice, showMessage],
  );
  // 구독자 수 포맷팅 (memoized)
  const formatSubscriberCount = useCallback((count: number) => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    } else if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  }, []);

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
        `${process.env.NEXT_PUBLIC_BASE_URL}/api/story/notices?channel=${channelId}&limit=20`,
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

  // 공지사항 관련 헬퍼 함수들 - memoized
  const isNewNotice = useCallback((createdAt: string) => {
    const noticeDate = new Date(createdAt);
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    return noticeDate > threeDaysAgo;
  }, []);

  const truncateTitle = useCallback((title: string, maxLength: number = 35) => {
    return title.length > maxLength ? `${title.substring(0, maxLength)}...` : title;
  }, []);

  const handleNoticeClick = useCallback(
    (noticeId: number) => {
      router.push(`/notice/${noticeId}`);
      setShowNotice(false);
    },
    [router],
  );

  const handleWriteNotice = useCallback(() => {
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
  }, [session?.user, channelId, showMessage, router]);

  // 채팅 토글 핸들러 - memoized
  const handleChatToggle = useCallback(() => {
    if (!session?.user) {
      showMessage("로그인이 필요합니다.", "warning");
      return;
    }

    setShowChat(!showChat);
  }, [session?.user, showMessage, showChat]);

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
          <Box
            sx={{
              display: "flex",
              alignItems: isMobileDevice ? "stretch" : "center",
              justifyContent: isMobileDevice ? "flex-start" : "space-between",
              flexDirection: isMobileDevice ? "column" : "row",
              gap: isMobileDevice ? 2 : 0,
            }}
          >
            {/* 왼쪽: 채널 정보 */}
            <ChannelHeader
              channelData={channelData}
              session={session}
              formatSubscriberCount={formatSubscriberCount}
              isMobileViewOnly={isMobileDevice}
            />

            {/* 오른쪽: 버튼 그리드 */}
            <ChannelActionButtons
              showChat={showChat}
              onChatToggle={handleChatToggle}
              onShowNotice={() => setShowNotice(!showNotice)}
              onShowChannelInfo={() => setShowChannelInfo(!showChannelInfo)}
              hasSession={!!session?.user}
              isMobileViewOnly={isMobileDevice}
              isSubscribed={isSubscribed}
              onSubscribeToggle={handleSubscribeToggle}
              subscribeMutationPending={subscribeMutation.isPending}
              unsubscribeMutationPending={unsubscribeMutation.isPending}
              isNotificationEnabled={isNotificationEnabled}
              onNotificationToggle={handleNotificationToggle}
              notificationSubscribeMutationPending={notificationSubscribeMutation.isPending}
              notificationUnsubscribeMutationPending={notificationUnsubscribeMutation.isPending}
            />
          </Box>
        </CardContent>
      </ChannelInfoCard>

      {/* 공지사항 모달 */}
      {showNotice && (
        <ChannelNoticeModal
          channelData={channelData}
          channelNotices={channelNotices}
          noticesLoading={noticesLoading}
          onNoticeClick={handleNoticeClick}
          onWriteNotice={handleWriteNotice}
        />
      )}

      {/* 채널 정보 모달 */}
      {showChannelInfo && (
        <Card
          sx={{
            borderRadius: "12px",
            p: 3,
            background: theme.palette.mode === "dark" ? "#1e293b" : "#ffffff",
            border:
              theme.palette.mode === "dark" ? "1px solid rgba(139, 92, 246, 0.3)" : "1px solid rgba(139, 92, 246, 0.2)",
            boxShadow:
              theme.palette.mode === "dark" ? "0 4px 12px rgba(0, 0, 0, 0.3)" : "0 4px 12px rgba(0, 0, 0, 0.1)",
          }}
        >
          <Typography
            variant="h6"
            sx={{
              color: theme.palette.mode === "dark" ? "#ffffff" : "#1a1a2e",
              mb: 2,
              fontWeight: 700,
              fontSize: "1.2rem",
              display: "flex",
              alignItems: "center",
              gap: 1,
            }}
          >
            <PeopleIcon
              sx={{
                color: theme.palette.mode === "dark" ? "#a78bfa" : "#8b5cf6",
                fontSize: 24,
              }}
            />
            채널 정보
          </Typography>

          <Box
            sx={{
              p: 2,
              borderRadius: "8px",
              background: theme.palette.mode === "dark" ? "rgba(139, 92, 246, 0.1)" : "rgba(139, 92, 246, 0.05)",
              border:
                theme.palette.mode === "dark"
                  ? "1px solid rgba(139, 92, 246, 0.2)"
                  : "1px solid rgba(139, 92, 246, 0.15)",
            }}
          >
            <Box
              sx={{
                color: theme.palette.mode === "dark" ? "#e2e8f0" : "#374151",
                lineHeight: 1.6,
                fontSize: "1rem",
                fontWeight: 500,
                display: "flex",
                flexDirection: { xs: "column", sm: "row" },
                alignItems: { xs: "flex-start", sm: "center" },
                justifyContent: { xs: "flex-start", sm: "center" },
                textAlign: { xs: "left", sm: "center" },
                gap: { xs: 1.5, sm: 3 },
              }}
            >
              <Typography
                variant="body1"
                component="div"
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  whiteSpace: "nowrap",
                }}
              >
                📅 생성일:
                <Box
                  component="span"
                  sx={{
                    color: theme.palette.mode === "dark" ? "#a78bfa" : "#8b5cf6",
                    fontWeight: 600,
                  }}
                >
                  {new Date(channelData.created_at).toLocaleDateString("ko-KR", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </Box>
              </Typography>

              <Typography
                variant="body1"
                component="div"
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  whiteSpace: "nowrap",
                }}
              >
                👤 생성자:
                <Box
                  component="span"
                  sx={{
                    color: theme.palette.mode === "dark" ? "#22d3ee" : "#06b6d4",
                    fontWeight: 600,
                  }}
                >
                  {channelData.creator?.nickname || "알수없음"}
                </Box>
              </Typography>

              <Typography
                variant="body1"
                component="div"
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  whiteSpace: "nowrap",
                }}
              >
                📊 통계:
                <Box
                  component="span"
                  sx={{
                    color: theme.palette.mode === "dark" ? "#22c55e" : "#16a34a",
                    fontWeight: 600,
                  }}
                >
                  구독자 {channelData.subscriber_count.toLocaleString()}명 · 게시글{" "}
                  {channelData.story_count.toLocaleString()}개
                </Box>
              </Typography>
            </Box>
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
        <ChannelTabNavigation
          currentTab={currentTab}
          onTabChange={handleTabChange}
          hasSession={!!session?.user}
          viewMode={activeViewMode}
          onViewModeChange={handleViewModeChange}
          onWritePost={handleWritePost}
          showChat={showChat}
          isMobileViewOnly={isMobileDevice}
        />
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
          ) : activeViewMode === "card" ? (
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
          <ChannelControlPanel
            currentTab={currentTab}
            sortOrder={sortOrder}
            onSortChange={handleSortChange}
            recommendRankingMode={recommendRankingMode}
            onToggleRecommendRanking={toggleRecommendRanking}
            currentTotal={currentTotal}
            viewCount={viewCount}
            currentPage={currentPage}
            onPageChange={handlePageClick}
            hasSession={!!session?.user}
            channelSlug={channelSlug}
            searchParamsState={searchParamsState}
            onSearch={handleSearch}
            onClearSearch={handleClearSearch}
          />
        </>
      )}
    </MainContainer>
  );
};

export default ChannelDetailPage;
