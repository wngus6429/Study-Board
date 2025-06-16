import React, { useState, useRef, useEffect } from "react";
import { Box, Typography, Chip, IconButton, Slider, LinearProgress } from "@mui/material";
import { StoryVideoType } from "@/app/types/imageTypes";
import PlayCircleOutlineIcon from "@mui/icons-material/PlayCircleOutline";
import PauseCircleOutlineIcon from "@mui/icons-material/PauseCircleOutline";
import VolumeUpIcon from "@mui/icons-material/VolumeUp";
import VolumeOffIcon from "@mui/icons-material/VolumeOff";
import FullscreenIcon from "@mui/icons-material/Fullscreen";
import FullscreenExitIcon from "@mui/icons-material/FullscreenExit";

interface VideoCardProps {
  video: StoryVideoType;
  isLastOddVideo: boolean;
}

const VideoCard: React.FC<VideoCardProps> = React.memo(({ video, isLastOddVideo }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [loaded, setLoaded] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout>();

  // 비디오 메타데이터 로드 시
  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
      setLoaded(true);
    }
  };

  // 시간 업데이트
  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  // 버퍼링 상태 관리
  const handleWaiting = () => setIsBuffering(true);
  const handleCanPlay = () => setIsBuffering(false);

  // 재생/일시정지
  const handlePlayPause = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  // 음소거 토글
  const handleMuteToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  // 볼륨 조절
  const handleVolumeChange = (event: Event, newValue: number | number[]) => {
    event.stopPropagation();
    const volumeValue = Array.isArray(newValue) ? newValue[0] : newValue;
    if (videoRef.current) {
      videoRef.current.volume = volumeValue;
      setVolume(volumeValue);
      if (volumeValue === 0) {
        setIsMuted(true);
        videoRef.current.muted = true;
      } else if (isMuted) {
        setIsMuted(false);
        videoRef.current.muted = false;
      }
    }
  };

  // 시간 이동 (시크)
  const handleSeek = (event: Event, newValue: number | number[]) => {
    event.stopPropagation();
    const seekTime = Array.isArray(newValue) ? newValue[0] : newValue;
    if (videoRef.current) {
      videoRef.current.currentTime = seekTime;
      setCurrentTime(seekTime);
    }
  };

  // 전체화면 토글
  const handleFullscreenToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  // 전체화면 상태 변경 감지
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  // 마우스 움직임으로 컨트롤 표시/숨김
  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) {
        setShowControls(false);
      }
    }, 3000);
  };

  const handleMouseLeave = () => {
    if (isPlaying) {
      setShowControls(false);
    }
  };

  // 동영상 화면 클릭 시 재생/일시정지
  const handleVideoAreaClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    handlePlayPause(e);
  };

  // 시간 포맷팅
  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return "";
    const mb = bytes / (1024 * 1024);
    return mb >= 1 ? `${mb.toFixed(1)}MB` : `${(bytes / 1024).toFixed(1)}KB`;
  };

  return (
    <Box
      ref={containerRef}
      sx={{
        position: "relative",
        width: isLastOddVideo ? "100%" : { xs: "100%", sm: "calc(50% - 8px)" },
        aspectRatio: "16/9",
        borderRadius: "12px",
        overflow: "hidden",
        cursor: "pointer",
        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
        transition: "all 0.3s ease",
        "&:hover": {
          transform: "translateY(-2px)",
          boxShadow: "0 8px 20px rgba(0, 0, 0, 0.15)",
        },
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <video
        ref={videoRef}
        src={`${process.env.NEXT_PUBLIC_BASE_URL}${video.link}`}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
        }}
        muted={isMuted}
        onLoadedMetadata={handleLoadedMetadata}
        onTimeUpdate={handleTimeUpdate}
        onEnded={() => setIsPlaying(false)}
        onWaiting={handleWaiting}
        onCanPlay={handleCanPlay}
      />

      {/* 투명한 클릭 가능한 오버레이 */}
      <Box
        className="video-overlay"
        sx={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 1,
          cursor: "pointer",
        }}
        onClick={handleVideoAreaClick}
      />

      {/* 버퍼링 인디케이터 */}
      {isBuffering && (
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            zIndex: 3,
          }}
        >
          <LinearProgress sx={{ width: 100, color: "white" }} />
        </Box>
      )}

      {/* 상단 정보 */}
      <Box
        sx={{
          position: "absolute",
          top: 8,
          left: 8,
          right: 8,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          zIndex: 2,
        }}
      >
        <Chip
          label="동영상"
          size="small"
          sx={{
            backgroundColor: "rgba(233, 64, 87, 0.9)",
            color: "white",
            fontWeight: "bold",
            fontSize: "0.75rem",
          }}
        />
        {video.file_size && (
          <Chip
            label={formatFileSize(video.file_size)}
            size="small"
            sx={{
              backgroundColor: "rgba(0, 0, 0, 0.6)",
              color: "white",
              fontSize: "0.7rem",
            }}
          />
        )}
      </Box>

      {/* 중앙 재생 버튼 (컨트롤이 숨겨져 있을 때만) */}
      {!showControls && !isPlaying && (
        <Box
          className="video-overlay"
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            zIndex: 2,
          }}
        >
          <IconButton
            onClick={handlePlayPause}
            sx={{
              color: "white",
              backgroundColor: "rgba(0, 0, 0, 0.5)",
              "&:hover": {
                backgroundColor: "rgba(0, 0, 0, 0.7)",
              },
              width: 60,
              height: 60,
            }}
          >
            <PlayCircleOutlineIcon sx={{ fontSize: 40 }} />
          </IconButton>
        </Box>
      )}

      {/* 하단 컨트롤 바 */}
      <Box
        sx={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          background: "linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 100%)",
          padding: "8px 12px",
          opacity: showControls || !isPlaying ? 1 : 0,
          transition: "opacity 0.3s ease",
          zIndex: 2,
        }}
      >
        {/* 시크바 */}
        <Box sx={{ mb: 1 }}>
          <Slider
            value={currentTime}
            max={duration}
            onChange={handleSeek}
            onClick={(e) => e.stopPropagation()}
            sx={{
              color: "#e94057",
              height: 4,
              "& .MuiSlider-thumb": {
                width: 12,
                height: 12,
                "&:hover": {
                  boxShadow: "0px 0px 0px 8px rgba(233, 64, 87, 0.16)",
                },
              },
              "& .MuiSlider-rail": {
                backgroundColor: "rgba(255, 255, 255, 0.3)",
              },
            }}
          />
        </Box>

        {/* 컨트롤 버튼들 */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          {/* 왼쪽 컨트롤 */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <IconButton onClick={handlePlayPause} size="small" sx={{ color: "white" }}>
              {isPlaying ? (
                <PauseCircleOutlineIcon sx={{ fontSize: 20 }} />
              ) : (
                <PlayCircleOutlineIcon sx={{ fontSize: 20 }} />
              )}
            </IconButton>

            <IconButton onClick={handleMuteToggle} size="small" sx={{ color: "white" }}>
              {isMuted ? <VolumeOffIcon sx={{ fontSize: 18 }} /> : <VolumeUpIcon sx={{ fontSize: 18 }} />}
            </IconButton>

            {/* 볼륨 슬라이더 */}
            <Box sx={{ width: 60, mx: 1 }}>
              <Slider
                value={isMuted ? 0 : volume}
                max={1}
                step={0.1}
                onChange={handleVolumeChange}
                onClick={(e) => e.stopPropagation()}
                sx={{
                  color: "white",
                  height: 3,
                  "& .MuiSlider-thumb": {
                    width: 8,
                    height: 8,
                  },
                }}
              />
            </Box>

            {/* 시간 표시 */}
            <Typography
              variant="caption"
              sx={{
                color: "white",
                fontSize: "0.7rem",
                minWidth: "80px",
              }}
            >
              {formatTime(currentTime)} / {formatTime(duration)}
            </Typography>
          </Box>

          {/* 오른쪽 컨트롤 */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Typography
              variant="caption"
              sx={{
                color: "white",
                backgroundColor: "rgba(0, 0, 0, 0.6)",
                padding: "2px 6px",
                borderRadius: "4px",
                maxWidth: "120px",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                fontSize: "0.7rem",
              }}
            >
              {video.video_name}
            </Typography>

            <IconButton onClick={handleFullscreenToggle} size="small" sx={{ color: "white" }}>
              {isFullscreen ? <FullscreenExitIcon sx={{ fontSize: 18 }} /> : <FullscreenIcon sx={{ fontSize: 18 }} />}
            </IconButton>
          </Box>
        </Box>
      </Box>
    </Box>
  );
});

VideoCard.displayName = "VideoCard";

export default VideoCard;
