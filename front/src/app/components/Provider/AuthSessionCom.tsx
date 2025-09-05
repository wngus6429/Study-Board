"use client";
import { SessionProvider } from "next-auth/react";

type Props = {
  children: React.ReactNode;
};

//! - 역할: next-auth의 세션 컨텍스트를 애플리케이션 하위 컴포넌트에 제공하여
//*   로그인 상태(session)를 공유하고 인증 관련 훅(useSession 등)을 사용할 수 있게 합니다.
// - 이유: SessionProvider는 클라이언트에서 동작하는 컨텍스트를 사용하므로
//   파일 최상단에 "use client"를 두어 클라이언트 전용 컴포넌트로 명시해야 합니다.
// - 사용법: 상위 레이아웃이나 _app.tsx에서 <AuthSessionCom>{children}</AuthSessionCom> 형태로
//   감싸면 하위 컴포넌트에서 next-auth 훅을 바로 사용할 수 있습니다.
//* - 팁: 세션 자동 갱신이나 refetch 동작을 제어하고 싶으면 SessionProvider에
//*   옵션(session, refetchInterval 등)을 전달해서 조정할 수 있습니다.

export default function AuthSession({ children }: Props) {
  return <SessionProvider>{children}</SessionProvider>;
}
