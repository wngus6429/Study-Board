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
  TextField,
  InputAdornment,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Divider,
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
  Chat as ChatIcon,
  Send as SendIcon,
  Close as CloseIcon,
} from "@mui/icons-material";
import { useRouter, useParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { useMessage } from "@/app/store/messageStore";
import usePageStore from "@/app/store/pageStore";
import { useSubscriptionStore } from "@/app/store/subscriptionStore";
import { useChannelNotificationStore } from "@/app/store/channelNotificationStore";
import { TABLE_VIEW_COUNT } from "@/app/const/VIEW_COUNT";
import { TAB_SELECT_OPTIONS } from "@/app/const/WRITE_CONST";
import CustomizedTables from "@/app/components/table/CustomizedTables";
import CustomizedCardView from "@/app/components/table/CustomizedCardView";
import Pagination from "@/app/components/common/Pagination";
import SearchBar from "@/app/components/common/SearchBar";
import Loading from "@/app/components/common/Loading";
import ErrorView from "@/app/components/common/ErrorView";
// API 함수들 import
import { getChannel, getChannelBySlug, subscribeChannel, unsubscribeChannel, Channel } from "@/app/api/channelsApi";
// 기존 커스텀 훅들 import
import { useStories } from "@/app/components/api/useStories";
import { useCardStories } from "@/app/components/api/useCardStories";

// 채팅 API import
import {
  getChannelChatMessages,
  sendChannelChatMessage,
  joinChannelChat,
  leaveChannelChat,
  ChannelChatMessage,
  ChannelChatResponse,
} from "@/app/api/channelChatApi";

// 웹소켓 import
import { ChannelChatWebSocket, WebSocketStatus } from "@/app/utils/websocket";

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
  const [chatMessages, setChatMessages] = useState<ChannelChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [wsConnection, setWsConnection] = useState<ChannelChatWebSocket | null>(null);
  const [wsStatus, setWsStatus] = useState<WebSocketStatus>("disconnected");
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [typingUsers, setTypingUsers] = useState<{ id: string; nickname: string }[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<{ id: string; nickname: string }[]>([]);

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

  console.log("🔍 채널 페이지 상태:", {
    channelSlug,
    channelData,
    channelId,
    channelLoading,
    channelError,
  });

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
    router.push(`/channels/${channelSlug}/detail/suggestion/${noticeId}`);
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

    if (showChat) {
      // 채팅 종료 - 웹소켓 연결 해제
      disconnectWebSocket();
      setShowChat(false);
    } else {
      // 채팅 시작 - 메시지 로드 및 웹소켓 연결
      setShowChat(true);
      loadChatMessages();
    }
  };

  // 컴포넌트 언마운트 시 웹소켓 정리
  useEffect(() => {
    return () => {
      disconnectWebSocket();
    };
  }, []);

  // 채널 변경 시 웹소켓 재연결
  useEffect(() => {
    if (showChat && channelId && wsConnection) {
      disconnectWebSocket();
      loadChatMessages();
    }
  }, [channelId]);

  // 채팅 메시지 로드 및 웹소켓 연결
  const loadChatMessages = async () => {
    if (!channelId || !session?.user) return;

    setIsLoadingMessages(true);

    try {
      // API로 기존 채팅 메시지 로드
      console.log("📥 채팅 메시지 로드 시작");
      const response = await getChannelChatMessages(channelId, 1, 50);
      setChatMessages(response.messages);

      // 채널 입장 알림
      await joinChannelChat(channelId);

      // 웹소켓 연결 설정
      if (!wsConnection) {
        setupWebSocketConnection();
      }

      console.log("✅ 채팅 로드 완료:", response.messages.length, "개 메시지");
    } catch (error) {
      console.error("❌ 채팅 메시지 로드 실패:", error);
      showMessage("채팅을 불러오는데 실패했습니다.", "error");

      // 에러 시 더미 데이터 표시 (개발용)
      const dummyMessages: ChannelChatMessage[] = [
        {
          id: 1,
          channel_id: channelId,
          user_id: "1",
          user: {
            id: "1",
            nickname: "김개발자",
            user_email: "dev@example.com",
            profile_image: "",
          },
          message: "안녕하세요! 이 채널 정말 유용하네요 👍",
          created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
          updated_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        },
        {
          id: 2,
          channel_id: channelId,
          user_id: "2",
          user: {
            id: "2",
            nickname: "박프론트",
            user_email: "frontend@example.com",
            profile_image: "",
          },
          message: "React 관련 질문이 있는데 괜찮을까요?",
          created_at: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
          updated_at: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
        },
      ];
      setChatMessages(dummyMessages);
    } finally {
      setIsLoadingMessages(false);
    }
  };

  // 웹소켓 연결 설정
  const setupWebSocketConnection = () => {
    if (!channelId || wsConnection || !session?.user) return;

    console.log("🔌 웹소켓 연결 설정 시작");

    const userInfo = {
      id: session.user.id,
      nickname: session.user.nickname || session.user.name || "사용자",
    };

    const ws = new ChannelChatWebSocket(
      channelId,
      {
        onMessage: (message: ChannelChatMessage) => {
          console.log("📨 새 메시지 수신:", message);
          setChatMessages((prev) => {
            // 중복 메시지 방지
            const exists = prev.find((m) => m.id === message.id);
            if (!exists) {
              return [...prev, message];
            }
            return prev;
          });
        },

        onUserJoined: (user) => {
          console.log("👋 사용자 입장:", user);
          setOnlineUsers((prev) => {
            if (!prev.find((u) => u.id === user.id)) {
              return [...prev, user];
            }
            return prev;
          });
          showMessage(`${user.nickname}님이 채팅에 참여했습니다.`, "info");
        },

        onUserLeft: (user) => {
          console.log("👋 사용자 퇴장:", user);
          setOnlineUsers((prev) => prev.filter((u) => u.id !== user.id));
          showMessage(`${user.nickname}님이 채팅을 나갔습니다.`, "info");
        },

        onTyping: (user) => {
          setTypingUsers((prev) => {
            if (!prev.find((u) => u.id === user.id)) {
              const newTyping = [...prev, user];
              // 3초 후 타이핑 상태 제거
              setTimeout(() => {
                setTypingUsers((current) => current.filter((u) => u.id !== user.id));
              }, 3000);
              return newTyping;
            }
            return prev;
          });
        },

        onStatusChange: (status) => {
          console.log("🔄 웹소켓 상태 변경:", status);
          setWsStatus(status);

          // 연결 상태에 따른 사용자 피드백
          switch (status) {
            case "connecting":
              showMessage("채팅 서버에 연결 중입니다...", "info");
              break;
            case "connected":
              showMessage("채팅 서버에 연결되었습니다.", "success");
              break;
            case "disconnected":
              showMessage("채팅 서버 연결이 끊어졌습니다.", "warning");
              setOnlineUsers([]); // 연결 끊어지면 온라인 사용자 목록 초기화
              break;
            case "error":
              showMessage("채팅 서버 연결에 문제가 발생했습니다.", "error");
              break;
          }
        },

        onError: (error) => {
          console.error("❌ 웹소켓 에러:", error);
          showMessage(error, "error");
        },
      },
      userInfo
    );

    // 연결 시도
    ws.connect();
    setWsConnection(ws);

    // 연결 상태 모니터링 (30초마다)
    const connectionMonitor = setInterval(() => {
      if (ws.isConnected()) {
        console.log("✅ 웹소켓 연결 상태 양호");
      } else {
        console.warn("⚠️ 웹소켓 연결 끊어짐 - 재연결 시도");
        if (ws.getStatus() !== "connecting") {
          ws.connect();
        }
      }
    }, 30000);

    // 컴포넌트 언마운트 시 모니터링 정리
    return () => {
      clearInterval(connectionMonitor);
    };
  };

  // 웹소켓 연결 해제
  const disconnectWebSocket = async () => {
    if (wsConnection) {
      wsConnection.disconnect();
      setWsConnection(null);
    }

    if (channelId) {
      try {
        await leaveChannelChat(channelId);
      } catch (error) {
        console.error("채널 나가기 실패:", error);
      }
    }

    setOnlineUsers([]);
    setTypingUsers([]);
  };

  // 채팅 메시지 전송
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !session?.user || !channelId) return;

    try {
      // 웹소켓으로 실시간 전송 (연결되어 있다면)
      if (wsConnection && wsConnection.isConnected()) {
        wsConnection.sendMessage(newMessage.trim());
        setNewMessage("");
        return;
      }

      // 웹소켓이 없으면 API로 전송
      console.log("📤 API로 메시지 전송");
      const response = await sendChannelChatMessage(channelId, newMessage.trim());

      // 성공하면 로컬 상태에 추가
      setChatMessages((prev) => [...prev, response.chatMessage]);
      setNewMessage("");

      console.log("✅ 메시지 전송 완료");
    } catch (error) {
      console.error("❌ 메시지 전송 실패:", error);
      showMessage("메시지 전송에 실패했습니다.", "error");
    }
  };

  // 채팅 메시지 입력 핸들러
  const handleMessageKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
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

            {/* 오른쪽: 버튼 그리드 */}
            <Box sx={{ display: "flex", gap: 1.5 }}>
              {/* 왼쪽 열: 실시간 채팅 버튼 */}
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                {/* 실시간 채팅 버튼 */}
                <Button
                  variant={showChat ? "contained" : "outlined"}
                  startIcon={<ChatIcon />}
                  onClick={handleChatToggle}
                  sx={{
                    borderColor: theme.palette.mode === "dark" ? "rgba(139, 92, 246, 0.5)" : "#1976d2",
                    color: theme.palette.mode === "dark" ? "rgba(139, 92, 246, 0.8)" : "#1976d2",
                    minWidth: "120px",
                    height: "95px",
                    fontSize: "0.875rem",
                    fontWeight: 600,
                    borderRadius: "12px",
                    transition: "all 0.3s ease",
                    ...(showChat && {
                      background: "linear-gradient(135deg, #8b5cf6, #06b6d4)",
                      color: "white",
                      "&:hover": {
                        background: "linear-gradient(135deg, #7c3aed, #0891b2)",
                      },
                    }),
                    ...(!showChat && {
                      "&:hover": {
                        transform: "translateY(-1px)",
                        backgroundColor:
                          theme.palette.mode === "dark" ? "rgba(139, 92, 246, 0.1)" : "rgba(25, 118, 210, 0.1)",
                      },
                    }),
                  }}
                >
                  {showChat ? "채팅종료" : "실시간채팅"}
                </Button>
              </Box>

              {/* 가운데 열: 공지사항, 채널정보 - 항상 표시 */}
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
                    startIcon={
                      notificationSubscribeMutation.isPending || notificationUnsubscribeMutation.isPending ? (
                        <CircularProgress size={16} sx={{ color: "inherit" }} />
                      ) : isNotificationEnabled ? (
                        <NotificationsIcon />
                      ) : (
                        <NotificationsOffIcon />
                      )
                    }
                    onClick={handleNotificationToggle}
                    disabled={notificationSubscribeMutation.isPending || notificationUnsubscribeMutation.isPending}
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
            // mb: 3,
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

          {/* 한 줄로 간격을 띄워서 표시 */}
          <Typography
            variant="body1"
            sx={{
              color: theme.palette.mode === "dark" ? "#e2e8f0" : "#374151",
              textAlign: "center",
              lineHeight: 1.6,
            }}
          >
            📅 생성일:{" "}
            {new Date(channelData.created_at).toLocaleDateString("ko-KR", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
            &nbsp;&nbsp;&nbsp;&nbsp; 👤 생성자: {channelData.creator?.nickname || "알수없음"}
            &nbsp;&nbsp;&nbsp;&nbsp; 📊 통계: 구독자 {channelData.subscriber_count.toLocaleString()}명 · 게시글{" "}
            {channelData.story_count.toLocaleString()}개
          </Typography>
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

      {/* 탭 네비게이션 - 채팅 모드가 아닐 때만 표시 */}
      {!showChat && (
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
                  backgroundColor:
                    theme.palette.mode === "dark" ? "rgba(139, 92, 246, 0.1)" : "rgba(156, 39, 176, 0.04)",
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

          {/* 뷰 모드 토글 버튼 - 채팅 모드가 아닐 때만 표시 */}
          {!showChat && (
            <>
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
            </>
          )}

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
      )}

      {/* 메인 콘텐츠 - 채팅 모드와 기본 모드 전환 */}
      {showChat ? (
        /* 채팅 UI */
        <Box
          sx={{
            background: theme.palette.mode === "dark" ? "rgba(26, 26, 46, 0.95)" : "#ffffff",
            border:
              theme.palette.mode === "dark" ? "1px solid rgba(139, 92, 246, 0.3)" : "1px solid rgba(0, 0, 0, 0.08)",
            borderRadius: 2,
            boxShadow:
              theme.palette.mode === "dark" ? "0 4px 20px rgba(139, 92, 246, 0.15)" : "0 4px 12px rgba(0,0,0,0.08)",
            height: "calc(100vh - 200px)",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          {/* 채팅 헤더 */}
          <Box
            sx={{
              p: 2,
              borderBottom:
                theme.palette.mode === "dark" ? "1px solid rgba(255, 255, 255, 0.1)" : "1px solid rgba(0, 0, 0, 0.08)",
              background:
                theme.palette.mode === "dark"
                  ? "linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(6, 182, 212, 0.1))"
                  : "linear-gradient(135deg, rgba(139, 92, 246, 0.05), rgba(6, 182, 212, 0.05))",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <ChatIcon
              sx={{
                color: theme.palette.mode === "dark" ? "#a78bfa" : "#8b5cf6",
                fontSize: 24,
                mr: 1,
              }}
            />
            <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <Typography
                variant="h6"
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
                {channelData.channel_name} 채널 자유채팅
              </Typography>

              {/* 연결 상태 및 온라인 사용자 표시 */}
              <Box sx={{ display: "flex", alignItems: "center", gap: 2, mt: 0.5 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                  <Box
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      backgroundColor:
                        wsStatus === "connected" ? "#22c55e" : wsStatus === "connecting" ? "#f59e0b" : "#ef4444",
                      boxShadow: `0 0 8px ${
                        wsStatus === "connected" ? "#22c55e" : wsStatus === "connecting" ? "#f59e0b" : "#ef4444"
                      }`,
                    }}
                  />
                  <Typography
                    variant="caption"
                    sx={{
                      color: theme.palette.mode === "dark" ? "#94a3b8" : "#6b7280",
                      fontSize: "0.75rem",
                    }}
                  >
                    {wsStatus === "connected"
                      ? "실시간 연결됨"
                      : wsStatus === "connecting"
                        ? "연결 중..."
                        : "연결 끊김"}
                  </Typography>
                </Box>

                {onlineUsers.length > 0 && (
                  <Typography
                    variant="caption"
                    sx={{
                      color: theme.palette.mode === "dark" ? "#94a3b8" : "#6b7280",
                      fontSize: "0.75rem",
                    }}
                  >
                    온라인: {onlineUsers.length}명
                  </Typography>
                )}
              </Box>
            </Box>
          </Box>

          {/* 채팅 메시지 목록 */}
          <Box
            sx={{
              flexGrow: 1,
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <List
              sx={{
                flexGrow: 1,
                overflow: "auto",
                py: 1,
                px: 0,
                "&::-webkit-scrollbar": {
                  width: "6px",
                },
                "&::-webkit-scrollbar-track": {
                  background: theme.palette.mode === "dark" ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)",
                  borderRadius: "6px",
                },
                "&::-webkit-scrollbar-thumb": {
                  background: theme.palette.mode === "dark" ? "rgba(139, 92, 246, 0.5)" : "rgba(139, 92, 246, 0.3)",
                  borderRadius: "6px",
                  "&:hover": {
                    background: theme.palette.mode === "dark" ? "rgba(139, 92, 246, 0.7)" : "rgba(139, 92, 246, 0.5)",
                  },
                },
              }}
            >
              {chatMessages.length === 0 ? (
                <Box sx={{ textAlign: "center", py: 6 }}>
                  <ChatIcon
                    sx={{
                      fontSize: "4rem",
                      color: theme.palette.mode === "dark" ? "rgba(255, 255, 255, 0.3)" : "rgba(0, 0, 0, 0.3)",
                      mb: 2,
                    }}
                  />
                  <Typography
                    variant="h6"
                    sx={{
                      color: theme.palette.mode === "dark" ? "rgba(255, 255, 255, 0.6)" : "rgba(0, 0, 0, 0.6)",
                      mb: 1,
                      fontWeight: 600,
                    }}
                  >
                    첫 메시지를 남겨보세요!
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      color: theme.palette.mode === "dark" ? "rgba(255, 255, 255, 0.4)" : "rgba(0, 0, 0, 0.4)",
                      fontStyle: "italic",
                    }}
                  >
                    이 채널의 다른 사용자들과 자유롭게 대화해보세요
                  </Typography>
                </Box>
              ) : (
                chatMessages.map((message, index) => (
                  <React.Fragment key={message.id}>
                    <ListItem
                      alignItems="flex-start"
                      sx={{
                        px: 3,
                        py: 2,
                        transition: "all 0.2s ease",
                        "&:hover": {
                          backgroundColor:
                            theme.palette.mode === "dark" ? "rgba(255, 255, 255, 0.02)" : "rgba(0, 0, 0, 0.02)",
                        },
                      }}
                    >
                      <ListItemAvatar sx={{ minWidth: 56 }}>
                        <Avatar
                          sx={{
                            width: 44,
                            height: 44,
                            background: "linear-gradient(135deg, #8b5cf6, #06b6d4)",
                            fontSize: "1rem",
                            fontWeight: "bold",
                            boxShadow:
                              theme.palette.mode === "dark"
                                ? "0 2px 8px rgba(139, 92, 246, 0.3)"
                                : "0 2px 8px rgba(139, 92, 246, 0.2)",
                          }}
                          src={message.user.profile_image}
                        >
                          {message.user.nickname.charAt(0)}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
                            <Typography
                              variant="subtitle1"
                              sx={{
                                fontWeight: 700,
                                color: theme.palette.mode === "dark" ? "#e2e8f0" : "#374151",
                                fontSize: "1rem",
                              }}
                            >
                              {message.user.nickname}
                            </Typography>
                            <Typography
                              variant="caption"
                              sx={{
                                color: theme.palette.mode === "dark" ? "#94a3b8" : "#6b7280",
                                fontSize: "0.8rem",
                                backgroundColor:
                                  theme.palette.mode === "dark" ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.05)",
                                px: 1,
                                py: 0.25,
                                borderRadius: "8px",
                              }}
                            >
                              {new Date(message.created_at).toLocaleTimeString("ko-KR", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </Typography>
                          </Box>
                        }
                        secondary={
                          <Typography
                            variant="body1"
                            sx={{
                              color: theme.palette.mode === "dark" ? "#cbd5e1" : "#4b5563",
                              lineHeight: 1.5,
                              wordBreak: "break-word",
                              whiteSpace: "pre-wrap",
                              fontSize: "0.95rem",
                              mt: 0.5,
                            }}
                          >
                            {message.message}
                          </Typography>
                        }
                      />
                    </ListItem>
                    {index < chatMessages.length - 1 && (
                      <Divider
                        sx={{
                          mx: 3,
                          borderColor:
                            theme.palette.mode === "dark" ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.05)",
                        }}
                      />
                    )}
                  </React.Fragment>
                ))
              )}
            </List>

            {/* 메시지 입력 영역 */}
            <Box
              sx={{
                p: 3,
                borderTop:
                  theme.palette.mode === "dark"
                    ? "1px solid rgba(255, 255, 255, 0.1)"
                    : "1px solid rgba(0, 0, 0, 0.08)",
                background:
                  theme.palette.mode === "dark"
                    ? "linear-gradient(135deg, rgba(139, 92, 246, 0.05), rgba(6, 182, 212, 0.05))"
                    : "linear-gradient(135deg, rgba(139, 92, 246, 0.02), rgba(6, 182, 212, 0.02))",
              }}
            >
              <TextField
                fullWidth
                multiline
                maxRows={4}
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleMessageKeyPress}
                placeholder="메시지를 입력하세요... (Enter: 전송, Shift+Enter: 줄바꿈)"
                variant="outlined"
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: "16px",
                    background:
                      theme.palette.mode === "dark" ? "rgba(255, 255, 255, 0.05)" : "rgba(255, 255, 255, 0.9)",
                    fontSize: "1rem",
                    "& fieldset": {
                      borderColor:
                        theme.palette.mode === "dark" ? "rgba(139, 92, 246, 0.3)" : "rgba(139, 92, 246, 0.2)",
                    },
                    "&:hover fieldset": {
                      borderColor:
                        theme.palette.mode === "dark" ? "rgba(139, 92, 246, 0.5)" : "rgba(139, 92, 246, 0.4)",
                    },
                    "&.Mui-focused fieldset": {
                      borderColor: theme.palette.mode === "dark" ? "#a78bfa" : "#8b5cf6",
                      borderWidth: "2px",
                    },
                  },
                  "& .MuiInputBase-input": {
                    color: theme.palette.mode === "dark" ? "#e2e8f0" : "#374151",
                    fontSize: "1rem",
                    py: 1.5,
                  },
                  "& .MuiInputBase-input::placeholder": {
                    color: theme.palette.mode === "dark" ? "#94a3b8" : "#6b7280",
                    opacity: 1,
                  },
                }}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={handleSendMessage}
                        disabled={!newMessage.trim()}
                        sx={{
                          color: theme.palette.mode === "dark" ? "#a78bfa" : "#8b5cf6",
                          background:
                            theme.palette.mode === "dark" ? "rgba(139, 92, 246, 0.1)" : "rgba(139, 92, 246, 0.05)",
                          borderRadius: "12px",
                          p: 1,
                          "&:hover": {
                            background:
                              theme.palette.mode === "dark" ? "rgba(139, 92, 246, 0.2)" : "rgba(139, 92, 246, 0.1)",
                            transform: "scale(1.05)",
                          },
                          "&:disabled": {
                            color: theme.palette.mode === "dark" ? "#4a5568" : "#a0aec0",
                            background: "transparent",
                          },
                        }}
                      >
                        <SendIcon />
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </Box>
          </Box>
        </Box>
      ) : (
        /* 기본 탭 + 테이블 UI */
        <>
          {/* 게시글 목록 */}
          {currentLoading && !currentData ? (
            <Loading />
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
      )}
    </Box>
  );
};

export default ChannelDetailPage;
