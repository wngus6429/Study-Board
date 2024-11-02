"use client";
import { useMessage } from "@/app/store";
import { Story } from "@/app/types/story";
import { Button, Select } from "@mui/material";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useParams, useRouter } from "next/navigation";
import { ReactNode, useEffect, useState } from "react";

export default function page(): ReactNode {
  const params = useParams(); // URL 파라미터에서 id를 가져옴
  const { showMessage } = useMessage((state) => state);
  const router = useRouter();
  const queryClient = useQueryClient();
  const [detail, setDetail] = useState<Story | null>(null);

  const {
    data: getDetail,
    error,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["story", "detail", params?.id],
    queryFn: async () => {
      const response = await axios.get(`${process.env.NEXT_PUBLIC_BASE_URL}/api/story/detail/${params?.id}`);
      return response.data; // 데이터를 반환하여 `data`에 할당
    },
    enabled: !!params?.id, // params.id가 있을 때만 쿼리를 실행
  });

  useEffect(() => {
    if (getDetail) {
      setDetail(getDetail);
    }
  }, [getDetail]);

  const deleteData = useMutation({
    mutationFn: async (storyId: number) => {
      return await axios.delete(`${process.env.NEXT_PUBLIC_BASE_URL}/api/story/${storyId}`, { withCredentials: true });
    },
    onSuccess() {
      console.log("확인용", ["story", "detail", params?.id]);
      // queryClient.removeQueries({ queryKey: ["story", "detail", params?.id] }); // 쿼리 완전히 삭제
      if (params?.id) {
        console.log("실행");
        queryClient.removeQueries({ queryKey: ["story", "detail", String(params.id)] }); // 쿼리 키를 명확하게 지정하여 삭제
      }
      showMessage("삭제 성공", "error");
      router.push("/"); // 삭제 후 홈 또는 목록 페이지로 이동
    },
    onError: (error: any) => {
      if (error.response && error.response.data.statusCode === 401) {
        showMessage(`${error.response.data.message}`, "error");
      } else if (error.response && error.response.data.statusCode === 404) {
        showMessage(`${error.response.data.message}`, "error");
      } else {
        showMessage("삭제 중 오류가 발생했습니다.", "error");
      }
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
              console.log("detail.id", detail.id);
              deleteData.mutate(detail.id);
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
