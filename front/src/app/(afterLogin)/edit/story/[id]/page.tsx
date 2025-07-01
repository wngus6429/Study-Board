"use client";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { Box, Button, CircularProgress, TextField, Typography } from "@mui/material";
import Loading from "@/app/components/common/Loading";
// import InputFileUpload from "@/app/components/common/InputFileUpload";
import RichTextEditor from "@/app/components/common/RichTextEditor";
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

  // RichTextEditor에서 관리하는 파일들
  const [editorFiles, setEditorFiles] = useState<File[]>([]);
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

  // 글 데이터를 제목, 내용, 카테고리, 이미지/동영상 데이터로 초기화
  useEffect(() => {
    if (storyDetail) {
      setTitle(storyDetail.title || "");

      // blob URL을 실제 서버 파일 경로로 변환하여 에디터에 표시
      let processedContent = storyDetail.content || "";
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;

      console.log("1. 원본 컨텐츠:", storyDetail.content);
      console.log("2. StoryImage 배열:", storyDetail.StoryImage);
      console.log("3. StoryVideo 배열:", storyDetail.StoryVideo);

      if (baseUrl && storyDetail.StoryImage && storyDetail.StoryImage.length > 0) {
        // StoryImage 배열을 이용해 blob URL을 실제 파일 경로로 매핑
        storyDetail.StoryImage.forEach((imageInfo: any, index: number) => {
          // 파일명에서 타임스탬프와 확장자 제거한 기본 이름 추출
          const baseFileName = imageInfo.image_name.replace(/_\d{8}\.(jpg|jpeg|png|gif|webp)$/i, "");

          console.log(`매핑 시도 ${index}: ${baseFileName} -> ${imageInfo.link}`);

          // 단순하게 alt 속성의 파일명으로 찾기
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

      // 동영상 처리를 개선
      if (baseUrl && storyDetail.StoryVideo && storyDetail.StoryVideo.length > 0) {
        console.log("=== 동영상 처리 시작 ===");
        console.log("baseUrl:", baseUrl);
        console.log("StoryVideo 배열:", storyDetail.StoryVideo);

        storyDetail.StoryVideo.forEach((videoInfo: any, index: number) => {
          console.log(`\n--- 동영상 ${index + 1} 처리 ---`);
          console.log("videoInfo:", videoInfo);

          // 원본 컨텐츠 일부 확인
          console.log("처리 전 content 일부:", processedContent.substring(0, 500));

          // 1. <source> 태그의 빈 src 또는 blob URL을 실제 URL로 교체
          processedContent = processedContent.replace(
            /<source([^>]*)src=""([^>]*)/g,
            `<source$1src="${baseUrl}${videoInfo.link}"$2`
          );

          processedContent = processedContent.replace(
            /<source([^>]*)src="blob:[^"]*"([^>]*)/g,
            `<source$1src="${baseUrl}${videoInfo.link}"$2`
          );

          // 2. <video> 태그의 빈 src 또는 blob URL을 실제 URL로 교체
          processedContent = processedContent.replace(
            /<video([^>]*)src=""([^>]*)/g,
            `<video$1src="${baseUrl}${videoInfo.link}"$2`
          );

          processedContent = processedContent.replace(
            /<video([^>]*)src="blob:[^"]*"([^>]*)/g,
            `<video$1src="${baseUrl}${videoInfo.link}"$2`
          );

          // 3. 파일명 정보 업데이트 (🎬로 시작하는 부분)
          const fileSizeMB = videoInfo.file_size ? (videoInfo.file_size / 1024 / 1024).toFixed(2) : "0.00";
          const newVideoInfo = `🎬 ${videoInfo.video_name} (${fileSizeMB}MB)`;

          // 기존 파일명 패턴들을 교체
          processedContent = processedContent.replace(/🎬\s+[^(]+\([^)]+MB\)/g, newVideoInfo);
          processedContent = processedContent.replace(/🎬[^<]+(?=<)/g, newVideoInfo);

          console.log("처리 후 content 일부:", processedContent.substring(0, 500));
        });

        console.log("=== 동영상 처리 완료 ===");
      }

      // 혹시 이미 상대 경로로 저장된 것들도 처리
      if (baseUrl) {
        processedContent = processedContent.replace(/src="\/upload\/([^"]+)"/g, `src="${baseUrl}/upload/$1"`);
        processedContent = processedContent.replace(/src="\/videoUpload\/([^"]+)"/g, `src="${baseUrl}/videoUpload/$1"`);
      }

      console.log("4. 최종 처리된 컨텐츠:", processedContent);
      setContent(processedContent);
      setSelectedCategory(storyDetail.category || DEFAULT_SELECT_OPTION);
      console.log("수정 페이지용 데이터", storyDetail);
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
      // 채널이 있으면 채널 상세 페이지로, 없으면 메인 페이지로
      if (storyDetail?.Channel?.slug) {
        router.push(`/channels/${storyDetail.Channel.slug}/detail/story/${params.id}`);
      } else {
        router.push(`/`);
      }
    },
    onError: (error) => {
      setLoading(false);
      showMessage("수정 실패, 이전 화면으로 이동합니다", "error");
      console.error(error);
      router.back();
    },
  });

  // RichTextEditor에서 파일 변경사항을 받는 함수
  const handleEditorFilesChange = (files: File[]) => {
    setEditorFiles(files);
  };

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

    console.log("=== 저장 전 컨텐츠 변환 시작 ===");
    console.log("원본 content:", content);
    console.log("baseUrl:", baseUrl);

    if (baseUrl) {
      // 이미지 절대 경로를 상대 경로로 변환
      const escapedBaseUrl = baseUrl.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&");
      const imageRegex = new RegExp(`src="${escapedBaseUrl}/upload/([^"]+)"`, "g");
      const imageMatches = content.match(imageRegex);
      console.log("이미지 매치 결과:", imageMatches);

      contentToSave = contentToSave.replace(imageRegex, 'src="/upload/$1"');

      // 동영상 절대 경로를 상대 경로로 변환 (video 태그)
      const videoRegex = new RegExp(`src="${escapedBaseUrl}/videoUpload/([^"]+)"`, "g");
      const videoMatches = content.match(videoRegex);
      console.log("video 태그 매치 결과:", videoMatches);

      contentToSave = contentToSave.replace(videoRegex, 'src="/videoUpload/$1"');

      // 동영상 절대 경로를 상대 경로로 변환 (source 태그)
      const sourceRegex = new RegExp(`<source([^>]*)src="${escapedBaseUrl}/videoUpload/([^"]+)"([^>]*)>`, "g");
      const sourceMatches = content.match(sourceRegex);
      console.log("source 태그 매치 결과:", sourceMatches);

      contentToSave = contentToSave.replace(sourceRegex, '<source$1src="/videoUpload/$2"$3>');

      // blob URL도 제거 (새로 추가된 파일들은 서버에서 처리됨)
      const blobRegex = /src="blob:[^"]*"/g;
      const blobMatches = content.match(blobRegex);
      console.log("blob URL 매치 결과:", blobMatches);

      contentToSave = contentToSave.replace(blobRegex, 'src=""');

      console.log("변환 후 content:", contentToSave);
      console.log("=== 저장 전 컨텐츠 변환 완료 ===");
    }

    formData.append("content", contentToSave);
    formData.append("category", selectedCategory);

    // RichTextEditor에서 관리하는 파일들을 FormData에 추가
    editorFiles.forEach((file) => {
      formData.append("files", file);
    });

    // FormData 내용 확인 (디버깅용)
    console.log("FormData 내용:");
    const entries = Array.from(formData.entries());
    entries.forEach(([key, value]) => {
      console.log(`${key}:`, value);
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
          mb: 2,
        }}
      />

      <CustomSelect
        selectArray={WRITE_SELECT_OPTIONS}
        defaultValue={DEFAULT_SELECT_OPTION}
        setSelectedCategory={setSelectedCategory}
        value={selectedCategory}
      />

      <Box sx={{ mb: 2 }}>
        <Typography variant="body1" sx={{ mb: 1, fontWeight: 500, mt: -1 }}>
          내용 (필수)
        </Typography>
        <RichTextEditor
          value={content}
          onChange={setContent}
          placeholder="글 내용을 입력해주세요"
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
