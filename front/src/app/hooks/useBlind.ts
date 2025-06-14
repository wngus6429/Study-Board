import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { getBlindUsers } from "../api/blind";
import { useBlindStore } from "../store/blindStore";

export const useBlind = () => {
  const { data: session } = useSession();
  const { setBlindUsers, isUserBlinded } = useBlindStore();

  // 로그인 시 블라인드 목록 자동 로드
  const { data: blindData } = useQuery({
    queryKey: ["blindUsers"],
    queryFn: () => getBlindUsers(1, 100), // 충분히 많은 수로 설정
    enabled: !!session?.user,
    staleTime: 5 * 60 * 1000, // 5분간 캐시
  });

  // 블라인드 목록이 변경되면 스토어 업데이트
  useEffect(() => {
    if (blindData?.items) {
      setBlindUsers(blindData.items);
    }
  }, [blindData?.items, setBlindUsers]);

  return {
    isUserBlinded,
    blindUsers: blindData?.items || [],
  };
};
