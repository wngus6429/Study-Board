import * as React from "react";
import { styled } from "@mui/material/styles";
import Button from "@mui/material/Button";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import DeleteIcon from "@mui/icons-material/Delete";
import VideoFileIcon from "@mui/icons-material/VideoFile";
import ImageIcon from "@mui/icons-material/Image";
import { Box, Card, CardActions, CardMedia, IconButton, Typography, Chip } from "@mui/material";
import { useMessage } from "@/app/store/messageStore";

const VisuallyHiddenInput = styled("input")({
  clip: "rect(0 0 0 0)",
  clipPath: "inset(50%)",
  height: 1,
  overflow: "hidden",
  position: "absolute",
  bottom: 0,
  left: 0,
  whiteSpace: "nowrap",
  width: 1,
});

interface InputFileUploadProps {
  onPreviewUpdate: (previews: Array<{ dataUrl: string; file: File; type: "image" | "video" } | null>) => void;
  preview: Array<{ dataUrl: string; file: File; type: "image" | "video" } | null>;
}

const MAX_FILE_SIZE = 1000 * 1024 * 1024; // 1000MB in bytes (동영상을 위해 증가)
const ALLOWED_FILE_TYPES = [
  // 이미지 파일
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/svg+xml",
  "image/bmp",
  // 동영상 파일
  "video/mp4",
  "video/webm",
  "video/ogg",
  "video/avi",
  "video/mov",
  "video/wmv",
  "video/flv",
  "video/mkv",
];

// 파일 타입 확인 함수
const getFileType = (file: File): "image" | "video" => {
  return file.type.startsWith("image/") ? "image" : "video";
};

// 파일 크기 포맷팅 함수
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

