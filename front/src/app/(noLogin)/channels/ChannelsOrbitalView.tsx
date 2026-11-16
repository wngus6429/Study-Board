"use client";
// 채널 리스트 페이지 클라이언트 컴포넌트

import {
  Alert,
  Typography,
  Button,
  TextField,
  InputAdornment,
  Avatar,
  IconButton,
  Tooltip,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import PeopleIcon from "@mui/icons-material/People";
import ArticleIcon from "@mui/icons-material/Article";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import VisibilityIcon from "@mui/icons-material/Visibility";
import DeleteIcon from "@mui/icons-material/Delete";
import Link from "next/link";
import styles from "./channels.module.css";

// API 함수들 import

import CreateChannelDialog from "@/app/components/common/ChannelDialog/CreateChannelDialog";
import EditChannelImageDialog from "@/app/components/common/ChannelDialog/EditChannelImageDialog";
import ConfirmDialog from "@/app/components/common/ConfirmDialog";

import type { ChannelsController } from "./useChannelsController";

export default function ChannelsOrbitalView(props: ChannelsController) {
  const {
    isDbDisconnected,
    session,
    getImageUrl,
    isSuperAdmin,
    searchQuery,
    setSearchQuery,
    sortOrder,
    setSortOrder,
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
    isError,
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
    <div className={styles.page}>
      <section className={styles.hero} aria-labelledby="explore-title">
        <div className={styles.eyebrow}>A SPACE FOR YOUR NEXT INTEREST</div>
        <h1 id="explore-title">
          취향이 만나는
          <br />
          <span>새로운 궤도.</span>
        </h1>
        <p>
          좋아하는 것에 조금 더 깊이.
          <br />
          나와 같은 취향의 사람들과 이야기를 시작하세요.
        </p>
        <a href="#channel-explorer" className={styles.heroLink}>
          내 취향의 채널 찾기 <span aria-hidden="true">↗</span>
        </a>
        <div className={styles.orbit} aria-hidden="true">
          <div className={styles.orbitCore} />
          <div className={styles.orbitDot} />
        </div>
        <div className={styles.heroFooter}>
          <span>HOBBY CHANNEL / DISCOVER TOGETHER</span>
          <span>취향으로 연결되는 공간</span>
        </div>
      </section>

      {isDbDisconnected && (
        <Alert severity="info" className={styles.notice}>
          지금은 서버에 연결할 수 없어 예시 채널을 보여드리고 있어요. 실제
          채널은 연결 후 이용할 수 있습니다.
        </Alert>
      )}
      {isError && !isDbDisconnected && (
        <Alert severity="warning" className={styles.notice}>
          채널 목록을 새로 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.
        </Alert>
      )}

      <section
        id="channel-explorer"
        className={styles.toolbar}
        aria-labelledby="channels-heading"
      >
        <div className={styles.sectionHeading}>
          <h2 id="channels-heading">
            채널 둘러보기{" "}
            <span className={styles.count} aria-live="polite">
              {filteredChannels.length}
            </span>
          </h2>
          <Button
            variant="outlined"
            size="small"
            startIcon={<AddIcon />}
            onClick={handleCreateChannel}
            disabled={
              !session?.user ||
              isDbDisconnected ||
              createChannelMutation.isPending
            }
            title={
              !session?.user ? "로그인 후 채널을 만들 수 있어요" : undefined
            }
          >
            채널 만들기
          </Button>
        </div>
        <div className={styles.searchRow}>
          <TextField
            fullWidth
            size="small"
            placeholder="어떤 취향을 찾고 있나요?"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            inputProps={{ "aria-label": "채널 검색" }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            }}
          />
          <div className={styles.sortGroup} role="group" aria-label="채널 정렬">
            {(
              [
                { value: "default", label: "기본순" },
                { value: "popular", label: "구독자순" },
                { value: "name", label: "이름순" },
              ] as const
            ).map((option) => (
              <button
                key={option.value}
                type="button"
                className={styles.sortButton}
                aria-pressed={sortOrder === option.value}
                onClick={() => setSortOrder(option.value)}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      <div className={styles.grid}>
        {filteredChannels.map((channel, index) => (
          <article
            key={channel.id}
            className={[
              styles.card,
              channel.is_hidden ? styles.hiddenCard : "",
            ].join(" ")}
          >
            <div className={styles.cover}>
              {channel.ChannelImage?.link ? (
                // Channel uploads have arbitrary remote origins; retain native lazy loading.
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={getImageUrl(channel.ChannelImage.link)}
                  alt=""
                  loading="lazy"
                  decoding="async"
                />
              ) : (
                <>
                  <span className={styles.coverCode} aria-hidden="true">
                    CHANNEL / {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className={styles.monogram} aria-hidden="true">
                    {Array.from(channel.channel_name)[0]}
                  </span>
                </>
              )}
            </div>
            <div className={styles.cardBody}>
              <h3 className={styles.cardHeading}>
                {isDbDisconnected ? (
                  channel.channel_name
                ) : (
                  <Link
                    href={"/channels/" + channel.slug}
                    prefetch={false}
                    className={styles.cardLink}
                  >
                    {channel.channel_name}
                  </Link>
                )}
              </h3>
              {channel.is_hidden && (
                <Typography variant="caption" color="warning.main">
                  숨김 채널
                </Typography>
              )}
              <p className={styles.description}>
                {channel.description ||
                  "같은 관심사를 가진 사람들과 자유롭게 이야기를 나누세요."}
              </p>
              <div className={styles.metrics}>
                <span>
                  <PeopleIcon />
                  구독 {channel.subscriber_count || 0}
                </span>
                <span>
                  <ArticleIcon />글 {channel.story_count || 0}
                </span>
              </div>
              <div className={styles.cardFooter}>
                <span className={styles.creator}>
                  <Avatar
                    sx={{
                      width: 20,
                      height: 20,
                      fontSize: 10,
                      bgcolor: "action.selected",
                      color: "text.secondary",
                    }}
                  >
                    {Array.from(channel.creator.nickname)[0]}
                  </Avatar>
                  <span className={styles.creatorName}>
                    {channel.creator.nickname}
                  </span>
                </span>
                <span className={styles.arrow} aria-hidden="true">
                  {isDbDisconnected ? "DEMO" : "↗"}
                </span>
              </div>
            </div>
            {!isDbDisconnected &&
              (isSuperAdmin || session?.user?.id === channel.creator.id) && (
                <div className={styles.adminActions}>
                  <Tooltip title="이미지 수정">
                    <IconButton
                      size="small"
                      aria-label={channel.channel_name + " 이미지 수정"}
                      onClick={() => handleEditChannelImage(channel)}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip
                    title={channel.is_hidden ? "채널 표시" : "채널 숨김"}
                  >
                    <IconButton
                      size="small"
                      aria-label={
                        channel.channel_name +
                        (channel.is_hidden ? " 표시" : " 숨김")
                      }
                      disabled={
                        hideChannelMutation.isPending ||
                        showChannelMutation.isPending
                      }
                      onClick={() =>
                        channel.is_hidden
                          ? handleShowChannel(channel)
                          : handleHideChannel(channel)
                      }
                    >
                      {channel.is_hidden ? (
                        <VisibilityIcon fontSize="small" />
                      ) : (
                        <VisibilityOffIcon fontSize="small" />
                      )}
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="채널 삭제">
                    <IconButton
                      size="small"
                      color="error"
                      aria-label={channel.channel_name + " 삭제"}
                      disabled={deleteChannelMutation.isPending}
                      onClick={() => handleDeleteChannel(channel)}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </div>
              )}
          </article>
        ))}
      </div>
      {filteredChannels.length === 0 && (
        <div className={styles.empty} role="status">
          <SearchIcon sx={{ fontSize: 32, color: "text.secondary", mb: 1 }} />
          <h3>
            {searchQuery
              ? "아직 일치하는 채널이 없어요"
              : "첫 번째 취향을 공유해 보세요"}
          </h3>
          <p>
            {searchQuery
              ? "다른 검색어로 새로운 관심사를 발견해 보세요."
              : "새로운 채널을 만들고 함께 이야기를 시작해 보세요."}
          </p>
          {searchQuery && (
            <Button variant="outlined" onClick={() => setSearchQuery("")}>
              전체 채널 보기
            </Button>
          )}
        </div>
      )}
      <footer className={styles.pageFooter}>
        <span>HOBBY CHANNEL</span>
        <span>작은 관심에서 시작되는, 더 넓은 세계 ↗</span>
      </footer>

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
    </div>
  );
}
