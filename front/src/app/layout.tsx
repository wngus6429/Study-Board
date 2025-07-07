// 전체 레이아웃을 정의 및 공통부분 처리
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import NavMenuBar from "./components/NavMenuBar";
import RQProvider from "./components/Provider/RQProvider";
import TopBar from "./components/TopBar";
import AuthSession from "./components/Provider/AuthSessionCom";
import MessageView from "./components/common/MessageView";
import RightView from "./components/common/RightView";
import SubscriptionProvider from "./components/Provider/SubscriptionProvider";
import style from "./layout.module.css";
import ScrollUpButton from "./components/common/ScrollUpButton";
import ThemeProvider from "./components/Provider/ThemeProvider";
import SitePasswordGate from "./components/Provider/SitePasswordGate";
import BrowserNotification from "./components/Provider/BrowserNotification";

const inter = Inter({ subsets: ["latin"] });

//! 서버 컴포넌트의 장점
//* 서버에서 HTML을 미리 렌더링하여 성능 최적화
//* 불필요한 JavaScript 클라이언트로 전송하지 않음 → 성능 향상
//* SEO 최적화 가능 → metadata 사용
//! 결론
//* ✅ 현재 RootLayout은 서버 컴포넌트로 동작하고 있음.
//* ✅ 클라이언트 컴포넌트들과 함께 조합하여 사용 중.
//* ✅ SEO 및 전역 레이아웃 설정에 적합한 구조.

// 이거는 서버컴포넌트만 가능하다
export const metadata: Metadata = {
  title: "Hobby Channel",
  description: "Hobby Channel 게시판",
  icons: {
    icon: "/assets/logo.png",
    apple: "/assets/logo.png",
  },
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
        <ThemeProvider>
          <RQProvider>
            <AuthSession>
              {/* <SitePasswordGate> */}
              <BrowserNotification>
                <SubscriptionProvider>
                  {/* 상단 바 */}
                  <TopBar />
                  <div className={style.main_container}>
                    <div className={style.content_wrapper}>
                      {/* 왼쪽 네비게이션 */}
                      <NavMenuBar />
                      {/* 메인 컨텐츠 */}
                      <div className={style.main_content}>{children}</div>
                      {/* 오른쪽 영역 */}
                      <div className={style.right_section}>
                        <RightView />
                      </div>
                    </div>
                    <MessageView />
                  </div>
                  <ScrollUpButton />
                </SubscriptionProvider>
              </BrowserNotification>
              {/* </SitePasswordGate> */}
            </AuthSession>
          </RQProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
