"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import {
  Box,
  Paper,
  useTheme,
  Typography,
  IconButton,
  Divider,
  Tooltip,
  ButtonGroup,
  Chip,
  Stack,
  Card,
  CardMedia,
  CardContent,
  CardActions,
} from "@mui/material";
import {
  FormatBold,
  FormatItalic,
  FormatUnderlined,
  FormatListBulleted,
  FormatListNumbered,
  FormatQuote,
  Code,
  Image as ImageIcon,
  VideoLibrary,
  Link as LinkIcon,
  FormatAlignLeft,
  FormatAlignCenter,
  FormatAlignRight,
  Undo,
  Redo,
  Close,
  PlayArrow,
  AttachFile,
} from "@mui/icons-material";

// Quill dynamic import (클라이언트 사이드에서만 로드)
import dynamic from "next/dynamic";

const ReactQuill = dynamic(() => import("react-quill"), { ssr: false });
import "react-quill/dist/quill.snow.css";

interface QuillEditorProps {
  value: string;
  onChange: (content: string) => void;
  placeholder?: string;
  height?: string;
  disabled?: boolean;
  onFilesChange?: (files: File[]) => void;
}

export default function QuillEditor({
  value,
  onChange,
  placeholder = "내용을 입력하세요...",
  height = "300px",
  disabled = false,
  onFilesChange,
}: QuillEditorProps) {
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [selectedVideos, setSelectedVideos] = useState<File[]>([]);
  const quillRef = useRef<any>(null);
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === "dark";

  // 모든 파일 변경 시 부모에게 알림
  useEffect(() => {
    const allFiles = [...selectedImages, ...selectedVideos];
    setUploadedFiles(allFiles);
    if (onFilesChange) {
      onFilesChange(allFiles);
    }
  }, [selectedImages, selectedVideos, onFilesChange]);

  // 이미지 업로드 핸들러
  const handleImageUpload = useCallback(() => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.multiple = true;
    input.onchange = (e) => {
      const files = Array.from((e.target as HTMLInputElement).files || []);
      if (!files.length) return;

      // 용량 체크
      const oversized = files.filter((f) => f.size > 100 * 1024 * 1024);
      if (oversized.length) {
        alert(`100MB 초과 파일:\n${oversized.map((f) => f.name).join("\n")}`);
        return;
      }

      setSelectedImages((prev) => [...prev, ...files]);
    };
    input.click();
  }, []);

  // 동영상 업로드 핸들러
  const handleVideoUpload = useCallback(() => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "video/*";
    input.multiple = true;
    input.onchange = (e) => {
      const files = Array.from((e.target as HTMLInputElement).files || []);
      if (!files.length) return;

      // 용량 체크
      const oversized = files.filter((f) => f.size > 1024 * 1024 * 1024);
      if (oversized.length) {
        alert(`1GB 초과 파일:\n${oversized.map((f) => f.name).join("\n")}`);
        return;
      }

      setSelectedVideos((prev) => [...prev, ...files]);
    };
    input.click();
  }, []);

  // 이미지 삭제
  const handleImageRemove = useCallback((indexToRemove: number) => {
    setSelectedImages((prev) => prev.filter((_, index) => index !== indexToRemove));
  }, []);

  // 동영상 삭제
  const handleVideoRemove = useCallback((indexToRemove: number) => {
    setSelectedVideos((prev) => prev.filter((_, index) => index !== indexToRemove));
  }, []);

  // Quill 모듈 설정
  const modules = {
    toolbar: [
      [{ header: [1, 2, 3, false] }],
      ["bold", "italic", "underline", "strike"],
      [{ color: [] }, { background: [] }],
      [{ align: [] }],
      [{ list: "ordered" }, { list: "bullet" }],
      ["blockquote", "code-block"],
      ["link"],
      ["clean"],
    ],
  };

  const formats = [
    "header",
    "bold",
    "italic",
    "underline",
    "strike",
    "color",
    "background",
    "align",
    "list",
    "bullet",
    "blockquote",
    "code-block",
    "link",
  ];

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
        {/* 파일 첨부 툴바 */}
        <Box
          sx={{
            background: isDarkMode ? "rgba(20, 22, 28, 0.9)" : "#f8fafc",
            borderBottom: `1px solid ${isDarkMode ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.08)"}`,
            p: 1,
            display: "flex",
            gap: 1,
            alignItems: "center",
          }}
        >
          <Typography variant="body2" color="text.secondary" sx={{ mr: 1 }}>
            파일 첨부:
          </Typography>

          <Tooltip title="이미지 업로드">
            <IconButton size="small" onClick={handleImageUpload} sx={{ color: isDarkMode ? "#e2e8f0" : "#475569" }}>
              <ImageIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          <Tooltip title="동영상 업로드">
            <IconButton size="small" onClick={handleVideoUpload} sx={{ color: isDarkMode ? "#e2e8f0" : "#475569" }}>
              <VideoLibrary fontSize="small" />
            </IconButton>
          </Tooltip>

          {(selectedImages.length > 0 || selectedVideos.length > 0) && (
            <>
              <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />
              <Chip
                icon={<AttachFile />}
                label={`${selectedImages.length + selectedVideos.length}개 파일 선택됨`}
                size="small"
                variant="outlined"
                color="primary"
              />
            </>
          )}
        </Box>

        {/* 선택된 이미지 미리보기 */}
        {selectedImages.length > 0 && (
          <Box
            sx={{ p: 2, borderBottom: `1px solid ${isDarkMode ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.08)"}` }}
          >
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              선택된 이미지 ({selectedImages.length}개)
            </Typography>
            <Stack direction="row" spacing={2} sx={{ overflowX: "auto", pb: 1 }}>
              {selectedImages.map((file, index) => (
                <Card key={index} sx={{ minWidth: 200, position: "relative" }}>
                  <CardMedia
                    component="img"
                    height="120"
                    image={URL.createObjectURL(file)}
                    alt={file.name}
                    sx={{ objectFit: "cover" }}
                  />
                  <CardContent sx={{ p: 1 }}>
                    <Typography variant="body2" noWrap title={file.name}>
                      {file.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </Typography>
                  </CardContent>
                  <CardActions sx={{ p: 1, pt: 0 }}>
                    <IconButton size="small" onClick={() => handleImageRemove(index)} sx={{ color: "error.main" }}>
                      <Close fontSize="small" />
                    </IconButton>
                  </CardActions>
                </Card>
              ))}
            </Stack>
          </Box>
        )}

        {/* 선택된 동영상 미리보기 */}
        {selectedVideos.length > 0 && (
          <Box
            sx={{ p: 2, borderBottom: `1px solid ${isDarkMode ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.08)"}` }}
          >
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              선택된 동영상 ({selectedVideos.length}개)
            </Typography>
            <Stack direction="row" spacing={2} sx={{ overflowX: "auto", pb: 1 }}>
              {selectedVideos.map((file, index) => (
                <Card key={index} sx={{ minWidth: 200, position: "relative" }}>
                  <Box
                    sx={{
                      height: 120,
                      bgcolor: isDarkMode ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.05)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <PlayArrow sx={{ fontSize: 48, color: "text.secondary" }} />
                  </Box>
                  <CardContent sx={{ p: 1 }}>
                    <Typography variant="body2" noWrap title={file.name}>
                      {file.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </Typography>
                  </CardContent>
                  <CardActions sx={{ p: 1, pt: 0 }}>
                    <IconButton size="small" onClick={() => handleVideoRemove(index)} sx={{ color: "error.main" }}>
                      <Close fontSize="small" />
                    </IconButton>
                  </CardActions>
                </Card>
              ))}
            </Stack>
          </Box>
        )}

        {/* Quill 에디터 */}
        <Box
          sx={{
            minHeight: height,
            "& .ql-editor": {
              minHeight: height,
              fontSize: "15px",
              lineHeight: 1.6,
              fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
              color: isDarkMode ? "#e2e8f0" : "#1e293b",
            },
            "& .ql-toolbar": {
              borderTop: "none",
              borderLeft: "none",
              borderRight: "none",
              borderBottom: `1px solid ${isDarkMode ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.08)"}`,
              background: isDarkMode ? "rgba(20, 22, 28, 0.9)" : "#f8fafc",
            },
            "& .ql-container": {
              borderTop: "none",
              borderLeft: "none",
              borderRight: "none",
              borderBottom: "none",
              fontSize: "15px",
            },
            "& .ql-editor.ql-blank::before": {
              color: isDarkMode ? "#94a3b8" : "#94a3b8",
              fontStyle: "normal",
            },
          }}
        >
          <ReactQuill
            ref={quillRef}
            theme="snow"
            value={value}
            onChange={onChange}
            modules={modules}
            formats={formats}
            placeholder={placeholder}
            readOnly={disabled}
          />
        </Box>
      </Paper>
    </Box>
  );
}
