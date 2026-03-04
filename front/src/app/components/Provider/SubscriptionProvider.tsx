"use client";
import { useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useSubscriptionStore } from "@/app/store/subscriptionStore";

// - 역할: 로그인 상태에 따라 사용자의 '구독 목록'을 자동으로 로드하거나 초기화하는 전역 제공자입니다.
// - 사용되는 훅/스토어:
//   · useSession(): next-auth의 로그인 상태를 구독합니다.
//   · useSubscriptionStore(): zustand/로컬 스토어에서 구독 관련 액션(loadSubscriptions, clearSubscriptions)과 상태를 가져옵니다.
// - 동작 요약:
//*   1) 사용자가 인증된 상태(status === 'authenticated')이고 아직 구독 정보를 불러오지 않았다면
//      loadSubscriptions()를 호출해 구독 정보를 가져옵니다. 이 때 hasLoadedRef로 중복 호출을 방지합니다.
//*   2) 사용자가 로그아웃(status === 'unauthenticated')하면 clearSubscriptions()로 상태를 초기화합니다.
// - 이유/팁:
//   · Query나 API로 구독 정보를 가져올 때 컴포넌트 트리 어디에서나 한 번만 로드되도록 중앙에서 관리하는 것이 편리합니다.
//   · useRef를 사용해 마운트/언마운트 또는 리렌더에 의한 중복 로드를 방지합니다.
// - 엣지 케이스:
//   · 네트워크 실패 시 재시도 로직 필요(스토어 내에서 처리 권장).
//   · 멀티탭 동기화가 필요하면 localStorage/브로드캐스트 채널로 상태 동기화 고려.
// - 사용법: 상위 레이아웃이나 _app에 <SubscriptionProvider>{children}</SubscriptionProvider>로 감싸 주세요.

export default function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const { subscribedChannels, loading, loadSubscriptions, clearSubscriptions } = useSubscriptionStore();
  const hasLoadedRef = useRef(false);

  useEffect(() => {
    // 로그인된 상태이고, 아직 구독 정보를 로드하지 않았다면 로드
    if (
      status === "authenticated" &&
      session?.user &&
      !loading &&
      subscribedChannels.length === 0 &&
      !hasLoadedRef.current
    ) {
      console.log("🔄 사용자 로그인 감지 - 구독 정보를 자동으로 로드합니다.");
      hasLoadedRef.current = true;
      loadSubscriptions();
    }

    // 로그아웃된 상태라면 구독 정보 초기화
    if (status === "unauthenticated" && subscribedChannels.length > 0) {
      console.log("🧹 로그아웃 감지 - 구독 정보를 초기화합니다.");
      hasLoadedRef.current = false;
      clearSubscriptions();
    }
  }, [session?.user, subscribedChannels.length]);

  return <>{children}</>;
}
