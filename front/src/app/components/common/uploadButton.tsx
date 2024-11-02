import * as React from "react";
import { styled } from "@mui/material/styles";
import Button from "@mui/material/Button";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import { useState } from "react";

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

export default function InputFileUpload() {
  const [preview, setPreview] = useState<Array<{ dataUrl: string; file: File } | null>>([]);

  const onRemoveImage = (index: number) => () => {
    setPreview((prevPreview) => {
      const prev = [...prevPreview];
      prev[index] = null;
      return prev;
    });
  };

  const onUpload: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    e.preventDefault();
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
        setPreview((prevPreview) => [...prevPreview, ...newFiles]);
      });
    }
  };

  const onRemoveImageAll = () => {
    setPreview([]);
  };
  return (
    <>
      <Button component="label" role={undefined} variant="contained" tabIndex={-1} startIcon={<CloudUploadIcon />}>
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
                    <Button variant="outlined" onClick={onRemoveImage(index)} sx={{ width: "100%" }} color="error">
                      삭제
                    </Button>
                  </div>
                )
            )}
          </div>
          <Button variant="outlined" onClick={onRemoveImageAll} sx={{ width: "100%", marginTop: -3 }} color="error">
            전체삭제
          </Button>
        </>
      )}
    </>
  );
}
