"use client";
import { ReactNode, useEffect, useState, useMemo } from "react";
import CustomizedTables from "./table/CustomizedTables";
import axios from "axios";
import {
  Box,
  Button,
  FormControl,
  IconButton,
  MenuItem,
  Select,
  SelectChangeEvent,
  Tab,
  Tabs,
  Typography,
  Card,
  CardContent,
  Avatar,
  Chip,
} from "@mui/material";
import Loading from "./common/Loading";
import { useSession } from "next-auth/react";
import CreateIcon from "@mui/icons-material/Create";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import Pagination from "./common/Pagination";
import usePageStore from "../store/pageStore";
import { MIN_RECOMMEND_COUNT, TABLE_VIEW_COUNT } from "../const/VIEW_COUNT";
import { useRouter } from "next/navigation";
import SearchBar from "./common/SearchBar";
import { TAB_SELECT_OPTIONS } from "../const/WRITE_CONST";
import ViewListIcon from "@mui/icons-material/ViewList";
import ViewModuleIcon from "@mui/icons-material/ViewModule";
import CustomizedSuggestionTable from "./table/CustomizedSuggestionTable";
import { useStories } from "./api/useStories";
import CustomizedCardView from "./table/CustomizedCardView";
import { useCardStories } from "./api/useCardStories";
import NoticesDropdown from "./NoticesDropdown";
import { useTheme } from "@mui/material/styles";
import PeopleIcon from "@mui/icons-material/People";
import NotificationsIcon from "@mui/icons-material/Notifications";
import NotificationsOffIcon from "@mui/icons-material/NotificationsOff";
import VerifiedIcon from "@mui/icons-material/Verified";
import PersonIcon from "@mui/icons-material/Person";

// API 응답 타입
interface ApiResponse {
  results: any[];
  total: number;
}

// MainView 컴포넌트에 전달받는 초기 props 타입 정의
interface MainViewProps {
  initialData: ApiResponse;
  initialCategory: string;
  initialCurrentPage: number;
  initialRecommendRankingMode: boolean;
  initialSortOrder: "recent" | "view" | "recommend";
}

// 채널 mockData 타입 정의
interface ChannelInfo {
  id: number;
  name: string;
  description: string;
  subscriberCount: number;
  creatorName: string;
  creatorAvatar?: string;
  isSubscribed: boolean;
  isVerified: boolean;
  category: string;
  storyCount: number;
}

// 채널 mockData
const mockChannelData: ChannelInfo = {
  id: 1,
  name: "개발자 커뮤니티",
  description:
    "프로그래밍과 개발에 관한 모든 이야기를 나누는 공간입니다. 질문, 팁, 프로젝트 공유 등 자유롭게 소통해요! 🚀",
  subscriberCount: 1543,
  creatorName: "김개발",
  isSubscribed: false,
  isVerified: true,
  category: "개발",
  storyCount: 2847,
};

