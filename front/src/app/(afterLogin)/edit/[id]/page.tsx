"use client";
import { FormEvent, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useMessage } from "@/app/store";
import { useMutation, useQuery } from "@tanstack/react-query";
import axios from "axios";
import { Box, Button, CircularProgress, TextField, Typography } from "@mui/material";
import Loading from "@/app/components/common/Loading";
import InputFileUpload from "@/app/components/common/InputFileUpload";
import { DEFAULT_SELECT_OPTION, WRITE_SELECT_OPTIONS } from "@/app/const/WRITE_CONST";
import CustomSelect from "@/app/components/common/CustomSelect";

export default function EditPage() {
  const params = useParams();
  const id = params?.id as string | undefined;

  const router = useRouter();
  const { showMessage } = useMessage((state) => state);
  // 제목 변수
  const [title, setTitle] = useState<string>("");
  // 내용 변수
  const [content, setContent] = useState<string>("");
  // 카테고리 변수
  const [selectedCategory, setSelectedCategory] = useState<string>(DEFAULT_SELECT_OPTION);
  // 이미지 변수
  const [preview, setPreview] = useState<Array<{ dataUrl: string; file: File } | null>>([]);
  // 받아온 이미지 변수
  const [editPreview, setEditPreview] = useState<Array<{ dataUrl: string; file: File } | null>>([]);
  // 로딩
  const [loading, setLoading] = useState<boolean>(false);

  const { data: storyDetail, isLoading } = useQuery({
    queryKey: ["story", "edit", id],
    queryFn: async () => {
      const response = await axios.get(`${process.env.NEXT_PUBLIC_BASE_URL}/api/story/detail/${id}`);
      return response.data;
    },
    enabled: !!id,
  });

  useEffect(() => {
    if (storyDetail) {
      setTitle(storyDetail.title || "");
      setContent(storyDetail.content || "");
      setSelectedCategory(storyDetail.category || DEFAULT_SELECT_OPTION);

      // 기존 이미지 데이터를 preview 형식으로 변환
      const formattedImages = (storyDetail.Image || []).map((image: any) => ({
        dataUrl: `${process.env.NEXT_PUBLIC_BASE_URL}${image.link}`, // 전체 URL로 변환
        file: null, // 기존 이미지는 파일이 없으므로 null
      }));
      setEditPreview(formattedImages);
      setPreview(formattedImages);
    }
  }, [storyDetail]);

  // 수정 요청
  const updateStory = useMutation<void, Error, FormData>({
    mutationFn: async (formData) => {
      setLoading(true);
      await axios
        .post(`${process.env.NEXT_PUBLIC_BASE_URL}/api/story/update/${id}`, formData, {
          withCredentials: true,
          headers: {
            "Content-Type": "multipart/form-data",
          },
        })
        .finally(() => setLoading(false));
    },
    onSuccess: () => {
      showMessage("수정 성공", "success");
      router.push(`/detail/${id}`);
    },
    onError: (error) => {
      showMessage(`수정 중 오류가 발생했습니다.`, "error");
      setLoading(false);
    },
  });

  const handleUpdate = () => {
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
    <Box padding={2} component="form" sx={{ width: "100%" }}>
      <Typography variant="h5" marginBottom={2}>
        글 수정하기
      </Typography>
      <TextField
        name="title"
        label="제목"
        variant="outlined"
        fullWidth
        margin="normal"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      <TextField
        name="content"
        label="내용"
        variant="outlined"
        fullWidth
        margin="normal"
        multiline
        rows={4}
        value={content}
        onChange={(e) => setContent(e.target.value)}
      />
      <CustomSelect
        selectArray={WRITE_SELECT_OPTIONS}
        defaultValue={DEFAULT_SELECT_OPTION}
        setSelectedCategory={setSelectedCategory}
        value={selectedCategory} // 선택된 카테고리 값
      />
      {editPreview.length > 0 && <InputFileUpload onPreviewUpdate={setPreview} editPreview={editPreview} />}
      <Button variant="contained" color="error" onClick={() => router.push(`/detail/${id}`)}>
        취소
      </Button>
      <Button
        variant="contained"
        color="success"
        onClick={handleUpdate} // 수정: 함수 호출 추가
      >
        {loading ? <CircularProgress size={24} color="inherit" /> : "수정"}
      </Button>
    </Box>
  );
}
