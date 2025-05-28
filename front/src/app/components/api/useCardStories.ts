// hooks/useCardStories.ts
import { MIN_RECOMMEND_COUNT } from "@/app/const/VIEW_COUNT";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";

interface ApiResponse {
  results: any[];
  total: number;
}

interface UseCardStoriesProps {
  category: string;
  currentPage: number;
  searchParamsState: { type: string; query: string } | null;
  recommendRankingMode: boolean;
  viewCount: number;
  initialData: ApiResponse;
  viewMode: "table" | "card";
}

export const useCardStories = ({
  category,
  currentPage,
  searchParamsState,
  recommendRankingMode,
  viewCount,
  initialData,
  viewMode,
}: UseCardStoriesProps) => {
  return useQuery<ApiResponse>({
    // queryKey는 검색 옵션, 카테고리, 페이지, 추천 랭킹 모드 등에 따라 달라집니다.
    queryKey: searchParamsState
      ? ["stories", "cards", category, currentPage, searchParamsState, recommendRankingMode]
      : ["stories", "cards", category, currentPage, recommendRankingMode],
    // API 호출 함수 (axios를 사용하여 데이터 fetch)
    queryFn: async () => {
      console.log("카드 데이터 호출");
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
        const response = await axios.get<ApiResponse>(`${process.env.NEXT_PUBLIC_BASE_URL}/api/story/cardSearch`, {
          params,
        });
        return response.data;
      }
      // 검색 옵션이 없다면 기본 페이지 데이터 API 호출
      const response = await axios.get<ApiResponse>(`${process.env.NEXT_PUBLIC_BASE_URL}/api/story/cardPageTableData`, {
        params,
      });
      return response.data;
    },
    // TODO 삭제 플래그 두고 true false로 하면 될거 같은데
    // 삭제시에는 staleTime 잠시 무효화 시켜서 바로 최신꺼 제거된거 받아오게끔
    enabled: viewMode === "card",
    refetchOnWindowFocus: false, // 윈도우 포커스 시 재요청 방지
  });
};
