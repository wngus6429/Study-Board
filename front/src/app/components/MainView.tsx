/** @jsxImportSource @emotion/react */
"use client";
import { ReactNode, useEffect, useState } from "react";
import CustomizedTables from "./CustomizedTables";
import axios from "axios";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@mui/material";
import { css } from "@emotion/react";
import HtmlTable from "./HtmlTable";
import { useLogin } from "../store";
import CustomSnackBar from "./common/CustomSnackBar";
import Image from "next/image";
import Loading from "./common/Loading";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

const MainView = (): ReactNode => {
  const Router = useRouter();
  const { loginState } = useLogin((state) => state);
  const { data: session, status } = useSession();

  if (status === "authenticated") {
    console.log("로그인 성공:", session.user);
  } else {
    console.log("로그인 실패");
  }

  // const [loginSuccess, setLoginSuccess] = useState(false);
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
      <Button variant="outlined" onClick={moveWrite} color="success">
        글쓰기
      </Button>
      <div style={{ display: "flex" }}>
        <div style={{ width: "85%" }}>
          <CustomizedTables tableData={data} />
        </div>
        <div style={{ width: "15%" }}>
          <Image
            src="/assets/right.png"
            alt="Right Icon"
            width={0}
            height={0}
            sizes="100vw"
            style={{ width: "100%", height: "auto" }}
          />
          광고가 올자리
          {/* <Image
            src="/assets/right2.png"
            alt="Right Icon"
            width={0}
            height={0}
            sizes="100vw"
            style={{ width: "100%", height: "auto" }}
          /> */}
        </div>
      </div>
      {/* <HtmlTable tableData={data} /> */}
    </>
  );
};

export default MainView;
