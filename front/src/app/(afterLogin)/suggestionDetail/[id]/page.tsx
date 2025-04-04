"use client";
import Loading from "@/app/components/common/Loading";
import { Avatar, Box, Button, Card, CardContent, CircularProgress, Typography } from "@mui/material";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import dayjs from "dayjs";
import { useRouter } from "next/navigation";
import { ReactNode, useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { useMessage } from "@/app/store/messageStore";
import ConfirmDialog from "@/app/components/common/ConfirmDialog";
import ErrorView from "@/app/components/common/ErrorView";
import Link from "next/link";
import ImageCard from "@/app/components/ImageCard";
import { SuggestionImageType } from "@/app/types/imageTypes";
// MODIFIED: SuggestionType 타입 사용 (건의사항 상세 데이터)
// import { SuggestionType } from "@/app/types/suggestionDetailType";

export default function page({ params }: { params: { id: string } }): ReactNode {
  const { showMessage } = useMessage((state) => state);
  const router = useRouter();
  const { data: session } = useSession();
  const queryClient = useQueryClient();

  const [isDeleted, setIsDeleted] = useState<boolean>(false);

  //! 건의사항 상세 데이터 가져오기
  const {
    data: detail,
    isLoading,
    isError,
    error,
  } = useQuery<any>({
    queryKey: ["suggestion", "detail", params?.id],
    queryFn: async () => {
      const response = await axios.get(`${process.env.NEXT_PUBLIC_BASE_URL}/api/suggestion/detail/${params?.id}`, {
        withCredentials: true,
      });
      console.log("오옹", response);
      return response.data;
    },
    retry: 1,
    retryDelay: () => 2000,
    enabled: !!params?.id && !isDeleted,
    staleTime: 1000 * 60 * 4,
    gcTime: 1000 * 60 * 4,
  });

  useEffect(() => {
    if (detail) {
      document.title = `${detail.title}`;
    }
  }, [detail]);

  //! 에러 발생 시 404 처리 등
  useEffect(() => {
    if (isError && !isDeleted) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        router.replace("/not-found");
      } else {
        showMessage("오류가 발생했습니다. 다시 시도해주세요.", "error");
      }
    }
  }, [isError, error, router, isDeleted]);

  //! 건의사항 삭제
  const deleteData = useMutation({
    mutationFn: async (suggestionId: number) => {
      return await axios.delete(`${process.env.NEXT_PUBLIC_BASE_URL}/api/suggestion/${suggestionId}`, {
        withCredentials: true,
      });
    },
    onSuccess() {
      queryClient.removeQueries({ queryKey: ["suggestion", "detail", params?.id] });
      setIsDeleted(true);
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

  // MODIFIED: 건의사항 이미지 처리 (SuggestionImage 배열 사용)
  const memoizedImageCards = useMemo(() => {
    if (!detail || !detail.SuggestionImage || detail.SuggestionImage.length === 0) {
      return null;
    }
    return detail.SuggestionImage.map((img: any, index: number) => {
      const isLastOddImage = index === detail.SuggestionImage.length - 1 && detail.SuggestionImage.length % 2 !== 0;
      return <ImageCard key={`${img.id}-${index}`} img={img} isLastOddImage={isLastOddImage} />;
    });
  }, [detail?.SuggestionImage]);

  if (isLoading) return <Loading />;
  if (isError) return <ErrorView />;

  return (
    <Box display="flex" justifyContent="center" alignItems="center" sx={{ padding: 2, overflow: "hidden" }}>
      {openConfirmDialog && (
        <ConfirmDialog
          open={openConfirmDialog}
          title="건의사항 삭제"
          description="이 건의사항을 삭제하시겠습니까? 삭제된 건의사항은 복구할 수 없습니다."
          onConfirm={confirmDelete}
          onCancel={cancelDelete}
          confirmText="삭제"
          cancelText="취소"
        />
      )}
      {detail && (
        <Card sx={{ width: "100%", boxShadow: 4, padding: 3, borderRadius: 2, bgcolor: "background.paper" }}>
          <CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
              <Typography variant="h4" component="div" sx={{ fontWeight: "bold" }}>
                {detail.title}
              </Typography>
              {detail?.User?.id === session?.user?.id && (
                <Box display="flex" gap={1}>
                  <Button
                    size="medium"
                    variant="outlined"
                    color="warning"
                    onClick={(e) => {
                      e.preventDefault();
                      router.push(`/edit-suggestion/${detail.id}`);
                    }}
                  >
                    수정
                  </Button>
                  <Button
                    size="medium"
                    variant="outlined"
                    color="error"
                    onClick={(e) => {
                      e.preventDefault();
                      handleDeleteClick(detail.id);
                    }}
                  >
                    삭제
                  </Button>
                </Box>
              )}
            </Box>
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 3 }}>
              종류: {detail.category}
            </Typography>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
              <Box display="flex" alignItems="center" gap={2}>
                <Avatar
                  src={`${process.env.NEXT_PUBLIC_BASE_URL}${detail.User.userImage}`}
                  sx={{ width: 50, height: 50, boxShadow: 2 }}
                />
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: "bold", cursor: "pointer" }}>
                    <Link href={`/profile/${detail.User.nickname}`} passHref>
                      작성자: {detail.User.nickname}
                    </Link>
                  </Typography>
                  <Button onClick={() => router.back()} size="small" variant="contained" color="primary" sx={{ mt: 1 }}>
                    뒤로가기
                  </Button>
                </Box>
              </Box>
              <Box textAlign="right">
                <Typography variant="subtitle2" color="text.secondary">
                  등록일: {dayjs(detail.created_at).format("YYYY/MM/DD HH:mm:ss")}
                </Typography>
                <Typography variant="subtitle2" color="text.secondary">
                  수정일: {dayjs(detail.updated_at).format("YYYY/MM/DD HH:mm:ss")}
                </Typography>
              </Box>
            </Box>
            <Typography
              variant="body1"
              color="text.primary"
              sx={{ lineHeight: 1.7, bgcolor: "grey.50", p: 2, borderRadius: 1, boxShadow: 1, mb: 3 }}
            >
              {detail.content}
            </Typography>
            {memoizedImageCards && (
              <Box>
                <Typography
                  variant="h6"
                  gutterBottom
                  sx={{ fontWeight: "bold", textAlign: "center", color: "primary.main", mb: 2 }}
                >
                  첨부된 이미지:
                </Typography>
                <Box sx={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 1 }}>
                  {memoizedImageCards}
                </Box>
              </Box>
            )}
          </CardContent>
        </Card>
      )}
    </Box>
  );
}
