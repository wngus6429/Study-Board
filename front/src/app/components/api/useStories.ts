// hooks/useStories.ts
import { MIN_RECOMMEND_COUNT } from "@/app/const/VIEW_COUNT";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
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
  initialData?: ApiResponse;
  viewMode: "table" | "card";
  channelId?: number; // 채널 페이지에서 사용할 때 필요
}

export const useStories = ({
  category,
  currentPage,
  searchParamsState,
  recommendRankingMode,
  viewCount,
  initialData,
  viewMode,
  channelId,
}: UseStoriesProps) => {
  return useQuery<ApiResponse>({
    // queryKey는 검색 옵션, 카테고리, 페이지, 추천 랭킹 모드, 채널 ID 등에 따라 달라집니다.
    queryKey: searchParamsState
      ? ["stories", category, currentPage, searchParamsState, recommendRankingMode, channelId]
      : ["stories", category, currentPage, recommendRankingMode, channelId],
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
      // 채널 ID가 있으면 추가 (0은 제외하고 유효한 숫자만)
      if (channelId && channelId > 0) {
        params.channelId = channelId;
      }
      console.log("🔍 useStories API 호출 파라미터:", params, "원본 channelId:", channelId);
      // 추천 랭킹 모드가 활성화되면 최소 추천수 설정
      if (recommendRankingMode) {
        params.minRecommend = MIN_RECOMMEND_COUNT;
      }
      // 검색 옵션이 있다면 검색 API 호출
      if (searchParamsState && searchParamsState.query.trim() !== "") {
        params.type = searchParamsState.type;
        params.query = searchParamsState.query;
        // 검색 시에도 category 파라미터 전달 (전체가 아닌 경우에만)
        if (category !== "all") {
          params.category = category;
        }
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
    enabled: viewMode === "table" && (channelId === undefined || channelId > 0),
    // 서버에서 전달받은 초기 데이터를 사용하여 초기 렌더링 시 바로 데이터를 표시
    initialData: initialData,
    // 페이지네이션 깜빡임 방지: 채널 페이지에서는 항상 이전 데이터 유지
    placeholderData: keepPreviousData,
    // staleTime: 1000 * 30, // 30초간 데이터를 fresh로 간주 (페이지네이션 시 캐시 활용)
    refetchOnWindowFocus: false, // 윈도우 포커스 시 재요청 방지
  });
};
