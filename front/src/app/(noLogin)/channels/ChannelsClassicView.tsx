"use client";
// 채널 리스트 페이지 클라이언트 컴포넌트

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
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import VisibilityIcon from "@mui/icons-material/Visibility";
import DeleteIcon from "@mui/icons-material/Delete";

// API 함수들 import

import CreateChannelDialog from "@/app/components/common/ChannelDialog/CreateChannelDialog";
import EditChannelImageDialog from "@/app/components/common/ChannelDialog/EditChannelImageDialog";
import ConfirmDialog from "@/app/components/common/ConfirmDialog";

import type { ChannelsController } from "./useChannelsController";

export default function ChannelsClassicView(props: ChannelsController) {
  const {
    isDbDisconnected,
    theme,
    handleChannelClick,
    session,
    getImageUrl,
    isSuperAdmin,
    searchQuery,
    setSearchQuery,
    openCreateDialog,
    newChannelName,
    setNewChannelName,
    newChannelSlug,
    setNewChannelSlug,
    channelImageFile,
    channelImagePreview,
    openEditImageDialog,
    editImageFile,
    editImagePreview,
    deleteTargetChannel,
    openDeleteConfirmDialog,
    channels,
    createChannelMutation,
    uploadExistingChannelImageMutation,
    deleteExistingChannelImageMutation,
    hideChannelMutation,
    showChannelMutation,
    deleteChannelMutation,
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
  } = props;
  return (
    <Box
      sx={{
        background:
          theme.palette.mode === "dark"
            ? "linear-gradient(135deg, rgba(26, 26, 46, 0.95), rgba(16, 16, 32, 0.98))"
            : "linear-gradient(135deg, rgba(237, 244, 255, 0.96), rgba(248, 251, 255, 0.98) 48%, rgba(255, 247, 237, 0.94))",
        padding: { xs: 1, sm: 2, md: 3 },
        paddingBottom: 6, // 하단에 여백 추가
      }}
    >
      {/* 🔴 DB 연결 해제 경고 대형 배너 */}
      {isDbDisconnected && (
        <Box
          sx={{
            backgroundColor:
              theme.palette.mode === "dark"
                ? "rgba(220, 38, 38, 0.25)"
                : "#fef2f2",
            border:
              theme.palette.mode === "dark"
                ? "2px solid rgba(220, 38, 38, 0.8)"
                : "2px solid #ef4444",
            borderRadius: 3,
            padding: { xs: 2, sm: 3 },
            marginBottom: { xs: 2, sm: 4 },
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow:
              theme.palette.mode === "dark"
                ? "0 0 20px rgba(220, 38, 38, 0.3)"
                : "0 4px 15px rgba(239, 68, 68, 0.2)",
            gap: 2,
          }}
        >
          <Typography
            variant="h5"
            sx={{
              color: theme.palette.mode === "dark" ? "#fca5a5" : "#b91c1c",
              fontWeight: "bold",
              textAlign: "center",
              display: "flex",
              alignItems: "center",
              gap: 1.5,
              fontSize: { xs: "1rem", sm: "1.5rem" },
              flexWrap: "wrap",
              justifyContent: "center",
            }}
          >
            ⚠️ 서버(DB) 연결이 끊어졌습니다. UI 테스트를 위해 아래에 더미 샘플
            채널이 표시됩니다.
          </Typography>
        </Box>
      )}

      {/* 헤더 */}
      <Box
        sx={{
          background:
            theme.palette.mode === "dark"
              ? "rgba(26, 26, 46, 0.95)"
              : "linear-gradient(135deg, rgba(255, 254, 250, 0.96), rgba(240, 247, 255, 0.96))",
          borderRadius: 3,
          padding: { xs: 2, sm: 3 },
          marginBottom: { xs: 2, sm: 3 },
          border:
            theme.palette.mode === "dark"
              ? "1px solid rgba(139, 92, 246, 0.4)"
              : "1px solid rgba(79, 70, 229, 0.16)",
          boxShadow:
            theme.palette.mode === "dark"
              ? "0px 8px 32px rgba(139, 92, 246, 0.3)"
              : "0px 12px 32px rgba(79, 70, 229, 0.12)",
        }}
      >
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: { xs: "stretch", sm: "center" },
            flexDirection: { xs: "column", sm: "row" },
            gap: { xs: 1.5, sm: 2 },
            mb: 2,
          }}
        >
          <Typography
            variant="h4"
            sx={{
              color: theme.palette.mode === "dark" ? "#ffffff" : "#10172a",
              fontWeight: "bold",
              textShadow:
                theme.palette.mode === "dark"
                  ? "0 0 10px rgba(139, 92, 246, 0.5)"
                  : "0 1px 0 rgba(255, 255, 255, 0.8)",
              fontSize: { xs: "1.5rem", sm: "2.125rem" },
              wordBreak: "keep-all",
            }}
          >
            {`채널 목록 (${filteredChannels.length}개)`}
            {isSuperAdmin && channels.filter((c) => c.is_hidden).length > 0 && (
              <Typography
                component="span"
                variant="body2"
                sx={{
                  ml: 2,
                  color: theme.palette.mode === "dark" ? "#ef4444" : "#dc2626",
                  fontWeight: "normal",
                }}
              >
                {`(숨김: ${channels.filter((c) => c.is_hidden).length}개)`}
              </Typography>
            )}
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
                background:
                  theme.palette.mode === "dark"
                    ? "rgba(255, 255, 255, 0.1)"
                    : "rgba(0, 0, 0, 0.1)",
                color:
                  theme.palette.mode === "dark"
                    ? "rgba(255, 255, 255, 0.3)"
                    : "rgba(0, 0, 0, 0.3)",
              },
              boxShadow:
                theme.palette.mode === "dark"
                  ? "0 0 20px rgba(139, 92, 246, 0.4)"
                  : "0 4px 12px rgba(25, 118, 210, 0.3)",
              borderRadius: 2,
              px: 3,
              width: { xs: "100%", sm: "auto" },
            }}
          >
            {createChannelMutation.isPending ? (
              <CircularProgress size={20} sx={{ color: "inherit" }} />
            ) : (
              "채널 만들기"
            )}
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
                <SearchIcon
                  sx={{
                    color:
                      theme.palette.mode === "dark"
                        ? "rgba(139, 92, 246, 0.7)"
                        : "#666",
                  }}
                />
              </InputAdornment>
            ),
          }}
          sx={{
            "& .MuiOutlinedInput-root": {
              backgroundColor:
                theme.palette.mode === "dark"
                  ? "rgba(26, 26, 46, 0.8)"
                  : "rgba(248, 251, 255, 0.92)",
              "& fieldset": {
                borderColor:
                  theme.palette.mode === "dark"
                    ? "rgba(139, 92, 246, 0.5)"
                    : "rgba(79, 70, 229, 0.22)",
              },
              "&:hover fieldset": {
                borderColor:
                  theme.palette.mode === "dark"
                    ? "rgba(139, 92, 246, 0.8)"
                    : "#1976d2",
              },
              "&.Mui-focused fieldset": {
                borderColor:
                  theme.palette.mode === "dark"
                    ? "rgba(139, 92, 246, 1)"
                    : "#1976d2",
              },
            },
            "& .MuiOutlinedInput-input": {
              color: theme.palette.mode === "dark" ? "#ffffff" : "#172033",
              "&::placeholder": {
                color:
                  theme.palette.mode === "dark"
                    ? "rgba(255, 255, 255, 0.5)"
                    : "rgba(82, 98, 122, 0.75)",
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
                background:
                  theme.palette.mode === "dark"
                    ? "rgba(26, 26, 46, 0.95)"
                    : "linear-gradient(180deg, #fffefa 0%, #f8fbff 100%)",
                border: channel.is_hidden
                  ? theme.palette.mode === "dark"
                    ? "2px solid rgba(239, 68, 68, 0.5)"
                    : "2px solid rgba(220, 38, 38, 0.5)"
                  : theme.palette.mode === "dark"
                    ? "1px solid rgba(139, 92, 246, 0.3)"
                    : "1px solid rgba(148, 163, 184, 0.36)",
                borderRadius: 3,
                overflow: "hidden",
                cursor: "pointer",
                transition: "all 0.3s ease-in-out",
                opacity: channel.is_hidden ? 0.7 : 1, // 숨김 처리된 채널은 전체 투명도 조정
                "&:hover": {
                  transform: "translateY(-4px)",
                  boxShadow:
                    theme.palette.mode === "dark"
                      ? "0px 12px 40px rgba(139, 92, 246, 0.4)"
                      : "0px 14px 32px rgba(37, 99, 235, 0.16)",
                  border: channel.is_hidden
                    ? theme.palette.mode === "dark"
                      ? "2px solid rgba(239, 68, 68, 0.8)"
                      : "2px solid rgba(220, 38, 38, 0.8)"
                    : theme.palette.mode === "dark"
                      ? "1px solid rgba(139, 92, 246, 0.6)"
                      : "1px solid rgba(59, 130, 246, 0.42)",
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
                      ? `url(${getImageUrl(channel.ChannelImage.link)})`
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
                        color:
                          theme.palette.mode === "dark"
                            ? "rgba(139, 92, 246, 0.8)"
                            : "#1976d2",
                        fontWeight: "bold",
                      }}
                    >
                      {channel.channel_name.charAt(0)}
                    </Typography>
                  )}
                </CardMedia>

                {/* 편집 버튼 (총관리자 또는 채널 생성자 보임) */}
                {(isSuperAdmin || session?.user?.id === channel.creator.id) && (
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
                      <IconButton
                        size="small"
                        onClick={() => handleEditChannelImage(channel)}
                        sx={{ color: "white" }}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                )}

                {/* 숨김 버튼 (총관리자 또는 채널 생성자만 보임) */}
                {(isSuperAdmin || session?.user?.id === channel.creator.id) &&
                  !channel.is_hidden && (
                    <Box
                      sx={{
                        position: "absolute",
                        top: 8,
                        left: 8,
                        background: "rgba(220, 38, 38, 0.9)",
                        borderRadius: "50%",
                      }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Tooltip title="채널 숨김">
                        <IconButton
                          size="small"
                          onClick={() => handleHideChannel(channel)}
                          sx={{
                            color: "white",
                            "&:hover": {
                              background: "rgba(185, 28, 28, 0.9)",
                            },
                          }}
                          disabled={hideChannelMutation.isPending}
                        >
                          {hideChannelMutation.isPending ? (
                            <CircularProgress
                              size={16}
                              sx={{ color: "white" }}
                            />
                          ) : (
                            <VisibilityOffIcon fontSize="small" />
                          )}
                        </IconButton>
                      </Tooltip>
                    </Box>
                  )}

                {/* 표시 버튼 (총관리자 또는 채널 생성자 보임) */}
                {(isSuperAdmin || session?.user?.id === channel.creator.id) &&
                  channel.is_hidden && (
                    <Box
                      sx={{
                        position: "absolute",
                        top: 8,
                        right: 56,
                        background: "rgba(6, 182, 212, 0.9)",
                        borderRadius: "50%",
                      }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Tooltip title="채널 표시">
                        <IconButton
                          size="small"
                          onClick={() => handleShowChannel(channel)}
                          sx={{
                            color: "white",
                            "&:hover": {
                              background: "rgba(6, 182, 212, 0.9)",
                            },
                          }}
                          disabled={showChannelMutation.isPending}
                        >
                          {showChannelMutation.isPending ? (
                            <CircularProgress
                              size={16}
                              sx={{ color: "white" }}
                            />
                          ) : (
                            <VisibilityIcon fontSize="small" />
                          )}
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
                    color:
                      theme.palette.mode === "dark" ? "#ffffff" : "#10172a",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    opacity: channel.is_hidden ? 0.6 : 1, // 숨김 처리된 채널은 투명도 조정
                  }}
                >
                  {channel.channel_name}
                  {channel.is_hidden && (
                    <Typography
                      component="span"
                      variant="caption"
                      sx={{
                        ml: 1,
                        color:
                          theme.palette.mode === "dark" ? "#ef4444" : "#dc2626",
                        fontWeight: "normal",
                      }}
                    >
                      (숨김)
                    </Typography>
                  )}
                </Typography>

                <Typography
                  variant="body2"
                  sx={{
                    color:
                      theme.palette.mode === "dark"
                        ? "rgba(255, 255, 255, 0.7)"
                        : "#52627a",
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
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <PeopleIcon
                      sx={{
                        fontSize: 16,
                        color:
                          theme.palette.mode === "dark"
                            ? "rgba(139, 92, 246, 0.8)"
                            : "#1976d2",
                      }}
                    />
                    <Typography
                      variant="caption"
                      sx={{
                        color:
                          theme.palette.mode === "dark"
                            ? "rgba(255, 255, 255, 0.8)"
                            : "text.secondary",
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
                        color:
                          theme.palette.mode === "dark"
                            ? "rgba(6, 182, 212, 0.8)"
                            : "#42a5f5",
                      }}
                    />
                    <Typography
                      variant="caption"
                      sx={{
                        color:
                          theme.palette.mode === "dark"
                            ? "rgba(255, 255, 255, 0.8)"
                            : "text.secondary",
                        fontWeight: 500,
                      }}
                    >
                      {channel.story_count || 0}
                    </Typography>
                  </Box>
                </Box>

                {/* 생성자 정보 및 삭제 버튼 */}
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    mt: 2,
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
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
                        color:
                          theme.palette.mode === "dark"
                            ? "rgba(255, 255, 255, 0.6)"
                            : "text.secondary",
                        fontWeight: 500,
                      }}
                    >
                      {channel.creator.nickname}
                    </Typography>
                  </Box>

                  {/* 숨김 버튼 그룹 (총관리자 또는 채널 생성자만 보임) */}
                  {(isSuperAdmin ||
                    session?.user?.id === channel.creator.id) && (
                    <Box
                      sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
                    >
                      {!channel.is_hidden && (
                        <Tooltip title="채널 숨김">
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleHideChannel(channel);
                            }}
                            sx={{
                              color:
                                theme.palette.mode === "dark"
                                  ? "#ef4444"
                                  : "#dc2626",
                              "&:hover": {
                                background:
                                  theme.palette.mode === "dark"
                                    ? "rgba(239, 68, 68, 0.1)"
                                    : "rgba(220, 38, 38, 0.1)",
                              },
                            }}
                            disabled={hideChannelMutation.isPending}
                          >
                            {hideChannelMutation.isPending ? (
                              <CircularProgress size={16} />
                            ) : (
                              <VisibilityOffIcon fontSize="small" />
                            )}
                          </IconButton>
                        </Tooltip>
                      )}
                      <Tooltip title="채널 삭제">
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteChannel(channel);
                          }}
                          sx={{
                            color:
                              theme.palette.mode === "dark"
                                ? "#ef4444"
                                : "#dc2626",
                            "&:hover": {
                              background:
                                theme.palette.mode === "dark"
                                  ? "rgba(239, 68, 68, 0.1)"
                                  : "rgba(220, 38, 38, 0.1)",
                            },
                          }}
                          disabled={deleteChannelMutation.isPending}
                        >
                          {deleteChannelMutation.isPending &&
                          deleteTargetChannel?.id === channel.id ? (
                            <CircularProgress size={16} />
                          ) : (
                            <DeleteIcon fontSize="small" />
                          )}
                        </IconButton>
                      </Tooltip>
                    </Box>
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {openDeleteConfirmDialog && deleteTargetChannel && (
        <ConfirmDialog
          open={openDeleteConfirmDialog}
          title="채널 삭제"
          description={`"${deleteTargetChannel.channel_name}" 채널을 삭제하시겠습니까?\n\n삭제된 채널은 목록에서 사라지고 URL로도 접근할 수 없습니다. 게시글과 데이터는 물리적으로 삭제되지 않습니다.`}
          onConfirm={handleConfirmDeleteChannel}
          onCancel={handleCancelDeleteChannel}
          confirmText={deleteChannelMutation.isPending ? "삭제 중..." : "삭제"}
          cancelText="취소"
        />
      )}

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
}
