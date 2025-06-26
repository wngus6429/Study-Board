"use client";
import { TextField, Box, Typography, Paper, Button, CircularProgress, Divider, useTheme } from "@mui/material";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useRouter, useSearchParams } from "next/navigation";
import React, { FormEvent, useState } from "react";
// import InputFileUpload from "@/app/components/common/InputFileUpload"; // 주석처리 - RichTextEditor로 통합
import RichTextEditor from "@/app/components/common/RichTextEditor";
import { useMessage } from "@/app/store/messageStore";
import { getChannel } from "@/app/api/channelsApi";

const commonButtonStyles = {
  fontSize: { xs: "0.95rem", sm: "1rem" },
  textTransform: "none",
  fontWeight: 600,
  letterSpacing: "0.5px",
  background: "linear-gradient(135deg, #8a2387, #e94057, #f27121)",
  boxShadow: "0 6px 15px rgba(233, 64, 87, 0.3)",
  transition: "all 0.3s ease",
  "&:hover": {
    boxShadow: "0 8px 20px rgba(233, 64, 87, 0.4)",
    transform: "translateY(-2px)",
    background: "linear-gradient(135deg, #7a1d77, #d93a4f, #e2671e)",
  },
  "&:active": {
    transform: "translateY(0)",
    boxShadow: "0 4px 10px rgba(233, 64, 87, 0.3)",
  },
  "&:disabled": {
    background: "#e0e0e0",
    color: "#a0a0a0",
    boxShadow: "none",
  },
};

