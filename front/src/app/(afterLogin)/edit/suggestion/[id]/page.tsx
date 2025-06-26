"use client";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { Box, Button, CircularProgress, TextField, Typography } from "@mui/material";
import Loading from "@/app/components/common/Loading";
// import InputFileUpload from "@/app/components/common/InputFileUpload";
import RichTextEditor from "@/app/components/common/RichTextEditor";
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

  // 제목, 내용, 카테고리, 로딩 상태를 위한 상태 변수
  const [title, setTitle] = useState<string>("");
  const [content, setContent] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>(DEFAULT_SELECT_OPTION);
  // RichTextEditor에서 관리하는 파일들
  const [editorFiles, setEditorFiles] = useState<File[]>([]);
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

      // blob URL을 실제 서버 파일 경로로 변환하여 에디터에 표시
      let processedContent = suggestionDetail.content || "";
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;

      if (baseUrl && suggestionDetail.SuggestionImage && suggestionDetail.SuggestionImage.length > 0) {
        // SuggestionImage 배열을 이용해 blob URL을 실제 파일 경로로 매핑
        suggestionDetail.SuggestionImage.forEach((imageInfo: any) => {
          // 파일명에서 타임스탬프와 확장자 제거한 기본 이름 추출
          const baseFileName = imageInfo.image_name.replace(/_\d{8}\.(jpg|jpeg|png|gif|webp)$/i, "");

          // alt 속성의 파일명으로 찾기
          const escapedFileName = baseFileName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
          processedContent = processedContent.replace(
            new RegExp(`alt="${escapedFileName}[^"]*"[^>]*src="blob:[^"]*"`, "gi"),
            `alt="${baseFileName}.jpg" src="${baseUrl}${imageInfo.link}"`
          );

          // title 속성으로도 찾기
          processedContent = processedContent.replace(
            new RegExp(`title="${escapedFileName}[^"]*"[^>]*src="blob:[^"]*"`, "gi"),
            `title="${baseFileName}.jpg" src="${baseUrl}${imageInfo.link}"`
          );

          // src가 먼저 오는 경우
          processedContent = processedContent.replace(
            new RegExp(`src="blob:[^"]*"[^>]*alt="${escapedFileName}[^"]*"`, "gi"),
            `src="${baseUrl}${imageInfo.link}" alt="${baseFileName}.jpg"`
          );

          processedContent = processedContent.replace(
            new RegExp(`src="blob:[^"]*"[^>]*title="${escapedFileName}[^"]*"`, "gi"),
            `src="${baseUrl}${imageInfo.link}" title="${baseFileName}.jpg"`
          );
        });
      }

      // 혹시 이미 상대 경로로 저장된 것들도 처리
      if (baseUrl) {
        processedContent = processedContent.replace(/src="\/upload\/([^"]+)"/g, `src="${baseUrl}/upload/$1"`);
      }

      setContent(processedContent);
      setSelectedCategory(suggestionDetail.category || DEFAULT_SELECT_OPTION);
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
      router.back(); // 이전 페이지로 돌아가기
    },
    onError: (error) => {
      showMessage("수정 실패, 이전 화면으로 이동합니다", "error");
      console.error(error);
      router.back();
    },
  });

  // RichTextEditor에서 파일 변경사항을 받는 함수
  const handleEditorFilesChange = (files: File[]) => {
    setEditorFiles(files);
  };

  // 폼 제출 시 수정 요청 전송
  const handleUpdate = (e: FormEvent) => {
    if (title.length < 3 || content.length < 3) {
      showMessage("제목과 내용을 3글자 이상 입력해주세요", "error");
      return;
    }

    setLoading(true);
    e.preventDefault();
    const formData = new FormData();
    formData.append("title", title);

    // 에디터의 컨텐츠에서 절대 URL을 다시 상대 URL로 변경하여 저장
    let contentToSave = content;
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
    if (baseUrl) {
      // 이미지 절대 경로를 상대 경로로 변환
      const escapedBaseUrl = baseUrl.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&");
      contentToSave = contentToSave.replace(
        new RegExp(`src="${escapedBaseUrl}/upload/([^"]+)"`, "g"),
        'src="/upload/$1"'
      );

      // blob URL도 제거 (새로 추가된 파일들은 서버에서 처리됨)
      contentToSave = contentToSave.replace(/src="blob:[^"]*"/g, 'src=""');
    }

    formData.append("content", contentToSave);
    formData.append("category", selectedCategory);

    // RichTextEditor에서 관리하는 파일들을 FormData에 추가
    editorFiles.forEach((file) => {
      formData.append("files", file);
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
      <Box sx={{ mb: 2 }}>
        <Typography variant="body1" sx={{ mb: 1, fontWeight: 500 }}>
          내용 (필수)
        </Typography>
        <RichTextEditor
          value={content}
          onChange={setContent}
          placeholder="건의사항 내용을 입력해주세요"
          height="400px"
          onFilesChange={handleEditorFilesChange}
        />
      </Box>

      {/* InputFileUpload 컴포넌트 사용 안 함 - RichTextEditor로 파일 처리 */}
      {/* <InputFileUpload onPreviewUpdate={handlePreviewUpdate} preview={preview} /> */}

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
          onClick={() => router.back()}
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
