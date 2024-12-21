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

const MainView = (): ReactNode => {
  const Router = useRouter();
  const [value, setValue] = useState("all");

  const handleChange = (event: React.SyntheticEvent, newValue: string) => {
    setValue(newValue);
  };
  const { data: user } = useSession();

  const [currentPage, setCurrentPage] = useState(1); // 현재 페이지
  const viewCount = 2; // 조회수

  const [cursor, setCursor] = useState<number>(0); // 커서 상태 관리

  const { data, error, isLoading } = useQuery({
    queryKey: ["stories", currentPage],
    queryFn: async () => {
      const response = await axios.get(`${process.env.NEXT_PUBLIC_BASE_URL}/api/story/getall`, {
        params: {
          cursor: cursor || 0, // 커서 값이 없으면 0으로 초기화
          limit: viewCount,
        },
      });
      return response.data;
    },
    staleTime: 0,
  });

  const [stories, setStories] = useState<any[]>([]);

  console.log("data", data);

  useEffect(() => {
    if (data?.stories) {
      setStories((prevStories) => {
        if (currentPage === 1) {
          return data.stories; // 첫 페이지일 경우 초기화
        }
        return [...prevStories, ...data.stories]; // 기존 데이터에 추가
      });
      // 마지막 커서 업데이트
      const lastStory = data.stories[data.stories.length - 1];
      if (lastStory) {
        setCursor(lastStory.id);
      }
    }
  }, [data, currentPage]);

  useEffect(() => {
    if (data && data.length > 0) {
      setStories(data);
    }
  }, [data]);

  useEffect(() => {
    if (stories && stories.length > 0) {
      setCursor(stories[stories.length - 1].id);
    }
  }, [currentPage, stories]);

  const moveWrite = () => {
    Router.push("/write");
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
      <CustomizedTables
        tableData={stories || []} // 데이터가 없으면 빈 배열 전달
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        viewCount={viewCount}
      />
      {user?.user && (
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <Button variant="outlined" onClick={moveWrite} color="success">
            <CreateIcon />
            글쓰기
          </Button>
        </div>
      )}
    </>
  );
};

export default MainView;
