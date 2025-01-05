"use client";
import Loading from "@/app/components/common/Loading";
import { ImageType, StoryImageType, StoryType } from "@/app/types/types";
import { Avatar, Box, Button, Card, CardContent, CardMedia, Typography } from "@mui/material";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import dayjs from "dayjs";
import { useRouter } from "next/navigation";
import { ReactNode, useEffect, useState } from "react";
import LocalOfferIcon from "@mui/icons-material/LocalOffer";
import { useSession } from "next-auth/react";
import { useMessage } from "@/app/store/messageStore";
import { useComment } from "@/app/store/commentStore";
import ConfirmDialog from "@/app/components/common/ConfirmDialog";
import ErrorView from "@/app/components/common/ErrorView";

export default function page({ params }: { params: { id: string } }): ReactNode {
  // const params = useParams(); // Next.js 13 이상에서 App Directory를 사용하면, page 컴포넌트는 URL 매개변수(파라미터)를 props로 받을 수 있습니다.
  const { showMessage } = useMessage((state) => state);
  const router = useRouter();
  const { data: session } = useSession();
  const queryClient = useQueryClient();

  const [isDeleted, setIsDeleted] = useState<boolean>(false); // 삭제 상태 추가
  const { openCloseComments } = useComment();

  //! 상세 데이터 가져오기
  const {
    data: detail,
    isLoading,
    isError,
    error,
  } = useQuery<StoryType>({
    queryKey: ["story", "detail", params?.id],
    queryFn: async () => {
      const response = await axios.get(`${process.env.NEXT_PUBLIC_BASE_URL}/api/story/detail/${params?.id}`);
      return response.data;
    },
    // isDeleted 안 쓰면 삭제 후 API 요청이 되어 오류 발생
    enabled: !!params?.id && !isDeleted,
    staleTime: 1000 * 60 * 5, // 5분 동안 데이터 신선 상태 유지
  });

  useEffect(() => {
    if (detail != null) {
      console.log("상세데이터", detail);
      openCloseComments(true);
    }
    return () => {
      openCloseComments(false);
    };
  }, [detail]);

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

  const deleteData = useMutation({
    mutationFn: async (storyId: number) => {
      return await axios.delete(`${process.env.NEXT_PUBLIC_BASE_URL}/api/story/${storyId}`, { withCredentials: true });
    },
    onSuccess() {
      queryClient.removeQueries({ queryKey: ["story", "detail", params?.id] });
      setIsDeleted(true); // 삭제 상태 업데이트, 다시 API 요청 방지
      showMessage("삭제 성공", "success");
      router.push("/");
    },
    onError: (error: any) => {
      if (error.response && error.response.data.code === 404) {
        showMessage(`${error.response.data.data}`, "error");
      } else if (error.response && error.response.data.code === 401) {
        showMessage(`${error.response.data.data}`, "error");
      } else {
        showMessage("삭제 중 오류가 발생했습니다.", "error");
      }
    },
  });

  const [openConfirmDialog, setOpenConfirmDialog] = useState(false);
  const [detailToDelete, setDetailToDelete] = useState<number | null>(null);

  const handleDeleteClick = (id: number) => {
    setDetailToDelete(id);
    setOpenConfirmDialog(true);
  };

  const confirmDelete = () => {
    if (detailToDelete !== null) {
      deleteData.mutate(detailToDelete);
      setDetailToDelete(null);
      setOpenConfirmDialog(false);
    }
  };

  const cancelDelete = () => {
    setDetailToDelete(null);
    setOpenConfirmDialog(false);
  };

  if (isLoading) return <Loading />;

  if (isError) return <ErrorView />;

  return (
    <Box display="flex" justifyContent="center" alignItems="center" sx={{ padding: 2, overflow: "hidden" }}>
      {openConfirmDialog && (
        <ConfirmDialog
          open={openConfirmDialog}
          title="글 삭제"
          description="글을 삭제하시겠습니까? 삭제된 글은 복구할 수 없습니다."
          onConfirm={confirmDelete}
          onCancel={cancelDelete}
          confirmText="삭제"
          cancelText="취소"
        />
      )}
      {detail && (
        <Card sx={{ width: "100%", boxShadow: 3, padding: 2 }}>
          <CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="center" marginBottom={2}>
              <Typography variant="h4" component="div">
                {detail.title}
              </Typography>
              {detail?.category !== "question" && detail.User?.id === session?.user?.id && (
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
                    修正
                  </Button>
                  <Button
                    size="medium"
                    variant="contained"
                    color="error"
                    sx={{ marginLeft: 1 }}
                    onClick={(e) => {
                      e.preventDefault();
                      handleDeleteClick(detail.id);
                    }}
                  >
                    削除
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
                <Box sx={{ display: "flex" }}>
                  작성자:
                  <Avatar
                    src={`${process.env.NEXT_PUBLIC_BASE_URL}${detail.User.avatar}`}
                    sx={{ width: 40, height: 40, marginRight: 1 }}
                  />
                  {detail.User.nickname}
                </Box>
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
          {detail.StoryImage && detail.StoryImage.length > 0 && (
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
                {detail.StoryImage.map((img: StoryImageType, index: number) => {
                  const isLastOddImage = index === detail.StoryImage.length - 1 && detail.StoryImage.length % 2 !== 0;

                  return (
                    <CardMedia
                      key={`${img.id}-${index}`}
                      component="img"
                      image={`${img.link}?timestamp=${new Date().getTime()}`}
                      alt={`イメージ${img.image_name}`}
                      sx={{
                        flexBasis: isLastOddImage ? "100%" : "calc(50% - 8px)", // 마지막 홀수 이미지는 100% 너비
                        maxWidth: isLastOddImage ? "100%" : "calc(50% - 8px)", // 최대 50% 너비
                        margin: isLastOddImage ? "0 auto" : undefined, // 홀수 마지막 이미지를 가운데 정렬
                        borderRadius: 1,
                        objectFit: "contain", // 이미지 비율 유지
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
