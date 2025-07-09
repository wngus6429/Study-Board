"use client";
import { useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useSubscriptionStore } from "@/app/store/subscriptionStore";

export default function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const { subscribedChannels, loading, loadSubscriptions, clearSubscriptions, isInitialized } = useSubscriptionStore();
  const hasLoadedRef = useRef(false);

  useEffect(() => {
    // 로그인된 상태이고, 아직 구독 정보를 로드하지 않았다면 로드
    if (
      status === "authenticated" &&
      session?.user &&
      !loading &&
      !isInitialized && // 🔥 변경: subscribedChannels.length === 0 대신 isInitialized 사용
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
  }, [status, session?.user, loading, isInitialized]); // 🔥 변경: 의존성 배열에서 subscribedChannels.length 제거

  return <>{children}</>;
}
