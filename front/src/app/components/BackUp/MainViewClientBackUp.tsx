"use client";
import { ReactNode, useEffect, useState, useMemo } from "react";
import CustomizedTables from "../CustomizedTables";
import axios from "axios";
import { useQuery } from "@tanstack/react-query";
import { Box, Button, FormControl, InputLabel, MenuItem, Select, Tab, Tabs } from "@mui/material";
import Loading from "../common/Loading";
import { useSession } from "next-auth/react";
import CreateIcon from "@mui/icons-material/Create";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
// import { TAB_SELECT_OPTIONS } from "../const/WRITE_CONST";
import Pagination from "../common/Pagination";
import usePageStore from "../../store/pageStore";
import { MIN_RECOMMEND_COUNT, TABLE_VIEW_COUNT } from "../../const/TABLE_VIEW_COUNT";
import { useRouter, useSearchParams } from "next/navigation";
import SearchBar from "../common/SearchBar";
// 필요한 아이콘들을 MUI 아이콘 라이브러리에서 import 합니다.
import ForumIcon from "@mui/icons-material/Forum";
import QuestionAnswerIcon from "@mui/icons-material/QuestionAnswer";
import InfoIcon from "@mui/icons-material/Info";
import RateReviewIcon from "@mui/icons-material/RateReview";
import CameraAltIcon from "@mui/icons-material/CameraAlt";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";
import AllInclusiveIcon from "@mui/icons-material/AllInclusive";
import FeedbackIcon from "@mui/icons-material/Feedback";

// 게시글 작성 시 선택 옵션 (잡담, 질문, 정보, 리뷰, 스샷, 기타)
export const WRITE_SELECT_OPTIONS = [
  { name: "잡담", value: "chat", icon: <ForumIcon /> },
  { name: "질문", value: "question", icon: <QuestionAnswerIcon /> },
  { name: "정보", value: "info", icon: <InfoIcon /> },
  { name: "리뷰", value: "review", icon: <RateReviewIcon /> },
  { name: "스샷", value: "screenshot", icon: <CameraAltIcon /> },
  { name: "기타", value: "etc", icon: <MoreHorizIcon /> },
];

// 탭 선택 옵션 (전체, 위의 옵션들, 건의)
export const TAB_SELECT_OPTIONS = [
  { name: "전체", value: "all", icon: <AllInclusiveIcon /> },
  ...WRITE_SELECT_OPTIONS,
  { name: "건의", value: "suggestion", icon: <FeedbackIcon /> },
];

// 기본 선택 옵션은 기존과 동일하게 사용할 수 있습니다.
export const DEFAULT_SELECT_OPTION = WRITE_SELECT_OPTIONS[0]["name"];
export type WRITE_SELECT_OPTION_TYPE = (typeof WRITE_SELECT_OPTIONS)[number]["value"];

interface ApiResponse {
  results: any[];
  total: number;
}

// 검색 파라미터 타입 (SearchBar에서 전달받은 객체)
// 여기서 type은 검색 옵션(예: title, content, author 등)을 의미합니다.
interface SearchParams {
  type: string;
  query: string;
}