export default function InputFileUpload({ onPreviewUpdate, preview }: InputFileUploadProps) {
  const { showMessage } = useMessage((state) => state);

  // 파일 삭제
  const onRemoveFile = (index: number) => {
    const updatedPreview = preview.filter((_, i) => i !== index);
    onPreviewUpdate(updatedPreview); // 부모 컴포넌트로 상태 전달
  };

  // 파일 업로드
  const onUpload: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    if (e.target.files) {
      // 파일 타입 검사
      const invalidFiles = Array.from(e.target.files).filter((file) => !ALLOWED_FILE_TYPES.includes(file.type));
      if (invalidFiles.length > 0) {
        showMessage(
          "이미지 또는 동영상 파일만 업로드 가능합니다 (JPG, PNG, GIF, WEBP, SVG, BMP, MP4, WEBM, OGG, AVI, MOV, WMV, FLV, MKV).",
          "error"
        );
        return;
      }

      // 파일 크기 검사
      const oversizedFiles = Array.from(e.target.files).filter((file) => file.size > MAX_FILE_SIZE);
      if (oversizedFiles.length > 0) {
        showMessage("파일 크기는 1000MB를 초과할 수 없습니다.", "error");
        return;
      }

      const newPreviews = Array.from(e.target.files).map((file) => {
        const reader = new FileReader();
        return new Promise<{ dataUrl: string; file: File; type: "image" | "video" }>((resolve) => {
          reader.onloadend = () => {
            resolve({
              dataUrl: reader.result as string,
              file,
              type: getFileType(file),
            });
          };
          reader.readAsDataURL(file);
        });
      });

      Promise.all(newPreviews).then((newFiles) => {
        const updatedPreviews = [...preview, ...newFiles];
        onPreviewUpdate(updatedPreviews); // 부모 컴포넌트로 상태 전달
      });
    }
  };

  // 모든 파일 제거
  const onRemoveAllFiles = () => {
    onPreviewUpdate([]); // 모든 파일 제거
  };

  return (
    <Box sx={{ width: "100%", textAlign: "center" }}>
      <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
        <Button
          component="label"
          variant="contained"
          startIcon={<ImageIcon />}
          sx={{
            flex: 1,
            fontWeight: "bold",
            background: "linear-gradient(135deg, #4caf50, #45a049)",
            "&:hover": {
              background: "linear-gradient(135deg, #45a049, #3d8b40)",
            },
          }}
        >
          이미지 업로드
          <VisuallyHiddenInput type="file" onChange={onUpload} multiple accept="image/*" />
        </Button>
        <Button
          component="label"
          variant="contained"
          startIcon={<VideoFileIcon />}
          sx={{
            flex: 1,
            fontWeight: "bold",
            background: "linear-gradient(135deg, #ff9800, #f57c00)",
            "&:hover": {
              background: "linear-gradient(135deg, #f57c00, #ef6c00)",
            },
          }}
        >
          영상 업로드
          <VisuallyHiddenInput type="file" onChange={onUpload} multiple accept="video/*" />
        </Button>
      </Box>

      {preview.length > 0 && (
        <Box>
          <Box
            sx={{
              display: "flex",
              flexWrap: "wrap",
              gap: 2,
              mt: 2,
              justifyContent: "center",
            }}
          >
            {preview.map(
              (v, index) =>
                v && (
                  <Card
                    key={index}
                    sx={{
                      maxWidth: 200,
                      boxShadow: 3,
                      position: "relative",
                      borderRadius: 2,
                    }}
                  >
                    {/* 파일 타입에 따른 미리보기 */}
                    {v.type === "image" ? (
                      <CardMedia
                        component="img"
                        image={v.dataUrl}
                        alt="이미지 미리보기"
                        sx={{
                          height: 120,
                          objectFit: "cover",
                          borderRadius: "8px 8px 0 0",
                        }}
                      />
                    ) : (
                      <Box
                        sx={{
                          height: 120,
                          position: "relative",
                          borderRadius: "8px 8px 0 0",
                          overflow: "hidden",
                        }}
                      >
                        <video
                          src={v.dataUrl}
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                          }}
                          controls={false}
                          muted
                        />
                        <Box
                          sx={{
                            position: "absolute",
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            justifyContent: "center",
                            backgroundColor: "rgba(0, 0, 0, 0.3)",
                            gap: 1,
                          }}
                        >
                          <VideoFileIcon sx={{ fontSize: 40, color: "white" }} />
                          <Typography variant="caption" sx={{ fontWeight: "bold", color: "white" }}>
                            동영상
                          </Typography>
                          <Chip
                            label={formatFileSize(v.file.size)}
                            size="small"
                            sx={{
                              backgroundColor: "rgba(255, 255, 255, 0.9)",
                              color: "rgba(0, 0, 0, 0.87)",
                            }}
                          />
                        </Box>
                      </Box>
                    )}

                    {/* 파일 정보 */}
                    <Box sx={{ p: 1 }}>
                      <Typography
                        variant="caption"
                        sx={{
                          display: "block",
                          textAlign: "center",
                          fontWeight: "medium",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {v.file.name}
                      </Typography>
                      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 1, mt: 0.5 }}>
                        {v.type === "image" ? (
                          <ImageIcon sx={{ fontSize: 14, color: "success.main" }} />
                        ) : (
                          <VideoFileIcon sx={{ fontSize: 14, color: "primary.main" }} />
                        )}
                        <Typography variant="caption" color="text.secondary">
                          {formatFileSize(v.file.size)}
                        </Typography>
                      </Box>
                    </Box>

                    <CardActions sx={{ justifyContent: "center", pt: 0 }}>
                      <IconButton color="error" onClick={() => onRemoveFile(index)} size="small">
                        <DeleteIcon />
                      </IconButton>
                    </CardActions>
                  </Card>
                )
            )}
          </Box>
          <Button
            variant="outlined"
            onClick={onRemoveAllFiles}
            sx={{
              mt: 2,
              fontWeight: "bold",
            }}
            color="error"
          >
            전체삭제
          </Button>
        </Box>
      )}
    </Box>
  );
}
