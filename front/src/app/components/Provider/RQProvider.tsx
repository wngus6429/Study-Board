"use client";
import React, { useState } from "react";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

type Props = {
  children: React.ReactNode;
};

function RQProvider({ children }: Props) {
  // retry는 원래 리액트쿼리 요청이 실패하면 3번까지 재시도하는데,
  // 이를 막기 위해 retry: false로 설정
  // react-query 전역 설정
  const [client] = useState(
    new QueryClient({
      defaultOptions: {
        queries: {
          refetchOnWindowFocus: false,
          retryOnMount: true,
          refetchOnReconnect: false,
          retry: false,
        },
      },
    })
  );

  return (
    <QueryClientProvider client={client}>
      {children}
      {/* 데브툴 기본으로 띄워둘지?, 개발모드에서만 */}
      <ReactQueryDevtools initialIsOpen={process.env.NEXT_PUBLIC_MODE === "local"} />
    </QueryClientProvider>
  );
}

export default RQProvider;
