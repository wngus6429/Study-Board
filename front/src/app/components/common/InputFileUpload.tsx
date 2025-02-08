import * as React from "react";
import { styled } from "@mui/material/styles";
import Button from "@mui/material/Button";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import DeleteIcon from "@mui/icons-material/Delete";
import { Box, Card, CardActions, CardMedia, IconButton } from "@mui/material";

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
  onPreviewUpdate: (previews: Array<{ dataUrl: string; file: File } | null>) => void;
  preview: Array<{ dataUrl: string; file: File } | null>;
}

export default function InputFileUpload({ onPreviewUpdate, preview }: InputFileUploadProps) {
  // 이미지 삭제
  const onRemoveImage = (index: number) => {
    const updatedPreview = preview.filter((_, i) => i !== index);
    onPreviewUpdate(updatedPreview); // 부모 컴포넌트로 상태 전달
  };
  // 이미지 업로드
  const onUpload: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    if (e.target.files) {
      const newPreviews = Array.from(e.target.files).map((file) => {
        const reader = new FileReader();
        return new Promise<{ dataUrl: string; file: File }>((resolve) => {
          reader.onloadend = () => {
            resolve({
              dataUrl: reader.result as string,
              file,
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
  // 모든 이미지 제거
  const onRemoveImageAll = () => {
    onPreviewUpdate([]); // 모든 이미지 제거
  };

  return (
    <Box sx={{ width: "100%", textAlign: "center" }}>
      <Button
        component="label"
        variant="contained"
        startIcon={<CloudUploadIcon />}
        sx={{
          width: "100%",
          // mb: 2,
          fontWeight: "bold",
        }}
      >
        업로드
        <VisuallyHiddenInput type="file" onChange={onUpload} multiple />
      </Button>
      {preview.length > 0 && (
        <Box>
          <Box
            sx={{
              display: "flex",
              flexWrap: "wrap",
              gap: 2,
              justifyContent: "center",
            }}
          >
            {preview.map(
              (v, index) =>
                v && (
                  <Card
                    key={index}
                    sx={{
                      maxWidth: 150,
                      boxShadow: 3,
                      position: "relative",
                      borderRadius: 2,
                    }}
                  >
                    <CardMedia
                      component="img"
                      image={v.dataUrl}
                      alt="미리보기"
                      sx={{
                        height: 100,
                        objectFit: "cover",
                        borderRadius: "8px 8px 0 0",
                      }}
                    />
                    <CardActions sx={{ justifyContent: "center" }}>
                      <IconButton color="error" onClick={() => onRemoveImage(index)} size="small">
                        <DeleteIcon />
                      </IconButton>
                    </CardActions>
                  </Card>
                )
            )}
          </Box>
          <Button
            variant="outlined"
            onClick={onRemoveImageAll}
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
