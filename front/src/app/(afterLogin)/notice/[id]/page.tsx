"use client";
import Loading from "@/app/components/common/Loading";
import { StoryImageType } from "@/app/types/imageTypes";
import { Avatar, Box, Button, Card, CardContent, CircularProgress, Typography, useTheme } from "@mui/material";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import dayjs from "dayjs";
import { useRouter } from "next/navigation";
import { ReactNode, useEffect, useMemo, useState } from "react";
import LocalOfferIcon from "@mui/icons-material/LocalOffer";
import { useSession } from "next-auth/react";
import { useMessage } from "@/app/store/messageStore";
import { useComment } from "@/app/store/commentStore";
import ConfirmDialog from "@/app/components/common/ConfirmDialog";
import ErrorView from "@/app/components/common/ErrorView";
import Link from "next/link";
import ImageCard from "@/app/components/ImageCard";
import { StoryType } from "@/app/types/storyDetailType";

export default function page({ params }: { params: { id: string } }): ReactNode {
  // const params = useParams(); // Next.js 13 이상에서 App Directory를 사용하면, page 컴포넌트는 URL 매개변수(파라미터)를 props로 받을 수 있습니다.
  const { showMessage } = useMessage((state) => state);
  const router = useRouter();
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const theme = useTheme();

  const [isDeleted, setIsDeleted] = useState<boolean>(false); // 삭제 상태 추가
  const { openCloseComments } = useComment();
  // 버튼 여러번 연속 클릭 방지
  const [editFlag, setEditFlag] = useState<boolean>(false);

  //! 상세 데이터 가져오기
  const {
    data: notice,
    isLoading,
    isError,
    error,
  } = useQuery<StoryType>({
    queryKey: ["story", "notice", params?.id],
    queryFn: async () => {
      const response = await axios.get(`${process.env.NEXT_PUBLIC_BASE_URL}/api/story/notice/${params?.id}`);
      return response.data;
    },
    retry: 1,
    retryDelay: () => 2000,
    // isDeleted 안 쓰면 삭제 후 API 요청이 되어 오류 발생
    enabled: !!params?.id && !isDeleted,
    staleTime: 1000 * 60 * 4,
    gcTime: 1000 * 60 * 4,
  });

  useEffect(() => {
    if (notice != null) {
      console.log("상세데이터", notice);
      document.title = `${notice.title}`;
      openCloseComments(true);
    }
    return () => {
      openCloseComments(false);
    };
  }, [notice]);

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
      queryClient.removeQueries({ queryKey: ["story", "notice", params?.id] });
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

  // ★ 모든 훅은 조건부 return 전에 호출되어야 합니다.
  const memoizedImageCards = useMemo(() => {
    if (!notice || !notice.StoryImage || notice.StoryImage.length === 0) {
      return null;
    }
    return notice.StoryImage.map((img: StoryImageType, index: number) => {
      const isLastOddImage = index === notice.StoryImage.length - 1 && notice.StoryImage.length % 2 !== 0;
      return <ImageCard key={`${img.id}-${index}`} img={img} isLastOddImage={isLastOddImage} />;
    });
  }, [notice?.StoryImage]);

  // ★ 조건부 return은 훅 선언 이후에 배치합니다.
  if (isLoading) return <Loading />;
  if (isError) return <ErrorView />;

  return (
    <Box display="flex" justifyContent="center" alignItems="center" sx={{ padding: 2, overflow: "hidden" }}>
      {openConfirmDialog && (
        <ConfirmDialog
          open={openConfirmDialog}
          title="공지사항 삭제"
          description="이 공지사항을 삭제하시겠습니까? 삭제된 공지사항은 복구할 수 없습니다."
          onConfirm={confirmDelete}
          onCancel={cancelDelete}
          confirmText="삭제"
          cancelText="취소"
        />
      )}
      {notice && (
        <Card sx={{ width: "100%", boxShadow: 4, padding: 3, borderRadius: 2, bgcolor: "background.paper" }}>
          <CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
              <Typography variant="h4" component="div" sx={{ fontWeight: "bold" }}>
                {notice.title}
              </Typography>
              {/* 공지사항에서는 수정/삭제 버튼을 일반적으로 제공하지 않습니다 */}
            </Box>
            <Typography
              variant="subtitle2"
              color="text.secondary"
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                bgcolor: theme.palette.mode === "dark" ? "rgba(26, 26, 46, 0.8)" : "grey.100",
                p: 1,
                borderRadius: 1,
                mb: 3,
                border: theme.palette.mode === "dark" ? "1px solid rgba(139, 92, 246, 0.3)" : "none",
                boxShadow: theme.palette.mode === "dark" ? "0 0 10px rgba(139, 92, 246, 0.2)" : "none",
              }}
            >
              <LocalOfferIcon fontSize="small" />
              종류: 공지사항
            </Typography>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
              <Box display="flex" alignItems="center" gap={2}>
                <Avatar
                  src={`${process.env.NEXT_PUBLIC_BASE_URL}${notice.User.avatar}`}
                  sx={{ width: 50, height: 50, boxShadow: 2 }}
                />
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: "bold", cursor: "pointer" }}>
                    <Link href={`/profile/${encodeURIComponent(notice.User.nickname)}`} passHref>
                      작성자: {notice.User.nickname}
                    </Link>
                  </Typography>
                  <Button onClick={() => router.back()} size="small" variant="contained" color="primary" sx={{ mt: 1 }}>
                    뒤로가기
                  </Button>
                </Box>
              </Box>
              <Box textAlign="right">
                <Typography variant="subtitle2" color="text.secondary">
                  작성일: {dayjs(notice.created_at).format("YYYY/MM/DD HH:mm:ss")}
                </Typography>
                <Typography variant="subtitle2" color="text.secondary">
                  조회수: {notice.read_count}
                </Typography>
              </Box>
            </Box>
            <Typography
              variant="body1"
              color="text.primary"
              sx={{
                lineHeight: 1.7,
                bgcolor: theme.palette.mode === "dark" ? "rgba(26, 26, 46, 0.6)" : "grey.50",
                p: 2,
                borderRadius: 1,
                boxShadow: theme.palette.mode === "dark" ? "0 0 15px rgba(139, 92, 246, 0.2)" : 1,
                mb: 3,
                border: theme.palette.mode === "dark" ? "1px solid rgba(139, 92, 246, 0.3)" : "none",
              }}
            >
              {notice.content}
            </Typography>
            {memoizedImageCards && (
              <Box>
                <Typography
                  variant="h6"
                  gutterBottom
                  sx={{
                    fontWeight: "bold",
                    textAlign: "center",
                    color: "primary.main",
                    mb: 2,
                  }}
                >
                  첨부된 이미지:
                </Typography>
                <Box
                  sx={{
                    display: "flex",
                    flexWrap: "wrap",
                    justifyContent: "center",
                    gap: 1,
                  }}
                >
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
