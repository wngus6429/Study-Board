"use client";
import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useSubscriptionStore } from "@/app/store/subscriptionStore";

export default function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const { subscribedChannels, loading, loadSubscriptions, clearSubscriptions } = useSubscriptionStore();

  useEffect(() => {
    // 로그인된 상태이고, 아직 구독 정보를 로드하지 않았다면 로드
    if (status === "authenticated" && session?.user && !loading && subscribedChannels.length === 0) {
      console.log("🔄 사용자 로그인 감지 - 구독 정보를 자동으로 로드합니다.");
      loadSubscriptions();
    }

    // 로그아웃된 상태라면 구독 정보 초기화
    if (status === "unauthenticated") {
      console.log("🧹 로그아웃 감지 - 구독 정보를 초기화합니다.");
      clearSubscriptions();
    }
  }, [status, session?.user, loading, subscribedChannels.length, loadSubscriptions, clearSubscriptions]);

  return <>{children}</>;
}
