import React, { useState, useMemo, useRef } from "react";
import { CardMedia } from "@mui/material";
import { StoryImageType } from "@/app/types/imageTypes";

const ImageCard: React.FC<{ img: StoryImageType; isLastOddImage: boolean }> = React.memo(({ img, isLastOddImage }) => {
  const [dimensions, setDimensions] = useState<{ width: number; height: number } | null>(null);

  // 컴포넌트가 마운트 될 때 고정되는 타임스탬프
  const timestampRef = useRef(Date.now());
  const [loaded, setLoaded] = useState<boolean>(false);

  // 이미지 URL을 메모이제이션
  const imageSrc = useMemo(() => {
    const lowerLink = img.link.toLowerCase();
    if (lowerLink.endsWith(".gif")) {
      return img.link;
    }
    return `${img.link}?timestamp=${timestampRef.current}`;
  }, [img.link]);

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    const { naturalWidth, naturalHeight } = e.currentTarget;
    setDimensions({ width: naturalWidth, height: naturalHeight });
    setLoaded(true);
  };

  const isWideImage = dimensions ? dimensions.width / dimensions.height >= 1.3 : false;
  const fullWidth = isWideImage || isLastOddImage;

  return (
    <CardMedia
      component="img"
      image={imageSrc}
      alt={`이미지 ${img.image_name}`}
      onLoad={handleImageLoad}
      sx={{
        flexBasis: fullWidth ? "100%" : "calc(50% - 8px)",
        maxWidth: fullWidth ? "100%" : "calc(50% - 8px)",
        margin: fullWidth ? "0 auto" : undefined,
        borderRadius: 4,
        objectFit: "contain",
        boxShadow: 16,
        opacity: loaded ? 1 : 0,
        transition: "opacity 0.5s ease, transform 0.3s ease, box-shadow 0.3s ease",
        "&:hover": {
          transform: "translateY(-10px)",
          boxShadow: 16,
        },
      }}
    />
  );
});

export default ImageCard;
