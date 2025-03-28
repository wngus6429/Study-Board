"use client";
import { ReactNode, useEffect, useState, useMemo } from "react";
import CustomizedTables from "./CustomizedTables";
import axios from "axios";
import { useQuery } from "@tanstack/react-query";
import { Box, Button, FormControl, MenuItem, Select, SelectChangeEvent, Tab, Tabs } from "@mui/material";
import Loading from "./common/Loading";
import { useSession } from "next-auth/react";
import CreateIcon from "@mui/icons-material/Create";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import Pagination from "./common/Pagination";
import usePageStore from "../store/pageStore";
import { MIN_RECOMMEND_COUNT, TABLE_VIEW_COUNT } from "../const/TABLE_VIEW_COUNT";
import { useRouter } from "next/navigation";
import SearchBar from "./common/SearchBar";
// MUI 아이콘 import
import ForumIcon from "@mui/icons-material/Forum";
import QuestionAnswerIcon from "@mui/icons-material/QuestionAnswer";
import InfoIcon from "@mui/icons-material/Info";
import RateReviewIcon from "@mui/icons-material/RateReview";
import CameraAltIcon from "@mui/icons-material/CameraAlt";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";
import AllInclusiveIcon from "@mui/icons-material/AllInclusive";
import FeedbackIcon from "@mui/icons-material/Feedback";

// 탭 선택 옵션 (게시글 작성 시 선택 가능한 옵션들)
export const WRITE_SELECT_OPTIONS = [
  { name: "잡담", value: "chat", icon: <ForumIcon /> },
  { name: "질문", value: "question", icon: <QuestionAnswerIcon /> },
  { name: "정보", value: "info", icon: <InfoIcon /> },
  { name: "리뷰", value: "review", icon: <RateReviewIcon /> },
  { name: "스샷", value: "screenshot", icon: <CameraAltIcon /> },
  { name: "기타", value: "etc", icon: <MoreHorizIcon /> },
];

// 전체 탭 옵션: '전체'와 위의 옵션들, '건의' 옵션 포함
export const TAB_SELECT_OPTIONS = [
  { name: "전체", value: "all", icon: <AllInclusiveIcon /> },
  ...WRITE_SELECT_OPTIONS,
  { name: "건의", value: "suggestion", icon: <FeedbackIcon /> },
];

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

/**
 * MainView 컴포넌트 (클라이언트 컴포넌트)
 * - 서버에서 전달받은 초기 데이터(initialData)와 초기 상태(카테고리, 페이지, 추천 랭킹 모드)를 기반으로 렌더링
 * - react-query를 사용하여 데이터 갱신 및 클라이언트 상호작용(탭 전환, 추천 랭킹, 검색 등)을 처리
 */
