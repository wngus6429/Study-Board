"use client";
// 채널 리스트 페이지
import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardMedia,
  Grid,
  Chip,
  Button,
  TextField,
  InputAdornment,
  useTheme,
  Avatar,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  CardActions,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import PeopleIcon from "@mui/icons-material/People";
import ArticleIcon from "@mui/icons-material/Article";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import AddIcon from "@mui/icons-material/Add";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import DeleteIcon from "@mui/icons-material/Delete";
import ImageIcon from "@mui/icons-material/Image";
import EditIcon from "@mui/icons-material/Edit";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { useMessage } from "@/app/store/messageStore";
// API 함수들 import
import { getChannels, createChannel, uploadChannelImage, deleteChannelImage, Channel } from "@/app/api/channelsApi";

// 카테고리는 일단 기본값으로 유지 (나중에 백엔드에서 카테고리 기능 추가할 수 있음)
const categories = ["전체"];

const ChannelsPage = () => {
  const theme = useTheme();
  const router = useRouter();
  const { data: session } = useSession();
  const { showMessage } = useMessage();
  const queryClient = useQueryClient();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("전체");

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

  // 채널 목록 조회 쿼리
  const {
    data: channels = [],
    isLoading,
    isError,
    error,
  } = useQuery<Channel[]>({
    queryKey: ["channels"],
    queryFn: getChannels,
    staleTime: 1000 * 60 * 5, // 5분간 캐시 유지
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
    // 추후 카테고리 기능 추가 시 사용
    // const matchesCategory = selectedCategory === "전체" || channel.category === selectedCategory;
    return matchesSearch;
  });

  // slug 자동 생성 함수
  const generateSlug = (name: string): string => {
    return (
      name
        .toLowerCase()
        .replace(/[^a-z0-9가-힣\s]/g, "") // 특수문자 제거
        .replace(/\s+/g, "-") // 공백을 하이픈으로
        .replace(/게임/g, "game")
        .replace(/개발/g, "dev")
        .replace(/프로그래밍/g, "programming")
        .replace(/애니메이션/g, "animation")
        .replace(/만화/g, "comic")
        .replace(/음식/g, "food")
        .replace(/요리/g, "cooking")
        .replace(/영화/g, "movie")
        .replace(/음악/g, "music")
        .replace(/스포츠/g, "sports")
        .replace(/뉴스/g, "news")
        .replace(/일반/g, "general")
        .replace(/자유/g, "free")
        .replace(/토론/g, "discussion") || `channel-${Date.now()}`
    );
  };

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

  // 로딩 상태
  if (isLoading) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          background:
            theme.palette.mode === "dark"
              ? "linear-gradient(135deg, rgba(26, 26, 46, 0.95), rgba(16, 16, 32, 0.98))"
              : "linear-gradient(135deg, #f8f9fa, #e9ecef)",
        }}
      >
        <CircularProgress
          size={60}
          sx={{
            color: theme.palette.mode === "dark" ? "rgba(139, 92, 246, 0.8)" : "#1976d2",
          }}
        />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background:
          theme.palette.mode === "dark"
            ? "linear-gradient(135deg, rgba(26, 26, 46, 0.95), rgba(16, 16, 32, 0.98))"
            : "linear-gradient(135deg, #f8f9fa, #e9ecef)",
        padding: 3,
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

                {/* 채널 소유자에게만 이미지 수정 버튼 표시 */}
                {session?.user?.id === channel.creator.id && (
                  <IconButton
                    onClick={(e) => {
                      e.stopPropagation(); // 카드 클릭 이벤트 방지
                      handleEditChannelImage(channel);
                    }}
                    sx={{
                      position: "absolute",
                      top: 8,
                      left: 8,
                      backgroundColor:
                        theme.palette.mode === "dark" ? "rgba(0, 0, 0, 0.7)" : "rgba(255, 255, 255, 0.9)",
                      color: theme.palette.mode === "dark" ? "#ffffff" : "#1976d2",
                      "&:hover": {
                        backgroundColor:
                          theme.palette.mode === "dark" ? "rgba(0, 0, 0, 0.8)" : "rgba(255, 255, 255, 1)",
                      },
                      backdropFilter: "blur(4px)",
                      border:
                        theme.palette.mode === "dark"
                          ? "1px solid rgba(139, 92, 246, 0.3)"
                          : "1px solid rgba(25, 118, 210, 0.2)",
                    }}
                    size="medium"
                  >
                    <EditIcon fontSize="medium" />
                  </IconButton>
                )}
                {/* HOT 기능은 추후 추가 가능 */}
                {channel.story_count > 50 && (
                  <Chip
                    icon={<TrendingUpIcon />}
                    label="HOT"
                    size="small"
                    sx={{
                      position: "absolute",
                      top: 8,
                      right: 8,
                      background: "linear-gradient(135deg, #ff6b6b, #ff8e53)",
                      color: "#ffffff",
                      fontWeight: "bold",
                    }}
                  />
                )}
              </Box>

              <CardContent sx={{ p: 2 }}>
                {/* 채널 이름 */}
                <Typography
                  variant="h6"
                  sx={{
                    color: theme.palette.mode === "dark" ? "#ffffff" : "#1a1a2e",
                    fontWeight: "bold",
                    mb: 1,
                    textShadow: theme.palette.mode === "dark" ? "0 0 5px rgba(139, 92, 246, 0.3)" : "none",
                  }}
                >
                  {channel.channel_name}
                </Typography>

                {/* 채널 설명 (추후 백엔드에 description 필드 추가 시 사용) */}
                <Typography
                  variant="body2"
                  sx={{
                    color: theme.palette.mode === "dark" ? "rgba(255, 255, 255, 0.7)" : "rgba(0, 0, 0, 0.6)",
                    mb: 2,
                    height: 40,
                    overflow: "hidden",
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                  }}
                >
                  {`${channel.creator?.nickname || "알수없음"}님이 만든 채널입니다.`}
                </Typography>

                {/* 통계 정보 */}
                <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                    <PeopleIcon
                      sx={{
                        fontSize: 16,
                        color: theme.palette.mode === "dark" ? "rgba(139, 92, 246, 0.7)" : "#666",
                      }}
                    />
                    <Typography
                      variant="caption"
                      sx={{
                        color: theme.palette.mode === "dark" ? "rgba(255, 255, 255, 0.6)" : "rgba(0, 0, 0, 0.6)",
                      }}
                    >
                      {channel.subscriber_count.toLocaleString()}
                    </Typography>
                  </Box>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                    <ArticleIcon
                      sx={{
                        fontSize: 16,
                        color: theme.palette.mode === "dark" ? "rgba(6, 182, 212, 0.7)" : "#666",
                      }}
                    />
                    <Typography
                      variant="caption"
                      sx={{
                        color: theme.palette.mode === "dark" ? "rgba(255, 255, 255, 0.6)" : "rgba(0, 0, 0, 0.6)",
                      }}
                    >
                      {channel.story_count.toLocaleString()}
                    </Typography>
                  </Box>
                </Box>

                {/* 채널 소유자와 생성 날짜 */}
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Avatar
                      sx={{
                        width: 20,
                        height: 20,
                        fontSize: "0.7rem",
                        background:
                          theme.palette.mode === "dark"
                            ? "linear-gradient(135deg, rgba(139, 92, 246, 0.8), rgba(6, 182, 212, 0.8))"
                            : "linear-gradient(135deg, #1976d2, #42a5f5)",
                      }}
                    >
                      {channel.creator?.nickname?.charAt(0) || "?"}
                    </Avatar>
                    <Typography
                      variant="caption"
                      sx={{
                        color: theme.palette.mode === "dark" ? "rgba(255, 255, 255, 0.6)" : "rgba(0, 0, 0, 0.6)",
                      }}
                    >
                      {channel.creator?.nickname || "알수없음"}
                    </Typography>
                  </Box>
                  <Typography
                    variant="caption"
                    sx={{
                      color: theme.palette.mode === "dark" ? "rgba(255, 255, 255, 0.5)" : "rgba(0, 0, 0, 0.5)",
                    }}
                  >
                    {new Date(channel.created_at).toLocaleDateString()}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* 검색 결과가 없을 때 */}
      {filteredChannels.length === 0 && !isLoading && (
        <Box
          sx={{
            textAlign: "center",
            py: 8,
            background: theme.palette.mode === "dark" ? "rgba(26, 26, 46, 0.95)" : "#ffffff",
            borderRadius: 3,
            border:
              theme.palette.mode === "dark" ? "1px solid rgba(139, 92, 246, 0.3)" : "1px solid rgba(0, 0, 0, 0.1)",
          }}
        >
          <Typography
            variant="h6"
            sx={{
              color: theme.palette.mode === "dark" ? "rgba(255, 255, 255, 0.6)" : "rgba(0, 0, 0, 0.6)",
              mb: 2,
            }}
          >
            {searchQuery ? "검색 결과가 없습니다" : "등록된 채널이 없습니다"}
          </Typography>
          <Typography
            variant="body2"
            sx={{
              color: theme.palette.mode === "dark" ? "rgba(255, 255, 255, 0.4)" : "rgba(0, 0, 0, 0.4)",
            }}
          >
            {searchQuery ? "다른 검색어를 시도해보세요" : "첫 번째 채널을 만들어보세요!"}
          </Typography>
        </Box>
      )}

      {/* 채널 생성 다이얼로그 */}
      <Dialog
        open={openCreateDialog}
        onClose={handleCancelCreate}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            background: theme.palette.mode === "dark" ? "rgba(26, 26, 46, 0.95)" : "#ffffff",
            border: theme.palette.mode === "dark" ? "1px solid rgba(139, 92, 246, 0.4)" : "none",
            boxShadow:
              theme.palette.mode === "dark"
                ? "0px 8px 32px rgba(139, 92, 246, 0.3)"
                : "0px 4px 20px rgba(0, 0, 0, 0.1)",
          },
        }}
      >
        <DialogTitle
          sx={{
            color: theme.palette.mode === "dark" ? "#ffffff" : "#1a1a2e",
            fontWeight: "bold",
            textShadow: theme.palette.mode === "dark" ? "0 0 10px rgba(139, 92, 246, 0.5)" : "none",
          }}
        >
          새 채널 만들기
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="채널 이름"
            type="text"
            fullWidth
            variant="outlined"
            value={newChannelName}
            onChange={(e) => setNewChannelName(e.target.value)}
            placeholder="채널 이름을 입력하세요 (2-50글자)"
            helperText={`${newChannelName.length}/50`}
            inputProps={{ maxLength: 50 }}
            sx={{
              mb: 2,
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
              "& .MuiInputLabel-root": {
                color: theme.palette.mode === "dark" ? "rgba(255, 255, 255, 0.7)" : "rgba(0, 0, 0, 0.6)",
              },
              "& .MuiOutlinedInput-input": {
                color: theme.palette.mode === "dark" ? "#ffffff" : "#1a1a2e",
              },
              "& .MuiFormHelperText-root": {
                color: theme.palette.mode === "dark" ? "rgba(255, 255, 255, 0.5)" : "rgba(0, 0, 0, 0.5)",
              },
            }}
          />

          {/* 채널 URL(슬러그) 입력 */}
          <Box sx={{ mb: 3 }}>
            <Box sx={{ display: "flex", gap: 1, alignItems: "end" }}>
              <TextField
                margin="dense"
                label="채널 URL (영문)"
                type="text"
                fullWidth
                variant="outlined"
                value={newChannelSlug}
                onChange={(e) => {
                  // 입력 시 자동으로 소문자 변환 및 유효 문자만 허용
                  const value = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "");
                  setNewChannelSlug(value);
                }}
                placeholder="예: my-channel, game-dev (2-30글자)"
                helperText={`${newChannelSlug.length}/30 • 영어 소문자, 숫자, 하이픈(-) 사용 가능`}
                inputProps={{ maxLength: 30 }}
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
                  "& .MuiInputLabel-root": {
                    color: theme.palette.mode === "dark" ? "rgba(255, 255, 255, 0.7)" : "rgba(0, 0, 0, 0.6)",
                  },
                  "& .MuiOutlinedInput-input": {
                    color: theme.palette.mode === "dark" ? "#ffffff" : "#1a1a2e",
                    fontFamily: "monospace",
                  },
                  "& .MuiFormHelperText-root": {
                    color: theme.palette.mode === "dark" ? "rgba(255, 255, 255, 0.5)" : "rgba(0, 0, 0, 0.5)",
                  },
                }}
              />
              <Button
                variant="outlined"
                onClick={() => setNewChannelSlug(generateSlug(newChannelName))}
                disabled={!newChannelName.trim()}
                sx={{
                  mb: 2.5,
                  minWidth: "auto",
                  px: 2,
                  color: theme.palette.mode === "dark" ? "rgba(139, 92, 246, 0.8)" : "#1976d2",
                  borderColor: theme.palette.mode === "dark" ? "rgba(139, 92, 246, 0.5)" : "rgba(25, 118, 210, 0.5)",
                  "&:hover": {
                    borderColor: theme.palette.mode === "dark" ? "rgba(139, 92, 246, 0.8)" : "#1976d2",
                    backgroundColor:
                      theme.palette.mode === "dark" ? "rgba(139, 92, 246, 0.1)" : "rgba(25, 118, 210, 0.05)",
                  },
                }}
              >
                자동생성
              </Button>
            </Box>
            <Typography
              variant="caption"
              sx={{
                color: theme.palette.mode === "dark" ? "rgba(255, 255, 255, 0.6)" : "rgba(0, 0, 0, 0.6)",
                display: "block",
                mt: 0.5,
              }}
            >
              URL: {process.env.NEXT_PUBLIC_BASE_URL?.replace(/^https?:\/\//, "") || "your-domain"}/channels/
              {newChannelSlug || "your-channel"}
            </Typography>
          </Box>

          {/* 채널 이미지 업로드 섹션 */}
          <Box sx={{ mt: 2 }}>
            <Typography
              variant="subtitle1"
              sx={{
                mb: 2,
                color: theme.palette.mode === "dark" ? "#ffffff" : "#1a1a2e",
                fontWeight: 600,
              }}
            >
              채널 대표 이미지 (선택사항)
            </Typography>

            {channelImagePreview ? (
              // 이미지 미리보기
              <Card
                sx={{
                  maxWidth: 500,
                  mb: 2,
                  margin: "0 auto",
                  background: theme.palette.mode === "dark" ? "rgba(26, 26, 46, 0.8)" : "#f8f9fa",
                  border:
                    theme.palette.mode === "dark"
                      ? "1px solid rgba(139, 92, 246, 0.3)"
                      : "1px solid rgba(0, 0, 0, 0.1)",
                }}
              >
                <CardMedia
                  component="img"
                  height="300"
                  image={channelImagePreview}
                  alt="채널 이미지 미리보기"
                  sx={{ objectFit: "cover" }}
                />
                <CardActions sx={{ justifyContent: "center", py: 1 }}>
                  <IconButton
                    color="error"
                    onClick={handleRemoveImage}
                    size="small"
                    sx={{
                      background: theme.palette.mode === "dark" ? "rgba(244, 67, 54, 0.1)" : "rgba(244, 67, 54, 0.05)",
                      "&:hover": {
                        background: theme.palette.mode === "dark" ? "rgba(244, 67, 54, 0.2)" : "rgba(244, 67, 54, 0.1)",
                      },
                    }}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </CardActions>
              </Card>
            ) : (
              // 이미지 업로드 버튼
              <Button
                component="label"
                variant="outlined"
                startIcon={<CloudUploadIcon />}
                sx={{
                  width: "100%",
                  height: 120,
                  display: "flex",
                  flexDirection: "column",
                  gap: 1,
                  borderStyle: "dashed",
                  borderWidth: 2,
                  borderColor: theme.palette.mode === "dark" ? "rgba(139, 92, 246, 0.5)" : "rgba(25, 118, 210, 0.5)",
                  backgroundColor:
                    theme.palette.mode === "dark" ? "rgba(139, 92, 246, 0.05)" : "rgba(25, 118, 210, 0.05)",
                  color: theme.palette.mode === "dark" ? "rgba(139, 92, 246, 0.8)" : "#1976d2",
                  "&:hover": {
                    borderColor: theme.palette.mode === "dark" ? "rgba(139, 92, 246, 0.8)" : "#1976d2",
                    backgroundColor:
                      theme.palette.mode === "dark" ? "rgba(139, 92, 246, 0.1)" : "rgba(25, 118, 210, 0.1)",
                  },
                  mb: 2,
                }}
              >
                <ImageIcon sx={{ fontSize: 40 }} />
                <Typography variant="body2">이미지 업로드 (JPG, PNG, GIF, WEBP - 최대 5MB)</Typography>
                <input type="file" hidden accept="image/*" onChange={handleImageChange} />
              </Button>
            )}

            <Typography
              variant="caption"
              sx={{
                color: theme.palette.mode === "dark" ? "rgba(255, 255, 255, 0.6)" : "rgba(0, 0, 0, 0.6)",
                display: "block",
                mt: 1,
              }}
            >
              채널 대표 이미지는 나중에 수정할 수 있습니다.
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button
            onClick={handleCancelCreate}
            sx={{
              color: theme.palette.mode === "dark" ? "rgba(255, 255, 255, 0.7)" : "rgba(0, 0, 0, 0.6)",
            }}
          >
            취소
          </Button>
          <Button
            onClick={handleConfirmCreate}
            variant="contained"
            disabled={!newChannelName.trim() || createChannelMutation.isPending}
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
              },
              "&:disabled": {
                background: theme.palette.mode === "dark" ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)",
                color: theme.palette.mode === "dark" ? "rgba(255, 255, 255, 0.3)" : "rgba(0, 0, 0, 0.3)",
              },
            }}
          >
            {createChannelMutation.isPending ? <CircularProgress size={20} sx={{ color: "inherit" }} /> : "만들기"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 기존 채널 이미지 수정 다이얼로그 */}
      <Dialog
        open={openEditImageDialog}
        onClose={handleCancelEditImage}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: "16px",
            background: theme.palette.mode === "dark" ? "rgba(26, 26, 46, 0.95)" : "#ffffff",
            border: theme.palette.mode === "dark" ? "1px solid rgba(139, 92, 246, 0.4)" : "none",
            boxShadow:
              theme.palette.mode === "dark"
                ? "0px 8px 32px rgba(139, 92, 246, 0.3)"
                : "0px 4px 20px rgba(0, 0, 0, 0.1)",
          },
        }}
      >
        <DialogTitle
          sx={{
            color: theme.palette.mode === "dark" ? "#ffffff" : "#1a1a2e",
            fontWeight: "bold",
            textShadow: theme.palette.mode === "dark" ? "0 0 10px rgba(139, 92, 246, 0.5)" : "none",
          }}
        >
          채널 이미지 수정
        </DialogTitle>
        <DialogContent>
          {/* 현재 이미지 표시 */}
          {(() => {
            const currentChannel = channels.find((c) => c.id === editChannelId);
            return (
              currentChannel?.ChannelImage?.link && (
                <Box sx={{ mb: 3 }}>
                  <Card
                    sx={{
                      maxWidth: 500,
                      margin: "0 auto",
                      background: theme.palette.mode === "dark" ? "rgba(26, 26, 46, 0.8)" : "#f8f9fa",
                      border:
                        theme.palette.mode === "dark"
                          ? "1px solid rgba(139, 92, 246, 0.3)"
                          : "1px solid rgba(0, 0, 0, 0.1)",
                    }}
                  >
                    <CardMedia
                      component="img"
                      height="300"
                      image={`${process.env.NEXT_PUBLIC_BASE_URL}${currentChannel.ChannelImage.link}`}
                      alt="현재 채널 이미지"
                      sx={{ objectFit: "cover" }}
                    />
                  </Card>
                </Box>
              )
            );
          })()}

          {/* 새 이미지 업로드 섹션 */}
          <Box>
            <Typography
              variant="subtitle1"
              sx={{
                mb: 2,
                color: theme.palette.mode === "dark" ? "#ffffff" : "#1a1a2e",
                fontWeight: 600,
              }}
            >
              새 이미지 업로드
            </Typography>

            {editImagePreview ? (
              // 새 이미지 미리보기
              <Card
                sx={{
                  maxWidth: 500,
                  mb: 2,
                  margin: "0 auto",
                  background: theme.palette.mode === "dark" ? "rgba(26, 26, 46, 0.8)" : "#f8f9fa",
                  border:
                    theme.palette.mode === "dark"
                      ? "1px solid rgba(139, 92, 246, 0.3)"
                      : "1px solid rgba(0, 0, 0, 0.1)",
                }}
              >
                <CardMedia
                  component="img"
                  height="300"
                  image={editImagePreview}
                  alt="새 이미지 미리보기"
                  sx={{ objectFit: "cover" }}
                />
                <CardActions sx={{ justifyContent: "center", py: 1 }}>
                  <IconButton
                    color="error"
                    onClick={handleRemoveEditImage}
                    size="small"
                    sx={{
                      background: theme.palette.mode === "dark" ? "rgba(244, 67, 54, 0.1)" : "rgba(244, 67, 54, 0.05)",
                      "&:hover": {
                        background: theme.palette.mode === "dark" ? "rgba(244, 67, 54, 0.2)" : "rgba(244, 67, 54, 0.1)",
                      },
                    }}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </CardActions>
              </Card>
            ) : (
              // 이미지 업로드 버튼
              <Button
                component="label"
                variant="outlined"
                startIcon={<CloudUploadIcon />}
                sx={{
                  width: "100%",
                  height: 120,
                  display: "flex",
                  flexDirection: "column",
                  gap: 1,
                  borderStyle: "dashed",
                  borderWidth: 2,
                  borderColor: theme.palette.mode === "dark" ? "rgba(139, 92, 246, 0.5)" : "rgba(25, 118, 210, 0.5)",
                  backgroundColor:
                    theme.palette.mode === "dark" ? "rgba(139, 92, 246, 0.05)" : "rgba(25, 118, 210, 0.05)",
                  color: theme.palette.mode === "dark" ? "rgba(139, 92, 246, 0.8)" : "#1976d2",
                  "&:hover": {
                    borderColor: theme.palette.mode === "dark" ? "rgba(139, 92, 246, 0.8)" : "#1976d2",
                    backgroundColor:
                      theme.palette.mode === "dark" ? "rgba(139, 92, 246, 0.1)" : "rgba(25, 118, 210, 0.1)",
                  },
                  mb: 2,
                }}
              >
                <ImageIcon sx={{ fontSize: 40 }} />
                <Typography variant="body2">새 이미지 업로드 (JPG, PNG, GIF, WEBP - 최대 5MB)</Typography>
                <input type="file" hidden accept="image/*" onChange={handleEditImageChange} />
              </Button>
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
          <Button
            onClick={handleCancelEditImage}
            sx={{
              color: theme.palette.mode === "dark" ? "rgba(255, 255, 255, 0.7)" : "rgba(0, 0, 0, 0.6)",
            }}
          >
            취소
          </Button>

          {/* 기존 이미지가 있으면 삭제 버튼 표시 */}
          {(() => {
            const currentChannel = channels.find((c) => c.id === editChannelId);
            return (
              currentChannel?.ChannelImage?.link && (
                <Button
                  onClick={handleDeleteExistingImage}
                  color="error"
                  variant="outlined"
                  disabled={deleteExistingChannelImageMutation.isPending}
                  startIcon={<DeleteIcon />}
                >
                  {deleteExistingChannelImageMutation.isPending ? <CircularProgress size={20} /> : "이미지 삭제"}
                </Button>
              )
            );
          })()}

          {/* 새 이미지가 선택되었으면 업로드 버튼 표시 */}
          {editImageFile && (
            <Button
              onClick={handleConfirmEditImage}
              variant="contained"
              disabled={uploadExistingChannelImageMutation.isPending}
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
                },
                "&:disabled": {
                  background: theme.palette.mode === "dark" ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)",
                  color: theme.palette.mode === "dark" ? "rgba(255, 255, 255, 0.3)" : "rgba(0, 0, 0, 0.3)",
                },
              }}
            >
              {uploadExistingChannelImageMutation.isPending ? (
                <CircularProgress size={20} sx={{ color: "inherit" }} />
              ) : (
                "이미지 업데이트"
              )}
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ChannelsPage;
