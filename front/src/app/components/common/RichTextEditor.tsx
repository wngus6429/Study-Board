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
import ImageResize from "tiptap-extension-resize-image";
import { Box, Paper, useTheme, Typography, IconButton, Divider, Tooltip, ButtonGroup } from "@mui/material";
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
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === "dark";

  const editor = useEditor({
    extensions: [
      StarterKit,
      Image.configure({
        HTMLAttributes: {
          style: "max-width: 100%; height: auto; margin: 8px auto; border-radius: 2px; display: block;",
          class: "editor-image",
        },
      }),
      ImageResize.configure({
        // 옵션 (생략 가능)
        // preserveAspectRatio: true,           // 비율 고정
        // minWidth: 50, maxWidth: 800,          // 최소/최대 크기 제한
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
    },
  });

  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value);
    }
  }, [value, editor]);

  // 이미지 정렬 함수들
  const alignImage = useCallback(
    (alignment: "left" | "center" | "right") => {
      if (!editor) return;

      const { state } = editor;
      const { selection } = state;
      const { from } = selection;

      // 현재 선택된 노드가 이미지인지 확인
      const node = state.doc.nodeAt(from);
      if (node && node.type.name === "image") {
        const pos = from;
        const attrs = { ...node.attrs };

        // 기존 스타일에서 정렬 관련 속성 제거 후 새로운 정렬 추가
        let style = attrs.style || "";

        // 기존 margin 관련 스타일 제거
        style = style.replace(/margin[^;]*;?/g, "");
        style = style.replace(/display[^;]*;?/g, "");
        style = style.replace(/text-align[^;]*;?/g, "");

        // 새로운 정렬 스타일 추가
        switch (alignment) {
          case "left":
            style += " margin: 8px auto 8px 0; display: block;";
            break;
          case "center":
            style += " margin: 8px auto; display: block;";
            break;
          case "right":
            style += " margin: 8px 0 8px auto; display: block;";
            break;
        }

        // 스타일 정리
        style = style.replace(/;\s*;/g, ";").trim();
        if (!style.endsWith(";")) style += ";";

        attrs.style = style;

        editor.chain().setNodeSelection(pos).updateAttributes("image", attrs).run();
      }
    },
    [editor]
  );

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
          <video controls style="max-width:100%; height:auto; border-radius:2px; box-shadow:0 4px 12px rgba(0,0,0,0.15);">
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
                onClick={() => {
                  // 현재 선택된 노드가 이미지인지 확인
                  const { state } = editor;
                  const { selection } = state;
                  const { from } = selection;
                  const node = state.doc.nodeAt(from);

                  if (node && node.type.name === "image") {
                    alignImage("left");
                  } else {
                    editor.chain().focus().setTextAlign("left").run();
                  }
                }}
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
                onClick={() => {
                  // 현재 선택된 노드가 이미지인지 확인
                  const { state } = editor;
                  const { selection } = state;
                  const { from } = selection;
                  const node = state.doc.nodeAt(from);

                  if (node && node.type.name === "image") {
                    alignImage("center");
                  } else {
                    editor.chain().focus().setTextAlign("center").run();
                  }
                }}
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
                onClick={() => {
                  // 현재 선택된 노드가 이미지인지 확인
                  const { state } = editor;
                  const { selection } = state;
                  const { from } = selection;
                  const node = state.doc.nodeAt(from);

                  if (node && node.type.name === "image") {
                    alignImage("right");
                  } else {
                    editor.chain().focus().setTextAlign("right").run();
                  }
                }}
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
              "& img.editor-image": {
                transition: "all 0.2s ease",
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
