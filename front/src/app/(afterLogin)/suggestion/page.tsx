"use client";
import { TextField, Box, Typography, Paper, Button, CircularProgress } from "@mui/material";
import { useMutation } from "@tanstack/react-query";
import axios from "axios";
import { useRouter } from "next/navigation";
import React, { FormEvent, useState } from "react";
import CustomSelect from "@/app/components/common/CustomSelect";
import InputFileUpload from "@/app/components/common/InputFileUpload";
import { useMessage } from "@/app/store/messageStore";
import { DEFAULT_FEEDBACK_OPTION, FEEDBACK_SELECT_OPTIONS } from "@/app/const/WRITE_CONST";

export default function FeedbackWrite() {
  const router = useRouter();
  const { showMessage } = useMessage((state) => state);

  // 상태 관리
  const [title, setTitle] = useState<string>("");
  const [content, setContent] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>(DEFAULT_FEEDBACK_OPTION);
  const [preview, setPreview] = useState<Array<{ dataUrl: string; file: File } | null>>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const mutation = useMutation({
    mutationFn: async (e: FormEvent) => {
      e.preventDefault();
      if (title.length > 2 && content.length > 2) {
        setLoading(true);
        const formData = new FormData();
        formData.append("category", selectedCategory);
        formData.append("title", title);
        formData.append("content", content);
        preview.forEach((item) => {
          if (item?.file) {
            formData.append("images", item.file);
          }
        });
        return await axios.post(`${process.env.NEXT_PUBLIC_BASE_URL}/api/feedback/create`, formData, {
          withCredentials: true,
          headers: { "Content-Type": "multipart/form-data" },
        });
      } else {
        showMessage("제목과 내용을 3글자 이상 입력해주세요", "error");
      }
    },
    retry: 1,
    retryDelay: () => 2000,
    onSuccess: (data) => {
      setLoading(false);
      showMessage("글 작성 완료", "info");
      router.push("/");
    },
    onError: (error) => {
      showMessage("글 작성 실패, 이전 화면으로 이동합니다", "error");
      console.error(error);
      router.back();
    },
  });

  const handlePreviewUpdate = (updatedPreview: Array<{ dataUrl: string; file: File } | null>) => {
    setPreview(updatedPreview);
  };

  return (
    <Paper
      elevation={3}
      sx={{
        p: { xs: 3, md: 5 },
        width: { xs: "95%", sm: "80%", md: "60%" },
        maxWidth: "800px",
        margin: "auto",
        mt: 6,
        mb: 6,
        borderRadius: 2,
        boxShadow: "0 10px 30px rgba(0, 0, 0, 0.08)",
        background: "#ffffff",
        overflow: "hidden",
        position: "relative",
        "&::before": {
          content: '""',
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "4px",
          background: "linear-gradient(90deg, #3a8eff, #6f42c1)",
        },
      }}
    >
      <Typography
        variant="h4"
        sx={{
          fontWeight: 600,
          textAlign: "center",
          mb: 4,
          color: "#333",
          fontSize: { xs: "1.8rem", md: "2.2rem" },
          letterSpacing: "-0.5px",
        }}
      >
        피드백 작성
      </Typography>

      <Box sx={{ mb: 4 }}>
        <CustomSelect
          selectArray={FEEDBACK_SELECT_OPTIONS}
          defaultValue={DEFAULT_FEEDBACK_OPTION}
          setSelectedCategory={setSelectedCategory}
        />
      </Box>

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
          id="title-input"
          label="제목"
          placeholder="3글자 이상 입력해주세요"
          variant="outlined"
          fullWidth
          sx={{
            "& .MuiOutlinedInput-root": {
              borderRadius: 1.5,
              backgroundColor: "#fafafa",
              transition: "all 0.3s",
              "&:hover": {
                backgroundColor: "#f5f5f5",
              },
              "&.Mui-focused": {
                backgroundColor: "#fff",
                "& fieldset": {
                  borderColor: "#3a8eff",
                  borderWidth: "2px",
                },
              },
            },
          }}
          onChange={(e) => setTitle(e.target.value)}
        />

        <TextField
          id="content-input"
          label="내용"
          placeholder="3글자 이상 입력해주세요"
          multiline
          rows={8}
          variant="outlined"
          fullWidth
          sx={{
            "& .MuiOutlinedInput-root": {
              borderRadius: 1.5,
              backgroundColor: "#fafafa",
              transition: "all 0.3s",
              "&:hover": {
                backgroundColor: "#f5f5f5",
              },
              "&.Mui-focused": {
                backgroundColor: "#fff",
                "& fieldset": {
                  borderColor: "#3a8eff",
                  borderWidth: "2px",
                },
              },
            },
          }}
          onChange={(e) => setContent(e.target.value)}
        />

        <Box sx={{ my: 1 }}>
          <InputFileUpload onPreviewUpdate={handlePreviewUpdate} preview={preview} />
        </Box>

        <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
          <Button
            variant="contained"
            onClick={(e) => mutation.mutate(e)}
            disabled={loading || title.length < 3 || content.length < 3}
            sx={{
              width: { xs: "100%", sm: "60%", md: "50%" },
              py: 1.5,
              fontSize: "1rem",
              textTransform: "none",
              borderRadius: 2,
              background: "linear-gradient(90deg, #3a8eff, #6f42c1)",
              boxShadow: "0 4px 12px rgba(58, 142, 255, 0.3)",
              transition: "all 0.3s",
              "&:hover": {
                boxShadow: "0 6px 16px rgba(58, 142, 255, 0.4)",
                background: "linear-gradient(90deg, #3a7eff, #6732c1)",
                transform: "translateY(-1px)",
              },
              "&:disabled": {
                background: "#e0e0e0",
                color: "#a0a0a0",
              },
            }}
            startIcon={loading ? <CircularProgress size={20} color="inherit" /> : null}
          >
            {loading ? "등록 중..." : "건의하기"}
          </Button>
        </Box>
      </Box>
    </Paper>
  );
}
