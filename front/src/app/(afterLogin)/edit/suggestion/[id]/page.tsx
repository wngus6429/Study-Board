"use client";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { Box, Button, CircularProgress, TextField, Typography } from "@mui/material";
import Loading from "@/app/components/common/Loading";
import InputFileUpload from "@/app/components/common/InputFileUpload";
import CustomSelect from "@/app/components/common/CustomSelect";
import {
  DEFAULT_FEEDBACK_OPTION,
  DEFAULT_SELECT_OPTION,
  FEEDBACK_SELECT_OPTIONS,
  WRITE_SELECT_OPTIONS,
} from "@/app/const/WRITE_CONST";
import { useSession } from "next-auth/react";
import { useMessage } from "@/app/store/messageStore";

export default function EditSuggestionPage({ params }: { params: { id: string } }) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const { data: session, status } = useSession();
  const { showMessage } = useMessage((state) => state);

  // 제목, 내용, 카테고리, 이미지 미리보기, 로딩 상태를 위한 상태 변수
  const [title, setTitle] = useState<string>("");
  const [content, setContent] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>(DEFAULT_SELECT_OPTION);
  const [preview, setPreview] = useState<Array<{ dataUrl: string; file: File } | null>>([]);
  const [loading, setLoading] = useState<boolean>(false);

  // 건의사항 상세 데이터를 불러옴 (수정용 엔드포인트)
  const { data: suggestionDetail, isLoading } = useQuery({
    queryKey: ["suggestion", "edit", params?.id],
    queryFn: async () => {
      try {
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_BASE_URL}/api/suggestion/detail/edit/${params.id}?userId=${session?.user.id}`,
          { withCredentials: true }
        );
        console.log("Response", response);
        return response.data;
      } catch (error) {
        console.error("Error fetching suggestion detail", error);
        if (axios.isAxiosError(error) && error.response?.status === 403) {
          router.push("/");
        }
        throw error;
      }
    },
    retry: 1,
    retryDelay: () => 2000,
    enabled: !!params.id && !!session?.user.id,
  });

  // 상세 데이터가 로드되면 폼 필드 초기화
  useEffect(() => {
    if (suggestionDetail) {
      setTitle(suggestionDetail.title || "");
      setContent(suggestionDetail.content || "");
      setSelectedCategory(suggestionDetail.category || DEFAULT_SELECT_OPTION);
      // 기존 이미지 데이터를 preview 형식으로 변환 (SuggestionImage 배열)
      const formattedImages = (suggestionDetail.SuggestionImage || []).map((image: any) => ({
        dataUrl: `${process.env.NEXT_PUBLIC_BASE_URL}${image.link}`,
        file: null,
      }));
      setPreview(formattedImages);
    }
  }, [suggestionDetail]);

  // 로그아웃 상태라면 홈으로 리다이렉트
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
    }
  }, [status, router]);

  // 수정 요청을 위한 Mutation (건의사항 수정 엔드포인트)
  const updateSuggestion = useMutation<void, Error, FormData>({
    mutationFn: async (formData) => {
      await axios.post(`${process.env.NEXT_PUBLIC_BASE_URL}/api/suggestion/update/${params.id}`, formData, {
        withCredentials: true,
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
    },
    retry: 1,
    retryDelay: () => 2000,
    onSuccess: () => {
      setLoading(false);
      showMessage("수정 성공", "success");
      queryClient.invalidateQueries({ queryKey: ["suggestion", "detail", params.id] });
      router.push(`/detail/suggestion/${params.id}`);
    },
    onError: (error) => {
      showMessage("수정 실패, 이전 화면으로 이동합니다", "error");
      console.error(error);
      router.back();
    },
  });

  // InputFileUpload 컴포넌트에서 미리보기 이미지 업데이트를 받는 함수
  const handlePreviewUpdate = (updatedPreview: Array<{ dataUrl: string; file: File } | null>) => {
    setPreview(updatedPreview);
  };

  // 폼 제출 시 수정 요청 전송
  const handleUpdate = (e: FormEvent) => {
    setLoading(true);
    e.preventDefault();
    const formData = new FormData();
    formData.append("title", title);
    formData.append("content", content);
    formData.append("category", selectedCategory);

    // 새 이미지 파일과 기존 이미지 데이터 분기 처리
    preview.forEach((item) => {
      if (item?.file != null) {
        // 새로운 이미지 파일인 경우
        formData.append("images", item.file);
      } else if (item?.dataUrl) {
        // 기존 이미지일 경우 (변경 여부를 감지)
        formData.append("existImages", item.dataUrl);
      }
    });
    updateSuggestion.mutate(formData);
  };

  if (isLoading) return <Loading />;

  return (
    <Box
      component="form"
      onSubmit={handleUpdate}
      padding={4}
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
        건의사항 수정하기
      </Typography>

      <Box>
        <CustomSelect
          selectArray={FEEDBACK_SELECT_OPTIONS}
          defaultValue={DEFAULT_FEEDBACK_OPTION}
          setSelectedCategory={setSelectedCategory}
        />
      </Box>

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
          onClick={() => router.push(`/detail/${params.id}`)}
          sx={{
            flex: 1,
            marginRight: 1,
            fontWeight: "bold",
          }}
        >
          취소
        </Button>
        <Button
          type="submit"
          variant="contained"
          color="success"
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
