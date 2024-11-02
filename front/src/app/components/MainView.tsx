/** @jsxImportSource @emotion/react */
"use client";
import { ReactNode, useState } from "react";
import CustomizedTables from "./CustomizedTables";
import axios from "axios";
import { useQuery } from "@tanstack/react-query";
import { Box, Button, Tab, Tabs } from "@mui/material";
// import HtmlTable from "./HtmlTable";
import { useLogin } from "../store";
import Loading from "./common/Loading";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import CreateIcon from "@mui/icons-material/Create";
import { TAB_SELECT_OPTIONS } from "../const/writeconsts";

const MainView = (): ReactNode => {
  const Router = useRouter();
  // const { loginState } = useLogin((state) => state);
  const [value, setValue] = useState("all");

  const handleChange = (event: React.SyntheticEvent, newValue: string) => {
    setValue(newValue);
  };
  const { data: user, status } = useSession();
  const { data, error, isLoading, refetch } = useQuery({
    queryKey: ["stories"],
    queryFn: async () => {
      return await axios.get(`${process.env.NEXT_PUBLIC_BASE_URL}/api/story/getall`).then((res) => res.data);
    },
  });

  const moveWrite = () => {
    Router.push("/write");
  };

  // useEffect(() => {
  //   setLoginSuccess(true);
  // }, [loginState]);

  if (isLoading) return <Loading />;
  if (error) return <div>Error: {(error as Error).message}</div>;

  return (
    <>
      <div style={{ display: "flex" }}>
        <div style={{ width: "100%" }}>
          <Box>
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
          <CustomizedTables tableData={data} />
          {user?.user && (
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <Button variant="outlined" onClick={moveWrite} color="success">
                <CreateIcon />
                글쓰기
              </Button>
            </div>
          )}
        </div>
      </div>
      {/* <HtmlTable tableData={data} /> */}
    </>
  );
};

export default MainView;
