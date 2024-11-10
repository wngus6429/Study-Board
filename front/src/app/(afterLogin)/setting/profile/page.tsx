"use client";
import { FormEvent, useEffect, useState } from "react";
import { TextField, Button, Avatar, Typography, Box, Container, CircularProgress } from "@mui/material";
import { useMutation, useQuery } from "@tanstack/react-query";
import axios from "axios";
import { useSession } from "next-auth/react";
import { useMessage } from "@/app/store";
import Loading from "@/app/components/common/Loading";

function UserProfileEdit() {
  const [nickname, setNickname] = useState("");
  const [profileImage, setProfileImage] = useState(null);
  const [previewImage, setPreviewImage] = useState<any>(null);
  const { showMessage, messageState } = useMessage((state) => state);

  const { data: session, status } = useSession();
  // 세션이 인증된 상태에서만 요청을 수행합니다.
  const {
    data: userDetail,
    error,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["user"],
    queryFn: async () => {
      if (session != null) {
        const response = await axios.get(`${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/${session.user.id}`, {
          withCredentials: true,
        });
        console.log("res", response);
        return response.data;
      }
    },
    // F5 새로고침 시 세션이 인증된 상태에서만 요청을 수행합니다.
    // 이거 안하니까. F5 새로고침 시 세션이 인증되지 않은 상태에서 API요청을 수행해서 안 불러옴
    enabled: status === "authenticated",
  });

  useEffect(() => {
    if (userDetail) {
      const profileImageUrl = userDetail?.image?.link
        ? `${process.env.NEXT_PUBLIC_BASE_URL}${userDetail.image.link}`
        : null;
      setPreviewImage(profileImageUrl);
      setNickname(userDetail.nickname);
    }
  }, [userDetail]);

  const handleNicknameChange = (event: any) => {
    setNickname(event.target.value);
  };

  const handleImageChange = (event: any) => {
    const file = event.target.files[0];
    setProfileImage(file);
    setPreviewImage(URL.createObjectURL(file));
  };

  const mutation = useMutation({
    mutationFn: async (e: FormEvent) => {
      e.preventDefault();
      // FormData 객체에 닉네임과 프로필 이미지 추가
      const formData = new FormData();
      formData.append("nickname", nickname);
      if (profileImage) formData.append("profileImage", profileImage);

      return await axios.post(`${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/update`, formData, {
        withCredentials: true,
      });
    },
    onSuccess: (response) => {
      if (response.status === 200 || response.status === 201) {
        showMessage("프로필 변경 완료", "success");
      }
    },
    onError: (error: any) => {
      if (error.response && error.response.data.statusCode === 401) {
        showMessage(`${error.response.data.message}`, "error");
      }
    },
  });

  if (isLoading) return <Loading />;

  return (
    <Container component="main" maxWidth="xs" sx={{ mt: 10 }}>
      <Box display="flex" flexDirection="column" alignItems="center">
        <Typography variant="h5" gutterBottom>
          프로필 수정
        </Typography>

        <Avatar src={previewImage} sx={{ width: 100, height: 100, mb: 2 }} />

        <Button variant="contained" component="label">
          사진 업로드
          <input type="file" hidden onChange={handleImageChange} />
        </Button>
        <Button variant="contained" color="error">
          사진 삭제
        </Button>

        <TextField
          label="닉네임"
          value={nickname}
          onChange={handleNicknameChange}
          variant="outlined"
          sx={{ mt: 2, mb: 2, width: "100%" }}
        />

        <Button variant="contained" color="primary" onClick={mutation.mutate}>
          저장하기
        </Button>
      </Box>
    </Container>
  );
}

export default UserProfileEdit;
