import React, { useState, useEffect } from "react";
import { Dialog, Box, IconButton, Typography } from "@mui/material";
import {
  Close as CloseIcon,
  ArrowBackIosNew as ArrowBackIosNewIcon,
  ArrowForwardIos as ArrowForwardIosIcon,
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon,
} from "@mui/icons-material";
import { StoryImageType } from "@/app/types/imageTypes";

/**
 * 이미지 뷰어 컴포넌트의 Props 인터페이스
 * 초보자도 이해하기 쉽도록 각 prop의 역할을 명시
 */
interface ImageViewerProps {
  /** 이미지 뷰어 열림/닫힘 상태 */
  open: boolean;
  /** 현재 선택된 이미지 */
  selectedImage: StoryImageType | null;
  /** 현재 이미지의 인덱스 (이전/다음 버튼용) */
  currentImageIndex: number;
  /** 이미지 목록 (이전/다음 네비게이션용) */
  images: StoryImageType[];
  /** 이미지 뷰어 닫기 함수 */
  onClose: () => void;
  /** 이미지 변경 함수 (이전/다음 버튼용) */
  onImageChange: (index: number) => void;
}

/**
 * 이미지 뷰어 컴포넌트
 * 이미지 확대/축소, 드래그, 키보드 네비게이션 기능 제공
 */
