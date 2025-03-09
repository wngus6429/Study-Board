"use client";
import { ReactNode, useEffect, useState, useMemo } from "react";
import CustomizedTables from "./CustomizedTables";
import axios from "axios";
import { useQuery } from "@tanstack/react-query";
import { Box, Button, FormControl, MenuItem, Select, Tab, Tabs } from "@mui/material";
import Loading from "./common/Loading";
import { useSession } from "next-auth/react";
import CreateIcon from "@mui/icons-material/Create";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import Pagination from "./common/Pagination";
import usePageStore from "../store/pageStore";
import { MIN_RECOMMEND_COUNT, TABLE_VIEW_COUNT } from "../const/TABLE_VIEW_COUNT";
import { useRouter } from "next/navigation";
import SearchBar from "./common/SearchBar";
import ForumIcon from "@mui/icons-material/Forum";
import QuestionAnswerIcon from "@mui/icons-material/QuestionAnswer";
import InfoIcon from "@mui/icons-material/Info";
import RateReviewIcon from "@mui/icons-material/RateReview";
import CameraAltIcon from "@mui/icons-material/CameraAlt";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";
import AllInclusiveIcon from "@mui/icons-material/AllInclusive";
import FeedbackIcon from "@mui/icons-material/Feedback";

// 탭 선택 옵션
export const WRITE_SELECT_OPTIONS = [
  { name: "잡담", value: "chat", icon: <ForumIcon /> },
  { name: "질문", value: "question", icon: <QuestionAnswerIcon /> },
  { name: "정보", value: "info", icon: <InfoIcon /> },
  { name: "리뷰", value: "review", icon: <RateReviewIcon /> },
  { name: "스샷", value: "screenshot", icon: <CameraAltIcon /> },
  { name: "기타", value: "etc", icon: <MoreHorizIcon /> },
];

export const TAB_SELECT_OPTIONS = [
  { name: "전체", value: "all", icon: <AllInclusiveIcon /> },
  ...WRITE_SELECT_OPTIONS,
  { name: "건의", value: "suggestion", icon: <FeedbackIcon /> },
];

interface ApiResponse {
  results: any[];
  total: number;
}

interface MainViewProps {
  initialData: ApiResponse;
  initialCategory: string;
  initialCurrentPage: number;
  initialRecommendRankingMode: boolean;
}

