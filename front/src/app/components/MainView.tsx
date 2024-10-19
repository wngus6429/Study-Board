/** @jsxImportSource @emotion/react */
"use client";
import React, { ReactNode, useEffect, useState } from "react";
import CustomizedTables from "./CustomizedTables";
import axios from "axios";
import { useQuery } from "@tanstack/react-query";
import { Alert, Box, Button, CircularProgress, Snackbar } from "@mui/material";
import { useRouter } from "next/navigation";
import { css } from "@emotion/react";
import HtmlTable from "./HtmlTable";
import useStore from "../store";
import CustomSnackBar from "./common/CustomSnackBar";
import Image from "next/image";

const MainView = (): ReactNode => {
  const Router = useRouter();
  const { loginState } = useStore((state) => state);
  const [loginSuccess, setLoginSuccess] = useState(false);
  const { data, error, isLoading, refetch } = useQuery({
    queryKey: ["stories"],
    queryFn: async () => {
      return await axios.get("http://localhost:9000/story/getall").then((res) => res.data);
    },
  });

  const moveWrite = () => {
    Router.push("/write");
  };

  useEffect(() => {
    setLoginSuccess(true);
  }, [loginState]);

  if (isLoading)
    return (
      <div
        css={css`
          display: "flex";
          justify-content: "center";
          height: "100vh";
        `}
      >
        <CircularProgress />
      </div>
    );
  if (error) return <div>Error: {(error as Error).message}</div>;

  return (
    <>
      {loginState && (
        <CustomSnackBar open={loginSuccess} setOpen={setLoginSuccess} message="로그인 성공" severity="success" />
      )}
      <Button variant="outlined" onClick={moveWrite} color="success">
        글쓰기
      </Button>
      <Button variant="outlined" onClick={() => Router.push("/login")} color="error">
        로그인
      </Button>
      <Button variant="outlined" onClick={() => Router.push("/signup")}>
        회원가입
      </Button>
      <div style={{ display: "flex" }}>
        <div style={{ width: "80%" }}>
          <CustomizedTables tableData={data} />
        </div>
        <div style={{ width: "20%" }}>
          <Image src="/assets/right.jpeg" alt="Description of image" width={500} height={300} />
        </div>
      </div>
      {/* <HtmlTable tableData={data} /> */}
    </>
  );
};

export default MainView;
