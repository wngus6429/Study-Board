"use client";
import { TextField, Box, Typography, Paper, Button, CircularProgress } from "@mui/material";
import { useMutation } from "@tanstack/react-query";
import axios from "axios";
import { useRouter } from "next/navigation";
import React, { FormEvent, useState } from "react";
import { useMessage } from "@/app/store";
import CustomSelect from "@/app/components/common/CustomSelect";
import { WRITE_SELECT_OPTIONS } from "@/app/const/writeconsts";

export default function StoryWrite() {
  const Router = useRouter();
  const { showMessage } = useMessage((state) => state);

  const [loading, setLoading] = useState<boolean>(false);
  const [title, setTitle] = useState<string>("");
  const [content, setContent] = useState<string>("");

  // useMutation 훅 사용
  const mutation = useMutation({
    mutationFn: async (e: FormEvent) => {
      if (title.length > 2 && content.length > 2) {
        setLoading(true);
        e.preventDefault();
        return axios
          .post(
            `${process.env.NEXT_PUBLIC_BASE_URL}/api/story/create`,
            {
              title,
              content,
            },
            {
              withCredentials: true, // 쿠키 전송을 허용
            }
          )
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
    <Paper elevation={3} sx={{ p: 4, width: "600px", margin: "auto", mt: 5 }}>
      <Typography variant="h5" gutterBottom>
        글 작성하기
      </Typography>
      <CustomSelect selectArray={WRITE_SELECT_OPTIONS} defaultValue={WRITE_SELECT_OPTIONS[0]["name"]} />
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
          label="제목"
          defaultValue=""
          variant="filled"
          fullWidth
          onChange={(e) => setTitle(e.target.value)}
        />
        <TextField
          id="filled-multiline-flexible"
          label="내용"
          multiline
          rows={6}
          variant="filled"
          fullWidth
          onChange={(e) => setContent(e.target.value)}
        />
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
