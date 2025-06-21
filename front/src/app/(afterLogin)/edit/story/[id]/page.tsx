"use client";
import { FormEvent, useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { Box, Button, CircularProgress, TextField, Typography, Tabs, Tab, useTheme, Paper } from "@mui/material";
import Loading from "@/app/components/common/Loading";
// import InputFileUpload from "@/app/components/common/InputFileUpload";
import RichTextEditor from "@/app/components/common/RichTextEditor";
import QuillEditor from "@/app/components/common/QuillEditor";
import { DEFAULT_SELECT_OPTION, WRITE_SELECT_OPTIONS } from "@/app/const/WRITE_CONST";
import CustomSelect from "@/app/components/common/CustomSelect";
import { useSession } from "next-auth/react";
import { useMessage } from "@/app/store/messageStore";

export default function EditPage({ params }: { params: { id: string } }) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const { data: session, status } = useSession();
  const theme = useTheme();

  // zustand 메시지
  const { showMessage } = useMessage((state) => state);
  // 제목 변수
  const [title, setTitle] = useState<string>("");
  // 내용 변수
  const [content, setContent] = useState<string>("");
  // 카테고리 변수
  const [selectedCategory, setSelectedCategory] = useState<string>(DEFAULT_SELECT_OPTION);
  // 에디터 탭 상태
  const [editorTab, setEditorTab] = useState(0);
  // 에디터에서 관리할 파일들
  const [editorFiles, setEditorFiles] = useState<File[]>([]);
  // 기존 이미지와 동영상 정보 저장
  const [originalImages, setOriginalImages] = useState<any[]>([]);
  const [originalVideos, setOriginalVideos] = useState<any[]>([]);
  // 순수 텍스트 내용 (미디어 제외)
  const [pureContent, setPureContent] = useState<string>("");
  // 초기화 완료 플래그
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  // 이미지 변수 (InputFileUpload 사용 시에만 필요)
  // const [preview, setPreview] = useState<Array<{ dataUrl: string; file: File; type: "image" | "video" } | null>>([]);
  // 로딩
  const [loading, setLoading] = useState<boolean>(false);

  // 기존 미디어를 포함한 content 생성 함수
  const buildContentWithMedia = useCallback((textContent: string, images: any[], videos: any[]) => {
    let contentWithMedia = textContent;

    // 기존 이미지들을 content에 추가
    if (images.length > 0) {
      const imageHtml = images
        .map(
          (image: any) =>
            `<img src="${process.env.NEXT_PUBLIC_BASE_URL}${image.link}" alt="${image.image_name}" style="max-width: 100%; height: auto; margin: 8px 0; border-radius: 8px;" />`
        )
        .join("");
      contentWithMedia += imageHtml;
    }

    // 기존 동영상들을 content에 추가
    if (videos.length > 0) {
      const videoHtml = videos
        .map(
          (video: any) =>
            `<video controls preload="metadata" style="width: 100%; max-width: 100%; height: auto; border-radius: 8px; margin: 8px 0;">
           <source src="${process.env.NEXT_PUBLIC_BASE_URL}${video.link}" type="${video.mime_type}" />
           Your browser does not support the video tag.
         </video>
         <p style="margin:8px 0; font-size:14px; color:#e94057; font-weight:500; text-align:center;">
           🎬 ${video.video_name}
         </p>`
        )
        .join("");
      contentWithMedia += videoHtml;
    }

    return contentWithMedia;
  }, []);

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
          // 403 에러일 경우 세션스토리지 정리 후 홈 화면으로 리다이렉트
          if (typeof window !== "undefined") {
            sessionStorage.removeItem("editReturnUrl");
          }
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
      // 세션스토리지 정리 후 홈으로 이동
      if (typeof window !== "undefined") {
        sessionStorage.removeItem("editReturnUrl");
      }
      router.push("/");
    }
  }, [status, router]);

  // 글 데이터를 제목, 내용, 카테고리, 이미지 데이터로 초기화
  useEffect(() => {
    if (storyDetail && !isInitialized) {
      setTitle(storyDetail.title || "");
      setSelectedCategory(storyDetail.category || DEFAULT_SELECT_OPTION);
      console.log("데이터", storyDetail);

      // 순수 텍스트 내용 저장 (이미지/동영상 제외)
      const pureText = storyDetail.content || "";
      setPureContent(pureText);

      // 기존 이미지와 동영상 정보 별도 저장
      const images = storyDetail.StoryImage || [];
      const videos = storyDetail.StoryVideo || [];
      setOriginalImages(images);
      setOriginalVideos(videos);

      // 초기 content 설정 (pureContent + 기존 미디어)
      const initialContent = buildContentWithMedia(pureText, images, videos);
      setContent(initialContent);

      setIsInitialized(true);
    }
  }, [storyDetail, isInitialized, buildContentWithMedia]);

  // 에디터 탭 변경 시 content 재구성
  const handleEditorTabChange = useCallback(
    (event: any, newValue: number) => {
      setEditorTab(newValue);
      if (isInitialized && (originalImages.length > 0 || originalVideos.length > 0)) {
        setContent(buildContentWithMedia(pureContent, originalImages, originalVideos));
      }
    },
    [isInitialized, pureContent, originalImages, originalVideos, buildContentWithMedia]
  );

  // content 변경 시 순수 텍스트 내용 추출 및 저장
  const handleContentChange = useCallback(
    (newContent: string) => {
      // 기존 이미지와 동영상 HTML을 제거하여 순수 텍스트만 추출
      let cleanContent = newContent;

      // 기존 이미지 HTML 제거
      originalImages.forEach((image: any) => {
        const imagePattern = new RegExp(
          `<img[^>]*src="${process.env.NEXT_PUBLIC_BASE_URL}${image.link.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}"[^>]*>`,
          "gi"
        );
        cleanContent = cleanContent.replace(imagePattern, "");
      });

      // 기존 동영상 HTML 제거 (video 태그와 p 태그 모두)
      originalVideos.forEach((video: any) => {
        const videoPattern = new RegExp(
          `<video[^>]*>[\\s\\S]*?<source[^>]*src="${process.env.NEXT_PUBLIC_BASE_URL}${video.link.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}"[^>]*>[\\s\\S]*?</video>`,
          "gi"
        );
        const videoPPattern = new RegExp(
          `<p[^>]*>[^<]*🎬\\s*${video.video_name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}[^<]*</p>`,
          "gi"
        );
        cleanContent = cleanContent.replace(videoPattern, "");
        cleanContent = cleanContent.replace(videoPPattern, "");
      });

      // 순수 텍스트 업데이트
      setPureContent(cleanContent);
      // 에디터 content 업데이트 (현재 content와 다를 때만)
      setContent(newContent);
    },
    [originalImages, originalVideos]
  );

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

      // 세션스토리지에서 돌아갈 URL 확인
      const returnUrl = typeof window !== "undefined" ? sessionStorage.getItem("editReturnUrl") : null;
      if (returnUrl) {
        sessionStorage.removeItem("editReturnUrl"); // 사용 후 삭제
        router.push(returnUrl);
      } else {
        // 기본값으로 홈으로 이동
        router.push("/");
      }
    },
    onError: (error) => {
      showMessage("수정 실패, 이전 화면으로 이동합니다", "error");
      console.error(error);
      router.back();
    },
  });

  const handleUpdate = (e: FormEvent) => {
    setLoading(true);
    e.preventDefault();
    const formData = new FormData();
    formData.append("title", title);
    formData.append("content", pureContent); // 순수 텍스트 내용만 전송
    formData.append("category", selectedCategory);

    // 에디터에서 관리하는 새로운 파일들을 'images' 키로 추가
    console.log("🔍 [수정 API 전송 전] editorFiles:", editorFiles);
    editorFiles.forEach((file, index) => {
      console.log(`🔍 [수정 API 전송 전] 파일 ${index + 1}:`, {
        name: file.name,
        size: file.size,
        type: file.type,
      });
      formData.append("images", file);
    });

    updateStory.mutate(formData);
  };

  if (isLoading) return <Loading />;

  const isDarkMode = theme.palette.mode === "dark";

  return (
    <Paper
      elevation={0}
      component="form"
      sx={{
        p: { xs: 3, sm: 4, md: 5 },
        width: { xs: "98%", sm: "90%", md: "80%", lg: "70%" },
        maxWidth: "1200px",
        margin: "auto",
        mt: { xs: 3, sm: 4, md: 5 },
        mb: 5,
        borderRadius: "16px",
        boxShadow: isDarkMode ? "0 10px 40px rgba(0, 0, 0, 0.4)" : "0 10px 40px rgba(0, 0, 0, 0.07)",
        background: isDarkMode ? "rgba(30, 32, 38, 0.95)" : "#ffffff",
        position: "relative",
        overflow: "hidden",
        border: isDarkMode ? "1px solid rgba(255, 255, 255, 0.1)" : "1px solid rgba(0, 0, 0, 0.2)",
      }}
    >
      <Box
        sx={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "6px",
          background: "linear-gradient(90deg, #8a2387, #e94057, #f27121)",
        }}
      />

      <Typography
        variant="h4"
        sx={{
          fontWeight: 700,
          textAlign: "center",
          mb: 1,
          mt: 1,
          letterSpacing: "-0.5px",
          background: "linear-gradient(135deg, #8a2387, #e94057, #f27121)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          // 다크모드에서 텍스트가 보이지 않는 경우를 위한 fallback
          ...(isDarkMode && {
            color: "#fff",
            background: "none",
            WebkitTextFillColor: "unset",
          }),
        }}
      >
        글 수정하기
      </Typography>

      <CustomSelect
        selectArray={WRITE_SELECT_OPTIONS}
        defaultValue={DEFAULT_SELECT_OPTION}
        setSelectedCategory={setSelectedCategory}
        value={selectedCategory}
      />

      <TextField
        name="title"
        label="제목 (필수)"
        placeholder="스토리의 제목을 입력해주세요 (3글자 이상)"
        variant="outlined"
        fullWidth
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        sx={{
          mb: 2,
          "& .MuiOutlinedInput-root": {
            borderRadius: "12px",
            backgroundColor: isDarkMode ? "rgba(45, 48, 56, 0.8)" : "rgba(249, 250, 251, 0.8)",
            color: isDarkMode ? "#ffffff" : "inherit",
            transition: "all 0.3s ease",
            "&:hover": {
              backgroundColor: isDarkMode ? "rgba(50, 53, 61, 1)" : "rgba(245, 247, 250, 1)",
              boxShadow: isDarkMode ? "0 2px 8px rgba(0, 0, 0, 0.3)" : "0 2px 8px rgba(0, 0, 0, 0.04)",
            },
            "&.Mui-focused": {
              backgroundColor: isDarkMode ? "rgba(55, 58, 66, 1)" : "#ffffff",
              boxShadow: isDarkMode ? "0 4px 12px rgba(0, 0, 0, 0.4)" : "0 4px 12px rgba(0, 0, 0, 0.05)",
              "& fieldset": {
                borderColor: "#e94057",
                borderWidth: "2px",
              },
            },
            "& fieldset": {
              borderColor: isDarkMode ? "rgba(255, 255, 255, 0.2)" : "rgba(0, 0, 0, 0.23)",
            },
          },
          "& .MuiInputLabel-root": {
            fontWeight: 500,
            color: isDarkMode ? "rgba(255, 255, 255, 0.7)" : "inherit",
          },
          "& .MuiInputLabel-root.Mui-focused": {
            color: "#e94057",
          },
          "& .MuiOutlinedInput-input::placeholder": {
            color: isDarkMode ? "rgba(255, 255, 255, 0.5)" : "rgba(0, 0, 0, 0.6)",
            opacity: 1,
          },
        }}
      />
      <Box sx={{ mb: 2 }}>
        <Typography variant="body1" sx={{ mb: 1, fontWeight: 500 }}>
          내용 (필수)
        </Typography>

        {/* 에디터 탭 */}
        <Tabs
          value={editorTab}
          onChange={handleEditorTabChange}
          sx={{
            borderBottom: 1,
            borderColor: "divider",
            mb: 2,
            "& .MuiTab-root": {
              textTransform: "none",
              fontWeight: 600,
              fontSize: "1rem",
            },
            "& .Mui-selected": {
              color: "#e94057 !important",
            },
            "& .MuiTabs-indicator": {
              backgroundColor: "#e94057",
            },
          }}
        >
          <Tab label="TipTap" />
          <Tab label="Quill" />
        </Tabs>

        {/* TipTap 에디터 */}
        {editorTab === 0 && (
          <RichTextEditor
            value={content}
            onChange={handleContentChange}
            placeholder="TipTap 에디터로 글 내용을 수정해주세요 (3글자 이상)"
            height="400px"
            onFilesChange={setEditorFiles}
          />
        )}

        {/* Quill 에디터 */}
        {editorTab === 1 && (
          <QuillEditor
            value={content}
            onChange={handleContentChange}
            placeholder="Quill 에디터로 글 내용을 수정해주세요 (3글자 이상)"
            height="400px"
            onFilesChange={setEditorFiles}
          />
        )}
      </Box>

      {/* <InputFileUpload onPreviewUpdate={handlePreviewUpdate} preview={preview} /> */}

      <Box
        sx={{
          display: "flex",
          width: "100%",
          alignItems: "center",
          mt: 3,
        }}
      >
        <Button
          onClick={() => {
            // 세션스토리지에서 돌아갈 URL 확인
            const returnUrl = typeof window !== "undefined" ? sessionStorage.getItem("editReturnUrl") : null;
            if (returnUrl) {
              sessionStorage.removeItem("editReturnUrl"); // 사용 후 삭제
              router.push(returnUrl);
            } else {
              // 기본값으로 뒤로가기
              router.back();
            }
          }}
          variant="contained"
          sx={{
            fontSize: { xs: "0.95rem", sm: "1rem" },
            textTransform: "none",
            fontWeight: 600,
            letterSpacing: "0.5px",
            background: "linear-gradient(135deg, #2196f3, #21cbf3)",
            boxShadow: isDarkMode ? "0 6px 15px rgba(33, 150, 243, 0.5)" : "0 6px 15px rgba(33, 150, 243, 0.3)",
            transition: "all 0.3s ease",
            "&:hover": {
              boxShadow: isDarkMode ? "0 8px 20px rgba(33, 150, 243, 0.6)" : "0 8px 20px rgba(33, 150, 243, 0.4)",
              transform: "translateY(-2px)",
              background: "linear-gradient(135deg, #1976d2, #1e88e5)",
            },
            "&:active": {
              transform: "translateY(0)",
              boxShadow: isDarkMode ? "0 4px 10px rgba(33, 150, 243, 0.5)" : "0 4px 10px rgba(33, 150, 243, 0.3)",
            },
            borderRadius: "12px 0 0 12px",
            width: { xs: "50%", sm: "30%", md: "25%" },
            height: "40px",
          }}
        >
          취소
        </Button>

        <Button
          variant="contained"
          onClick={handleUpdate}
          disabled={loading || title.length < 3 || pureContent.length < 3}
          sx={{
            fontSize: { xs: "0.95rem", sm: "1rem" },
            textTransform: "none",
            fontWeight: 600,
            letterSpacing: "0.5px",
            background: "linear-gradient(135deg, #8a2387, #e94057, #f27121)",
            boxShadow: isDarkMode ? "0 6px 15px rgba(233, 64, 87, 0.5)" : "0 6px 15px rgba(233, 64, 87, 0.3)",
            transition: "all 0.3s ease",
            "&:hover": {
              boxShadow: isDarkMode ? "0 8px 20px rgba(233, 64, 87, 0.6)" : "0 8px 20px rgba(233, 64, 87, 0.4)",
              transform: "translateY(-2px)",
              background: "linear-gradient(135deg, #7a1d77, #d93a4f, #e2671e)",
            },
            "&:active": {
              transform: "translateY(0)",
              boxShadow: isDarkMode ? "0 4px 10px rgba(233, 64, 87, 0.5)" : "0 4px 10px rgba(233, 64, 87, 0.3)",
            },
            "&:disabled": {
              background: isDarkMode ? "#333" : "#e0e0e0",
              color: isDarkMode ? "#666" : "#a0a0a0",
              boxShadow: "none",
            },
            borderRadius: "0 12px 12px 0",
            width: { xs: "50%", sm: "70%", md: "75%" },
            height: "40px",
          }}
          startIcon={loading ? <CircularProgress size={20} color="inherit" /> : null}
        >
          {loading ? "수정 중..." : "수정하기"}
        </Button>
      </Box>
    </Paper>
  );
}
