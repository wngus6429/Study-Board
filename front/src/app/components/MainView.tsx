/** @jsxImportSource @emotion/react */
"use client";
import { ReactNode, useEffect, useState } from "react";
import CustomizedTables from "./CustomizedTables";
import axios from "axios";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@mui/material";
import { useRouter } from "next/navigation";
import { css } from "@emotion/react";
import HtmlTable from "./HtmlTable";
import { useLogin } from "../store";
import CustomSnackBar from "./common/CustomSnackBar";
import Image from "next/image";
import Loading from "./common/Loading";

const MainView = (): ReactNode => {
  const Router = useRouter();
  const { loginState } = useLogin((state) => state);
  const [loginSuccess, setLoginSuccess] = useState(false);
  const { data, error, isLoading, refetch } = useQuery({
    queryKey: ["stories"],
    queryFn: async () => {
      return await axios.get(`${process.env.NEXT_PUBLIC_BASE_URL}/story/getall`).then((res) => res.data);
    },
  });

  console.log("화", `${process.env.NEXT_PUBLIC_BASE_URL}/story/getall`);
  const moveWrite = () => {
    Router.push("/write");
  };

  useEffect(() => {
    setLoginSuccess(true);
  }, [loginState]);

  if (isLoading) return <Loading />;
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
        <div style={{ width: "85%" }}>
          <CustomizedTables tableData={data} />
        </div>
        <div style={{ width: "15%" }}>
          <Image
            src="/assets/right.png"
            alt="Right Icon"
            width={190} // 원하는 너비로 설정
            height={300} // 원하는 높이로 설정
          />
          <Image
            src="/assets/right2.png"
            alt="Right Icon"
            width={190} // 원하는 너비로 설정
            height={280} // 원하는 높이로 설정
          />
        </div>
      </div>
      {/* <HtmlTable tableData={data} /> */}
    </>
  );
};

export default MainView;