const MainView = ({
  initialData,
  initialCategory,
  initialCurrentPage,
  initialRecommendRankingMode,
  initialSortOrder,
}: MainViewProps): ReactNode => {
  console.log("initialData", initialData);
  // next/navigation의 useRouter를 통해 URL 이동 제어
  const Router = useRouter();
  // next-auth의 useSession을 사용해 사용자 로그인 정보를 가져옴
  const { data: user } = useSession();
  // 페이지 번호 관리를 위한 store (예: zustand)에서 currentPage와 setCurrentPage 가져오기
  const { currentPage, setCurrentPage } = usePageStore();

  // 서버에서 전달받은 초기 카테고리 값을 상태로 저장
  const [value, setValue] = useState(initialCategory);
  // 초기 페이지 번호를 store에 설정 (컴포넌트 마운트 시)
  useEffect(() => {
    setCurrentPage(initialCurrentPage);
  }, [initialCurrentPage, setCurrentPage]);

  // 한 페이지에 보여줄 게시글 수 상수
  const viewCount: number = TABLE_VIEW_COUNT;

  // SearchBar에서 전달받은 검색 옵션을 상태로 관리 (초기에는 null)
  const [searchParamsState, setSearchParamsState] = useState<{ type: string; query: string } | null>(null);
  // 추천 랭킹 모드 상태: 서버에서 받은 초기값 사용
  const [recommendRankingMode, setRecommendRankingMode] = useState(initialRecommendRankingMode);

  // react-query를 이용해 API를 호출합니다.
  // initialData를 hydration하여 클라이언트에서 첫 렌더링 시 사용합니다.
  const { data, error, isLoading } = useQuery<ApiResponse>({
    // queryKey는 검색 옵션, 카테고리, 페이지, 추천 랭킹 모드 등에 따라 달라집니다.
    queryKey: searchParamsState
      ? ["stories", value, currentPage, searchParamsState, recommendRankingMode]
      : ["stories", value, currentPage, recommendRankingMode],
    // API 호출 함수 (axios를 사용하여 데이터 fetch)
    queryFn: async () => {
      const offset = (currentPage - 1) * viewCount;
      // API 호출에 필요한 파라미터 설정
      const params: any = {
        offset,
        limit: viewCount,
        category: value !== "all" ? value : undefined,
      };
      // 추천 랭킹 모드가 활성화되면 최소 추천수 설정
      if (recommendRankingMode) {
        params.minRecommend = MIN_RECOMMEND_COUNT;
      }
      // 검색 옵션이 있다면 검색 API 호출
      if (searchParamsState && searchParamsState.query.trim() !== "") {
        params.type = searchParamsState.type;
        params.query = searchParamsState.query;
        const response = await axios.get<ApiResponse>(`${process.env.NEXT_PUBLIC_BASE_URL}/api/story/search`, {
          params,
        });
        return response.data;
      }
      // 검색 옵션이 없다면 기본 페이지 데이터 API 호출
      const response = await axios.get<ApiResponse>(`${process.env.NEXT_PUBLIC_BASE_URL}/api/story/pageTableData`, {
        params,
      });
      return response.data;
    },
    // 서버에서 전달받은 초기 데이터를 사용하여 초기 렌더링 시 바로 데이터를 표시
    initialData: initialData,
  });

  // 데이터 변경 시 이전 데이터를 유지하여 로딩 중에도 기존 데이터가 보이도록 함
  const [previousData, setPreviousData] = useState<ApiResponse | null>(initialData);
  useEffect(() => {
    if (data) {
      setPreviousData(data);
    }
  }, [data]);

  // 현재 보여줄 테이블 데이터와 총 게시글 수 계산
  const tableData = data?.results || previousData?.results || [];
  const total = data?.total || previousData?.total || 0;

  // 탭(카테고리) 변경 시 호출되는 함수
  const handleChange = (event: React.SyntheticEvent, newValue: string) => {
    // 탭 전환 시 검색 상태 초기화
    setSearchParamsState(null);
    // 선택한 탭 값 업데이트
    setValue(newValue);
    // 페이지 번호 초기화
    setCurrentPage(1);
    // 추천 랭킹 모드 초기화 (탭 변경 시 기본값으로)
    setRecommendRankingMode(false);
    // URL 업데이트 (예: 쿼리 파라미터 반영)
    Router.push(`?category=${newValue}`, { scroll: false });
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
    params.set("category", value);

    // 6. 만약 검색 조건(searchParamsState)이 있다면, 해당 검색 조건을 URL 파라미터에 추가합니다.
    //    여기서는 검색 옵션의 종류(type)와 검색어(query)를 각각 "searchType"과 "searchQuery"로 설정합니다.
    if (searchParamsState) {
      params.set("searchType", searchParamsState.type);
      params.set("searchQuery", searchParamsState.query);
    }

    // 7. 새로 반전된 추천 랭킹 모드(newMode)를 문자열로 변환하여 "recommendRanking" 파라미터에 설정합니다.
    //    URL 파라미터는 문자열이어야 하므로 toString()을 사용합니다.
    params.set("recommendRanking", newMode.toString());

    // 8. 구성한 URL 쿼리 파라미터를 사용해 URL을 업데이트합니다.
    //    Router.push를 사용하여 URL을 변경하며, { scroll: false } 옵션은 페이지 이동 시 스크롤 위치를 유지하도록 합니다.
    Router.push(`?${params.toString()}`, { scroll: false });
  };

  // 글쓰기 페이지로 이동하는 함수
  const moveWrite = () => {
    Router.push("/write");
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
    params.set("category", value);
    params.set("searchType", category);
    params.set("searchQuery", query);
    // 검색 시 추천 랭킹 모드도 반영
    params.set("recommendRanking", recommendRankingMode.toString());
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
    // URL 업데이트
    Router.push(`?${params.toString()}`, { scroll: false });
  };

  // sortedTableData를 만드는 useMemo 부분
  const sortedTableData = useMemo(() => {
    if (!tableData) return [];

    return [...tableData].sort((a, b) => {
      // 1) 공지 여부 비교, 공지는 항상 상위
      //    a가 공지이고 b는 공지가 아니면 a가 먼저(-1)
      if (a.isNotice && !b.isNotice) return -1;
      //    b가 공지이고 a는 공지가 아니면 b가 먼저(1)
      if (!a.isNotice && b.isNotice) return 1;

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
    });
  }, [tableData, sortOrder]);

  // 에러 발생 시 에러 메시지 표시
  if (error) return <div>Error: {(error as Error).message}</div>;

  return (
    <>
      {/* 탭 UI 영역 */}
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
          {/* 탭 옵션을 순회하며 각 Tab 컴포넌트 생성 */}
          {TAB_SELECT_OPTIONS.map((option) => (
            <Tab key={option.value} icon={option.icon} label={option.name} value={option.value} />
          ))}
        </Tabs>
      </Box>
      {/* 데이터 로딩 시 Loading 컴포넌트, 로딩이 완료되면 CustomizedTables에 정렬된 데이터 전달 */}
      {isLoading && !previousData ? <Loading /> : <CustomizedTables tableData={sortedTableData} />}

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
              backgroundImage: "linear-gradient(45deg, #ff9800, #f77d58)",
              color: "white",
              fontWeight: "bold",
              borderRadius: "8px",
              padding: "8px 16px",
              boxShadow: "0px 4px 10px rgba(0,0,0,0.2)",
              "&:hover": {
                backgroundImage: "linear-gradient(45deg, #e65100, #bf360c)",
              },
            }}
            onClick={toggleRecommendRanking}
          >
            추천 랭킹
          </Button>
        </Box>
        {/* 가운데 영역: 페이지네이션 */}
        <Box sx={{ display: "flex", justifyContent: "center", flex: 1 }}>
          <Pagination
            pageCount={Math.ceil(total / viewCount)}
            onPageChange={handlePageClick}
            currentPage={currentPage}
          />
        </Box>
        {/* 오른쪽 영역: 글쓰기 버튼 (로그인 상태인 경우) */}
        <Box sx={{ display: "flex", justifyContent: "flex-end", flex: 1 }}>
          {user?.user && (
            <Button variant="outlined" onClick={moveWrite} color="success">
              <CreateIcon />
              글쓰기
            </Button>
          )}
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
