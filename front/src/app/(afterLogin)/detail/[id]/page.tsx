"use client";
import { useMessage } from "@/app/store";
import { ImageType, StoryType } from "@/app/types/types";
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
  const [detail, setDetail] = useState<StoryType | null>(null);

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
      console.log("getDetail", getDetail);
      setDetail(getDetail as StoryType);
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
          <div>{detail.created_at}</div>
          <div>{detail.read_count}</div>
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
          {detail.Image && detail.Image.length > 0 && (
            <div>
              <h2>첨부된 이미지:</h2>
              {/* src에 localhost:백엔드 안 적는 이유는 proxy 설정해서 그럼. next.config.js */}
              {detail.Image.map((img: ImageType, index: number) => (
                <div key={img.imageId}>
                  <img src={img.link} alt={`첨부 이미지 ${index + 1}`} style={{ maxWidth: "100%", height: "auto" }} />
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </>
  );
}
