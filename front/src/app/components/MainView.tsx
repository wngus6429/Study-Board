"use client";
import { ReactNode, useEffect, useState } from "react";
import CustomizedTables from "./CustomizedTables";
import axios from "axios";
import { useQuery } from "@tanstack/react-query";
import { Box, Button, Tab, Tabs } from "@mui/material";
import Loading from "./common/Loading";
import { useSession } from "next-auth/react";
import CreateIcon from "@mui/icons-material/Create";
import { TAB_SELECT_OPTIONS } from "../const/WRITE_CONST";
import Pagination from "./common/Pagination";
import usePageStore from "../store/pageStore";
import { TABLE_VIEW_COUNT } from "../const/TABLE_VIEW_COUNT";
import { useRouter, useSearchParams } from "next/navigation"; // ✅ URL Query 활용

interface ApiResponse {
  results: any[];
  total: number;
}

const MainView = (): ReactNode => {
  const Router = useRouter();
  const searchParams = useSearchParams();

  // ✅ URL에서 category 값을 가져와 초기 상태로 설정
  const categoryFromUrl = searchParams?.get("category") || "all";
  const [value, setValue] = useState(categoryFromUrl);

  const { data: user } = useSession();
  const { currentPage, setCurrentPage } = usePageStore();
  const viewCount: number = TABLE_VIEW_COUNT;

  // ✅ 이전 데이터를 저장할 state 추가
  const [previousData, setPreviousData] = useState<ApiResponse | null>(null);

  const { data, error, isLoading } = useQuery<ApiResponse>({
    queryKey: ["stories", value, currentPage],
    queryFn: async () => {
      const offset = (currentPage - 1) * viewCount;
      const response = await axios.get<ApiResponse>(`${process.env.NEXT_PUBLIC_BASE_URL}/api/story/pageTableData`, {
        params: {
          offset,
          limit: viewCount,
          category: value !== "all" ? value : undefined,
        },
      });
      return response.data;
    },
    //! 최신글 작성, 삭제 때문에 캐쉬 두면 안됨
    // staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // ✅ 데이터가 업데이트될 때 previousData를 저장
  useEffect(() => {
    if (data) {
      setPreviousData(data);
    }
  }, [data]);

  // ✅ 로딩 중이면 기존 데이터를 유지
  const tableData = data?.results || previousData?.results || [];
  const total = data?.total || previousData?.total || 0;

  const handleChange = (event: React.SyntheticEvent, newValue: string) => {
    setValue(newValue);
    setCurrentPage(1); // 탭 변경 시 페이지 초기화
    Router.push(`?category=${newValue}`, { scroll: false }); // ✅ URL 업데이트 (replace 없이 push)
  };

  const moveWrite = () => {
    Router.push("/write");
  };

  const handlePageClick = (selectedItem: { selected: number }) => {
    const newPage = selectedItem.selected + 1;
    setCurrentPage(newPage);
  };

  if (error) return <div>Error: {(error as Error).message}</div>;

  return (
    <>
      <Box sx={{ width: "100%" }}>
        <Tabs
          value={value}
          onChange={handleChange}
          textColor="secondary"
          indicatorColor="secondary"
          aria-label="secondary tabs example"
          variant="scrollable"
          scrollButtons="auto"
          sx={{ flexGrow: 1 }}
        >
          {TAB_SELECT_OPTIONS.map((tab) => (
            <Tab key={tab.value} value={tab.value} label={tab.name} />
          ))}
        </Tabs>
      </Box>
      {isLoading && !previousData ? <Loading /> : <CustomizedTables tableData={tableData} />}
      {user?.user && (
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "10px" }}>
          <Button variant="outlined" onClick={moveWrite} color="success">
            <CreateIcon />
            글쓰기
          </Button>
        </div>
      )}
      <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
        <Pagination pageCount={Math.ceil(total / viewCount)} onPageChange={handlePageClick} currentPage={currentPage} />
      </Box>
    </>
  );
};

export default MainView;
