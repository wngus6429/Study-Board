// 전체 레이아웃을 정의 및 공통부분 처리
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import NavMenuBar from "./components/NavMenuBar";
import RQProvider from "./components/RQProvider";
import TopBar from "./components/TopBar";
import AuthSession from "./components/common/AuthSessionCom";
import MessageView from "./components/common/MessageView";
import RightView from "./components/common/RightView";
import style from "./layout.module.css";

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
    // 이거 alwaysScroll이라는 클래스를 만들어서 스크롤이 항상 보이게 설정, 아니면 스크롤 생기면 왼쪽으로 밀려나는 현상 발생
    <html lang="en" className="alwaysScroll">
      <body className={inter.className}>
        <RQProvider>
          <AuthSession>
            {/* 상단 바 */}
            <TopBar />
            <div style={{ width: "90%", maxWidth: "1600px", margin: "0 auto" }}>
              <div className={style.main_container}>
                <div className={style.nav_display}>
                  {/* 왼쪽 메뉴 */}
                  <NavMenuBar />
                </div>
                <div className={style.content_wrapper}>
                  {/* 가운데 데이터 */}
                  <div className={style.main_content}>{children}</div>
                  {/* 광고 및 댓글부분 */}
                  <div className={style.right_view}>
                    <RightView />
                  </div>
                </div>
                <MessageView />
              </div>
            </div>
          </AuthSession>
        </RQProvider>
      </body>
    </html>
  );
}
