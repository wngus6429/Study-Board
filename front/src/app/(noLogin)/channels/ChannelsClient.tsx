"use client";
// 채널 리스트 페이지 클라이언트 컴포넌트
import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardMedia,
  Grid,
  Button,
  TextField,
  InputAdornment,
  useTheme,
  Avatar,
  IconButton,
  Tooltip,
  CircularProgress,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import PeopleIcon from "@mui/icons-material/People";
import ArticleIcon from "@mui/icons-material/Article";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { useMessage } from "@/app/store/messageStore";
import Loading from "@/app/components/common/Loading";
// API 함수들 import
import { getChannels, createChannel, uploadChannelImage, deleteChannelImage, Channel } from "@/app/api/channelsApi";
import CreateChannelDialog from "@/app/components/common/ChannelDialog/CreateChannelDialog";
import EditChannelImageDialog from "@/app/components/common/ChannelDialog/EditChannelImageDialog";

interface ChannelsClientProps {
  initialChannels: Channel[];
}

const ChannelsClient = ({ initialChannels }: ChannelsClientProps) => {
  const theme = useTheme();
  const router = useRouter();
  const { data: session } = useSession();
  const { showMessage } = useMessage();
  const queryClient = useQueryClient();

  const [searchQuery, setSearchQuery] = useState("");

  // 채널 생성 모달 관련 상태
  const [openCreateDialog, setOpenCreateDialog] = useState(false);
  const [newChannelName, setNewChannelName] = useState("");
  const [newChannelSlug, setNewChannelSlug] = useState("");

  // 채널 생성 이미지 업로드 상태
  const [channelImageFile, setChannelImageFile] = useState<File | null>(null);
  const [channelImagePreview, setChannelImagePreview] = useState<string | null>(null);

  // 기존 채널 이미지 수정 관련 상태
  const [editChannelId, setEditChannelId] = useState<number | null>(null);
  const [openEditImageDialog, setOpenEditImageDialog] = useState(false);
  const [editImageFile, setEditImageFile] = useState<File | null>(null);
  const [editImagePreview, setEditImagePreview] = useState<string | null>(null);

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
    // staleTime: 1000 * 60 * 5, // 5분간 캐시 유지
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  // 채널 생성 mutation
  const createChannelMutation = useMutation({
    mutationFn: ({ channelName, slug }: { channelName: string; slug: string }) => createChannel(channelName, slug),
    onSuccess: async (data) => {
      // 채널 생성 후 이미지가 있으면 업로드
      if (channelImageFile && data.channel) {
        try {
          await uploadChannelImage(data.channel.id, channelImageFile);
          showMessage("채널과 이미지가 성공적으로 생성되었습니다!", "success");
        } catch (imageError: any) {
          console.error("채널 이미지 업로드 실패:", imageError);
          showMessage("채널은 생성되었지만 이미지 업로드에 실패했습니다.", "warning");
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
      queryClient.invalidateQueries({ queryKey: ["channels"] });
    },
    onError: (error: any) => {
      console.error("채널 생성 실패:", error);
      const errorMessage = error.response?.data?.message || "채널 생성에 실패했습니다.";
      showMessage(errorMessage, "error");
    },
  });

  // 기존 채널 이미지 업로드 mutation
  const uploadExistingChannelImageMutation = useMutation({
    mutationFn: ({ channelId, imageFile }: { channelId: number; imageFile: File }) =>
      uploadChannelImage(channelId, imageFile),
    onSuccess: () => {
      showMessage("채널 이미지가 업데이트되었습니다!", "success");
      setOpenEditImageDialog(false);
      setEditChannelId(null);
      setEditImageFile(null);
      setEditImagePreview(null);
      queryClient.invalidateQueries({ queryKey: ["channels"] });
    },
    onError: (error: any) => {
      console.error("채널 이미지 업로드 실패:", error);
      const errorMessage = error.response?.data?.message || "이미지 업로드에 실패했습니다.";
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
    onError: (error: any) => {
      console.error("채널 이미지 삭제 실패:", error);
      const errorMessage = error.response?.data?.message || "이미지 삭제에 실패했습니다.";
      showMessage(errorMessage, "error");
    },
  });

  // 에러 처리
  useEffect(() => {
    if (isError) {
      console.error("채널 목록 조회 실패:", error);
      showMessage("채널 목록을 불러오는데 실패했습니다.", "error");
    }
  }, [isError, error, showMessage]);

  // 필터링된 채널 목록 (현재는 검색만 지원)
  const filteredChannels = channels.filter((channel) => {
    const matchesSearch = channel.channel_name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  // 채널 클릭 핸들러
  const handleChannelClick = (slug: string) => {
    router.push(`/channels/${slug}`);
  };

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
      showMessage("채널 URL은 영어 소문자, 숫자, 하이픈(-)만 사용할 수 있습니다.", "warning");
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
      const validImageTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
      if (!validImageTypes.includes(file.type)) {
        showMessage("이미지 파일만 업로드 가능합니다 (JPG, PNG, GIF, WEBP).", "error");
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
    if (channel.creator.id !== session?.user?.id) {
      showMessage("채널 생성자만 이미지를 수정할 수 있습니다.", "warning");
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
  const handleEditImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // 이미지 파일 타입 검증
      const validImageTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
      if (!validImageTypes.includes(file.type)) {
        showMessage("이미지 파일만 업로드 가능합니다 (JPG, PNG, GIF, WEBP).", "error");
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

  if (isLoading && !initialChannels.length) {
    return <Loading />;
  }

  return (
    <Box
      sx={{
        background:
          theme.palette.mode === "dark"
            ? "linear-gradient(135deg, rgba(26, 26, 46, 0.95), rgba(16, 16, 32, 0.98))"
            : "linear-gradient(135deg, #f8f9fa, #e9ecef)",
        padding: 3,
        paddingBottom: 6, // 하단에 여백 추가
      }}
    >
      {/* 헤더 */}
      <Box
        sx={{
          background: theme.palette.mode === "dark" ? "rgba(26, 26, 46, 0.95)" : "#ffffff",
          borderRadius: 3,
          padding: 3,
          marginBottom: 3,
          border: theme.palette.mode === "dark" ? "1px solid rgba(139, 92, 246, 0.4)" : "1px solid rgba(0, 0, 0, 0.1)",
          boxShadow:
            theme.palette.mode === "dark" ? "0px 8px 32px rgba(139, 92, 246, 0.3)" : "0px 4px 20px rgba(0, 0, 0, 0.1)",
        }}
      >
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
          <Typography
            variant="h4"
            sx={{
              color: theme.palette.mode === "dark" ? "#ffffff" : "#1a1a2e",
              fontWeight: "bold",
              textShadow: theme.palette.mode === "dark" ? "0 0 10px rgba(139, 92, 246, 0.5)" : "none",
            }}
          >
            채널 목록 ({channels.length}개)
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleCreateChannel}
            disabled={!session?.user || createChannelMutation.isPending}
            sx={{
              background:
                theme.palette.mode === "dark"
                  ? "linear-gradient(135deg, rgba(139, 92, 246, 0.8), rgba(6, 182, 212, 0.8))"
                  : "linear-gradient(135deg, #1976d2, #42a5f5)",
              "&:hover": {
                background:
                  theme.palette.mode === "dark"
                    ? "linear-gradient(135deg, rgba(139, 92, 246, 1), rgba(6, 182, 212, 1))"
                    : "linear-gradient(135deg, #1565c0, #1976d2)",
                transform: "translateY(-1px)",
              },
              "&:disabled": {
                background: theme.palette.mode === "dark" ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)",
                color: theme.palette.mode === "dark" ? "rgba(255, 255, 255, 0.3)" : "rgba(0, 0, 0, 0.3)",
              },
              boxShadow:
                theme.palette.mode === "dark"
                  ? "0 0 20px rgba(139, 92, 246, 0.4)"
                  : "0 4px 12px rgba(25, 118, 210, 0.3)",
              borderRadius: 2,
              px: 3,
            }}
          >
            {createChannelMutation.isPending ? <CircularProgress size={20} sx={{ color: "inherit" }} /> : "채널 만들기"}
          </Button>
        </Box>

        {/* 검색바 */}
        <TextField
          fullWidth
          placeholder="채널 검색..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: theme.palette.mode === "dark" ? "rgba(139, 92, 246, 0.7)" : "#666" }} />
              </InputAdornment>
            ),
          }}
          sx={{
            "& .MuiOutlinedInput-root": {
              backgroundColor: theme.palette.mode === "dark" ? "rgba(26, 26, 46, 0.8)" : "#f8f9fa",
              "& fieldset": {
                borderColor: theme.palette.mode === "dark" ? "rgba(139, 92, 246, 0.5)" : "rgba(0, 0, 0, 0.2)",
              },
              "&:hover fieldset": {
                borderColor: theme.palette.mode === "dark" ? "rgba(139, 92, 246, 0.8)" : "#1976d2",
              },
              "&.Mui-focused fieldset": {
                borderColor: theme.palette.mode === "dark" ? "rgba(139, 92, 246, 1)" : "#1976d2",
              },
            },
            "& .MuiOutlinedInput-input": {
              color: theme.palette.mode === "dark" ? "#ffffff" : "#1a1a2e",
              "&::placeholder": {
                color: theme.palette.mode === "dark" ? "rgba(255, 255, 255, 0.5)" : "rgba(0, 0, 0, 0.5)",
              },
            },
          }}
        />
      </Box>

      {/* 채널 카드 그리드 */}
      <Grid container spacing={3}>
        {filteredChannels.map((channel) => (
          <Grid item xs={12} sm={6} md={4} key={channel.id}>
            <Card
              sx={{
                height: "100%",
                background: theme.palette.mode === "dark" ? "rgba(26, 26, 46, 0.95)" : "#ffffff",
                border:
                  theme.palette.mode === "dark" ? "1px solid rgba(139, 92, 246, 0.3)" : "1px solid rgba(0, 0, 0, 0.1)",
                borderRadius: 3,
                overflow: "hidden",
                cursor: "pointer",
                transition: "all 0.3s ease-in-out",
                "&:hover": {
                  transform: "translateY(-4px)",
                  boxShadow:
                    theme.palette.mode === "dark"
                      ? "0px 12px 40px rgba(139, 92, 246, 0.4)"
                      : "0px 8px 30px rgba(0, 0, 0, 0.15)",
                  border:
                    theme.palette.mode === "dark"
                      ? "1px solid rgba(139, 92, 246, 0.6)"
                      : "1px solid rgba(25, 118, 210, 0.3)",
                },
              }}
              onClick={() => handleChannelClick(channel.slug)}
            >
              {/* 채널 이미지 */}
              <Box sx={{ position: "relative" }}>
                <CardMedia
                  component="div"
                  sx={{
                    height: 160,
                    background:
                      theme.palette.mode === "dark"
                        ? "linear-gradient(135deg, rgba(139, 92, 246, 0.3), rgba(6, 182, 212, 0.3))"
                        : "linear-gradient(135deg, #e3f2fd, #f3e5f5)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundImage: channel.ChannelImage?.link
                      ? `url(${process.env.NEXT_PUBLIC_BASE_URL}${channel.ChannelImage.link})`
                      : "none",
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    backgroundRepeat: "no-repeat",
                  }}
                >
                  {/* 이미지가 없으면 채널 이름 첫 글자 표시 */}
                  {!channel.ChannelImage?.link && (
                    <Typography
                      variant="h3"
                      sx={{
                        color: theme.palette.mode === "dark" ? "rgba(139, 92, 246, 0.8)" : "#1976d2",
                        fontWeight: "bold",
                      }}
                    >
                      {channel.channel_name.charAt(0)}
                    </Typography>
                  )}
                </CardMedia>

                {/* 편집 버튼 (채널 생성자만 보임) */}
                {session?.user?.id === channel.creator.id && (
                  <Box
                    sx={{
                      position: "absolute",
                      top: 8,
                      right: 8,
                      background: "rgba(0, 0, 0, 0.7)",
                      borderRadius: "50%",
                    }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Tooltip title="이미지 수정">
                      <IconButton size="small" onClick={() => handleEditChannelImage(channel)} sx={{ color: "white" }}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                )}
              </Box>

              {/* 채널 정보 */}
              <CardContent sx={{ flexGrow: 1, p: 2 }}>
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: "bold",
                    mb: 1,
                    color: theme.palette.mode === "dark" ? "#ffffff" : "#1a1a2e",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {channel.channel_name}
                </Typography>

                <Typography
                  variant="body2"
                  sx={{
                    color: theme.palette.mode === "dark" ? "rgba(255, 255, 255, 0.7)" : "text.secondary",
                    mb: 2,
                    height: 40,
                    overflow: "hidden",
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                  }}
                >
                  {channel.description || "채널 설명이 없습니다."}
                </Typography>

                {/* 통계 정보 */}
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <PeopleIcon
                      sx={{
                        fontSize: 16,
                        color: theme.palette.mode === "dark" ? "rgba(139, 92, 246, 0.8)" : "#1976d2",
                      }}
                    />
                    <Typography
                      variant="caption"
                      sx={{
                        color: theme.palette.mode === "dark" ? "rgba(255, 255, 255, 0.8)" : "text.secondary",
                        fontWeight: 500,
                      }}
                    >
                      {channel.subscriber_count || 0}
                    </Typography>
                  </Box>

                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <ArticleIcon
                      sx={{
                        fontSize: 16,
                        color: theme.palette.mode === "dark" ? "rgba(6, 182, 212, 0.8)" : "#42a5f5",
                      }}
                    />
                    <Typography
                      variant="caption"
                      sx={{
                        color: theme.palette.mode === "dark" ? "rgba(255, 255, 255, 0.8)" : "text.secondary",
                        fontWeight: 500,
                      }}
                    >
                      {channel.story_count || 0}
                    </Typography>
                  </Box>
                </Box>

                {/* 생성자 정보 */}
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 2 }}>
                  <Avatar
                    sx={{
                      width: 24,
                      height: 24,
                      fontSize: 12,
                      background:
                        theme.palette.mode === "dark"
                          ? "linear-gradient(135deg, rgba(139, 92, 246, 0.8), rgba(6, 182, 212, 0.8))"
                          : "linear-gradient(135deg, #1976d2, #42a5f5)",
                    }}
                  >
                    {channel.creator.nickname.charAt(0)}
                  </Avatar>
                  <Typography
                    variant="caption"
                    sx={{
                      color: theme.palette.mode === "dark" ? "rgba(255, 255, 255, 0.6)" : "text.secondary",
                      fontWeight: 500,
                    }}
                  >
                    {channel.creator.nickname}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* 채널 생성 다이얼로그 */}
      <CreateChannelDialog
        open={openCreateDialog}
        onClose={handleCancelCreate}
        channelName={newChannelName}
        onChannelNameChange={setNewChannelName}
        channelSlug={newChannelSlug}
        onChannelSlugChange={setNewChannelSlug}
        imageFile={channelImageFile}
        imagePreview={channelImagePreview}
        onImageChange={handleImageChange}
        onImageRemove={handleRemoveImage}
        onConfirm={handleConfirmCreate}
        createMutation={createChannelMutation}
      />

      {/* 기존 채널 이미지 수정 다이얼로그 */}
      <EditChannelImageDialog
        open={openEditImageDialog}
        onClose={handleCancelEditImage}
        imageFile={editImageFile}
        imagePreview={editImagePreview}
        onImageChange={handleEditImageChange}
        onImageRemove={handleRemoveEditImage}
        onConfirm={handleConfirmEditImage}
        onDeleteExisting={handleDeleteExistingImage}
        uploadMutation={uploadExistingChannelImageMutation}
        deleteMutation={deleteExistingChannelImageMutation}
      />
    </Box>
  );
};

export default ChannelsClient;