// 서버에서 전달받은 초기 데이터(initialData)와 초기 상태(카테고리, 페이지, 추천 랭킹 모드)를 기반으로 렌더링
const MainView = ({
  initialData,
  initialCategory,
  initialCurrentPage,
  initialRecommendRankingMode,
  initialSortOrder,
}: MainViewProps): ReactNode => {
  // next/navigation의 useRouter를 통해 URL 이동 제어
  const Router = useRouter();
  // next-auth의 useSession을 사용해 사용자 로그인 정보를 가져옴
  const { data: user, status } = useSession();
  // 페이지 번호 관리를 위한 store (예: zustand)에서 currentPage와 setCurrentPage 가져오기
  const { currentPage, setCurrentPage } = usePageStore();
  // 서버에서 전달받은 초기 카테고리 값을 상태로 저장
  const [categoryValue, setCategoryValue] = useState(initialCategory);
  // 테마 훅 추가
  const theme = useTheme();

  // 채널 구독 상태 관리 (mockData용)
  const [channelInfo, setChannelInfo] = useState<ChannelInfo>(mockChannelData);

  // 구독 토글 함수
  const handleSubscriptionToggle = () => {
    setChannelInfo((prev) => ({
      ...prev,
      isSubscribed: !prev.isSubscribed,
      subscriberCount: prev.isSubscribed ? prev.subscriberCount - 1 : prev.subscriberCount + 1,
    }));
  };

  // 구독자 수 포맷팅 함수
  const formatSubscriberCount = (count: number) => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    } else if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  };

  // 초기 페이지 번호를 store에 설정 (컴포넌트 마운트 시)
  useEffect(() => {
    console.log("setCurrentPage", initialCurrentPage);
    setCurrentPage(initialCurrentPage);
  }, [initialCurrentPage, setCurrentPage]);

  // 한 페이지에 보여줄 게시글 수 상수
  const viewCount: number = TABLE_VIEW_COUNT;

  // SearchBar에서 전달받은 검색 옵션을 상태로 관리 (초기에는 null)
  const [searchParamsState, setSearchParamsState] = useState<{ type: string; query: string } | null>(null);
  // 추천 랭킹 모드 상태: 서버에서 받은 초기값 사용
  const [recommendRankingMode, setRecommendRankingMode] = useState(initialRecommendRankingMode);

  // 뷰 모드 토글: "table" (기존 테이블)와 "card" (이미지+제목 카드) 중 선택
  const [viewMode, setViewMode] = useState<"table" | "card">("table");

  // react-query를 이용해 API를 호출합니다.
  // initialData를 hydration하여 클라이언트에서 첫 렌더링 시 사용합니다.
  const { data, error, isLoading } = useStories({
    category: categoryValue,
    currentPage,
    searchParamsState,
    recommendRankingMode,
    viewCount,
    initialData,
    viewMode,
  });

  const [suggestionData, setSuggestionData] = useState<ApiResponse | null>(initialData);

  useEffect(() => {
    if (categoryValue === "suggestion" && status === "authenticated" && user?.user?.id) {
      const fetchSuggestionData = async () => {
        const offset = (currentPage - 1) * viewCount;
        const params = {
          offset,
          limit: viewCount,
          userId: user.user.id, // 건의사항은 반드시 유저 아이디가 필요합니다.
        };

        try {
          const response = await axios.get<ApiResponse>(
            `${process.env.NEXT_PUBLIC_BASE_URL}/api/suggestion/pageTableData`,
            { params, withCredentials: true }
          );
          // 받아온 데이터를 필요에 따라 상태에 저장하거나 추가 처리를 합니다.
          console.log("Fetched suggestion data:", response.data);
          setSuggestionData(response.data);
        } catch (error) {
          console.error("Error fetching suggestion data:", error);
        }
      };

      fetchSuggestionData();
    }
  }, [categoryValue, currentPage, viewCount, user?.user?.id]);

  // 현재 보여줄 테이블 데이터와 총 게시글 수 계산
  const tableData = data?.results || [];
  const total = data?.total || 0;

  // 탭(카테고리) 변경 시 호출되는 함수
  const handleChange = (event: React.SyntheticEvent, newValue: string) => {
    // 탭 전환 시 검색 상태 초기화
    setSearchParamsState(null);
    // 선택한 탭 값 업데이트
    setCategoryValue(newValue);
    // 페이지 번호 초기화
    setCurrentPage(1);

    // URL 쿼리 파라미터 구성
    const params = new URLSearchParams();
    params.set("category", newValue);

    // 추천 랭킹 모드 상태 유지 (탭 변경에도 유지)
    params.set("recommendRanking", recommendRankingMode.toString());

    // 현재 뷰 모드 상태 유지 (카드 뷰 또는 테이블 뷰)
    params.set("viewMode", viewMode);

    // URL 업데이트 (예: 쿼리 파라미터 반영)
    Router.push(`?${params.toString()}`, { scroll: false });
  };

  // 추천 랭킹 모드 토글 함수
  const toggleRecommendRanking = () => {
    // 1. 현재 추천 랭킹 모드의 boolean 값을 반전시켜 새로운 모드(newMode)를 결정합니다.
    //    예를 들어, 현재 추천 랭킹 모드가 false라면 newMode는 true가 됩니다.
    const newMode = !recommendRankingMode;

    // 2. 추천 랭킹 모드 상태를 업데이트합니다.
    //    새로운 모드 값(newMode)을 setRecommendRankingMode를 통해 상태에 반영합니다.
    setRecommendRankingMode(newMode);

    // 3. 추천 랭킹 모드를 토글할 때는 페이지 번호를 1로 초기화합니다.
    //    (새 모드에 맞춰 첫 페이지부터 데이터를 다시 불러오기 위함)
    setCurrentPage(1);

    // 4. URL 쿼리 파라미터를 구성하기 위해 새로운 URLSearchParams 객체를 생성합니다.
    const params = new URLSearchParams();

    // 5. 현재 선택된 카테고리 값을 "category" 파라미터에 설정합니다.
    //    이 값은 기존에 선택된 탭(카테고리)을 나타냅니다.
    params.set("category", categoryValue);

    // 6. 만약 검색 조건(searchParamsState)이 있다면, 해당 검색 조건을 URL 파라미터에 추가합니다.
    //    여기서는 검색 옵션의 종류(type)와 검색어(query)를 각각 "searchType"과 "searchQuery"로 설정합니다.
    if (searchParamsState) {
      params.set("searchType", searchParamsState.type);
      params.set("searchQuery", searchParamsState.query);
    }

    // 7. 새로 반전된 추천 랭킹 모드(newMode)를 문자열로 변환하여 "recommendRanking" 파라미터에 설정합니다.
    //    URL 파라미터는 문자열이어야 하므로 toString()을 사용합니다.
    params.set("recommendRanking", newMode.toString());

    // 8. 현재 뷰 모드 상태 유지 (카드 뷰 또는 테이블 뷰)
    params.set("viewMode", viewMode);

    // 9. 구성한 URL 쿼리 파라미터를 사용해 URL을 업데이트합니다.
    //    Router.push를 사용하여 URL을 변경하며, { scroll: false } 옵션은 페이지 이동 시 스크롤 위치를 유지하도록 합니다.
    Router.push(`?${params.toString()}`, { scroll: false });
  };

  // 페이지네이션 클릭 시 호출되는 함수 (페이지 번호 업데이트)
  const handlePageClick = (selectedItem: { selected: number }) => {
    const newPage = selectedItem.selected + 1;
    setCurrentPage(newPage);
    // 기존 쿼리 파라미터들을 유지하면서 페이지 번호만 업데이트
    const params = new URLSearchParams(window.location.search);
    params.set("page", newPage.toString());
    // 만약 다른 파라미터(예: category, recommendRanking 등)도 있다면 그대로 유지됨
    Router.push(`?${params.toString()}`, { scroll: false });
  };

  // SearchBar에서 검색 옵션과 검색어를 전달받아 상태와 URL 업데이트
  const handleSearch = ({ category, query }: { category: string; query: string }) => {
    setSearchParamsState({ type: category, query });
    setCurrentPage(1);
    const params = new URLSearchParams();
    params.set("category", categoryValue);
    params.set("searchType", category);
    params.set("searchQuery", query);
    // 검색 시 추천 랭킹 모드도 반영
    params.set("recommendRanking", recommendRankingMode.toString());
    // 현재 뷰 모드 상태 유지
    params.set("viewMode", viewMode);
    Router.push(`?${params.toString()}`, { scroll: false });
  };

  // 정렬 옵션 상태 (최신순, 조회수, 추천수)
  const [sortOrder, setSortOrder] = useState<"recent" | "view" | "recommend">(initialSortOrder);

  // 테이블 데이터를 정렬 (정렬 옵션에 따라)
  const handleSortChange = (event: SelectChangeEvent<"recent" | "view" | "recommend">) => {
    const newSortOrder = event.target.value as "recent" | "view" | "recommend";
    setSortOrder(newSortOrder);
    // 현재 URL 쿼리 파라미터 가져오기
    const params = new URLSearchParams(window.location.search);
    // sortOrder 파라미터 추가 또는 업데이트
    params.set("sortOrder", newSortOrder);
    // 현재 뷰 모드 상태 유지
    params.set("viewMode", viewMode);
    // URL 업데이트
    Router.push(`?${params.toString()}`, { scroll: false });
  };

  // 데이터 테이블에 뿌리는 데이터를 만듬
  const sortedTableData = useMemo(() => {
    if (!tableData) return [];
    return [...tableData]
      .sort((a, b) => {
        // 2) 둘 다 공지거나 둘 다 공지가 아니면, 정렬 옵션에 따라 비교
        if (sortOrder === "view") {
          return b.read_count - a.read_count;
        } else if (sortOrder === "recommend") {
          return b.recommend_Count - a.recommend_Count;
        }
        // "최신순"인 경우 서버가 이미 최신순으로 반환한다면 그대로 두기(0)
        // 혹은 클라이언트에서 최신순으로 직접 정렬하려면 아래처럼 처리
        // return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        return 0;
      })
      .map((item) => ({
        ...item,
        isRecommendRanking: recommendRankingMode,
      }));
  }, [tableData, sortOrder, recommendRankingMode]);

  const {
    data: getCardData,
    error: cardError,
    isLoading: cardLoading,
  } = useCardStories({
    category: categoryValue,
    currentPage,
    searchParamsState,
    recommendRankingMode,
    viewCount,
    initialData,
    viewMode,
  });

  const cardResultData = getCardData?.results || [];
  const cardResultTotal = getCardData?.total || 0;

  // 카드 테이블에 뿌리는 데이터를 만듬
  const sortedCardTableData = useMemo(() => {
    if (!cardResultData || viewMode !== "card") return [];
    return [...cardResultData]
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
  }, [cardResultData, sortOrder, viewMode, recommendRankingMode]);

  // 뷰 모드에 따른 현재 total과 loading 상태 결정
  const currentTotal = viewMode === "card" ? cardResultTotal : total;
  const currentLoading = viewMode === "card" ? cardLoading : isLoading;

  // 새로고침시 움직임
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const viewModeParam = params.get("viewMode");
    if (viewModeParam === "card") {
      setViewMode("card");
    } else {
      setViewMode("table"); // 기본값, 필요에 따라 변경
    }
  }, []);

  // 에러 발생 시 에러 메시지 표시
  if (error) return <div>Error: {(error as Error).message}</div>;

  return (
    <>
      {/* 채널 정보 표시 영역 */}
      <Card
        sx={{
          mb: 3,
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
          "&::before": {
            content: '""',
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "4px",
            background: "linear-gradient(90deg, #8b5cf6, #06b6d4, #10b981)",
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
                {channelInfo.name.charAt(0)}
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
                    {channelInfo.name}
                  </Typography>
                  {channelInfo.isVerified && (
                    <VerifiedIcon
                      sx={{
                        color: theme.palette.mode === "dark" ? "#22d3ee" : "#06b6d4",
                        fontSize: 20,
                      }}
                    />
                  )}
                  <Chip
                    label={channelInfo.category}
                    size="small"
                    sx={{
                      background: theme.palette.mode === "dark" ? "rgba(139, 92, 246, 0.2)" : "rgba(139, 92, 246, 0.1)",
                      color: theme.palette.mode === "dark" ? "#a78bfa" : "#8b5cf6",
                      fontWeight: 600,
                      fontSize: "0.75rem",
                    }}
                  />
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
                  {channelInfo.description}
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
                      구독자 {formatSubscriberCount(channelInfo.subscriberCount)}명
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
                      채널 생성자: {channelInfo.creatorName}
                    </Typography>
                  </Box>

                  <Typography
                    variant="body2"
                    sx={{
                      color: theme.palette.mode === "dark" ? "#94a3b8" : "text.secondary",
                    }}
                  >
                    게시글 {channelInfo.storyCount.toLocaleString()}개
                  </Typography>
                </Box>
              </Box>
            </Box>

            {/* 오른쪽: 구독 버튼 */}
            {user?.user && (
              <Button
                variant={channelInfo.isSubscribed ? "outlined" : "contained"}
                onClick={handleSubscriptionToggle}
                startIcon={
                  channelInfo.isSubscribed ? (
                    <NotificationsOffIcon sx={{ fontSize: 20 }} />
                  ) : (
                    <NotificationsIcon sx={{ fontSize: 20 }} />
                  )
                }
                sx={{
                  borderRadius: "12px",
                  fontWeight: 600,
                  px: 3,
                  py: 1.5,
                  transition: "all 0.3s ease",
                  ...(channelInfo.isSubscribed
                    ? {
                        color: theme.palette.mode === "dark" ? "#f87171" : "#dc2626",
                        borderColor: theme.palette.mode === "dark" ? "#f87171" : "#dc2626",
                        "&:hover": {
                          background:
                            theme.palette.mode === "dark" ? "rgba(248, 113, 113, 0.1)" : "rgba(220, 38, 38, 0.1)",
                          borderColor: theme.palette.mode === "dark" ? "#dc2626" : "#991b1b",
                          transform: "translateY(-1px)",
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
                {channelInfo.isSubscribed ? "구독 취소" : "구독하기"}
              </Button>
            )}
          </Box>
        </CardContent>
      </Card>

      {/* 탭 UI 영역 */}
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
        }}
      >
        <Tabs
          value={categoryValue}
          onChange={handleChange}
          textColor="secondary"
          indicatorColor="secondary"
          aria-label="category tabs"
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
          {TAB_SELECT_OPTIONS.filter((option) => {
            // "건의" 탭은 로그인 상태(status가 "authenticated")일 때만 남깁니다.
            if (option.value === "suggestion" && status !== "authenticated") return false;
            return true;
          }).map((option) => (
            <Tab key={option.value} icon={option.icon} label={option.name} value={option.value} />
          ))}
        </Tabs>
        {/* ★ 추가: 필독 공지사항 드롭다운 버튼 */}
        <NoticesDropdown />
        {/* 왼쪽: 테이블 보기 아이콘 */}
        <IconButton
          onClick={() => {
            // 기존 URL의 쿼리 파라미터를 유지하고, viewMode를 "table"로 설정
            const params = new URLSearchParams(window.location.search);
            params.set("viewMode", "table");
            // URL 업데이트: { scroll: false }를 사용해 스크롤 위치 유지
            Router.push(`?${params.toString()}`, { scroll: false });
            setViewMode("table");
          }}
          color={viewMode === "table" ? "primary" : "default"}
          sx={{ ml: 2 }}
          aria-label="table view"
        >
          <ViewListIcon sx={{ fontSize: 32 }} />
        </IconButton>
        {/* 오른쪽: 카드 보기 아이콘 */}
        <IconButton
          onClick={() => {
            // 기존 URL의 쿼리 파라미터를 유지하고, viewMode 업데이트
            const params = new URLSearchParams(window.location.search);
            params.set("viewMode", "card");
            // URL 업데이트: { scroll: false }로 스크롤 위치 유지
            Router.push(`?${params.toString()}`, { scroll: false });
            setViewMode("card");
          }}
          color={viewMode === "card" ? "primary" : "default"}
          sx={{ ml: 1, mr: 2 }}
          aria-label="card view"
        >
          <ViewModuleIcon sx={{ fontSize: 32 }} />
        </IconButton>
      </Box>
      {/* 데이터 로딩 시 Loading 컴포넌트, 로딩이 완료되면 CustomizedTables에 정렬된 데이터 전달
      {isLoading && categoryValue !== "suggestion" && !previousData ? (
        <Loading />
      ) : (
        <CustomizedTables tableData={sortedTableData} />
      )}
      {categoryValue === "suggestion" && <CustomizedSuggestionTable tableData={suggestionData?.results || []} />} */}

      {/* 카테고리가 "suggestion"인 경우 */}

      {categoryValue === "suggestion" ? (
        suggestionData?.results && <CustomizedSuggestionTable tableData={suggestionData.results} />
      ) : currentLoading ? (
        <Loading />
      ) : viewMode === "card" ? (
        <CustomizedCardView tableData={sortedCardTableData} />
      ) : (
        <CustomizedTables tableData={sortedTableData} />
      )}
      {/* 하단 영역: 정렬, 페이지네이션, 글쓰기 버튼 */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mt: 2,
          height: "35px",
        }}
      >
        {/* 왼쪽 영역: 정렬 옵션과 추천 랭킹 토글 버튼 */}
        <Box sx={{ flex: 1 }}>
          <FormControl size="small">
            <Select value={sortOrder} onChange={(e) => handleSortChange(e)}>
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
                theme.palette.mode === "dark" ? "0px 4px 15px rgba(139, 92, 246, 0.4)" : "0px 4px 10px rgba(0,0,0,0.2)",
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
        {/* 가운데 영역: 페이지네이션 */}
        <Box sx={{ display: "flex", justifyContent: "center", flex: 1 }}>
          <Pagination
            pageCount={Math.ceil(currentTotal / viewCount)}
            onPageChange={handlePageClick}
            currentPage={currentPage}
          />
        </Box>
        {/* 오른쪽 영역: 글쓰기 버튼 (로그인 상태인 경우) */}
        <Box sx={{ display: "flex", justifyContent: "flex-end", flex: 1 }}>
          {user?.user &&
            (categoryValue !== "suggestion" ? (
              <Button variant="outlined" onClick={() => Router.push("/write/story")} color="success">
                <CreateIcon />
                글쓰기
              </Button>
            ) : (
              <Button variant="outlined" onClick={() => Router.push("/write/suggestion")} color="success">
                <CreateIcon />
                건의하기
              </Button>
            ))}
        </Box>
      </Box>
      {/* 하단 검색바 영역 */}
      <Box sx={{ display: "flex", justifyContent: "center", mt: 2, mb: 2 }}>
        <SearchBar onSearch={handleSearch} />
      </Box>
    </>
  );
};

export default MainView;
