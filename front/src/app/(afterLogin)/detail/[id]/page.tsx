"use client";
import Loading from "@/app/components/common/Loading";
import { useMessage } from "@/app/store";
import { ImageType, StoryType } from "@/app/types/types";
import { Box, Button, Card, CardActions, CardContent, CardMedia, Typography } from "@mui/material";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import dayjs from "dayjs";
import { useParams, useRouter } from "next/navigation";
import { ReactNode, useEffect, useState } from "react";

export default function page(): ReactNode {
  const params = useParams(); // URL 파라미터에서 id를 가져옴
  const { showMessage } = useMessage((state) => state);
  const router = useRouter();
  const queryClient = useQueryClient();
  const [detail, setDetail] = useState<StoryType | null>(null);

  const { data: getDetail, isLoading } = useQuery({
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
      router.push("/");
    },
    onError: (error: any) => {
      if (error.response && error.response.data.code === 404) {
        // 404 에러 처리
        showMessage(`${error.response.data.data}`, "error"); // 서버에서 전달한 메시지 표시
      } else if (error.response && error.response.data.code === 401) {
        showMessage(`${error.response.data.data}`, "error");
      } else {
        showMessage("삭제 중 오류가 발생했습니다.", "error");
      }
    },
  });

  if (isLoading) return <Loading />;

  // TODO : comments 테이블 만들어서 엮기
  return (
    <Box display="flex" justifyContent="center" alignItems="center" padding={2}>
      {detail && (
        <Card sx={{ width: "100%", boxShadow: 3, padding: 2 }}>
          <CardContent>
            <Typography
              variant="h4"
              component="div"
              gutterBottom
              sx={{ display: "flex", justifyContent: "space-between" }}
            >
              <div>{detail.title}</div>
              <div>
                <Button
                  size="small"
                  variant="contained"
                  color="warning"
                  onClick={(e) => {
                    e.preventDefault();
                    deleteData.mutate(detail.id);
                  }}
                >
                  수정하기
                </Button>
                <Button
                  size="small"
                  variant="contained"
                  color="error"
                  onClick={(e) => {
                    e.preventDefault();
                    deleteData.mutate(detail.id);
                  }}
                >
                  삭제
                </Button>
              </div>
            </Typography>
            <Typography
              variant="subtitle2"
              color="text.secondary"
              gutterBottom
              sx={{ display: "flex", justifyContent: "space-between" }}
            >
              <div>작성자: {detail.nickname}</div>
              <div>
                작성일: {dayjs(detail.created_at).format("YYYY/MM/DD HH:mm:ss")}
                <div>조회수: {detail.read_count}</div>
              </div>
            </Typography>
            <Typography variant="body1" color="text.secondary" gutterBottom>
              {detail.content}
            </Typography>
          </CardContent>
          {detail.Image && detail.Image.length > 0 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                첨부된 이미지:
              </Typography>
              {detail.Image.map((img: ImageType, index: number) => (
                <CardMedia
                  /* src에 localhost:백엔드 안 적는 이유는 proxy 설정해서 그럼. next.config.js */
                  key={`${img.imageId}-${index}`}
                  component="img"
                  image={img.link}
                  alt={`첨부 이미지 ${index + 1}`}
                  sx={{ marginY: 1, borderRadius: 1 }}
                />
              ))}
            </Box>
          )}
        </Card>
      )}
    </Box>
  );
}
