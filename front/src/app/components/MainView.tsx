"use client";
import { ReactNode, useEffect, useState } from "react";
import CustomizedTables from "./CustomizedTables";
import axios from "axios";
import { useQuery } from "@tanstack/react-query";
import { Box, Button, Tab, Tabs } from "@mui/material";
import Loading from "./common/Loading";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import CreateIcon from "@mui/icons-material/Create";
import { TAB_SELECT_OPTIONS } from "../const/WRITE_CONST";
import Pagination from "./common/Pagination";

const MainView = (): ReactNode => {
  const Router = useRouter();
  const [value, setValue] = useState("all");
  const { data: user } = useSession();
  const [currentPage, setCurrentPage] = useState(1);
  const viewCount = 3;

  // Keep track of all cursors for each page
  const [cursors, setCursors] = useState<Record<number, number>>({ 1: 0 });

  const { data, error, isLoading } = useQuery({
    queryKey: ["stories", currentPage, cursors[currentPage] ?? 0],
    queryFn: async () => {
      const response = await axios.get(`${process.env.NEXT_PUBLIC_BASE_URL}/api/story/pageTableData`, {
        params: {
          cursor: cursors[currentPage] ?? 0,
          limit: viewCount,
        },
      });
      return response.data;
    },
  });

  // Update cursors when new data is received
  useEffect(() => {
    if (data?.results?.length > 0) {
      const lastItem = data.results[data.results.length - 1];
      setCursors((prev) => ({
        ...prev,
        [currentPage + 1]: lastItem.id,
      }));
    }
  }, [data, currentPage]);

  const handleChange = (event: React.SyntheticEvent, newValue: string) => {
    setValue(newValue);
  };

  const moveWrite = () => {
    Router.push("/write");
  };

  const handlePageClick = (selectedItem: { selected: number }) => {
    const newPage = selectedItem.selected + 1;
    setCurrentPage(newPage);
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
          sx={{ flexGrow: 1 }}
        >
          {TAB_SELECT_OPTIONS.map((tab) => (
            <Tab key={tab.value} value={tab.value} label={tab.name} />
          ))}
        </Tabs>
      </Box>
      <CustomizedTables tableData={data?.results || []} />
      {user?.user && (
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "10px" }}>
          <Button variant="outlined" onClick={moveWrite} color="success">
            <CreateIcon />
            글쓰기
          </Button>
        </div>
      )}
      <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
        <Pagination
          pageCount={Math.ceil((data?.total || 0) / viewCount)}
          onPageChange={handlePageClick}
          currentPage={currentPage}
        />
      </Box>
    </>
  );
};

export default MainView;
