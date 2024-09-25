import React, { ReactNode } from "react";
import CustomizedTables from "./CustomizedTables";
import axios from "axios";
import { useQuery } from "@tanstack/react-query";
import { CircularProgress } from "@mui/material";

const MainView = (): ReactNode => {
  const { data, error, isLoading } = useQuery({
    queryKey: ["stories"],
    queryFn: async () => {
      return await axios.get("http://localhost:9000/story/getall").then((res) => res.data);
    },
  });

  if (isLoading)
    return (
      <div style={{ display: "flex", justifyContent: "center", height: "100vh" }}>
        <CircularProgress />
      </div>
    );
  if (error) return <div>Error: {(error as Error).message}</div>;

  return (
    <div>
      <CustomizedTables tableData={data} />
    </div>
  );
};

export default MainView;
