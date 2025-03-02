"use client";
import { TextField, Box, Typography, Paper, Button, CircularProgress } from "@mui/material";
import { useMutation } from "@tanstack/react-query";
import axios from "axios";
import { useRouter } from "next/navigation";
import React, { FormEvent, useState } from "react";
import CustomSelect from "@/app/components/common/CustomSelect";
import InputFileUpload from "@/app/components/common/InputFileUpload";
import { useMessage } from "@/app/store/messageStore";
import { DEFAULT_SELECT_OPTION, WRITE_SELECT_OPTIONS } from "@/app/const/WRITE_CONST";

export default function StoryWrite() {
  const router = useRouter();
  const { showMessage } = useMessage((state) => state);

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
      elevation={4}
      sx={{
        p: 5,
        width: "50%",
        margin: "auto",
        mt: 4,
        borderRadius: 3,
        boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.2)",
        bgcolor: "background.paper",
      }}
    >
      <Typography
        variant="h4"
        gutterBottom
        sx={{
          fontWeight: "bold",
          textAlign: "center",
          color: "primary.main",
          mb: 2,
        }}
      >
        글 작성하기
      </Typography>
      <CustomSelect
        selectArray={WRITE_SELECT_OPTIONS}
        defaultValue={DEFAULT_SELECT_OPTION}
        setSelectedCategory={setSelectedCategory}
      />
      <Box
        component="form"
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: 2,
          alignItems: "center",
        }}
        noValidate
        autoComplete="off"
      >
        <TextField
          required
          id="filled-required"
          label="제목 (3글자 이상)"
          variant="outlined"
          fullWidth
          sx={{
            maxWidth: "90%",
            bgcolor: "background.default",
            borderRadius: 2,
          }}
          onChange={(e) => setTitle(e.target.value)}
        />
        <TextField
          id="filled-multiline-flexible"
          label="내용 (3글자 이상)"
          multiline
          rows={8}
          variant="outlined"
          fullWidth
          sx={{
            maxWidth: "90%",
            bgcolor: "background.default",
            borderRadius: 2,
          }}
          onChange={(e) => setContent(e.target.value)}
        />
        <InputFileUpload onPreviewUpdate={handlePreviewUpdate} preview={preview} />
        <Button
          variant="contained"
          color="success"
          onClick={mutation.mutate}
          disabled={loading || title.length < 3 || content.length < 3}
          sx={{
            width: "40%",
            fontWeight: "bold",
            fontSize: "1.1rem",
          }}
          startIcon={loading ? <CircularProgress size={20} /> : null}
        >
          등록
        </Button>
      </Box>
    </Paper>
  );
}
