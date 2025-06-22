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
      if (customWidth) {
        return {
          width: customWidth,
          maxWidth: "100%",
          margin: customMargin || "0 auto", // customMargin이 있으면 사용, 없으면 기본값
          borderRadius: 1,
          objectFit: "contain" as const,
          boxShadow: 16,
          opacity: loaded ? 1 : 0,
          transition: "opacity 0.5s ease, transform 0.3s ease, box-shadow 0.3s ease",
          "&:hover": {
            transform: "translateY(-10px)",
            boxShadow: 16,
            cursor: onClick ? "pointer" : "default",
          },
        };
      }

      // 기본 스타일 (기존 로직)
      return {
        flexBasis: fullWidth ? "100%" : "calc(50% - 8px)",
        maxWidth: fullWidth ? "100%" : "calc(50% - 8px)",
        margin: fullWidth ? "0 auto" : undefined,
        borderRadius: 1,
        objectFit: "contain" as const,
        boxShadow: 16,
        opacity: loaded ? 1 : 0,
        transition: "opacity 0.5s ease, transform 0.3s ease, box-shadow 0.3s ease",
        "&:hover": {
          transform: "translateY(-10px)",
          boxShadow: 16,
          cursor: onClick ? "pointer" : "default",
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
