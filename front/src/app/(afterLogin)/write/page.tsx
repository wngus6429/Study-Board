"use client";
import { TextField, Box, Typography, Paper, Button, CircularProgress } from "@mui/material";
import { useMutation } from "@tanstack/react-query";
import axios from "axios";
import { useRouter } from "next/navigation";
import React, { FormEvent, useState } from "react";
import { useMessage } from "@/app/store";
import CustomSelect from "@/app/components/common/CustomSelect";
import { DEFAULT_SELECT_OPTION, WRITE_SELECT_OPTIONS } from "@/app/const/WRITE_CONST";
import InputFileUpload from "@/app/components/common/InputFileUpload";

export default function StoryWrite() {
  const Router = useRouter();
  const { showMessage } = useMessage((state) => state);
  // 로딩
  const [loading, setLoading] = useState<boolean>(false);
  // 타이틀과 내용
  const [title, setTitle] = useState<string>("");
  const [content, setContent] = useState<string>("");
  // 카테고리 변수
  const [selectedCategory, setSelectedCategory] = useState<string>(DEFAULT_SELECT_OPTION);
  // 이미지 변수
  const [preview, setPreview] = useState<Array<{ dataUrl: string; file: File } | null>>([]);

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

        console.log("글쓰기", preview);

        return await axios
          .post(`${process.env.NEXT_PUBLIC_BASE_URL}/api/story/create`, formData, {
            withCredentials: true,
            headers: {
              "Content-Type": "multipart/form-data",
            },
          })
          .finally(() => setLoading(false));
      } else {
        showMessage("제목과 내용을 3글자 이상 입력해주세요", "error");
      }
    },
    onSuccess: (data) => {
      showMessage("글쓰기 완료", "info");
      Router.push("/");
    },
    onError: (error) => {
      showMessage("글쓰기 실패", "error");
      console.error(error);
    },
  });

  return (
    <Paper elevation={3} sx={{ p: 4, width: "60%", margin: "auto", mt: 5 }}>
      <Typography variant="h5" gutterBottom sx={{ mb: 3 }}>
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
          gap: 3, // 필드 간의 간격
        }}
        noValidate
        autoComplete="off"
      >
        <TextField
          required
          id="filled-required"
          label="제목, 3글자 이상"
          defaultValue=""
          variant="filled"
          fullWidth
          onChange={(e) => setTitle(e.target.value)}
        />
        <TextField
          id="filled-multiline-flexible"
          label="내용, 3글자 이상"
          multiline
          rows={6}
          variant="filled"
          fullWidth
          onChange={(e) => setContent(e.target.value)}
        />
        <InputFileUpload onPreviewUpdate={setPreview} />
        <Button
          variant="contained"
          color="success"
          onClick={mutation.mutate}
          disabled={title.length < 3 || content.length < 3}
        >
          {loading ? <CircularProgress size={24} color="inherit" /> : "등록"}
        </Button>
      </Box>
    </Paper>
  );
}
