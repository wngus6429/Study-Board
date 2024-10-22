"use client";
import { TextField, Box, Typography, Paper, Button } from "@mui/material";
import { useMutation } from "@tanstack/react-query";
import axios from "axios";
import { useRouter } from "next/navigation";
import React, { FormEvent, useState } from "react";
import { getCookie } from "cookies-next";
import { useMessage } from "@/app/store";

export default function StoryWrite() {
  const Router = useRouter();
  const { showMessage } = useMessage((state) => state);

  const [title, setTitle] = useState<string>("");
  const [content, setContent] = useState<string>("");

  // useMutation 훅 사용
  const mutation = useMutation({
    mutationFn: async (e: FormEvent) => {
      e.preventDefault();
      return axios.post(
        `${process.env.NEXT_PUBLIC_BASE_URL}/api/story/create`,
        {
          title,
          content,
        },
        {
          withCredentials: true, // 쿠키 전송을 허용
        }
      );
    },
    onSuccess: (data) => {
      console.log("Response Data:", data);
      showMessage("글쓰기 완료", "error");
      Router.push("/");
    },
    onError: (error) => {
      // 요청 실패 시 처리 로직
      alert("글 작성에 실패했습니다.");
      console.error(error);
    },
  });
  return (
    <Paper elevation={3} sx={{ p: 4, width: "600px", margin: "auto", mt: 5 }}>
      <Typography variant="h5" gutterBottom>
        글 작성하기
      </Typography>
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
        <Button variant="contained" color="success" onClick={mutation.mutate}>
          등록
        </Button>
      </Box>
    </Paper>
  );
}
