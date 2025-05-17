"use client";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { Box, Button, CircularProgress, TextField, Typography } from "@mui/material";
import Loading from "@/app/components/common/Loading";
import InputFileUpload from "@/app/components/common/InputFileUpload";
import { DEFAULT_SELECT_OPTION, WRITE_SELECT_OPTIONS } from "@/app/const/WRITE_CONST";
import CustomSelect from "@/app/components/common/CustomSelect";
import { useSession } from "next-auth/react";
import { useMessage } from "@/app/store/messageStore";

export default function EditPage({ params }: { params: { id: string } }) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const { data: session, status } = useSession();

  // zustand 메시지
  const { showMessage } = useMessage((state) => state);
  // 제목 변수
  const [title, setTitle] = useState<string>("");
  // 내용 변수
  const [content, setContent] = useState<string>("");
  // 카테고리 변수
  const [selectedCategory, setSelectedCategory] = useState<string>(DEFAULT_SELECT_OPTION);
  // 이미지 변수
  const [preview, setPreview] = useState<Array<{ dataUrl: string; file: File } | null>>([]);
  // 로딩
  const [loading, setLoading] = useState<boolean>(false);

  const { data: storyDetail, isLoading } = useQuery({
    queryKey: ["story", "edit", params?.id],
    queryFn: async () => {
      try {
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_BASE_URL}/api/story/detail/edit/${params.id}?userId=${session?.user.id}`,
          { withCredentials: true }
        );
        console.log("리스폰", response);
        return response.data;
      } catch (error) {
        console.log("errr", error);
        if (axios.isAxiosError(error) && error.response?.status === 403) {
          // 403 에러일 경우 홈 화면으로 리다이렉트
          router.push("/");
        }
        // 에러를 다시 throw해서 React Query의 상태도 업데이트하도록 함
        throw error;
      }
    },
    retry: 1,
    retryDelay: () => 2000,
    enabled: !!params.id && !!session?.user.id,
  });

  // 로그아웃 하면 홈으로 페이지 이동
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
    }
  }, [status, router]);

  // 글 데이터를 제목, 내용, 카테고리, 이미지 데이터로 초기화
  useEffect(() => {
    if (storyDetail) {
      setTitle(storyDetail.title || "");
      setContent(storyDetail.content || "");
      setSelectedCategory(storyDetail.category || DEFAULT_SELECT_OPTION);
      console.log("데이터", storyDetail);
      // 기존 이미지 데이터를 preview 형식으로 변환
      const formattedImages = (storyDetail.StoryImage || []).map((image: any) => ({
        dataUrl: `${process.env.NEXT_PUBLIC_BASE_URL}${image.link}`, // 전체 URL로 변환
        file: null, // 기존 이미지는 파일이 없으므로 null
      }));
      setPreview(formattedImages);
    }
  }, [storyDetail]);

  // 수정 요청
  const updateStory = useMutation<void, Error, FormData>({
    mutationFn: async (formData) => {
      await axios.post(`${process.env.NEXT_PUBLIC_BASE_URL}/api/story/update/${params.id}`, formData, {
        withCredentials: true,
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
    },
    retry: 1, // 1회 재시도
    retryDelay: () => 2000, // 매 재시도마다 2초(2000ms) 지연
    onSuccess: () => {
      setLoading(false);
      showMessage("수정 성공", "success");
      queryClient.invalidateQueries({ queryKey: ["story", "detail", params.id] });
      router.push(`/detail/story/${params.id}`);
    },
    onError: (error) => {
      showMessage("수정 실패, 이전 화면으로 이동합니다", "error");
      console.error(error);
      router.back();
    },
  });

  const handlePreviewUpdate = (updatedPreview: Array<{ dataUrl: string; file: File } | null>) => {
    setPreview(updatedPreview);
  };

  const handleUpdate = (e: FormEvent) => {
    setLoading(true);
    e.preventDefault();
    const formData = new FormData();
    formData.append("title", title);
    formData.append("content", content);
    formData.append("category", selectedCategory);

    // 이미지 파일 보낼 데이터 분기 처리
    preview.forEach((item) => {
      if (item?.file != null) {
        // 새로운 이미지 파일
        formData.append("images", item.file);
      } else if (item?.dataUrl) {
        // 기존 이미지에서 변경이 있는 경우를 감지하기 위해
        formData.append("existImages", item.dataUrl);
      }
    });
    updateStory.mutate(formData);
  };

  if (isLoading) return <Loading />;

  return (
    <Box
      padding={4}
      component="form"
      sx={{
        width: "60%",
        margin: "auto",
        mt: 5,
        bgcolor: "background.paper",
        boxShadow: 3,
        borderRadius: 3,
        mb: 5,
      }}
    >
      <Typography
        variant="h4"
        marginBottom={3}
        sx={{
          fontWeight: "bold",
          textAlign: "center",
          color: "primary.main",
        }}
      >
        글 수정하기
      </Typography>

      <TextField
        name="title"
        label="제목 (필수)"
        variant="outlined"
        fullWidth
        margin="normal"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        sx={{
          bgcolor: "background.default",
          borderRadius: 2,
        }}
      />
      <TextField
        name="content"
        label="내용 (필수)"
        variant="outlined"
        fullWidth
        margin="normal"
        multiline
        rows={6}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        sx={{
          bgcolor: "background.default",
          borderRadius: 2,
        }}
      />
      <CustomSelect
        selectArray={WRITE_SELECT_OPTIONS}
        defaultValue={DEFAULT_SELECT_OPTION}
        setSelectedCategory={setSelectedCategory}
        value={selectedCategory}
      />

      <InputFileUpload onPreviewUpdate={handlePreviewUpdate} preview={preview} />

      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          mt: 3,
        }}
      >
        <Button
          variant="outlined"
          color="error"
          onClick={() => router.push(`/detail/story/${params.id}`)}
          sx={{
            flex: 1,
            marginRight: 1,
            fontWeight: "bold",
          }}
        >
          취소
        </Button>
        <Button
          variant="contained"
          color="success"
          onClick={handleUpdate}
          disabled={loading || title.length < 3 || content.length < 3}
          sx={{
            flex: 1,
            marginLeft: 1,
            fontWeight: "bold",
          }}
          startIcon={loading && <CircularProgress size={20} color="inherit" />}
        >
          수정
        </Button>
      </Box>
    </Box>
  );
}
