"use client";
import { useState, useEffect, useCallback } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import TextAlign from "@tiptap/extension-text-align";
import Color from "@tiptap/extension-color";
import TextStyle from "@tiptap/extension-text-style";
import Highlight from "@tiptap/extension-highlight";
import Underline from "@tiptap/extension-underline";
import Image from "@tiptap/extension-image";
import { Box, Paper, useTheme, Typography, IconButton, Divider, Tooltip, ButtonGroup, Fade, Card } from "@mui/material";
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
  PhotoSizeSelectSmall,
  PhotoSizeSelectActual,
  PhotoSizeSelectLarge,
  Delete as DeleteIcon,
} from "@mui/icons-material";

interface RichTextEditorProps {
  value: string;
  onChange: (content: string) => void;
  placeholder?: string;
  height?: string;
  disabled?: boolean;
  onFilesChange?: (files: File[]) => void;
}

export default function RichTextEditor({
  value,
  onChange,
  placeholder = "내용을 입력하세요...",
  height = "300px",
  disabled = false,
  onFilesChange,
}: RichTextEditorProps) {
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [selectedImageElement, setSelectedImageElement] = useState<HTMLImageElement | null>(null);
  const [showImageControls, setShowImageControls] = useState(false);
  const [imageControlsPosition, setImageControlsPosition] = useState({ top: 0, left: 0 });
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === "dark";

  const editor = useEditor({
    extensions: [
      StarterKit,
      Image.configure({
        HTMLAttributes: {
          style: "max-width: 100%; height: auto; margin: 8px 0; border-radius: 8px; cursor: pointer;",
          class: "editor-image",
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          style: "color: #3b82f6; text-decoration: underline;",
        },
      }),
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      Color,
      TextStyle,
      Highlight.configure({
        multicolor: true,
      }),
      Underline,
    ],
    content: value,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      onChange(html);
    },
    editable: !disabled,
    editorProps: {
      attributes: {
        style: `min-height: ${height}; padding: 16px; outline: none;`,
        class: "tiptap-editor",
      },
      handleClick: (view, pos, event) => {
        const target = event.target as HTMLElement;
        if (target.tagName === "IMG" && target.classList.contains("editor-image")) {
          handleImageClick(target as HTMLImageElement);
          return true;
        } else {
          setShowImageControls(false);
          setSelectedImageElement(null);
        }
        return false;
      },
    },
  });

  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value);
    }
  }, [value, editor]);

  // uploadedFiles가 변경될 때만 부모에게 알림
  useEffect(() => {
    console.log(
      "🔄 [useEffect] uploadedFiles 변경됨:",
      uploadedFiles.map((f) => f.name)
    );
    if (onFilesChange) {
      console.log("📤 [useEffect] 부모 컴포넌트로 파일 전달 예정:", uploadedFiles.length, "개");
      const timeoutId = setTimeout(() => {
        console.log(
          "📤 [useEffect] 부모 컴포넌트로 파일 전달 실행:",
          uploadedFiles.map((f) => f.name)
        );
        onFilesChange(uploadedFiles);
      }, 0);
      return () => clearTimeout(timeoutId);
    }
  }, [uploadedFiles, onFilesChange]);

  // 이미지 클릭 핸들러 (아카라이브 스타일)
  const handleImageClick = useCallback((imgElement: HTMLImageElement) => {
    console.log("🖼️ 이미지 클릭됨:", imgElement.src);

    // 기존 선택 해제
    document.querySelectorAll(".editor-image.selected").forEach((img) => {
      img.classList.remove("selected");
    });

    // 새로운 이미지 선택
    imgElement.classList.add("selected");
    setSelectedImageElement(imgElement);

    // 이미지 위치 계산
    const rect = imgElement.getBoundingClientRect();
    const editorRect = imgElement.closest(".tiptap-editor")?.getBoundingClientRect();

    if (editorRect) {
      setImageControlsPosition({
        top: rect.top - editorRect.top - 50, // 이미지 위쪽에 컨트롤 표시
        left: rect.left - editorRect.left + rect.width - 200, // 오른쪽 정렬
      });
    }

    setShowImageControls(true);
  }, []);

  // 이미지 크기 조절 함수
  const handleImageResize = useCallback(
    (size: string) => {
      if (!selectedImageElement || !editor) return;

      console.log(`📏 이미지 크기 변경: ${size}`);

      // 현재 선택된 이미지의 위치 찾기
      const images = Array.from(editor.view.dom.querySelectorAll("img.editor-image"));
      const targetImageIndex = images.indexOf(selectedImageElement);

      if (targetImageIndex !== -1) {
        // TipTap 에디터에서 해당 이미지 속성 업데이트
        let imagePos = -1;
        let currentImageIndex = 0;

        editor.state.doc.descendants((node, pos) => {
          if (node.type.name === "image") {
            if (currentImageIndex === targetImageIndex) {
              imagePos = pos;
              return false;
            }
            currentImageIndex++;
          }
        });

        if (imagePos !== -1) {
          const newAttrs = {
            style: `max-width: ${size}; height: auto; margin: 8px 0; border-radius: 8px; cursor: pointer;`,
            class: "editor-image",
          };

          editor.chain().focus().setNodeSelection(imagePos).updateAttributes("image", newAttrs).run();
        }
      }

      // 직접 DOM 업데이트 (즉시 반영)
      selectedImageElement.style.maxWidth = size;

      setShowImageControls(false);
      setSelectedImageElement(null);
    },
    [selectedImageElement, editor]
  );

  // 이미지 삭제 함수
  const handleImageDelete = useCallback(() => {
    if (!selectedImageElement || !editor) return;

    console.log("🗑️ 이미지 삭제");

    // TipTap에서 이미지 삭제
    const images = Array.from(editor.view.dom.querySelectorAll("img.editor-image"));
    const imageIndex = images.indexOf(selectedImageElement);

    if (imageIndex !== -1) {
      let currentIndex = 0;
      editor.state.doc.descendants((node, pos) => {
        if (node.type.name === "image") {
          if (currentIndex === imageIndex) {
            editor.chain().focus().setNodeSelection(pos).deleteSelection().run();
            return false;
          }
          currentIndex++;
        }
      });
    }

    setShowImageControls(false);
    setSelectedImageElement(null);
  }, [selectedImageElement, editor]);

  // 이미지 업로드 핸들러 (다중 선택 지원)
  const handleImageUpload = useCallback(() => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.multiple = true; // 다중 선택 허용
    input.onchange = (e) => {
      const files = Array.from((e.target as HTMLInputElement).files || []);
      if (!files.length) return;

      // 용량 체크 등은 그대로 유지
      const oversized = files.filter((f) => f.size > 100 * 1024 * 1024);
      if (oversized.length) {
        alert(`100MB 초과 파일:\n${oversized.map((f) => f.name).join("\n")}`);
        return;
      }

      // Object URL 생성 + 삽입할 이미지 노드 목록 만들기
      const nodes = files.map((file) => {
        const src = URL.createObjectURL(file);
        // 5분 후 메모리 해제
        setTimeout(() => URL.revokeObjectURL(src), 5 * 60_000);
        return {
          type: "image",
          attrs: {
            src,
            alt: file.name,
            title: file.name,
            // 스타일은 전역 설정된 HTMLAttributes가 적용됨
          },
        };
      });

      // 한 번의 커맨드로 여러 노드 삽입
      editor?.chain().focus().insertContent(nodes).run();

      // 부모 컴포넌트에 파일 리스트 전달
      setUploadedFiles((prev) => [...prev, ...files]);
    };
    input.click();
  }, [editor]);

  // 동영상 업로드 핸들러 (다중 선택 지원)
  const handleVideoUpload = useCallback(() => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "video/*";
    input.multiple = false; // 단일 선택만 허용
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      if (file.size > 1024 * 1024 * 1024) {
        alert(`${file.name}은(는) 1GB를 초과합니다.`);
        return;
      }

      const src = URL.createObjectURL(file);
      setTimeout(() => URL.revokeObjectURL(src), 5 * 60_000);

      const videoHtml = `
        <div style="margin:16px 0; text-align:center;">
          <video controls style="max-width:100%; height:auto; border-radius:8px; box-shadow:0 4px 12px rgba(0,0,0,0.15);">
            <source src="${src}" type="${file.type}" />
            동영상을 재생할 수 없습니다.
          </video>
          <p style="margin:8px 0 0; font-size:14px; color:#e94057; font-weight:500;">
            🎬 ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB)
          </p>
        </div>
      `;

      editor?.chain().focus().insertContent(videoHtml).run();
      setUploadedFiles((prev) => [...prev, file]);
    };
    input.click();
  }, [editor]);

  // 링크 추가 핸들러
  const handleAddLink = useCallback(() => {
    const url = window.prompt("링크 URL을 입력하세요:");
    if (url) {
      editor?.chain().focus().setLink({ href: url }).run();
    }
  }, [editor]);

  if (!editor) {
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
        {/* 툴바 */}
        <Box
          sx={{
            background: isDarkMode ? "rgba(20, 22, 28, 0.9)" : "#f8fafc",
            borderBottom: `1px solid ${isDarkMode ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.08)"}`,
            p: 1,
            display: "flex",
            flexWrap: "wrap",
            gap: 0.5,
          }}
        >
          {/* 실행 취소/다시 실행 */}
          <ButtonGroup size="small">
            <Tooltip title={editor.can().undo() ? "실행 취소" : ""}>
              <span>
                <IconButton
                  size="small"
                  onClick={() => editor.chain().focus().undo().run()}
                  disabled={!editor.can().undo()}
                  sx={{ color: isDarkMode ? "#e2e8f0" : "#475569" }}
                >
                  <Undo fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
            <Tooltip title={editor.can().redo() ? "다시 실행" : ""}>
              <span>
                <IconButton
                  size="small"
                  onClick={() => editor.chain().focus().redo().run()}
                  disabled={!editor.can().redo()}
                  sx={{ color: isDarkMode ? "#e2e8f0" : "#475569" }}
                >
                  <Redo fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
          </ButtonGroup>

          <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />

          {/* 텍스트 포맷팅 */}
          <ButtonGroup size="small">
            <Tooltip title="굵게">
              <IconButton
                size="small"
                onClick={() => editor.chain().focus().toggleBold().run()}
                sx={{
                  color: editor.isActive("bold") ? "#e94057" : isDarkMode ? "#e2e8f0" : "#475569",
                  backgroundColor: editor.isActive("bold") ? "rgba(233, 64, 87, 0.1)" : "transparent",
                }}
              >
                <FormatBold fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="기울임">
              <IconButton
                size="small"
                onClick={() => editor.chain().focus().toggleItalic().run()}
                sx={{
                  color: editor.isActive("italic") ? "#e94057" : isDarkMode ? "#e2e8f0" : "#475569",
                  backgroundColor: editor.isActive("italic") ? "rgba(233, 64, 87, 0.1)" : "transparent",
                }}
              >
                <FormatItalic fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="밑줄">
              <IconButton
                size="small"
                onClick={() => editor.chain().focus().toggleUnderline().run()}
                sx={{
                  color: editor.isActive("underline") ? "#e94057" : isDarkMode ? "#e2e8f0" : "#475569",
                  backgroundColor: editor.isActive("underline") ? "rgba(233, 64, 87, 0.1)" : "transparent",
                }}
              >
                <FormatUnderlined fontSize="small" />
              </IconButton>
            </Tooltip>
          </ButtonGroup>

          <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />

          {/* 정렬 */}
          <ButtonGroup size="small">
            <Tooltip title="왼쪽 정렬">
              <IconButton
                size="small"
                onClick={() => editor.chain().focus().setTextAlign("left").run()}
                sx={{
                  color: editor.isActive({ textAlign: "left" }) ? "#e94057" : isDarkMode ? "#e2e8f0" : "#475569",
                  backgroundColor: editor.isActive({ textAlign: "left" }) ? "rgba(233, 64, 87, 0.1)" : "transparent",
                }}
              >
                <FormatAlignLeft fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="가운데 정렬">
              <IconButton
                size="small"
                onClick={() => editor.chain().focus().setTextAlign("center").run()}
                sx={{
                  color: editor.isActive({ textAlign: "center" }) ? "#e94057" : isDarkMode ? "#e2e8f0" : "#475569",
                  backgroundColor: editor.isActive({ textAlign: "center" }) ? "rgba(233, 64, 87, 0.1)" : "transparent",
                }}
              >
                <FormatAlignCenter fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="오른쪽 정렬">
              <IconButton
                size="small"
                onClick={() => editor.chain().focus().setTextAlign("right").run()}
                sx={{
                  color: editor.isActive({ textAlign: "right" }) ? "#e94057" : isDarkMode ? "#e2e8f0" : "#475569",
                  backgroundColor: editor.isActive({ textAlign: "right" }) ? "rgba(233, 64, 87, 0.1)" : "transparent",
                }}
              >
                <FormatAlignRight fontSize="small" />
              </IconButton>
            </Tooltip>
          </ButtonGroup>

          <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />

          {/* 리스트 */}
          <ButtonGroup size="small">
            <Tooltip title="불릿 리스트">
              <IconButton
                size="small"
                onClick={() => editor.chain().focus().toggleBulletList().run()}
                sx={{
                  color: editor.isActive("bulletList") ? "#e94057" : isDarkMode ? "#e2e8f0" : "#475569",
                  backgroundColor: editor.isActive("bulletList") ? "rgba(233, 64, 87, 0.1)" : "transparent",
                }}
              >
                <FormatListBulleted fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="번호 리스트">
              <IconButton
                size="small"
                onClick={() => editor.chain().focus().toggleOrderedList().run()}
                sx={{
                  color: editor.isActive("orderedList") ? "#e94057" : isDarkMode ? "#e2e8f0" : "#475569",
                  backgroundColor: editor.isActive("orderedList") ? "rgba(233, 64, 87, 0.1)" : "transparent",
                }}
              >
                <FormatListNumbered fontSize="small" />
              </IconButton>
            </Tooltip>
          </ButtonGroup>

          <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />

          {/* 기타 */}
          <ButtonGroup size="small">
            <Tooltip title="인용문">
              <IconButton
                size="small"
                onClick={() => editor.chain().focus().toggleBlockquote().run()}
                sx={{
                  color: editor.isActive("blockquote") ? "#e94057" : isDarkMode ? "#e2e8f0" : "#475569",
                  backgroundColor: editor.isActive("blockquote") ? "rgba(233, 64, 87, 0.1)" : "transparent",
                }}
              >
                <FormatQuote fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="코드 블록">
              <IconButton
                size="small"
                onClick={() => editor.chain().focus().toggleCodeBlock().run()}
                sx={{
                  color: editor.isActive("codeBlock") ? "#e94057" : isDarkMode ? "#e2e8f0" : "#475569",
                  backgroundColor: editor.isActive("codeBlock") ? "rgba(233, 64, 87, 0.1)" : "transparent",
                }}
              >
                <Code fontSize="small" />
              </IconButton>
            </Tooltip>
          </ButtonGroup>

          <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />

          {/* 미디어 */}
          <ButtonGroup size="small">
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
            <Tooltip title="링크 추가">
              <IconButton
                size="small"
                onClick={handleAddLink}
                sx={{
                  color: editor.isActive("link") ? "#e94057" : isDarkMode ? "#e2e8f0" : "#475569",
                  backgroundColor: editor.isActive("link") ? "rgba(233, 64, 87, 0.1)" : "transparent",
                }}
              >
                <LinkIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </ButtonGroup>
        </Box>

        {/* 아카라이브 스타일 이미지 컨트롤 */}
        <Fade in={showImageControls}>
          <Card
            sx={{
              position: "absolute",
              top: imageControlsPosition.top,
              left: imageControlsPosition.left,
              zIndex: 1000,
              background: isDarkMode ? "rgba(20, 22, 28, 0.95)" : "rgba(255, 255, 255, 0.95)",
              backdropFilter: "blur(8px)",
              border: `1px solid ${isDarkMode ? "rgba(139, 92, 246, 0.3)" : "rgba(0, 0, 0, 0.1)"}`,
              borderRadius: "8px",
              boxShadow: isDarkMode
                ? "0 8px 32px rgba(0, 0, 0, 0.6), 0 0 20px rgba(139, 92, 246, 0.3)"
                : "0 8px 32px rgba(0, 0, 0, 0.15)",
              p: 1,
              minWidth: "180px",
            }}
          >
            <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
              {/* 크기 조절 버튼들 */}
              <Typography
                variant="caption"
                sx={{
                  color: isDarkMode ? "#a78bfa" : "#8b5cf6",
                  fontWeight: 600,
                  textAlign: "center",
                  mb: 0.5,
                }}
              >
                이미지 크기 조절
              </Typography>

              <ButtonGroup size="small" orientation="vertical" fullWidth>
                <Tooltip title="소형 (25%)" placement="left">
                  <IconButton
                    onClick={() => handleImageResize("25%")}
                    sx={{
                      color: isDarkMode ? "#e2e8f0" : "#475569",
                      "&:hover": {
                        backgroundColor: isDarkMode ? "rgba(139, 92, 246, 0.2)" : "rgba(139, 92, 246, 0.1)",
                        color: "#8b5cf6",
                      },
                      justifyContent: "flex-start",
                      px: 2,
                    }}
                  >
                    <PhotoSizeSelectSmall sx={{ mr: 1 }} />
                    <Typography variant="body2">소형 (25%)</Typography>
                  </IconButton>
                </Tooltip>

                <Tooltip title="중형 (50%)" placement="left">
                  <IconButton
                    onClick={() => handleImageResize("50%")}
                    sx={{
                      color: isDarkMode ? "#e2e8f0" : "#475569",
                      "&:hover": {
                        backgroundColor: isDarkMode ? "rgba(139, 92, 246, 0.2)" : "rgba(139, 92, 246, 0.1)",
                        color: "#8b5cf6",
                      },
                      justifyContent: "flex-start",
                      px: 2,
                    }}
                  >
                    <PhotoSizeSelectActual sx={{ mr: 1 }} />
                    <Typography variant="body2">중형 (50%)</Typography>
                  </IconButton>
                </Tooltip>

                <Tooltip title="대형 (100%)" placement="left">
                  <IconButton
                    onClick={() => handleImageResize("100%")}
                    sx={{
                      color: isDarkMode ? "#e2e8f0" : "#475569",
                      "&:hover": {
                        backgroundColor: isDarkMode ? "rgba(139, 92, 246, 0.2)" : "rgba(139, 92, 246, 0.1)",
                        color: "#8b5cf6",
                      },
                      justifyContent: "flex-start",
                      px: 2,
                    }}
                  >
                    <PhotoSizeSelectLarge sx={{ mr: 1 }} />
                    <Typography variant="body2">대형 (100%)</Typography>
                  </IconButton>
                </Tooltip>
              </ButtonGroup>

              <Divider sx={{ my: 0.5 }} />

              {/* 삭제 버튼 */}
              <Tooltip title="이미지 삭제" placement="left">
                <IconButton
                  onClick={handleImageDelete}
                  sx={{
                    color: "#ef4444",
                    "&:hover": {
                      backgroundColor: "rgba(239, 68, 68, 0.1)",
                      color: "#dc2626",
                    },
                    justifyContent: "flex-start",
                    px: 2,
                  }}
                >
                  <DeleteIcon sx={{ mr: 1 }} />
                  <Typography variant="body2">삭제</Typography>
                </IconButton>
              </Tooltip>
            </Box>
          </Card>
        </Fade>

        {/* 에디터 */}
        <Box
          sx={{
            minHeight: height,
            "& .tiptap-editor": {
              color: isDarkMode ? "#e2e8f0" : "#1e293b",
              fontSize: "15px",
              lineHeight: 1.6,
              fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
              "&:focus": {
                outline: "none",
              },
              "& p": {
                margin: "0 0 8px 0",
              },
              "& h1, & h2, & h3": {
                margin: "16px 0 8px 0",
                fontWeight: 600,
              },
              "& h1": {
                fontSize: "1.875rem",
                background: "linear-gradient(135deg, #8a2387, #e94057, #f27121)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              },
              "& h2": {
                fontSize: "1.5rem",
                color: isDarkMode ? "#a78bfa" : "#8b5cf6",
              },
              "& h3": {
                fontSize: "1.25rem",
                color: isDarkMode ? "#fbbf24" : "#f59e0b",
              },
              "& blockquote": {
                borderLeft: `4px solid ${isDarkMode ? "#8b5cf6" : "#6366f1"}`,
                background: isDarkMode ? "rgba(139, 92, 246, 0.1)" : "rgba(99, 102, 241, 0.05)",
                padding: "12px 16px",
                margin: "16px 0",
                borderRadius: "0 8px 8px 0",
              },
              "& pre": {
                background: isDarkMode ? "#1e293b" : "#f1f5f9",
                color: isDarkMode ? "#e2e8f0" : "#334155",
                borderRadius: "8px",
                padding: "16px",
                margin: "16px 0",
                border: `1px solid ${isDarkMode ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.08)"}`,
                overflow: "auto",
              },
              "& code": {
                background: isDarkMode ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.08)",
                padding: "2px 6px",
                borderRadius: "4px",
                fontSize: "0.9em",
              },
              "& ul, & ol": {
                paddingLeft: "20px",
                margin: "8px 0",
              },
              "& li": {
                margin: "4px 0",
              },
              "& a": {
                color: isDarkMode ? "#60a5fa" : "#3b82f6",
                textDecoration: "none",
                "&:hover": {
                  textDecoration: "underline",
                },
              },
              // 아카라이브 스타일 이미지 효과
              "& img.editor-image": {
                transition: "all 0.2s ease",
                "&:hover": {
                  boxShadow: "0 0 0 2px rgba(139, 92, 246, 0.5)",
                  transform: "scale(1.02)",
                },
                "&.selected": {
                  boxShadow: isDarkMode
                    ? "0 0 0 3px rgba(139, 92, 246, 0.8), 0 8px 25px rgba(139, 92, 246, 0.3)"
                    : "0 0 0 3px rgba(139, 92, 246, 0.6), 0 8px 25px rgba(139, 92, 246, 0.2)",
                  transform: "scale(1.02)",
                },
              },
            },
            "& .tiptap-editor.ProseMirror-focused": {
              outline: "none",
            },
            "& .tiptap-editor p.is-editor-empty:first-of-type::before": {
              content: `"${placeholder}"`,
              float: "left",
              color: isDarkMode ? "#94a3b8" : "#94a3b8",
              pointerEvents: "none",
              height: 0,
            },
          }}
        >
          <EditorContent editor={editor} />
        </Box>
      </Paper>
    </Box>
  );
}