const MainViewClientBackUp = (): ReactNode => {
  const Router = useRouter();
  const urlSearchParams = useSearchParams();

  // URL에 있는 category를 초기 상태로 설정
  const initialCategory = urlSearchParams?.get("category") || "all";
  const [value, setValue] = useState(initialCategory);

  const { data: user } = useSession();
  const { currentPage, setCurrentPage } = usePageStore();
  const viewCount: number = TABLE_VIEW_COUNT;

  // 기존 데이터를 유지 (로딩 중에도 화면에 표시)
  const [previousData, setPreviousData] = useState<ApiResponse | null>(null);
  // SearchBar에서 전달받은 검색 옵션과 검색어
  const [searchParams, setSearchParams] = useState<SearchParams | null>(null);

  // 추천 랭킹 모드 활성화 상태 (기본: false)
  const [recommendRankingMode, setRecommendRankingMode] = useState(false);

  // URL 파라미터와 내부 상태 동기화
  useEffect(() => {
    const urlCategory = urlSearchParams?.get("category") || "all";
    setValue(urlCategory);

    const urlSearchType = urlSearchParams?.get("searchType");
    const urlSearchQuery = urlSearchParams?.get("searchQuery");
    const urlRecommend = urlSearchParams?.get("recommendRanking"); // URL에서 추천 랭킹 모드 확인

    if (urlSearchType && urlSearchQuery) {
      setSearchParams({ type: urlSearchType, query: urlSearchQuery });
    } else {
      setSearchParams(null);
    }
    // 추천 랭킹 모드 설정 (URL 파라미터가 "true"이면 활성화)
    setRecommendRankingMode(urlRecommend === "true");
    // 페이지 번호 초기화
    // setCurrentPage(1);
  }, [urlSearchParams, setCurrentPage]);

  /**
   * - 검색 파라미터(searchParams)가 있으면 검색 API를 호출합니다.
   *   이때 현재 탭(category)과 추천 랭킹 모드(recommendRankingMode), 최소 추천수(MIN_RECOMMEND_COUNT)를 함께 전송합니다.
   * - 검색 파라미터가 없으면 기존 페이지 데이터 API를 호출합니다.
   * ! queryKey의 변경이 useQuery 부르는 트리거
   */
  const { data, error, isLoading } = useQuery<ApiResponse>({
    queryKey: searchParams
      ? ["stories", value, currentPage, searchParams, recommendRankingMode]
      : ["stories", value, currentPage, recommendRankingMode],
    queryFn: async () => {
      // 공지사항이 첫 페이지에만 표시되는 것을 고려하여 오프셋 계산
      const offset = (currentPage - 1) * viewCount;

      // 기본 파라미터 객체 생성
      const params: any = {
        offset,
        limit: viewCount,
        category: value !== "all" ? value : undefined,
      };

      // 추천 랭킹 모드일 경우 최소 추천수 파라미터 추가
      if (recommendRankingMode) {
        params.minRecommend = MIN_RECOMMEND_COUNT;
      }

      // 검색 API 호출 (검색 파라미터가 있을 경우)
      if (searchParams && searchParams.query.trim() !== "") {
        params.type = searchParams.type;
        params.query = searchParams.query;
        // 검색 API 호출 – 현재 탭(value), 추천 랭킹 모드, 최소 추천수 모두 전송
        const response = await axios.get<ApiResponse>(`${process.env.NEXT_PUBLIC_BASE_URL}/api/story/search`, {
          params,
        });
        return response.data;
      }
      // 검색 파라미터가 없으면 기존 API 호출 (탭 필터 적용 + 추천 랭킹 모드 적용)
      const response = await axios.get<ApiResponse>(`${process.env.NEXT_PUBLIC_BASE_URL}/api/story/pageTableData`, {
        params,
      });
      return response.data;
    },
    // ... 나머지 옵션들
  });

  // 데이터 수신 시 이전 데이터를 업데이트 (로딩 중 기존 데이터 유지)
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
    setSearchParams(null);
    setValue(newValue);
    setCurrentPage(1);
    // 탭 변경 시 추천 랭킹 모드 초기화 (필요에 따라 유지할 수도 있음)
    setRecommendRankingMode(false);
    Router.push(`?category=${newValue}`, { scroll: false });
  };

  // 추천 랭킹 버튼 클릭 핸들러
  const toggleRecommendRanking = () => {
    // 추천 랭킹 모드를 토글하며 페이지 번호 초기화 및 URL 반영
    const newMode = !recommendRankingMode;
    setRecommendRankingMode(newMode);
    setCurrentPage(1);

    // URL 파라미터에 추천 랭킹 모드 반영 (검색 파라미터와 탭 정보 유지)
    const params = new URLSearchParams();
    params.set("category", value);
    if (searchParams) {
      params.set("searchType", searchParams.type);
      params.set("searchQuery", searchParams.query);
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

  /**
   * SearchBar에서 검색 옵션과 검색어를 전달받습니다.
   * - 검색 상태를 업데이트하고, URL에도 검색 관련 파라미터를 반영합니다.
   */
  const handleSearch = ({ category, query }: { category: string; query: string }) => {
    setSearchParams({ type: category, query });
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

  // 정렬된 데이터 생성
  const sortedTableData = useMemo(() => {
    if (!tableData) return [];

    console.log("tableData", tableData);

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
          {/* 추천 랭킹 버튼: 추천 랭킹 모드 활성화/비활성화 */}
          <Button
            variant="contained"
            startIcon={<EmojiEventsIcon sx={{ fontSize: 24, color: "rgba(255, 255, 255, 0.8)" }} />}
            sx={{
              backgroundImage: "linear-gradient(45deg, #ff9800, #f77d58)", // 오렌지~레드 그라데이션
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

export default MainViewClientBackUp;
