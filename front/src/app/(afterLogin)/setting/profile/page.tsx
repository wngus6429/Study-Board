"use client";
import { useEffect, useState } from "react";
import { TextField, Button, Avatar, Typography, Box, Container, CircularProgress } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { useSession } from "next-auth/react";
import { User } from "next-auth";

function UserProfileEdit() {
  const [nickname, setNickname] = useState("");
  const [profileImage, setProfileImage] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);

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
  });

  useEffect(() => {
    if (userDetail) {
      console.log("userDetail", userDetail);
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

  const handleSubmit = async (event: any) => {
    event.preventDefault();

    // FormData 객체에 닉네임과 프로필 이미지 추가
    const formData = new FormData();
    formData.append("nickname", nickname);
    if (profileImage) formData.append("profileImage", profileImage);

    // 서버에 전송 (예: /api/user/update 엔드포인트)
    const response = await fetch("/api/user/update", {
      method: "POST",
      body: formData,
    });

    if (response.ok) {
      // 성공 시 처리 로직
      console.log("Profile updated successfully");
    } else {
      // 실패 시 처리 로직
      console.error("Failed to update profile");
    }
  };

  if (isLoading) {
    return <CircularProgress size={24} color="inherit" />;
  }

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

        <TextField
          label="닉네임"
          value={nickname}
          onChange={handleNicknameChange}
          variant="outlined"
          sx={{ mt: 2, mb: 2, width: "100%" }}
        />

        <Button variant="contained" color="primary" onClick={handleSubmit}>
          저장하기
        </Button>
      </Box>
    </Container>
  );
}

export default UserProfileEdit;
