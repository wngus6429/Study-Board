import { useState } from "react";
import { useSession } from "next-auth/react";
import adminApi, { AdminPermission } from "../api/adminApi";

/**
 * 관리자 기능을 위한 커스텀 훅
 */
export const useAdmin = () => {
  const { data: session } = useSession();
  const [isLoading, setIsLoading] = useState(false);

  const currentUser = session?.user || null;
  const isSuperAdmin = () => currentUser?.is_super_admin === true;
  const isChannelAdmin = (channelId?: number) => {
    if (!currentUser || !channelId) return false;
    // createdChannels 정보는 필요시 별도 API로 가져오도록 구현
    return false; // 임시로 false 반환
  };
  const hasAdminPermission = (channelId?: number) => {
    return isSuperAdmin() || isChannelAdmin(channelId);
  };

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
   * @param channelId 채널 ID (선택사항)
   * @returns 권한 표시 텍스트
   */
  const getAdminBadgeText = (channelId?: number): string => {
    if (isSuperAdmin()) return "총관리자";
    if (isChannelAdmin(channelId)) return "채널관리자";
    return "";
  };

  /**
   * 관리자 권한별 색상 반환
   * @param channelId 채널 ID (선택사항)
   * @returns 권한별 색상
   */
  const getAdminBadgeColor = (channelId?: number): "error" | "warning" | "default" => {
    if (isSuperAdmin()) return "error";
    if (isChannelAdmin(channelId)) return "warning";
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
