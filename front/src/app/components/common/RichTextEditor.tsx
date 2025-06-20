"use client";
import { useState, useEffect, useMemo, useCallback } from "react";
import dynamic from "next/dynamic";
import { Box, Paper, useTheme, Typography } from "@mui/material";

// SSR 문제 방지를 위한 동적 import
const ReactQuill = dynamic(() => import("react-quill"), { ssr: false });

// Quill CSS import
import "react-quill/dist/quill.snow.css";

interface RichTextEditorProps {
  value: string;
  onChange: (content: string) => void;
  placeholder?: string;
  height?: string;
  disabled?: boolean;
}

export default function RichTextEditor({
  value,
  onChange,
  placeholder = "내용을 입력하세요...",
  height = "300px",
  disabled = false,
}: RichTextEditorProps) {
  const [editorValue, setEditorValue] = useState(value || "");
  const [isClient, setIsClient] = useState(false);
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === "dark";

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    setEditorValue(value || "");
  }, [value]);

  const handleChange = (content: string) => {
    setEditorValue(content);
    if (onChange) {
      onChange(content);
    }
  };

  // 이미지 업로드 핸들러
  const imageHandler = useCallback(() => {
    const input = document.createElement("input");
    input.setAttribute("type", "file");
    input.setAttribute("accept", "image/*");
    input.click();

    input.onchange = () => {
      const file = input.files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = () => {
          const imageUrl = reader.result as string;

          // 간단한 방법으로 현재 에디터의 내용에 이미지 추가
          const currentContent = editorValue;
          const imageHtml = `<img src="${imageUrl}" alt="uploaded image" style="max-width: 100%; height: auto;" />`;
          const newContent = currentContent + imageHtml;

          setEditorValue(newContent);
          if (onChange) {
            onChange(newContent);
          }
        };
        reader.readAsDataURL(file);
      }
    };
  }, []);

  // 동영상에서 썸네일 추출하는 함수
  const extractVideoThumbnail = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const video = document.createElement("video");
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      video.crossOrigin = "anonymous";
      video.currentTime = 1; // 1초 지점의 프레임 캡처

      video.onloadedmetadata = () => {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
      };

      video.onseeked = () => {
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const thumbnailDataUrl = canvas.toDataURL("image/jpeg", 0.8);
          resolve(thumbnailDataUrl);
        } else {
          reject(new Error("Canvas context not available"));
        }
        // 메모리 정리
        URL.revokeObjectURL(video.src);
      };

      video.onerror = () => {
        reject(new Error("Video load error"));
        URL.revokeObjectURL(video.src);
      };

      video.src = URL.createObjectURL(file);
      video.load();
    });
  };

  // 동영상 업로드 핸들러
  const videoHandler = useCallback(() => {
    const input = document.createElement("input");
    input.setAttribute("type", "file");
    input.setAttribute("accept", "video/*");
    input.click();

    input.onchange = async () => {
      const file = input.files?.[0];
      if (file) {
        try {
          // 동영상에서 썸네일 추출
          const thumbnailUrl = await extractVideoThumbnail(file);

          // 간단한 방법으로 현재 에디터의 내용에 동영상 썸네일 추가
          const currentContent = editorValue;
          const videoHtml = `<div style="margin: 16px 0; padding: 12px; border: 2px dashed #e94057; border-radius: 8px; text-align: center; background: rgba(233, 64, 87, 0.05); position: relative;">
            <img src="${thumbnailUrl}" alt="video thumbnail" style="max-width: 100%; height: auto; max-height: 300px; border-radius: 8px;" />
            <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); background: rgba(0,0,0,0.7); border-radius: 50%; width: 60px; height: 60px; display: flex; align-items: center; justify-content: center; pointer-events: none;">
              <div style="width: 0; height: 0; border-left: 20px solid white; border-top: 12px solid transparent; border-bottom: 12px solid transparent; margin-left: 4px;"></div>
            </div>
            <p style="margin: 8px 0 0 0; font-size: 14px; color: #e94057; font-weight: 500;">
              🎬 ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB)
            </p>
          </div>`;
          const newContent = currentContent + videoHtml;

          setEditorValue(newContent);
          if (onChange) {
            onChange(newContent);
          }
        } catch (error) {
          console.error("썸네일 추출 실패:", error);
          // 썸네일 추출 실패시 기본 동영상 아이콘 표시
          const currentContent = editorValue;
          const videoHtml = `<div style="margin: 16px 0; padding: 12px; border: 2px dashed #e94057; border-radius: 8px; text-align: center; background: rgba(233, 64, 87, 0.05);">
            <div style="width: 200px; height: 150px; background: #f3f4f6; border-radius: 8px; display: flex; align-items: center; justify-content: center; margin: 0 auto; color: #6b7280;">
              <div style="text-align: center;">
                <div style="font-size: 48px; margin-bottom: 8px;">🎬</div>
                <div style="font-size: 14px;">동영상 파일</div>
              </div>
            </div>
            <p style="margin: 8px 0 0 0; font-size: 14px; color: #e94057; font-weight: 500;">
              🎬 ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB)
            </p>
          </div>`;
          const newContent = currentContent + videoHtml;

          setEditorValue(newContent);
          if (onChange) {
            onChange(newContent);
          }
        }
      }
    };
  }, []);

  const modules = useMemo(
    () => ({
      toolbar: {
        container: [
          [{ header: [1, 2, 3, false] }],
          ["bold", "italic", "underline", "strike"],
          [{ color: [] }, { background: [] }],
          [{ script: "sub" }, { script: "super" }],
          [{ list: "ordered" }, { list: "bullet" }],
          [{ indent: "-1" }, { indent: "+1" }],
          [{ align: [] }],
          ["link", "image", "video"],
          ["blockquote", "code-block"],
          ["clean"],
        ],
        handlers: {
          image: imageHandler,
          video: videoHandler,
        },
      },
      clipboard: {
        matchVisual: false,
      },
    }),
    [imageHandler, videoHandler]
  );

  const formats = [
    "header",
    "font",
    "size",
    "bold",
    "italic",
    "underline",
    "strike",
    "blockquote",
    "list",
    "bullet",
    "indent",
    "link",
    "image",
    "video",
    "color",
    "background",
    "align",
    "script",
    "code-block",
  ];

  if (!isClient) {
    return (
      <Paper
        elevation={0}
        sx={{
          border: `1px solid ${isDarkMode ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.12)"}`,
          borderRadius: "12px",
          overflow: "hidden",
          background: isDarkMode ? "rgba(30, 32, 38, 0.8)" : "#ffffff",
          height,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Typography color="text.secondary">에디터 로딩 중...</Typography>
      </Paper>
    );
  }

  return (
    <Box sx={{ position: "relative", mb: 2 }}>
      <Paper
        elevation={0}
        sx={{
          border: `1px solid ${isDarkMode ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.12)"}`,
          borderRadius: "12px",
          overflow: "hidden",
          background: isDarkMode ? "rgba(30, 32, 38, 0.8)" : "#ffffff",
          transition: "all 0.3s ease",
          "&:hover": {
            borderColor: isDarkMode ? "rgba(139, 92, 246, 0.3)" : "rgba(139, 92, 246, 0.5)",
            boxShadow: isDarkMode ? "0 4px 20px rgba(139, 92, 246, 0.15)" : "0 4px 20px rgba(139, 92, 246, 0.1)",
          },
          "&:focus-within": {
            borderColor: isDarkMode ? "#8b5cf6" : "#6366f1",
            boxShadow: isDarkMode ? "0 0 0 3px rgba(139, 92, 246, 0.2)" : "0 0 0 3px rgba(99, 102, 241, 0.2)",
          },
        }}
      >
        <ReactQuill
          theme="snow"
          value={editorValue}
          onChange={handleChange}
          modules={modules}
          formats={formats}
          placeholder={placeholder}
          readOnly={disabled}
          style={{
            height: height,
          }}
        />
      </Paper>

      <style jsx global>{`
        /* Quill 에디터 커스텀 스타일 */
        .ql-toolbar {
          background: ${isDarkMode ? "rgba(20, 22, 28, 0.9)" : "#f8fafc"} !important;
          border: none !important;
          border-bottom: 1px solid ${isDarkMode ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.08)"} !important;
          padding: 12px 16px !important;
        }

        .ql-toolbar .ql-stroke {
          fill: none;
          stroke: ${isDarkMode ? "#e2e8f0" : "#475569"} !important;
        }

        .ql-toolbar .ql-fill,
        .ql-toolbar .ql-stroke.ql-fill {
          fill: ${isDarkMode ? "#e2e8f0" : "#475569"} !important;
          stroke: none;
        }

        .ql-toolbar .ql-picker-label {
          color: ${isDarkMode ? "#e2e8f0" : "#475569"} !important;
        }

        .ql-toolbar button:hover,
        .ql-toolbar button:focus,
        .ql-toolbar button.ql-active,
        .ql-toolbar .ql-picker-label:hover,
        .ql-toolbar .ql-picker-item:hover {
          background: linear-gradient(135deg, #8a2387, #e94057, #f27121) !important;
          border-radius: 6px !important;
        }

        .ql-toolbar button:hover .ql-stroke,
        .ql-toolbar button:focus .ql-stroke,
        .ql-toolbar button.ql-active .ql-stroke {
          stroke: white !important;
        }

        .ql-toolbar button:hover .ql-fill,
        .ql-toolbar button:focus .ql-fill,
        .ql-toolbar button.ql-active .ql-fill {
          fill: white !important;
        }

        .ql-container {
          border: none !important;
          font-family: "Inter", "Roboto", "Helvetica", "Arial", sans-serif !important;
        }

        .ql-editor {
          background: ${isDarkMode ? "rgba(30, 32, 38, 0.8)" : "#ffffff"} !important;
          color: ${isDarkMode ? "#e2e8f0" : "#1e293b"} !important;
          font-size: 15px !important;
          line-height: 1.6 !important;
          padding: 20px !important;
          min-height: ${height === "300px" ? "200px" : "calc(" + height + " - 100px)"} !important;
          border-radius: 0 0 12px 12px !important;
        }

        .ql-editor.ql-blank::before {
          color: ${isDarkMode ? "#94a3b8" : "#94a3b8"} !important;
          font-style: normal !important;
          font-size: 15px !important;
          left: 20px !important;
          right: 20px !important;
        }

        .ql-editor p {
          margin-bottom: 8px !important;
        }

        .ql-editor h1,
        .ql-editor h2,
        .ql-editor h3 {
          margin: 16px 0 8px 0 !important;
          font-weight: 600 !important;
        }

        .ql-editor h1 {
          font-size: 1.875rem !important;
          background: linear-gradient(135deg, #8a2387, #e94057, #f27121);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .ql-editor h2 {
          font-size: 1.5rem !important;
          color: ${isDarkMode ? "#a78bfa" : "#8b5cf6"} !important;
        }

        .ql-editor h3 {
          font-size: 1.25rem !important;
          color: ${isDarkMode ? "#fbbf24" : "#f59e0b"} !important;
        }

        .ql-editor blockquote {
          border-left: 4px solid ${isDarkMode ? "#8b5cf6" : "#6366f1"} !important;
          background: ${isDarkMode ? "rgba(139, 92, 246, 0.1)" : "rgba(99, 102, 241, 0.05)"} !important;
          padding: 12px 16px !important;
          margin: 16px 0 !important;
          border-radius: 0 8px 8px 0 !important;
        }

        .ql-editor pre.ql-syntax {
          background: ${isDarkMode ? "#1e293b" : "#f1f5f9"} !important;
          color: ${isDarkMode ? "#e2e8f0" : "#334155"} !important;
          border-radius: 8px !important;
          padding: 16px !important;
          margin: 16px 0 !important;
          border: 1px solid ${isDarkMode ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.08)"} !important;
        }

        .ql-editor a {
          color: ${isDarkMode ? "#60a5fa" : "#3b82f6"} !important;
          text-decoration: none !important;
        }

        .ql-editor a:hover {
          text-decoration: underline !important;
        }

        .ql-snow .ql-tooltip {
          background: ${isDarkMode ? "#1e293b" : "#ffffff"} !important;
          border: 1px solid ${isDarkMode ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.12)"} !important;
          color: ${isDarkMode ? "#e2e8f0" : "#1e293b"} !important;
          border-radius: 8px !important;
          box-shadow: 0 10px 25px ${isDarkMode ? "rgba(0, 0, 0, 0.5)" : "rgba(0, 0, 0, 0.15)"} !important;
          z-index: 9999 !important;
        }

        .ql-snow .ql-tooltip input {
          background: ${isDarkMode ? "rgba(30, 32, 38, 0.8)" : "#ffffff"} !important;
          color: ${isDarkMode ? "#e2e8f0" : "#1e293b"} !important;
          border: 1px solid ${isDarkMode ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.12)"} !important;
          border-radius: 6px !important;
          padding: 8px 12px !important;
        }

        .ql-snow .ql-tooltip a.ql-action,
        .ql-snow .ql-tooltip a.ql-remove {
          background: linear-gradient(135deg, #8a2387, #e94057, #f27121) !important;
          color: white !important;
          border-radius: 4px !important;
          padding: 4px 8px !important;
          margin-left: 8px !important;
          text-decoration: none !important;
        }

        .ql-picker-options {
          background: ${isDarkMode ? "#1e293b" : "#ffffff"} !important;
          border: 1px solid ${isDarkMode ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.12)"} !important;
          border-radius: 8px !important;
          box-shadow: 0 10px 25px ${isDarkMode ? "rgba(0, 0, 0, 0.5)" : "rgba(0, 0, 0, 0.15)"} !important;
        }

        .ql-picker-item {
          color: ${isDarkMode ? "#e2e8f0" : "#1e293b"} !important;
        }

        .ql-picker-item:hover {
          background: ${isDarkMode ? "rgba(139, 92, 246, 0.2)" : "rgba(99, 102, 241, 0.1)"} !important;
        }
      `}</style>
    </Box>
  );
}
