"use client";
import { useMessage } from "@/app/store";
import { Story } from "@/app/types/story";
import { Button } from "@mui/material";
import { useMutation } from "@tanstack/react-query";
import axios from "axios";
import { useParams, useRouter } from "next/navigation";
import { ReactNode, useEffect, useState } from "react";

export default function page(): ReactNode {
  const params = useParams(); // URL 파라미터에서 id를 가져옴
  const { showMessage } = useMessage((state) => state);
  const router = useRouter();
  const [detail, setDetail] = useState<Story | null>(null);

  const getDetail = async (id: string) => {
    console.log("아이디", id);
    const response = await axios.get(`${process.env.NEXT_PUBLIC_BASE_URL}/api/story/detail/${id}`);
    setDetail(response.data);
  };

  useEffect(() => {
    const id = params?.id ?? null;
    if (id != null) {
      getDetail(id as string);
    }
  }, [params?.id]);

  const deleteData = useMutation({
    mutationFn: async (storyId: number) => {
      return await axios.delete(`${process.env.NEXT_PUBLIC_BASE_URL}/api/story/${storyId}`, { withCredentials: true });
    },
    onSuccess() {
      showMessage("삭제 성공", "error");
      router.push("/"); // 삭제하고 이동
    },
    onError() {
      showMessage("삭제 실패", "error");
    },
  });

  // TODO : comments 테이블 만들어서 엮기
  return (
    <>
      {detail && (
        <>
          <div>{detail.title}</div>
          <div>{detail.content}</div>
          <div>{detail.nickname}</div>
          <div>{detail.createdAt}</div>
          <div>{detail.readCount}</div>
          <Button
            sx={{ padding: "0px" }}
            size="small"
            variant="outlined"
            onClick={(e) => {
              e.preventDefault();
              deleteData.mutate(detail.id);
            }}
            color="warning"
          >
            수정하기
          </Button>
          <Button
            sx={{ padding: "0px" }}
            size="small"
            variant="outlined"
            onClick={(e) => {
              e.preventDefault();
              deleteData.mutate(id);
            }}
            color="error"
          >
            삭제
          </Button>
        </>
      )}
    </>
  );
}
