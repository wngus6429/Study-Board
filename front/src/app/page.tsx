// Home.tsx
// 이 파일은 Next.js App Router의 페이지 컴포넌트로, 기본적으로 서버 컴포넌트입니다.
import MainView from "./components/MainView";
import { MIN_RECOMMEND_COUNT, TABLE_VIEW_COUNT } from "./const/VIEW_COUNT";

export default async function Home({
  searchParams,
}: {
  // searchParams: URL 쿼리 파라미터 객체
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  // URL 쿼리 파라미터에서 초기 상태를 읽어옵니다.
  // category가 문자열이면 해당 값을, 없으면 "all"을 기본값으로 사용합니다.
  const category = typeof searchParams.category === "string" ? searchParams.category : "all";
  // page 파라미터가 있으면 숫자로 변환하여 사용, 없으면 1을 기본값으로 사용합니다.
  const currentPage = searchParams.page ? Number(searchParams.page) : 1;
  // recommendRanking 파라미터가 "true"이면 true, 아니면 false
  const recommendRankingMode = searchParams.recommendRanking === "true";

  // 검색 옵션을 위한 객체를 초기화합니다.
  const search: { type?: string; query?: string } = {};
  if (typeof searchParams.searchType === "string") {
    search.type = searchParams.searchType;
  }
  if (typeof searchParams.searchQuery === "string") {
    search.query = searchParams.searchQuery;
  }

  // API 호출에 필요한 공통 파라미터를 설정합니다.
  const viewCount = TABLE_VIEW_COUNT;
  const offset = (currentPage - 1) * viewCount;
  const params = new URLSearchParams();
  params.set("offset", offset.toString());
  params.set("limit", viewCount.toString());
  // category가 "all"이 아니면 API 파라미터에 포함
  if (category !== "all") {
    params.set("category", category);
  }
  // 추천 랭킹 모드가 활성화되어 있다면 최소 추천수 파라미터 추가
  if (recommendRankingMode) {
    params.set("minRecommend", MIN_RECOMMEND_COUNT.toString());
  }

  let apiUrl = "";
  // 검색 옵션이 있으면 검색 API를 호출
  if (search.type && search.query && search.query.trim() !== "") {
    params.set("type", search.type);
    params.set("query", search.query);
    apiUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/api/story/search?${params.toString()}`;
  } else {
    // 검색 옵션이 없으면 기본 페이지 데이터 API 호출
    apiUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/api/story/pageTableData?${params.toString()}`;
  }

  // 서버에서 fetch를 사용해 API 호출 후 초기 데이터를 가져옵니다.
  //! 아래 방법은 캐싱 전혀 안함, 테이블은 추가 수정 삭제가 많아서 캐싱 안한다.
  //* const res = await fetch(apiUrl, { cache: "no-store" });
  // Next.js의 새로운 fetch 기능은 서버 측에서 데이터를 캐싱할 수 있도록 도와줍니다.
  //! revalidate: 3는 응답 데이터를 3초 동안 캐싱하라는 의미입니다.
  //! 동작 방식
  // 1. 클라이언트가 페이지를 요청하면 Next.js 서버는 지정된 API에 fetch 요청을 보냅니다.
  // 2. 이때 받은 응답 데이터는 Next.js 서버에 캐싱
  // 3. 이후 3초 이내에 동일한 API URL에 대한 요청이 들어오면, Next.js 서버는 캐시된 데이터를 사용하여 클라이언트에 응답
  // 4. 3초가 지나면 캐시가 만료되고, 새로운 데이터를 가져오기 위해 백엔드에 다시 요청합니다.
  //! 장점
  //* 부하 감소: 많은 사용자가 5초 내에 페이지에 접근해도 백엔드에는 한 번만 요청되므로, 서버 부하를 줄일 수 있습니다.
  //* 빠른 응답: 캐시된 데이터로 인해 응답 속도가 빨라질 수 있습니다.
  const res = await fetch(apiUrl, { next: { revalidate: 5 } });
  const initialData = await res.json();

  function isSortOrder(value: any): value is "recent" | "view" | "recommend" {
    return value === "recent" || value === "view" || value === "recommend";
  }

  const sortOrder = isSortOrder(searchParams.sortOrder) ? searchParams.sortOrder : "recent";

  // const validSortOrders = ["recent", "view", "recommend"] as const;
  // type SortOrder = (typeof validSortOrders)[number];

  // const sortOrder: SortOrder = validSortOrders.includes(searchParams.sortOrder)
  //   ? (searchParams.sortOrder as SortOrder)
  //   : "recent";

  console.log("서버 컴포넌트에서의 로그: searchParams =", searchParams);

  return (
    <div style={{ backgroundColor: "white" }}>
      {/* 초기 데이터와 초기 상태(카테고리, 페이지, 추천 랭킹 모드)를 MainView에 전달 */}
      <MainView
        initialData={initialData}
        initialCategory={category}
        initialCurrentPage={currentPage}
        initialRecommendRankingMode={recommendRankingMode}
        initialSortOrder={sortOrder}
      />
    </div>
  );
}
