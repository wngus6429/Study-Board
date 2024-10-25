import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import NavMenuBar from "./components/NavMenuBar";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import RQProvider from "./components/RQProvider";
import NavBar from "@/app/components/NavBar";
import TopBar from "./components/TopBar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "NextJS, NestJS 게시판",
  description: "Generated by create next app",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <RQProvider>
          {/* 전체 레이아웃을 가로로 배치 */}
          <TopBar />
          <div style={{ display: "flex", height: "100vh" }}>
            {/* 왼쪽 네비게이션 */}
            <NavMenuBar />
            {/* 메인 콘텐츠: 오른쪽에 배치 */}
            <div style={{ flexGrow: 1, paddingLeft: "3px" }}>{children}</div>
          </div>
        </RQProvider>
      </body>
    </html>
  );
}