export default function NoticeWrite() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const { showMessage } = useMessage((state) => state);
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === "dark";

  // 채널 ID 가져오기
  const channelId = searchParams?.get("channel");

  // 제목 변수
  const [title, setTitle] = useState<string>("");
  // 내용 변수
  const [content, setContent] = useState<string>("");
  // 이미지 변수 (InputFileUpload 방식 - 주석처리)
  // const [preview, setPreview] = useState<Array<{ dataUrl: string; file: File } | null>>([]);

  // RichTextEditor에서 관리할 파일들
  const [editorFiles, setEditorFiles] = useState<File[]>([]);
  // 로딩
  const [loading, setLoading] = useState<boolean>(false);

  // 채널 정보 조회 (channelId가 있는 경우에만)
  const { data: channelData } = useQuery({
    queryKey: ["channel", channelId],
    queryFn: () => getChannel(Number(channelId)),
    enabled: !!channelId && channelId !== "0",
    staleTime: 1000 * 60 * 5, // 5분간 캐시
  });

  // useMutation 훅 사용
  const mutation = useMutation({
    mutationFn: async (e: FormEvent) => {
      if (title.length > 2 && content.length > 2) {
        setLoading(true);
        e.preventDefault();

        // FormData 객체 생성
        const formData = new FormData();
        formData.append("category", "notice");
        formData.append("title", title);
        formData.append("content", content);

        // 채널 ID가 있으면 추가
        if (channelId) {
          formData.append("channelId", channelId);
        }

        // preview의 각 파일을 'images' 키로 추가 (InputFileUpload 방식 - 주석처리)
        // preview.forEach((item) => {
        //   if (item?.file) {
        //     formData.append("images", item.file); // 'images'는 서버의 FilesInterceptor와 일치해야 합니다.
        //   }
        // });

        // RichTextEditor에서 관리하는 파일들을 'images' 키로 추가
        editorFiles.forEach((file) => {
          formData.append("images", file);
        });

        return await axios.post(`${process.env.NEXT_PUBLIC_BASE_URL}/api/story/notice/create`, formData, {
          withCredentials: true,
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });
      } else {
        showMessage("제목과 내용을 3글자 이상 입력해주세요", "error");
      }
    },
    retry: 1, // 1회 재시도
    retryDelay: () => 2000, // 매 재시도마다 2초(2000ms) 지연
    onSuccess: (data) => {
      setLoading(false);
      showMessage("공지사항 작성 완료", "info");

      // 공지사항 관련 쿼리 캐시만 무효화
      queryClient.invalidateQueries({ queryKey: ["notices"] }); // 전역 공지사항 목록 캐시 무효화
      if (channelId) {
        queryClient.invalidateQueries({ queryKey: ["channelNotices", Number(channelId)] }); // 해당 채널의 공지사항 캐시 무효화
      }

      // 채널 페이지로 이동 (channelData가 있으면 채널 페이지로, 없으면 메인 페이지로)
      if (channelData?.slug) {
        router.push(`/channels/${channelData.slug}`);
      } else {
        router.push("/");
      }
    },
    onError: (error) => {
      showMessage("공지사항 작성 실패, 이전 화면으로 이동합니다", "error");
      console.error(error);
      router.back();
    },
  });

  // InputFileUpload 관련 핸들러 (주석처리)
  // const handlePreviewUpdate = (updatedPreview: Array<{ dataUrl: string; file: File } | null>) => {
  //   setPreview(updatedPreview);
  // };

  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 3, sm: 4, md: 5 },
        width: { xs: "95%", sm: "80%", md: "65%", lg: "55%" },
        maxWidth: "900px",
        margin: "auto",
        mt: { xs: 3, sm: 4, md: 5 },
        mb: 5,
        borderRadius: "16px",
        boxShadow: isDarkMode ? "0 10px 40px rgba(0, 0, 0, 0.4)" : "0 10px 40px rgba(0, 0, 0, 0.07)",
        background: isDarkMode ? "rgba(30, 32, 38, 0.95)" : "#ffffff",
        position: "relative",
        overflow: "hidden",
        border: isDarkMode ? "1px solid rgba(255, 255, 255, 0.1)" : "1px solid rgba(0, 0, 0, 0.2)",
      }}
    >
      <Box
        sx={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "6px",
          background: "linear-gradient(90deg, #8a2387, #e94057, #f27121)",
        }}
      />

      <Typography
        variant="h4"
        sx={{
          fontWeight: 700,
          textAlign: "center",
          mb: 2,
          mt: 1,
          letterSpacing: "-0.5px",
          background: "linear-gradient(135deg, #8a2387, #e94057, #f27121)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          // 다크모드에서 텍스트가 보이지 않는 경우를 위한 fallback
          ...(isDarkMode && {
            color: "#fff",
            background: "none",
            WebkitTextFillColor: "unset",
          }),
        }}
      >
        공지사항 작성
      </Typography>

      <Divider sx={{ mb: 2, opacity: isDarkMode ? 0.3 : 0.8 }} />

      <Box
        component="form"
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: 3,
        }}
        noValidate
        autoComplete="off"
      >
        <TextField
          required
          id="filled-required"
          label="제목"
          placeholder="공지사항의 제목을 입력해주세요 (3글자 이상)"
          variant="outlined"
          fullWidth
          sx={{
            "& .MuiOutlinedInput-root": {
              borderRadius: "12px",
              backgroundColor: isDarkMode ? "rgba(45, 48, 56, 0.8)" : "rgba(249, 250, 251, 0.8)",
              color: isDarkMode ? "#ffffff" : "inherit",
              transition: "all 0.3s ease",
              "&:hover": {
                backgroundColor: isDarkMode ? "rgba(50, 53, 61, 1)" : "rgba(245, 247, 250, 1)",
                boxShadow: isDarkMode ? "0 2px 8px rgba(0, 0, 0, 0.3)" : "0 2px 8px rgba(0, 0, 0, 0.04)",
              },
              "&.Mui-focused": {
                backgroundColor: isDarkMode ? "rgba(55, 58, 66, 1)" : "#ffffff",
                boxShadow: isDarkMode ? "0 4px 12px rgba(0, 0, 0, 0.4)" : "0 4px 12px rgba(0, 0, 0, 0.05)",
                "& fieldset": {
                  borderColor: "#e94057",
                  borderWidth: "2px",
                },
              },
              "& fieldset": {
                borderColor: isDarkMode ? "rgba(255, 255, 255, 0.2)" : "rgba(0, 0, 0, 0.23)",
              },
            },
            "& .MuiInputLabel-root": {
              fontWeight: 500,
              color: isDarkMode ? "rgba(255, 255, 255, 0.7)" : "inherit",
            },
            "& .MuiInputLabel-root.Mui-focused": {
              color: "#e94057",
            },
            "& .MuiOutlinedInput-input::placeholder": {
              color: isDarkMode ? "rgba(255, 255, 255, 0.5)" : "rgba(0, 0, 0, 0.6)",
              opacity: 1,
            },
          }}
          onChange={(e) => setTitle(e.target.value)}
        />

        {/* TextField content 입력란 제거 - RichTextEditor로 통합 */}
        {/* <TextField /> 기존 content 입력란 제거됨 */}

        {/* InputFileUpload 주석처리 - RichTextEditor로 통합 */}
        {/* <InputFileUpload onPreviewUpdate={handlePreviewUpdate} preview={preview} /> */}

        <RichTextEditor value={content} onChange={setContent} onFilesChange={setEditorFiles} />

        <Divider sx={{ opacity: isDarkMode ? 0.3 : 0.9 }} />

        <Box
          sx={{
            display: "flex",
            width: "100%",
            alignItems: "center", // 세로 방향 가운데 정렬
          }}
        >
          <Button
            onClick={() => router.back()}
            variant="contained"
            sx={{
              // 뒤로가기 버튼 (파란색 계열)
              fontSize: { xs: "0.95rem", sm: "1rem" },
              textTransform: "none",
              fontWeight: 600,
              letterSpacing: "0.5px",
              background: "linear-gradient(135deg, #2196f3, #21cbf3)",
              boxShadow: isDarkMode ? "0 6px 15px rgba(33, 150, 243, 0.5)" : "0 6px 15px rgba(33, 150, 243, 0.3)",
              transition: "all 0.3s ease",
              "&:hover": {
                boxShadow: isDarkMode ? "0 8px 20px rgba(33, 150, 243, 0.6)" : "0 8px 20px rgba(33, 150, 243, 0.4)",
                transform: "translateY(-2px)",
                background: "linear-gradient(135deg, #1976d2, #1e88e5)",
              },
              "&:active": {
                transform: "translateY(0)",
                boxShadow: isDarkMode ? "0 4px 10px rgba(33, 150, 243, 0.5)" : "0 4px 10px rgba(33, 150, 243, 0.3)",
              },
              "&:disabled": {
                background: isDarkMode ? "#333" : "#e0e0e0",
                color: isDarkMode ? "#666" : "#a0a0a0",
                boxShadow: "none",
              },
              borderRadius: "12px 0 0 12px",
              width: { xs: "50%", sm: "30%", md: "25%" },
              height: "40px", // 두 버튼 높이를 동일하게
            }}
          >
            뒤로가기
          </Button>

          <Button
            variant="contained"
            onClick={mutation.mutate}
            disabled={loading || title.length < 3 || content.length < 3}
            sx={{
              fontSize: { xs: "0.95rem", sm: "1rem" },
              textTransform: "none",
              fontWeight: 600,
              letterSpacing: "0.5px",
              background: "linear-gradient(135deg, #8a2387, #e94057, #f27121)",
              boxShadow: isDarkMode ? "0 6px 15px rgba(233, 64, 87, 0.5)" : "0 6px 15px rgba(233, 64, 87, 0.3)",
              transition: "all 0.3s ease",
              "&:hover": {
                boxShadow: isDarkMode ? "0 8px 20px rgba(233, 64, 87, 0.6)" : "0 8px 20px rgba(233, 64, 87, 0.4)",
                transform: "translateY(-2px)",
                background: "linear-gradient(135deg, #7a1d77, #d93a4f, #e2671e)",
              },
              "&:active": {
                transform: "translateY(0)",
                boxShadow: isDarkMode ? "0 4px 10px rgba(233, 64, 87, 0.5)" : "0 4px 10px rgba(233, 64, 87, 0.3)",
              },
              "&:disabled": {
                background: isDarkMode ? "#333" : "#e0e0e0",
                color: isDarkMode ? "#666" : "#a0a0a0",
                boxShadow: "none",
              },
              borderRadius: "0 12px 12px 0",
              width: { xs: "50%", sm: "70%", md: "75%" },
              height: "40px", // 두 버튼 높이를 동일하게
            }}
            startIcon={loading ? <CircularProgress size={20} color="inherit" /> : null}
          >
            {loading ? "공지사항 등록 중..." : "작성하기"}
          </Button>
        </Box>
      </Box>
    </Paper>
  );
}
