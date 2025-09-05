"use client";
import React, { useState } from "react";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

type Props = {
  children: React.ReactNode;
};

//! RQProvider (React Query Provider)
// - 역할: 애플리케이션 전역에서 React Query를 사용하기 위한 QueryClient를 생성하고
//   하위 컴포넌트에 제공(QueryClientProvider)합니다.
// - 위치: 클라이언트 전용 컴포넌트여야 하므로 파일 최상단에 "use client"가 필요합니다.
//! - 주요 설정 요약:
//   · refetchOnWindowFocus: 창 포커스 시 자동 재요청을 비활성화합니다.
//   · retry: 실패 시 자동 재시도를 끕니다(기본 3회 -> false로 변경).
//   · retryOnMount: 마운트 시 재시도 동작에 대한 설정입니다(프로젝트 요구에 맞게 조정).
//* - 구현 팁:
//   · QueryClient는 컴포넌트가 다시 렌더링되더라도 한 번만 생성되어야 하므로 useState로 생성합니다.
//   · 개발 편의성을 위해 ReactQueryDevtools를 사용하며, 환경변수(NEXT_PUBLIC_MODE)를
//     검사해 로컬 모드일 때만 열리도록 설정되어 있습니다.
//* 사용법 예시: 상위 레이아웃이나 _app.tsx에서 <RQProvider>{children}</RQProvider>로 감싸주세요.

function RQProvider({ children }: Props) {
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
      {/* 개발모드에서만 DevTools 보이게*/}
      <ReactQueryDevtools initialIsOpen={process.env.NEXT_PUBLIC_MODE === "local"} />
    </QueryClientProvider>
  );
}

export default RQProvider;
