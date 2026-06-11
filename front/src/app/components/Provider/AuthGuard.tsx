"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Loading from "@/app/components/common/Loading";
import { useAuthUiStore } from "@/app/store/authUiStore";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { status } = useSession();
  const hasLocalLogout = useAuthUiStore((state) => state.hasLocalLogout);
  const shouldRedirectToLogin = status === "unauthenticated" || hasLocalLogout;

  useEffect(() => {
    if (shouldRedirectToLogin) {
      router.replace("/login");
    }
  }, [router, shouldRedirectToLogin]);

  if (status === "loading" || shouldRedirectToLogin) {
    return <Loading />;
  }

  return <>{children}</>;
}
