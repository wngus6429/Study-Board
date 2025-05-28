// hooks/useStories.ts
import { MIN_RECOMMEND_COUNT } from "@/app/const/VIEW_COUNT";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";

interface ApiResponse {
  results: any[];
  total: number;
}

interface UseStoriesProps {
  category: string;
  currentPage: number;
  searchParamsState: { type: string; query: string } | null;
  recommendRankingMode: boolean;
  viewCount: number;
  initialData: ApiResponse;
  viewMode: "table" | "card";
}

export const useStories = ({
  category,
  currentPage,
  searchParamsState,
  recommendRankingMode,
  viewCount,
  initialData,
  viewMode,
}: UseStoriesProps) => {
  return useQuery<ApiResponse>({
    // queryKey는 검색 옵션, 카테고리, 페이지, 추천 랭킹 모드 등에 따라 달라집니다.
    queryKey: searchParamsState
      ? ["stories", category, currentPage, searchParamsState, recommendRankingMode]
      : ["stories", category, currentPage, recommendRankingMode],
    // API 호출 함수 (axios를 사용하여 데이터 fetch)
    queryFn: async () => {
      console.log("테이블 데이터 호출");
      const offset = (currentPage - 1) * viewCount;
      // API 호출에 필요한 파라미터 설정
      const params: any = {
        offset,
        limit: viewCount,
        category: category !== "all" ? category : undefined,
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
    enabled: viewMode === "table",
    // 서버에서 전달받은 초기 데이터를 사용하여 초기 렌더링 시 바로 데이터를 표시
    initialData: initialData,
    refetchOnWindowFocus: false, // 윈도우 포커스 시 재요청 방지
  });
};