const ImageViewer: React.FC<ImageViewerProps> = ({
  open,
  selectedImage,
  currentImageIndex,
  images,
  onClose,
  onImageChange,
}) => {
  // ========== 상태 관리 ==========
  /** 이미지 확대/축소 레벨 (1.0 = 100%, 3.0 = 300%) */
  const [zoomLevel, setZoomLevel] = useState<number>(1);

  /** 이미지 위치 (드래그 시 사용) */
  const [imagePosition, setImagePosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  /** 드래그 중인지 여부 */
  const [isDragging, setIsDragging] = useState<boolean>(false);

  /** 드래그 시작 위치 */
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // ========== 이벤트 핸들러 함수들 ==========

  /** 이미지 확대 함수 */
  const handleZoomIn = () => {
    setZoomLevel((prev) => Math.min(prev + 0.25, 3)); // 최대 3배까지 확대
  };

  /** 이미지 축소 함수 */
  const handleZoomOut = () => {
    const newZoomLevel = Math.max(zoomLevel - 0.25, 0.5); // 최소 0.5배까지 축소
    setZoomLevel(newZoomLevel);

    // 줌 레벨이 1배 이하가 되면 이미지 위치도 초기화
    if (newZoomLevel <= 1) {
      setImagePosition({ x: 0, y: 0 });
    }
  };

  /** 이전 이미지로 이동 */
  const handlePrevImage = () => {
    if (currentImageIndex > 0) {
      const prevIndex = currentImageIndex - 1;
      onImageChange(prevIndex);
      // 이미지 변경 시 줌과 위치 초기화
      setZoomLevel(1);
      setImagePosition({ x: 0, y: 0 });
    }
  };

  /** 다음 이미지로 이동 */
  const handleNextImage = () => {
    if (currentImageIndex < images.length - 1) {
      const nextIndex = currentImageIndex + 1;
      onImageChange(nextIndex);
      // 이미지 변경 시 줌과 위치 초기화
      setZoomLevel(1);
      setImagePosition({ x: 0, y: 0 });
    }
  };

  /** 이미지 뷰어 닫기 (상태 초기화 포함) */
  const handleClose = () => {
    setZoomLevel(1);
    setImagePosition({ x: 0, y: 0 });
    setIsDragging(false);
    onClose();
  };

  // ========== 드래그 관련 함수들 ==========

  /** 마우스 버튼을 누를 때 (드래그 시작) */
  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoomLevel <= 1) return; // 확대된 상태에서만 드래그 가능

    setIsDragging(true);
    setDragStart({
      x: e.clientX - imagePosition.x,
      y: e.clientY - imagePosition.y,
    });
    e.preventDefault();
  };

  /** 마우스 이동 시 (드래그 중) */
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || zoomLevel <= 1) return;

    setImagePosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  /** 마우스 버튼을 놓을 때 (드래그 종료) */
  const handleMouseUp = () => {
    setIsDragging(false);
  };

  /** 마우스가 이미지 영역을 벗어날 때 (드래그 종료) */
  const handleMouseLeave = () => {
    setIsDragging(false);
  };

  // ========== useEffect 훅들 ==========

  /** 키보드 이벤트 처리 (방향키, ESC, +/- 키) */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!open) return;

      switch (e.key) {
        case "ArrowRight":
          handleNextImage();
          break;
        case "ArrowLeft":
          handlePrevImage();
          break;
        case "Escape":
          handleClose();
          break;
        case "+":
        case "=":
          handleZoomIn();
          break;
        case "-":
          handleZoomOut();
          break;
        case "r":
        case "R":
          // R키로 이미지 위치 리셋
          setImagePosition({ x: 0, y: 0 });
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, currentImageIndex, images.length, zoomLevel]);

  /** 전역 마우스 이벤트 처리 (이미지 밖으로 드래그해도 작동) */
  useEffect(() => {
    if (!isDragging) return;

    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (!isDragging || zoomLevel <= 1) return;

      setImagePosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    };

    const handleGlobalMouseUp = () => {
      setIsDragging(false);
    };

    document.addEventListener("mousemove", handleGlobalMouseMove);
    document.addEventListener("mouseup", handleGlobalMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleGlobalMouseMove);
      document.removeEventListener("mouseup", handleGlobalMouseUp);
    };
  }, [isDragging, dragStart, zoomLevel]);

  // ========== 렌더링 ==========
  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth={false}
      fullWidth
      PaperProps={{
        sx: {
          bgcolor: "rgba(0, 0, 0, 0.92)",
          border: "1px solid rgba(192, 192, 192, 0.5)",
          boxShadow: "0 0 20px rgba(255, 255, 255, 0.1)",
          position: "relative",
          height: "85vh",
          width: "80vw",
          margin: "20px",
          borderRadius: "8px",
          overflow: "hidden",
        },
      }}
    >
      {/* 상단 컨트롤 바 */}
      <Box
        sx={{
          position: "absolute",
          top: 0,
          right: 0,
          display: "flex",
          justifyContent: "flex-end",
          alignItems: "center",
          p: 1.5,
          zIndex: 10,
        }}
      >
        {/* 줌 축소 버튼 */}
        <IconButton
          onClick={handleZoomOut}
          sx={{
            color: "silver",
            "&:hover": { color: "white" },
            mr: 1,
            fontSize: "1.8rem",
          }}
        >
          <ZoomOutIcon sx={{ fontSize: "1.8rem" }} />
        </IconButton>

        {/* 줌 레벨 표시 */}
        <Typography
          variant="body1"
          sx={{
            color: "silver",
            mx: 1,
            fontSize: "1.1rem",
          }}
        >
          {(zoomLevel * 100).toFixed(0)}%
        </Typography>

        {/* 줌 확대 버튼 */}
        <IconButton
          onClick={handleZoomIn}
          sx={{
            color: "silver",
            "&:hover": { color: "white" },
            mr: 1,
            fontSize: "1.8rem",
          }}
        >
          <ZoomInIcon sx={{ fontSize: "1.8rem" }} />
        </IconButton>

        {/* 닫기 버튼 */}
        <IconButton
          onClick={handleClose}
          sx={{
            color: "silver",
            "&:hover": { color: "white" },
            fontSize: "1.8rem",
          }}
        >
          <CloseIcon sx={{ fontSize: "1.8rem" }} />
        </IconButton>
      </Box>

      {/* 이미지 컨테이너 */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100%",
          width: "100%",
          position: "relative",
        }}
      >
        {/* 이전 이미지 네비게이션 버튼 */}
        {currentImageIndex > 0 && (
          <IconButton
            onClick={handlePrevImage}
            sx={{
              position: "absolute",
              left: { xs: 8, md: 24 },
              color: "silver",
              "&:hover": { color: "white" },
              fontSize: "2rem",
            }}
          >
            <ArrowBackIosNewIcon sx={{ fontSize: "2rem" }} />
          </IconButton>
        )}

        {/* 이미지 */}
        {selectedImage && (
          <Box
            component="img"
            src={`${process.env.NEXT_PUBLIC_BASE_URL}${selectedImage.link}`}
            alt="Selected"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseLeave}
            sx={{
              maxWidth: "90%",
              maxHeight: "80vh",
              objectFit: "contain",
              transform: `scale(${zoomLevel}) translate(${imagePosition.x / zoomLevel}px, ${imagePosition.y / zoomLevel}px)`,
              transition: isDragging ? "none" : "transform 0.2s ease-out",
              border: "1px solid rgba(192, 192, 192, 0.2)",
              cursor: zoomLevel > 1 ? (isDragging ? "grabbing" : "grab") : "default",
              userSelect: "none", // 텍스트 선택 방지
            }}
            draggable={false} // HTML 드래그 방지
          />
        )}

        {/* 다음 이미지 네비게이션 버튼 */}
        {currentImageIndex < images.length - 1 && (
          <IconButton
            onClick={handleNextImage}
            sx={{
              position: "absolute",
              right: { xs: 8, md: 24 },
              color: "silver",
              "&:hover": { color: "white" },
              fontSize: "2rem",
            }}
          >
            <ArrowForwardIosIcon sx={{ fontSize: "2rem" }} />
          </IconButton>
        )}
      </Box>
    </Dialog>
  );
};

export default ImageViewer;
