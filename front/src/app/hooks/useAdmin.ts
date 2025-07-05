import { useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import adminApi, { AdminPermission } from "../api/adminApi";

/**
 * 채널 관리자 권한 체크를 위한 인터페이스
 */
interface ChannelAdminCheckProps {
  channelId?: number;
  channelSlug?: string;
  creatorId?: string; // 채널 생성자 ID가 직접 전달된 경우
}

/**
 * 관리자 기능을 위한 커스텀 훅
 */
export const useAdmin = () => {
  const { data: session } = useSession();
  const [isLoading, setIsLoading] = useState(false);

  const currentUser = session?.user || null;
  const isSuperAdmin = () => currentUser?.is_super_admin === true;

  /**
   * 채널 관리자 권한 확인
   * @param channelIdOrOptions 채널 ID (기존 호환성) 또는 채널 정보 객체
   * @returns 채널 관리자 여부
   */
  const isChannelAdmin = useCallback(
    (channelIdOrOptions?: number | ChannelAdminCheckProps) => {
      if (!currentUser) return false;

      // 숫자가 전달된 경우 (기존 호환성)
      if (typeof channelIdOrOptions === "number") {
        // 기존 방식: 채널 ID만으로는 생성자 확인 불가
        return false;
      }

      // 객체가 전달된 경우
      const options = channelIdOrOptions as ChannelAdminCheckProps | undefined;

      // 생성자 ID가 직접 전달된 경우
      if (options?.creatorId) {
        return currentUser.id === options.creatorId;
      }

      // 채널 ID나 슬러그가 없으면 false
      if (!options?.channelId && !options?.channelSlug) {
        return false;
      }

      // 채널 정보를 통한 권한 확인은 별도 컴포넌트에서 처리
      return false;
    },
    [currentUser]
  );

  /**
   * 관리자 권한 확인 (총 관리자 또는 채널 관리자)
   * @param channelIdOrOptions 채널 ID (기존 호환성) 또는 채널 정보 객체
   * @returns 관리자 권한 여부
   */
  const hasAdminPermission = useCallback(
    (channelIdOrOptions?: number | ChannelAdminCheckProps) => {
      return isSuperAdmin() || isChannelAdmin(channelIdOrOptions);
    },
    [isChannelAdmin]
  );

  /**
   * 현재 사용자의 관리자 권한 정보 반환
   * @param channelId 채널 ID (선택사항)
   * @returns AdminPermission 객체
   */
  const getAdminPermission = (channelId?: number): AdminPermission => {
    const isSuperAdminValue = isSuperAdmin();
    const isChannelAdminValue = isChannelAdmin(channelId);

    return {
      isSuperAdmin: isSuperAdminValue,
      isChannelAdmin: isChannelAdminValue,
      hasAnyAdminPermission: isSuperAdminValue || isChannelAdminValue,
    };
  };

  /**
   * 게시글 삭제 (관리자 권한)
   * @param storyId 게시글 ID
   * @param channelId 채널 ID (선택사항)
   * @param onSuccess 성공 콜백
   * @param onError 에러 콜백
   */
  const deleteStory = async (
    storyId: number,
    channelId?: number,
    onSuccess?: () => void,
    onError?: (error: Error) => void
  ) => {
    try {
      setIsLoading(true);
      const permission = getAdminPermission(channelId);

      if (!permission.hasAnyAdminPermission) {
        throw new Error("관리자 권한이 없습니다.");
      }

      await adminApi.utils.deleteByPermission("story", storyId, permission);
      onSuccess?.();
    } catch (error) {
      const errorMessage = error instanceof Error ? error : new Error("알 수 없는 오류가 발생했습니다.");
      onError?.(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * 일괄 삭제 (총 관리자 전용)
   * @param type 'story' | 'comment'
   * @param ids 삭제할 아이템 ID 목록
   * @param onSuccess 성공 콜백
   * @param onError 에러 콜백
   */
  const batchDelete = async (
    type: "story" | "comment",
    ids: number[],
    onSuccess?: (deletedCount: number) => void,
    onError?: (error: Error) => void
  ) => {
    try {
      setIsLoading(true);
      const permission = getAdminPermission();

      if (!permission.isSuperAdmin) {
        throw new Error("일괄 삭제는 총 관리자만 가능합니다.");
      }

      const result = await adminApi.utils.batchDeleteByPermission(type, ids, permission);
      onSuccess?.(result.deletedCount);
    } catch (error) {
      const errorMessage = error instanceof Error ? error : new Error("알 수 없는 오류가 발생했습니다.");
      onError?.(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * 관리자 권한별 표시 텍스트 반환
   * @param channelIdOrOptions 채널 ID (기존 호환성) 또는 채널 정보 객체
   * @returns 권한 표시 텍스트
   */
  const getAdminBadgeText = (channelIdOrOptions?: number | ChannelAdminCheckProps): string => {
    if (isSuperAdmin()) return "총관리자";
    if (isChannelAdmin(channelIdOrOptions)) return "채널관리자";
    return "";
  };

  /**
   * 관리자 권한별 색상 반환
   * @param channelIdOrOptions 채널 ID (기존 호환성) 또는 채널 정보 객체
   * @returns 권한별 색상
   */
  const getAdminBadgeColor = (
    channelIdOrOptions?: number | ChannelAdminCheckProps
  ): "error" | "warning" | "default" => {
    if (isSuperAdmin()) return "error";
    if (isChannelAdmin(channelIdOrOptions)) return "warning";
    return "default";
  };

  return {
    // 권한 체크
    isSuperAdmin: isSuperAdmin(),
    isChannelAdmin,
    hasAdminPermission,
    getAdminPermission,

    // 관리자 정보
    currentUser,
    getAdminBadgeText,
    getAdminBadgeColor,

    // 삭제 기능
    deleteStory,
    batchDelete,

    // 상태
    isLoading,
  };
};

export default useAdmin;
