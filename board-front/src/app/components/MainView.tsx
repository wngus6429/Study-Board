"use client";
import React, { ReactNode } from "react";
import CustomizedTables from "./CustomizedTables";
import axios from "axios";
import { useQuery } from "@tanstack/react-query";
import { Button, CircularProgress } from "@mui/material";
import { useRouter } from "next/navigation";

const MainView = (): ReactNode => {
  const Router = useRouter();
  const { data, error, isLoading, refetch } = useQuery({
    queryKey: ["stories"],
    queryFn: async () => {
      return await axios.get("http://localhost:9000/story/getall").then((res) => res.data);
    },
  });

  const moveWrite = () => {
    Router.push("/write");
  };

  if (isLoading)
    return (
      <div style={{ display: "flex", justifyContent: "center", height: "100vh" }}>
        <CircularProgress />
      </div>
    );
  if (error) return <div>Error: {(error as Error).message}</div>;

  return (
    <>
      <Button variant="outlined" onClick={moveWrite}>
        글쓰기
      </Button>
      <CustomizedTables tableData={data} />
    </>
  );
};

export default MainView;
