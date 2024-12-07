import * as React from "react";
import { styled } from "@mui/material/styles";
import Button from "@mui/material/Button";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";

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
    <>
      <Button
        component="label"
        role={undefined}
        variant="contained"
        tabIndex={-1}
        startIcon={<CloudUploadIcon />}
        sx={{ width: "100%" }}
      >
        업로드
        <VisuallyHiddenInput type="file" onChange={onUpload} multiple />
      </Button>
      {preview.length > 0 && (
        <>
          <div style={{ display: "flex", flexWrap: "wrap" }}>
            {preview.map(
              (v, index) =>
                v && (
                  <div key={index} style={{ flex: 1, textAlign: "center" }}>
                    <img
                      src={v.dataUrl}
                      alt="미리보기"
                      style={{
                        width: "100%",
                        objectFit: "contain",
                        maxHeight: 100,
                      }}
                    />
                    <Button
                      variant="outlined"
                      onClick={() => onRemoveImage(index)}
                      sx={{ width: "100%" }}
                      color="error"
                    >
                      삭제
                    </Button>
                  </div>
                )
            )}
          </div>
          <Button variant="outlined" onClick={onRemoveImageAll} sx={{ width: "100%" }} color="error">
            전체삭제
          </Button>
        </>
      )}
    </>
  );
}
