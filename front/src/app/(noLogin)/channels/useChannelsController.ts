"use client";
// 채널 리스트 페이지 클라이언트 컴포넌트
import React, { useState, useEffect } from "react";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { useMessage } from "@/app/store/messageStore";

// API 함수들 import
import {
  getChannels,
  createChannel,
  uploadChannelImage,
  deleteChannel,
  deleteChannelImage,
  hideChannel,
  showChannel,
  Channel,
} from "@/app/api/channelsApi";

import { useTheme } from "@mui/material";
import { useRouter } from "next/navigation";
export interface ChannelsClientProps {
  initialChannels: Channel[];
  isDbDisconnected?: boolean;
}

interface ApiErrorLike {
  response?: {
    data?: {
      message?: string;
    };
  };
}

const getApiErrorMessage = (error: unknown, fallback: string) => {
  const apiError = error as ApiErrorLike;
  return apiError.response?.data?.message || fallback;
};

export default function useChannelsController({
  initialChannels,
  isDbDisconnected,
}: ChannelsClientProps) {
  const theme = useTheme();
  const router = useRouter();
  const handleChannelClick = (slug: string) => router.push(`/channels/${slug}`);
  const { data: session } = useSession();
  const { showMessage } = useMessage();
  const queryClient = useQueryClient();
  const getImageUrl = (link: string): string => {
    if (/^https?:\/\//i.test(link)) {
      return encodeURI(link);
    }

    const imagePath = link.startsWith("/") ? link : `/${link}`;
    return `${process.env.NEXT_PUBLIC_BASE_URL}${encodeURI(imagePath)}`;
  };

  // 관리자 권한 확인
  const isSuperAdmin = session?.user?.is_super_admin === true;

  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState<"default" | "popular" | "name">(
    "default",
  );

  // 채널 생성 모달 관련 상태
  const [openCreateDialog, setOpenCreateDialog] = useState(false);
  const [newChannelName, setNewChannelName] = useState("");
  const [newChannelSlug, setNewChannelSlug] = useState("");

  // 채널 생성 이미지 업로드 상태
  const [channelImageFile, setChannelImageFile] = useState<File | null>(null);
  const [channelImagePreview, setChannelImagePreview] = useState<string | null>(
    null,
  );

  // 기존 채널 이미지 수정 관련 상태
  const [editChannelId, setEditChannelId] = useState<number | null>(null);
  const [openEditImageDialog, setOpenEditImageDialog] = useState(false);
  const [editImageFile, setEditImageFile] = useState<File | null>(null);
  const [editImagePreview, setEditImagePreview] = useState<string | null>(null);

  // 채널 삭제 확인 모달 상태
  const [deleteTargetChannel, setDeleteTargetChannel] =
    useState<Channel | null>(null);
  const [openDeleteConfirmDialog, setOpenDeleteConfirmDialog] = useState(false);

  // 채널 목록 조회 쿼리 - 초기 데이터 사용
  const {
    data: channels = initialChannels,
    isLoading,
    isError,
    error,
  } = useQuery<Channel[]>({
    queryKey: ["channels"],
    queryFn: getChannels,
    initialData: initialChannels,
    // DB 끊김 상태면 refetch를 막아 불필요한 요청 방지
    enabled: !isDbDisconnected,
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnReconnect: !isDbDisconnected,
    refetchOnWindowFocus: !isDbDisconnected,
    retry: isDbDisconnected ? false : 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  // 채널 생성 mutation
  const createChannelMutation = useMutation({
    mutationFn: ({
      channelName,
      slug,
    }: {
      channelName: string;
      slug: string;
    }) => createChannel(channelName, slug),
    onSuccess: async (data) => {
      // 채널 생성 후 이미지가 있으면 업로드
      if (channelImageFile && data.channel) {
        try {
          await uploadChannelImage(data.channel.id, channelImageFile);
          showMessage("채널과 이미지가 성공적으로 생성되었습니다!", "success");
        } catch (imageError: unknown) {
          console.error("채널 이미지 업로드 실패:", imageError);
          showMessage(
            "채널은 생성되었지만 이미지 업로드에 실패했습니다.",
            "warning",
          );
        }
      } else {
        showMessage("채널이 성공적으로 생성되었습니다!", "success");
      }

      // 상태 초기화
      setOpenCreateDialog(false);
      setNewChannelName("");
      setNewChannelSlug("");
      setChannelImageFile(null);
      setChannelImagePreview(null);

      // 채널 목록 다시 불러오기
      await queryClient.invalidateQueries({ queryKey: ["channels"] });
      await queryClient.refetchQueries({ queryKey: ["channels"] });
    },
    onError: (error: unknown) => {
      console.error("채널 생성 실패:", error);
      const errorMessage = getApiErrorMessage(
        error,
        "채널 생성에 실패했습니다.",
      );
      showMessage(errorMessage, "error");
    },
  });

  // 기존 채널 이미지 업로드 mutation
  const uploadExistingChannelImageMutation = useMutation({
    mutationFn: ({
      channelId,
      imageFile,
    }: {
      channelId: number;
      imageFile: File;
    }) => uploadChannelImage(channelId, imageFile),
    onSuccess: async () => {
      showMessage("채널 이미지가 업데이트되었습니다!", "success");
      setOpenEditImageDialog(false);
      setEditChannelId(null);
      setEditImageFile(null);
      setEditImagePreview(null);
      await queryClient.invalidateQueries({ queryKey: ["channels"] });
      await queryClient.refetchQueries({ queryKey: ["channels"] });
    },
    onError: (error: unknown) => {
      console.error("채널 이미지 업로드 실패:", error);
      const errorMessage = getApiErrorMessage(
        error,
        "이미지 업로드에 실패했습니다.",
      );
      showMessage(errorMessage, "error");
    },
  });

  // 기존 채널 이미지 삭제 mutation
  const deleteExistingChannelImageMutation = useMutation({
    mutationFn: (channelId: number) => deleteChannelImage(channelId),
    onSuccess: () => {
      showMessage("채널 이미지가 삭제되었습니다.", "success");
      setOpenEditImageDialog(false);
      setEditChannelId(null);
      setEditImageFile(null);
      setEditImagePreview(null);
      queryClient.invalidateQueries({ queryKey: ["channels"] });
    },
    onError: (error: unknown) => {
      console.error("채널 이미지 삭제 실패:", error);
      const errorMessage = getApiErrorMessage(
        error,
        "이미지 삭제에 실패했습니다.",
      );
      showMessage(errorMessage, "error");
    },
  });

  // 채널 숨김 처리 mutation
  const hideChannelMutation = useMutation({
    mutationFn: (channelId: number) => hideChannel(channelId),
    onSuccess: () => {
      showMessage("채널이 숨김 처리되었습니다!", "success");
      queryClient.invalidateQueries({ queryKey: ["channels"] });
    },
    onError: (error: unknown) => {
      console.error("채널 숨김 처리 실패:", error);
      const errorMessage = getApiErrorMessage(
        error,
        "채널 숨김 처리에 실패했습니다.",
      );
      showMessage(errorMessage, "error");
    },
  });

  // 채널 표시 처리 mutation
  const showChannelMutation = useMutation({
    mutationFn: (channelId: number) => showChannel(channelId),
    onSuccess: () => {
      showMessage("채널이 표시되었습니다!", "success");
      queryClient.invalidateQueries({ queryKey: ["channels"] });
    },
    onError: (error: unknown) => {
      console.error("채널 표시 처리 실패:", error);
      const errorMessage = getApiErrorMessage(
        error,
        "채널 표시 처리에 실패했습니다.",
      );
      showMessage(errorMessage, "error");
    },
  });

  // 채널 논리 삭제 mutation
  const deleteChannelMutation = useMutation({
    mutationFn: (channelId: number) => deleteChannel(channelId),
    onSuccess: async () => {
      showMessage("채널이 삭제되었습니다.", "success");
      setDeleteTargetChannel(null);
      setOpenDeleteConfirmDialog(false);
      await queryClient.invalidateQueries({ queryKey: ["channels"] });
      await queryClient.refetchQueries({ queryKey: ["channels"] });
    },
    onError: (error: unknown) => {
      console.error("채널 삭제 실패:", error);
      const errorMessage = getApiErrorMessage(
        error,
        "채널 삭제에 실패했습니다.",
      );
      showMessage(errorMessage, "error");
    },
  });

  // 에러 처리
  useEffect(() => {
    if (isError && !isDbDisconnected) {
      console.error("채널 목록 조회 실패:", error);
      showMessage("채널 목록을 불러오는데 실패했습니다.", "error");
    }
  }, [isError, error, showMessage, isDbDisconnected]);

  const visibleChannels = channels.filter(
    (channel) => !channel.is_hidden || isSuperAdmin,
  );
  const filteredChannels = visibleChannels.filter((channel) =>
    channel.channel_name
      .toLowerCase()
      .includes(searchQuery.trim().toLowerCase()),
  );
  if (sortOrder === "popular") {
    filteredChannels.sort(
      (a, b) => (b.subscriber_count || 0) - (a.subscriber_count || 0),
    );
  } else if (sortOrder === "name") {
    filteredChannels.sort((a, b) =>
      a.channel_name.localeCompare(b.channel_name, "ko"),
    );
  }

  // 채널 생성 핸들러
  const handleCreateChannel = () => {
    if (!session?.user) {
      showMessage("로그인이 필요합니다.", "warning");
      return;
    }
    setOpenCreateDialog(true);
  };

  // 채널 생성 확인 핸들러
  const handleConfirmCreate = () => {
    if (!newChannelName.trim()) {
      showMessage("채널 이름을 입력해주세요.", "warning");
      return;
    }

    if (newChannelName.trim().length < 2) {
      showMessage("채널 이름은 2글자 이상이어야 합니다.", "warning");
      return;
    }

    if (newChannelName.trim().length > 50) {
      showMessage("채널 이름은 50글자를 초과할 수 없습니다.", "warning");
      return;
    }

    if (!newChannelSlug.trim()) {
      showMessage("채널 URL(슬러그)를 입력해주세요.", "warning");
      return;
    }

    // 슬러그 유효성 검사 (영어, 숫자, 하이픈만 허용)
    const slugPattern = /^[a-z0-9-]+$/;
    if (!slugPattern.test(newChannelSlug.trim())) {
      showMessage(
        "채널 URL은 영어 소문자, 숫자, 하이픈(-)만 사용할 수 있습니다.",
        "warning",
      );
      return;
    }

    if (newChannelSlug.trim().length < 2) {
      showMessage("채널 URL은 2글자 이상이어야 합니다.", "warning");
      return;
    }

    if (newChannelSlug.trim().length > 30) {
      showMessage("채널 URL은 30글자를 초과할 수 없습니다.", "warning");
      return;
    }

    createChannelMutation.mutate({
      channelName: newChannelName.trim(),
      slug: newChannelSlug.trim().toLowerCase(),
    });
  };

  // 채널 생성 취소 핸들러
  const handleCancelCreate = () => {
    setOpenCreateDialog(false);
    setNewChannelName("");
    setNewChannelSlug("");
    setChannelImageFile(null);
    setChannelImagePreview(null);
  };

  // 채널 이미지 선택 핸들러
  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // 이미지 파일 타입 검증
      const validImageTypes = [
        "image/jpeg",
        "image/png",
        "image/gif",
        "image/webp",
      ];
      if (!validImageTypes.includes(file.type)) {
        showMessage(
          "이미지 파일만 업로드 가능합니다 (JPG, PNG, GIF, WEBP).",
          "error",
        );
        return;
      }

      // 파일 크기 검증 (20MB 제한)
      if (file.size > 20 * 1024 * 1024) {
        showMessage("파일 크기는 20MB를 초과할 수 없습니다.", "error");
        return;
      }

      setChannelImageFile(file);
      setChannelImagePreview(URL.createObjectURL(file));
    }
  };

  // 채널 이미지 제거 핸들러
  const handleRemoveImage = () => {
    setChannelImageFile(null);
    setChannelImagePreview(null);
  };

  // 기존 채널 이미지 수정 다이얼로그 열기
  const handleEditChannelImage = (channel: Channel) => {
    const isChannelCreator = session?.user?.id === channel.creator.id;
    if (!isSuperAdmin && !isChannelCreator) {
      showMessage(
        "채널 이미지를 수정할 권한이 없습니다. 총관리자 또는 채널 생성자만 가능합니다.",
        "warning",
      );
      return;
    }
    setEditChannelId(channel.id);
    setOpenEditImageDialog(true);
    setEditImageFile(null);
    setEditImagePreview(null);
  };

  // 기존 채널 이미지 수정 취소
  const handleCancelEditImage = () => {
    setOpenEditImageDialog(false);
    setEditChannelId(null);
    setEditImageFile(null);
    setEditImagePreview(null);
  };

  // 기존 채널 이미지 선택
  const handleEditImageChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      // 이미지 파일 타입 검증
      const validImageTypes = [
        "image/jpeg",
        "image/png",
        "image/gif",
        "image/webp",
      ];
      if (!validImageTypes.includes(file.type)) {
        showMessage(
          "이미지 파일만 업로드 가능합니다 (JPG, PNG, GIF, WEBP).",
          "error",
        );
        return;
      }

      // 파일 크기 검증 (20MB 제한)
      if (file.size > 20 * 1024 * 1024) {
        showMessage("파일 크기는 20MB를 초과할 수 없습니다.", "error");
        return;
      }

      setEditImageFile(file);
      setEditImagePreview(URL.createObjectURL(file));
    }
  };

  // 기존 채널 이미지 제거
  const handleRemoveEditImage = () => {
    setEditImageFile(null);
    setEditImagePreview(null);
  };

  // 기존 채널 이미지 업로드 확인
  const handleConfirmEditImage = () => {
    if (!editChannelId) return;

    if (editImageFile) {
      uploadExistingChannelImageMutation.mutate({
        channelId: editChannelId,
        imageFile: editImageFile,
      });
    }
  };

  // 기존 채널 이미지 삭제 확인
  const handleDeleteExistingImage = () => {
    if (!editChannelId) return;
    deleteExistingChannelImageMutation.mutate(editChannelId);
  };

  // 채널 숨김 처리 핸들러
  const handleHideChannel = (channel: Channel) => {
    // 권한 확인: 총관리자이거나 채널 생성자인 경우만 숨김 처리 가능
    const isChannelCreator = session?.user?.id === channel.creator.id;

    if (!isSuperAdmin && !isChannelCreator) {
      showMessage(
        "채널을 숨김 처리할 권한이 없습니다. 총관리자 또는 채널 생성자만 숨김 처리할 수 있습니다.",
        "warning",
      );
      return;
    }

    // 확인 다이얼로그 표시
    if (
      window.confirm(
        `정말로 "${channel.channel_name}" 채널을 숨김 처리하시겠습니까?\n\n숨김 처리된 채널은 일반 사용자에게 보이지 않습니다.`,
      )
    ) {
      hideChannelMutation.mutate(channel.id);
    }
  };

  // 채널 표시 핸들러
  const handleShowChannel = (channel: Channel) => {
    // 권한 확인: 총관리자 또는 채널 생성자 가능
    const isChannelCreator = session?.user?.id === channel.creator.id;
    if (!isSuperAdmin && !isChannelCreator) {
      showMessage(
        "채널을 표시할 권한이 없습니다. 총관리자 또는 채널 생성자만 가능합니다.",
        "warning",
      );
      return;
    }

    // 확인 다이얼로그 표시
    if (
      window.confirm(
        `정말로 "${channel.channel_name}" 채널을 표시하시겠습니까?\n\n숨김 해제 후 목록에 다시 노출됩니다.`,
      )
    ) {
      showChannelMutation.mutate(channel.id);
    }
  };

  // 채널 삭제 핸들러
  const handleDeleteChannel = (channel: Channel) => {
    const isChannelCreator = session?.user?.id === channel.creator.id;
    if (!isSuperAdmin && !isChannelCreator) {
      showMessage(
        "채널을 삭제할 권한이 없습니다. 총관리자 또는 채널 생성자만 가능합니다.",
        "warning",
      );
      return;
    }

    setDeleteTargetChannel(channel);
    setOpenDeleteConfirmDialog(true);
  };

  const handleConfirmDeleteChannel = () => {
    if (!deleteTargetChannel) return;
    deleteChannelMutation.mutate(deleteTargetChannel.id);
  };

  const handleCancelDeleteChannel = () => {
    if (deleteChannelMutation.isPending) return;
    setDeleteTargetChannel(null);
    setOpenDeleteConfirmDialog(false);
  };

  return {
    initialChannels,
    isDbDisconnected,
    theme,
    router,
    handleChannelClick,
    session,
    showMessage,
    queryClient,
    getImageUrl,
    isSuperAdmin,
    searchQuery,
    setSearchQuery,
    sortOrder,
    setSortOrder,
    openCreateDialog,
    setOpenCreateDialog,
    newChannelName,
    setNewChannelName,
    newChannelSlug,
    setNewChannelSlug,
    channelImageFile,
    setChannelImageFile,
    channelImagePreview,
    setChannelImagePreview,
    editChannelId,
    setEditChannelId,
    openEditImageDialog,
    setOpenEditImageDialog,
    editImageFile,
    setEditImageFile,
    editImagePreview,
    setEditImagePreview,
    deleteTargetChannel,
    setDeleteTargetChannel,
    openDeleteConfirmDialog,
    setOpenDeleteConfirmDialog,
    channels,
    isLoading,
    isError,
    error,
    createChannelMutation,
    uploadExistingChannelImageMutation,
    deleteExistingChannelImageMutation,
    hideChannelMutation,
    showChannelMutation,
    deleteChannelMutation,
    visibleChannels,
    filteredChannels,
    handleCreateChannel,
    handleConfirmCreate,
    handleCancelCreate,
    handleImageChange,
    handleRemoveImage,
    handleEditChannelImage,
    handleCancelEditImage,
    handleEditImageChange,
    handleRemoveEditImage,
    handleConfirmEditImage,
    handleDeleteExistingImage,
    handleHideChannel,
    handleShowChannel,
    handleDeleteChannel,
    handleConfirmDeleteChannel,
    handleCancelDeleteChannel,
  };
}
export type ChannelsController = ReturnType<typeof useChannelsController>;
