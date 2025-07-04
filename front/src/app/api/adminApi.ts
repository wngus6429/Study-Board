import instance from "./axios";

// ═══════════════════════════════════════════════════════════════════════════════════════
// 🛡️ 관리자 전용 API 함수들
// ═══════════════════════════════════════════════════════════════════════════════════════

/**
 * 관리자 전용 게시글 관리 API
 */
export const adminStoryApi = {
  /**
   * 총 관리자 권한으로 게시글 강제 삭제
   * @param storyId 삭제할 게시글 ID
   * @returns Promise<void>
   */
  forceDeleteStory: async (storyId: number): Promise<void> => {
    const response = await instance.delete(`/api/story/admin/force-delete/${storyId}`);
    return response.data;
  },

  /**
   * 채널 관리자 권한으로 게시글 삭제
   * @param storyId 삭제할 게시글 ID
   * @returns Promise<void>
   */
  channelAdminDeleteStory: async (storyId: number): Promise<void> => {
    const response = await instance.delete(`/api/story/admin/channel-delete/${storyId}`);
    return response.data;
  },

  /**
   * 관리자 권한으로 여러 게시글 일괄 삭제
   * @param storyIds 삭제할 게시글 ID 목록
   * @returns Promise<{ deletedCount: number }>
   */
  batchDeleteStories: async (storyIds: number[]): Promise<{ deletedCount: number }> => {
    const response = await instance.delete("/api/story/admin/batch-delete", {
      data: { storyIds },
    });
    return response.data;
  },
};

/**
 * 관리자 전용 댓글 관리 API
 */
export const adminCommentApi = {
  /**
   * 총 관리자 권한으로 댓글 강제 삭제
   * @param commentId 삭제할 댓글 ID
   * @returns Promise<void>
   */
  forceDeleteComment: async (commentId: number): Promise<void> => {
    const response = await instance.delete(`/api/story/admin/comment/${commentId}/force-delete`);
    return response.data;
  },

  /**
   * 채널 관리자 권한으로 댓글 삭제
   * @param commentId 삭제할 댓글 ID
   * @returns Promise<void>
   */
  channelAdminDeleteComment: async (commentId: number): Promise<void> => {
    const response = await instance.delete(`/api/story/admin/comment/${commentId}/channel-delete`);
    return response.data;
  },

  /**
   * 관리자 권한으로 여러 댓글 일괄 삭제
   * @param commentIds 삭제할 댓글 ID 목록
   * @returns Promise<{ deletedCount: number }>
   */
  batchDeleteComments: async (commentIds: number[]): Promise<{ deletedCount: number }> => {
    const response = await instance.delete("/api/story/admin/comment/batch-delete", {
      data: { commentIds },
    });
    return response.data;
  },
};

/**
 * 관리자 권한 체크 타입 정의
 */
export interface AdminPermission {
  isSuperAdmin: boolean;
  isChannelAdmin: boolean;
  hasAnyAdminPermission: boolean;
}

/**
 * 관리자 전용 공통 함수들
 */
export const adminUtils = {
  /**
   * 관리자 권한에 따른 적절한 삭제 함수 선택
   * @param type 'story' | 'comment'
   * @param id 삭제할 아이템 ID
   * @param permission 관리자 권한 정보
   * @returns Promise<void>
   */
  deleteByPermission: async (type: "story" | "comment", id: number, permission: AdminPermission): Promise<void> => {
    if (permission.isSuperAdmin) {
      // 총 관리자는 강제 삭제
      if (type === "story") {
        return adminStoryApi.forceDeleteStory(id);
      } else {
        return adminCommentApi.forceDeleteComment(id);
      }
    } else if (permission.isChannelAdmin) {
      // 채널 관리자는 채널 관리자 삭제
      if (type === "story") {
        return adminStoryApi.channelAdminDeleteStory(id);
      } else {
        return adminCommentApi.channelAdminDeleteComment(id);
      }
    } else {
      throw new Error("관리자 권한이 없습니다.");
    }
  },

  /**
   * 관리자 권한에 따른 일괄 삭제 함수
   * @param type 'story' | 'comment'
   * @param ids 삭제할 아이템 ID 목록
   * @param permission 관리자 권한 정보
   * @returns Promise<{ deletedCount: number }>
   */
  batchDeleteByPermission: async (
    type: "story" | "comment",
    ids: number[],
    permission: AdminPermission
  ): Promise<{ deletedCount: number }> => {
    if (!permission.isSuperAdmin) {
      throw new Error("일괄 삭제는 총 관리자만 가능합니다.");
    }

    if (type === "story") {
      return adminStoryApi.batchDeleteStories(ids);
    } else {
      return adminCommentApi.batchDeleteComments(ids);
    }
  },
};

/**
 * 관리자 전용 훅을 위한 타입 정의
 */
export interface AdminDeleteOptions {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
  confirmMessage?: string;
}

export default {
  story: adminStoryApi,
  comment: adminCommentApi,
  utils: adminUtils,
};
