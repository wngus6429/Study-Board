"use client";
import Loading from "@/app/components/common/Loading";
import { useComment, useMessage } from "@/app/store";
import { ImageType, StoryType } from "@/app/types/types";
import { Box, Button, Card, CardContent, CardMedia, Typography } from "@mui/material";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import dayjs from "dayjs";
import { useRouter } from "next/navigation";
import { ReactNode, useEffect, useState } from "react";
import LocalOfferIcon from "@mui/icons-material/LocalOffer";
import { useSession } from "next-auth/react";

export default function page({ params }: { params: { id: string } }): ReactNode {
  // const params = useParams(); // Next.js 13 이상에서 App Directory를 사용하면, page 컴포넌트는 URL 매개변수(파라미터)를 props로 받을 수 있습니다.
  const { showMessage } = useMessage((state) => state);
  const router = useRouter();
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const { openCloseComments } = useComment(); // 댓글 관리

  const [isDeleted, setIsDeleted] = useState<boolean>(false); // 삭제 상태 추가
  const [detail, setDetail] = useState<StoryType | null>(null);

  //! 상세 데이터 가져오기
  const {
    data: getDetail,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["story", "detail", params?.id],
    queryFn: async () => {
      const response = await axios.get(`${process.env.NEXT_PUBLIC_BASE_URL}/api/story/detail/${params?.id}`);
      return response.data;
    },
    enabled: !!params?.id && !isDeleted, // 삭제 후 쿼리 비활성화
  });

  //! 데이터 없으면 not-found 위치로 이동
  useEffect(() => {
    if (isError && !isDeleted) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        router.replace("/not-found"); // 404 페이지로 이동
      } else {
        showMessage("오류가 발생했습니다. 다시 시도해주세요.", "error");
      }
    }
  }, [isError, error, router, isDeleted]);

  //! 데이터 받아오고, 댓글 상태 업데이트
  useEffect(() => {
    if (getDetail) {
      console.log("getDetail", getDetail);
      setDetail(getDetail as StoryType);
      if (getDetail.Comments) {
        openCloseComments(true, getDetail.Comments); // 상태 업데이트 호출
      } else {
        showMessage("Comments 데이터가 없습니다.", "error");
      }
    }
    return () => {
      openCloseComments(false, "");
    };
    // 컴포넌트 언마운트 또는 useEffect의 의존성이 변경되기 전에 실행되는
    // "정리 작업(cleanup)"을 정의한 부분으로, 댓글 창 상태를 초기화하거나 닫는 역할을 합니다.
  }, [getDetail]);

  const deleteData = useMutation({
    mutationFn: async (storyId: number) => {
      return await axios.delete(`${process.env.NEXT_PUBLIC_BASE_URL}/api/story/${storyId}`, { withCredentials: true });
    },
    onSuccess() {
      queryClient.removeQueries({ queryKey: ["story", "detail", params?.id] });
      setIsDeleted(true); // 삭제 상태 업데이트
      showMessage("삭제 성공", "success");
      router.push("/");
    },
    onError: (error: any) => {
      if (error.response && error.response.data.code === 404) {
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
    <Box display="flex" justifyContent="center" alignItems="center" sx={{ padding: 2, overflow: "hidden" }}>
      {detail && (
        <Card sx={{ width: "100%", boxShadow: 3, padding: 2 }}>
          <CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="center" marginBottom={2}>
              <Typography variant="h4" component="div">
                {detail.title}
              </Typography>
              {detail.User.id === session?.user.id && detail.category !== "question" && (
                <Box>
                  <Button
                    size="medium"
                    variant="contained"
                    color="warning"
                    onClick={(e) => {
                      e.preventDefault();
                      router.push(`/edit/${detail.id}`);
                    }}
                  >
                    수정하기
                  </Button>
                  <Button
                    size="medium"
                    variant="contained"
                    color="error"
                    sx={{ marginLeft: 1 }}
                    onClick={(e) => {
                      e.preventDefault();
                      deleteData.mutate(detail.id);
                    }}
                  >
                    삭제
                  </Button>
                </Box>
              )}
            </Box>
            <Typography variant="subtitle2" color="text.secondary" sx={{ marginBottom: 2 }}>
              <LocalOfferIcon fontSize="small" sx={{ marginRight: 0.5 }} />
              종류: {detail.category}
            </Typography>
            <Box display="flex" justifyContent="space-between" marginBottom={2}>
              <Typography variant="subtitle2" color="text.secondary">
                작성자: {detail.User.nickname}
                <div>
                  <Button
                    onClick={() => router.push("/")}
                    size="medium"
                    variant="contained"
                    color="error"
                    sx={{ marginTop: "10px" }}
                  >
                    뒤로가기
                  </Button>
                </div>
              </Typography>
              <Box textAlign="right">
                <Typography variant="subtitle2" color="text.secondary">
                  작성일: {dayjs(detail.created_at).format("YYYY/MM/DD HH:mm:ss")}
                </Typography>
                <Typography variant="subtitle2" color="text.secondary">
                  조회수: {detail.read_count}
                </Typography>
              </Box>
            </Box>
            <Typography variant="body1" color="text.secondary" marginBottom={2}>
              {detail.content}
            </Typography>
          </CardContent>
          {detail.Image && detail.Image.length > 0 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                첨부된 이미지:
              </Typography>
              <Box
                sx={{
                  display: "flex",
                  flexWrap: "wrap", // 줄바꿈 처리
                  justifyContent: "center", // 중앙 정렬
                  gap: 1, // 이미지 간 간격
                }}
              >
                {detail.Image.map((img: ImageType, index: number) => {
                  // 마지막 이미지를 조건으로 처리
                  const isLastOddImage = index === detail.Image.length - 1 && detail.Image.length % 2 !== 0;

                  return (
                    <CardMedia
                      key={`${img.imageId}-${index}`}
                      component="img"
                      image={img.link}
                      alt={`첨부 이미지 ${index + 1}`}
                      sx={{
                        width: isLastOddImage ? "70%" : "calc(50% - 8px)", // 홀수 마지막 이미지는 70%
                        margin: isLastOddImage ? "0 auto" : undefined, // 홀수 마지막 이미지를 가운데 정렬
                        borderRadius: 1,
                      }}
                    />
                  );
                })}
              </Box>
            </Box>
          )}
        </Card>
      )}
    </Box>
  );
}
