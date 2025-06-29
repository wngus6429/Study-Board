import React, { useState, useMemo, useRef } from "react";
import { CardMedia } from "@mui/material";
import { StoryImageType } from "@/app/types/imageTypes";

interface ImageCardProps {
  img: StoryImageType;
  isLastOddImage: boolean;
  onClick?: (img: StoryImageType) => void;
  customWidth?: string; // 리사이징된 width 정보
  customMargin?: string; // 리사이징된 margin 정보
}

const ImageCard: React.FC<ImageCardProps> = React.memo(
  ({ img, isLastOddImage, onClick, customWidth, customMargin }) => {
    const [dimensions, setDimensions] = useState<{ width: number; height: number } | null>(null);

    // 컴포넌트가 마운트 될 때 고정되는 타임스탬프
    const timestampRef = useRef(Date.now());
    const [loaded, setLoaded] = useState<boolean>(false);

    // 이미지 URL을 메모이제이션
    const imageSrc = useMemo(() => {
      const lowerLink = img.link.toLowerCase();
      if (lowerLink.endsWith(".gif")) {
        return `${process.env.NEXT_PUBLIC_BASE_URL}${img.link}`;
      }
      return `${process.env.NEXT_PUBLIC_BASE_URL}${img.link}?timestamp=${timestampRef.current}`;
    }, [img.link]);

    const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
      const { naturalWidth, naturalHeight } = e.currentTarget;
      setDimensions({ width: naturalWidth, height: naturalHeight });
      setLoaded(true);
    };

    const isWideImage = dimensions ? dimensions.width / dimensions.height >= 1.3 : false;
    const fullWidth = isWideImage || isLastOddImage;

    // customWidth가 있으면 그것을 우선 사용
    const getImageStyle = () => {
      // 메탈릭 네온 섀도우 효과
      const metallicNeonShadow = `
        0 8px 32px rgba(0, 0, 0, 0.3),
        0 4px 16px rgba(139, 92, 246, 0.4),
        0 2px 8px rgba(59, 130, 246, 0.3),
        0 1px 4px rgba(16, 185, 129, 0.2),
        inset 0 1px 2px rgba(255, 255, 255, 0.1),
        inset 0 -1px 2px rgba(0, 0, 0, 0.2)
      `;

      const metallicNeonShadowHover = `
        0 16px 48px rgba(0, 0, 0, 0.4),
        0 8px 24px rgba(139, 92, 246, 0.6),
        0 4px 16px rgba(59, 130, 246, 0.5),
        0 2px 8px rgba(16, 185, 129, 0.4),
        0 1px 4px rgba(245, 158, 11, 0.3),
        0 0 20px rgba(139, 92, 246, 0.3),
        0 0 40px rgba(59, 130, 246, 0.2),
        inset 0 2px 4px rgba(255, 255, 255, 0.15),
        inset 0 -2px 4px rgba(0, 0, 0, 0.3)
      `;

      if (customWidth) {
        return {
          width: customWidth,
          maxWidth: "100%",
          margin: customMargin || "0 auto",
          borderRadius: 2,
          objectFit: "contain" as const,
          boxShadow: metallicNeonShadow,
          opacity: loaded ? 1 : 0,
          border: "1px solid rgba(139, 92, 246, 0.2)",
          transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
          "&:hover": {
            transform: "translateY(-12px) scale(1.02)",
            boxShadow: metallicNeonShadowHover,
            border: "1px solid rgba(139, 92, 246, 0.5)",
            cursor: onClick ? "pointer" : "default",
            filter: "brightness(1.05) contrast(1.1) saturate(1.1)",
          },
        };
      }

      // 기본 스타일 (기존 로직)
      return {
        flexBasis: fullWidth ? "100%" : "calc(50% - 8px)",
        maxWidth: fullWidth ? "100%" : "calc(50% - 8px)",
        margin: fullWidth ? "0 auto" : undefined,
        borderRadius: 2,
        objectFit: "contain" as const,
        boxShadow: metallicNeonShadow,
        opacity: loaded ? 1 : 0,
        border: "1px solid rgba(139, 92, 246, 0.2)",
        transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
        "&:hover": {
          transform: "translateY(-12px) scale(1.02)",
          boxShadow: metallicNeonShadowHover,
          border: "1px solid rgba(139, 92, 246, 0.5)",
          cursor: onClick ? "pointer" : "default",
          filter: "brightness(1.05) contrast(1.1) saturate(1.1)",
        },
      };
    };

    return (
      <CardMedia
        component="img"
        image={imageSrc}
        alt={`이미지 ${img.image_name}`}
        onLoad={handleImageLoad}
        onClick={() => onClick?.(img)}
        sx={getImageStyle()}
      />
    );
  }
);

export default ImageCard;