const MainView = ({
  initialData,
  initialCategory,
  initialCurrentPage,
  initialRecommendRankingMode,
}: MainViewProps): ReactNode => {
  const Router = useRouter();
  const { data: user } = useSession();
  const { currentPage, setCurrentPage } = usePageStore();

  // 상태 초기화 (서버에서 전달받은 초기값 사용)
  const [value, setValue] = useState(initialCategory);
  useEffect(() => {
    setCurrentPage(initialCurrentPage);
  }, [initialCurrentPage, setCurrentPage]);
  const viewCount: number = TABLE_VIEW_COUNT;
  const [searchParamsState, setSearchParamsState] = useState<{ type: string; query: string } | null>(null);
  const [recommendRankingMode, setRecommendRankingMode] = useState(initialRecommendRankingMode);

  // react-query를 이용해 데이터 패칭 (초기 데이터로 hydration)
  const { data, error, isLoading } = useQuery<ApiResponse>({
    queryKey: searchParamsState
      ? ["stories", value, currentPage, searchParamsState, recommendRankingMode]
      : ["stories", value, currentPage, recommendRankingMode],
    queryFn: async () => {
      const offset = (currentPage - 1) * viewCount;
      const params: any = {
        offset,
        limit: viewCount,
        category: value !== "all" ? value : undefined,
      };
      if (recommendRankingMode) {
        params.minRecommend = MIN_RECOMMEND_COUNT;
      }
      if (searchParamsState && searchParamsState.query.trim() !== "") {
        params.type = searchParamsState.type;
        params.query = searchParamsState.query;
        const response = await axios.get<ApiResponse>(`${process.env.NEXT_PUBLIC_BASE_URL}/api/story/search`, {
          params,
        });
        return response.data;
      }
      const response = await axios.get<ApiResponse>(`${process.env.NEXT_PUBLIC_BASE_URL}/api/story/pageTableData`, {
        params,
      });
      return response.data;
    },
    initialData: initialData,
  });

  // 이전 데이터를 유지하기 위한 상태
  const [previousData, setPreviousData] = useState<ApiResponse | null>(initialData);
  useEffect(() => {
    if (data) {
      setPreviousData(data);
    }
  }, [data]);

  const tableData = data?.results || previousData?.results || [];
  const total = data?.total || previousData?.total || 0;

  // 탭(카테고리) 변경 시: 검색 상태 초기화 및 URL 업데이트
  const handleChange = (event: React.SyntheticEvent, newValue: string) => {
    // 탭 전환 시 검색 상태 초기화
    setSearchParamsState(null);
    setValue(newValue);
    setCurrentPage(1);
    setRecommendRankingMode(false);
    Router.push(`?category=${newValue}`, { scroll: false });
  };

  // 추천 랭킹 토글
  const toggleRecommendRanking = () => {
    // 추천 랭킹 모드를 토글하며 페이지 번호 초기화 및 URL 반영
    const newMode = !recommendRankingMode;
    setRecommendRankingMode(newMode);
    setCurrentPage(1);

    // URL 파라미터에 추천 랭킹 모드 반영 (검색 파라미터와 탭 정보 유지)
    const params = new URLSearchParams();
    params.set("category", value);
    if (searchParamsState) {
      params.set("searchType", searchParamsState.type);
      params.set("searchQuery", searchParamsState.query);
    }
    params.set("recommendRanking", newMode.toString());
    Router.push(`?${params.toString()}`, { scroll: false });
  };

  const moveWrite = () => {
    Router.push("/write");
  };

  const handlePageClick = (selectedItem: { selected: number }) => {
    const newPage = selectedItem.selected + 1;
    setCurrentPage(newPage);
  };

  // SearchBar에서 검색옵션 업데이트
  // 검색 상태를 업데이트하고, URL에도 검색 관련 파라미터를 반영합니다.
  const handleSearch = ({ category, query }: { category: string; query: string }) => {
    setSearchParamsState({ type: category, query });
    setCurrentPage(1);
    const params = new URLSearchParams();
    params.set("category", value);
    params.set("searchType", category);
    params.set("searchQuery", query);
    // 검색 시에도 추천 랭킹 모드가 반영되도록 처리
    params.set("recommendRanking", recommendRankingMode.toString());
    Router.push(`?${params.toString()}`, { scroll: false });
  };

  const [sortOrder, setSortOrder] = useState<"최신순" | "조회수" | "추천수">("최신순");
  const sortedTableData = useMemo(() => {
    if (!tableData) return [];
    return [...tableData].sort((a, b) => {
      if (sortOrder === "조회수") {
        return b.read_count - a.read_count; // 조회수 내림차순
      } else if (sortOrder === "추천수") {
        return b.recommend_Count - a.recommend_Count; // 추천수 내림차순
      }
      return 0; // 최신순(default)일 경우 원래 순서 유지
    });
  }, [tableData, sortOrder]);

  if (error) return <div>Error: {(error as Error).message}</div>;

  return (
    <>
      <Box
        sx={{
          width: "100%",
          borderRadius: 2,
          boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
          overflow: "hidden",
          bgcolor: "background.paper",
        }}
      >
        <Tabs
          value={value}
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
              "&:hover": {
                backgroundColor: "rgba(156, 39, 176, 0.04)",
                color: "secondary.dark",
              },
              "&.Mui-selected": {
                color: "secondary.main",
                fontWeight: 700,
              },
            },
            "& .MuiTabs-indicator": {
              height: 3,
              borderTopLeftRadius: 3,
              borderTopRightRadius: 3,
            },
          }}
        >
          {/* 탭 선택 */}
          {TAB_SELECT_OPTIONS.map((option) => (
            <Tab key={option.value} icon={option.icon} label={option.name} value={option.value} />
          ))}
        </Tabs>
      </Box>
      {isLoading && !previousData ? <Loading /> : <CustomizedTables tableData={sortedTableData} />}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mt: 2,
          height: "35px",
        }}
      >
        {/* 왼쪽 여백 정렬 기준 Select Box  */}
        <Box sx={{ flex: 1 }}>
          <FormControl size="small">
            <Select value={sortOrder} onChange={(e) => setSortOrder(e.target.value as "최신순" | "조회수" | "추천수")}>
              <MenuItem value="최신순">최신순</MenuItem>
              <MenuItem value="조회수">조회수순</MenuItem>
              <MenuItem value="추천수">추천수순</MenuItem>
            </Select>
          </FormControl>
          {/* 추천 랭킹 버튼: 추천 랭킹 모드 활성화 / 비활성화 */}
          <Button
            variant="contained"
            startIcon={<EmojiEventsIcon sx={{ fontSize: 24, color: "rgba(255, 255, 255, 0.8)" }} />}
            sx={{
              backgroundImage: "linear-gradient(45deg, #ff9800, #f77d58)",
              color: "white",
              fontWeight: "bold",
              borderRadius: "8px",
              padding: "8px 16px",
              boxShadow: "0px 4px 10px rgba(0,0,0,0.2)", // 부드러운 그림자 효과
              "&:hover": {
                backgroundImage: "linear-gradient(45deg, #e65100, #bf360c)", // 조금 더 어두운 톤으로 변환
              },
            }}
            onClick={toggleRecommendRanking}
          >
            추천 랭킹
          </Button>
        </Box>
        {/* 가운데 페이지네이션 */}
        <Box sx={{ display: "flex", justifyContent: "center", flex: 1 }}>
          <Pagination
            pageCount={Math.ceil(total / viewCount)}
            onPageChange={handlePageClick}
            currentPage={currentPage}
          />
        </Box>
        {/* 오른쪽 글쓰기 버튼 */}
        <Box sx={{ display: "flex", justifyContent: "flex-end", flex: 1 }}>
          {user?.user && (
            <Button variant="outlined" onClick={moveWrite} color="success">
              <CreateIcon />
              글쓰기
            </Button>
          )}
        </Box>
      </Box>
      {/* SearchBar: 검색 옵션과 검색어 입력 */}
      <Box sx={{ display: "flex", justifyContent: "center", mt: 2, mb: 2 }}>
        <SearchBar onSearch={handleSearch} />
      </Box>
    </>
  );
};

export default MainView;
