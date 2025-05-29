"use client";
import { TextField, Box, Typography, Paper, Button, CircularProgress, Divider, useTheme } from "@mui/material";
import { useMutation } from "@tanstack/react-query";
import axios from "axios";
import { useRouter } from "next/navigation";
import React, { FormEvent, useState } from "react";
import CustomSelect from "@/app/components/common/CustomSelect";
import InputFileUpload from "@/app/components/common/InputFileUpload";
import { useMessage } from "@/app/store/messageStore";
import { DEFAULT_SELECT_OPTION, WRITE_SELECT_OPTIONS } from "@/app/const/WRITE_CONST";

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

export default function StoryWrite() {
  const router = useRouter();
  const { showMessage } = useMessage((state) => state);
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === "dark";

  // 제목 변수
  const [title, setTitle] = useState<string>("");
  // 내용 변수
  const [content, setContent] = useState<string>("");
  // 카테고리 변수
  const [selectedCategory, setSelectedCategory] = useState<string>(DEFAULT_SELECT_OPTION);
  // 이미지 변수
  const [preview, setPreview] = useState<Array<{ dataUrl: string; file: File } | null>>([]);
  // 로딩
  const [loading, setLoading] = useState<boolean>(false);

  // useMutation 훅 사용
  const mutation = useMutation({
    mutationFn: async (e: FormEvent) => {
      if (title.length > 2 && content.length > 2) {
        setLoading(true);
        e.preventDefault();

        // FormData 객체 생성
        const formData = new FormData();
        formData.append("category", selectedCategory);
        formData.append("title", title);
        formData.append("content", content);

        // preview의 각 파일을 'images' 키로 추가
        preview.forEach((item) => {
          if (item?.file) {
            formData.append("images", item.file); // 'images'는 서버의 FilesInterceptor와 일치해야 합니다.
          }
        });

        return await axios.post(`${process.env.NEXT_PUBLIC_BASE_URL}/api/story/create`, formData, {
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
      showMessage("글쓰기 완료", "info");
      router.push("/");
    },
    onError: (error) => {
      showMessage("글쓰기 실패, 이전 화면으로 이동합니다", "error");
      console.error(error);
      router.back();
    },
  });

  const handlePreviewUpdate = (updatedPreview: Array<{ dataUrl: string; file: File } | null>) => {
    setPreview(updatedPreview);
  };

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
        스토리 작성
      </Typography>

      <Box>
        <CustomSelect
          selectArray={WRITE_SELECT_OPTIONS}
          defaultValue={DEFAULT_SELECT_OPTION}
          setSelectedCategory={setSelectedCategory}
        />
      </Box>

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
          placeholder="스토리의 제목을 입력해주세요 (3글자 이상)"
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

        <TextField
          id="filled-multiline-flexible"
          label="내용"
          placeholder="스토리 내용을 자유롭게 작성해주세요 (3글자 이상)"
          multiline
          rows={6}
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
          onChange={(e) => setContent(e.target.value)}
        />

        <InputFileUpload onPreviewUpdate={handlePreviewUpdate} preview={preview} />

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
            {loading ? "스토리 등록 중..." : "작성하기"}
          </Button>
        </Box>
      </Box>
    </Paper>
  );
}
