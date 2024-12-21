/** @jsxImportSource @emotion/react */
"use client";
import { ReactNode, useEffect, useState } from "react";
import CustomizedTables from "./CustomizedTables";
import axios from "axios";
import { useQuery } from "@tanstack/react-query";
import { Box, Button, Tab, Tabs } from "@mui/material";
// import HtmlTable from "./HtmlTable";
import Loading from "./common/Loading";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import CreateIcon from "@mui/icons-material/Create";
import { TAB_SELECT_OPTIONS } from "../const/WRITE_CONST";
import Pagination from "./common/Pagination";

const MainView = (): ReactNode => {
  const Router = useRouter();
  const [value, setValue] = useState("all");

  const handleChange = (event: React.SyntheticEvent, newValue: string) => {
    setValue(newValue);
  };
  const { data: user } = useSession();

  const [currentPage, setCurrentPage] = useState(1); // 현재 페이지

  const viewCount = 2; // 페이지당 데이터 수
  const [cursor, setCursor] = useState<number>(0); // 현재 커서 위치
  const [stories, setStories] = useState<any[]>([]); // 현재 페이지 데이터
  const [total, setTotal] = useState<number>(0); // 총 데이터 수

  const { data, error, isLoading } = useQuery({
    queryKey: ["stories", cursor], // cursor 기반으로 queryKey 설정
    queryFn: async () => {
      const response = await axios.get(`${process.env.NEXT_PUBLIC_BASE_URL}/api/story/pageTableData`, {
        params: { cursor, limit: viewCount },
      });
      return response.data;
    },
    staleTime: 0,
    enabled: cursor >= 0, // cursor가 유효할 때만 실행
  });

  useEffect(() => {
    if (data) {
      setStories(data.results); // 새로운 데이터로 교체
      setTotal(data.total); // 총 데이터 수 업데이트
    }
  }, [data]);

  useEffect(() => {
    const newCursor = currentPage > 1 ? stories[stories.length - 1]?.id : 0;
    setCursor(newCursor || 0); // 데이터가 없을 때 0으로 설정
  }, [currentPage]);

  const moveWrite = () => {
    Router.push("/write");
  };

  console.log("stories", stories);

  const handlePageClick = (selectedItem: { selected: number }) => {
    setCurrentPage(selectedItem.selected + 1); // 선택된 페이지 설정
  };

  if (isLoading) return <Loading />;
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
          sx={{ flexGrow: 1 }} // 부모의 너비를 채우도록 설정
        >
          {TAB_SELECT_OPTIONS.map((tab) => (
            <Tab key={tab.value} value={tab.value} label={tab.name} />
          ))}
        </Tabs>
      </Box>
      <CustomizedTables tableData={stories || []} />
      {user?.user && (
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "10px" }}>
          <Button variant="outlined" onClick={moveWrite} color="success">
            <CreateIcon />
            글쓰기
          </Button>
        </div>
      )}
      <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
        <Pagination
          pageCount={Math.ceil(total / viewCount)} // 총 페이지 계산
          onPageChange={handlePageClick}
          currentPage={currentPage}
        />
      </Box>
    </>
  );
};

export default MainView;
