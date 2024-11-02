import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import NavMenuBar from "./components/NavMenuBar";
import RQProvider from "./components/RQProvider";
import TopBar from "./components/TopBar";
import AuthSession from "./components/common/AuthSessionCom";
import Advertisement from "./components/common/Advertisement";

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
          <AuthSession>
            <div style={{ maxWidth: 1400, margin: "0 auto", padding: "0 20px" }}>
              {/* 상단 바 */}
              {/* TopBar의 높이와 동일하게 설정 */}
              <TopBar />
              <div style={{ display: "flex", height: "100vh" }}>
                {/* 왼쪽 네비게이션 */}
                <NavMenuBar />
                {/* 메인 콘텐츠: 중앙 정렬 */}
                <div style={{ flexGrow: 1, paddingLeft: "3px" }}>{children}</div>
                <div style={{ width: 200 }}>
                  <Advertisement />
                </div>
              </div>
            </div>
          </AuthSession>
        </RQProvider>
      </body>
    </html>
  );
}
