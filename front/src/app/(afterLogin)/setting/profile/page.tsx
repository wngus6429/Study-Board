"use client";
import { FormEvent, useEffect, useState } from "react";
import { TextField, Button, Avatar, Typography, Box, Container } from "@mui/material";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useSession } from "next-auth/react";
import Loading from "@/app/components/common/Loading";
import { useRouter } from "next/navigation";
import { useMessage } from "@/app/store/messageStore";
import { useUserImage } from "@/app/store/userImageStore";
import { USER_TABLE_VIEW_COUNT } from "@/app/const/TABLE_VIEW_COUNT";
import CustomizedUserTables from "@/app/components/CustomizedUserStoryTables";
import Pagination from "@/app/components/common/Pagination";
import CustomizedUserCommentsTables from "@/app/components/CustomizedUserCommentsTables";
import ProfilePagination from "@/app/components/common/ProfilePagination";

interface ApiStoryResponse {
  StoryResults: any[];
  StoryTotal: number;
}

interface ApiCommentsResponse {
  CommentsResults: any[];
  CommentsTotal: number;
}

function UserProfileEdit() {
  const [nickname, setNickname] = useState("");
  const [profileImage, setProfileImage] = useState<any>(null);
  const [previewImage, setPreviewImage] = useState<any>(null);
  const { showMessage } = useMessage((state) => state);

  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: session, status } = useSession();
  const { setTopBarImageDelete, setUserImageUrl } = useUserImage();

  // 프로필 정보 불러옴
  const fetchUserDetail = async (userId: string) => {
    const response = await axios.get(`${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/${userId}`, {
      withCredentials: true,
    });
    return response.data;
  };
  // 프로필 정보 미리 불러옴
  if (status === "authenticated" && session?.user?.id) {
    queryClient.prefetchQuery({
      queryKey: ["userInfo", session.user.id],
      queryFn: () => fetchUserDetail(session.user.id),
    });
  }

  // 세션이 인증된 상태에서만 요청을 수행합니다.
  // 위에 프리패칭된 데이터를 사용, 키가 일치하니까. 새로고침 시에도 데이터가 날라가지 않음
  const {
    data: userDetail,
    error,
    isLoading,
  } = useQuery<any>({
    queryKey: ["userInfo", session?.user.id],
    queryFn: () => {
      console.log("유즈쿼리");
      fetchUserDetail(session?.user.id as string);
    },
    retry: 1,
    retryDelay: () => 2000,
    // F5 새로고침 시 세션이 인증된 상태에서만 요청을 수행합니다.
    // 이거 안하니까. F5 새로고침 시 세션이 인증되지 않은 상태에서 API요청을 수행해서 안 불러옴
    enabled: status === "authenticated",
    staleTime: 1000 * 60 * 1,
    gcTime: 1000 * 10 * 1,
  });

  const [storyCurrentPage, setStoryCurrentPage] = useState(1);
  const [commentsCurrentPage, setCommentsCurrentPage] = useState(1);
  const viewCount: number = USER_TABLE_VIEW_COUNT;

  const {
    data: UserStory,
    error: UserTableError,
    isLoading: UserStoryIsLoading,
  } = useQuery<ApiStoryResponse>({
    queryKey: ["user", "stories", storyCurrentPage],
    queryFn: async () => {
      console.log("유저 스토리 불러옴");
      const offset = (storyCurrentPage - 1) * viewCount;
      const response = await axios.post<ApiStoryResponse>(
        `${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/userStoryTableData`,
        {
          offset,
          limit: viewCount,
          userId: session?.user.id,
        },
        { withCredentials: true }
      );
      return response.data;
    },
    enabled: status === "authenticated",
  });

  const {
    data: UserComments,
    error: UserCommentsTableError,
    isLoading: UserCommentsIsLoading,
  } = useQuery<ApiCommentsResponse>({
    queryKey: ["user", "comments", commentsCurrentPage],
    queryFn: async () => {
      console.log("유저 코멘트 불러옴");
      const offset = (commentsCurrentPage - 1) * viewCount;
      const response = await axios.post<ApiCommentsResponse>(
        `${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/userCommentsTableData`,
        {
          offset,
          limit: viewCount,
          userId: session?.user.id,
        },
        { withCredentials: true }
      );
      return response.data;
    },
    retry: 1,
    retryDelay: () => 2000,
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
    if (file) {
      setProfileImage(file);
      setPreviewImage(URL.createObjectURL(file));
    } else {
      console.error("파일이 선택되지 않았습니다.");
    }
  };

  const deleteProfileImageMutation = useMutation({
    mutationFn: async () => {
      if (!session?.user.id) {
        showMessage("로그인 해라", "error");
        return;
      }
      return await axios.delete(`${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/delete`, {
        data: { id: session.user.id },
        withCredentials: true,
      });
    },
    retry: 1, // 최대 1회 재시도
    retryDelay: () => 2000, // 재시도마다 2초 지연
    onSuccess: () => {
      setPreviewImage(null);
      queryClient.removeQueries({ queryKey: ["userTopImage", session?.user.id] });
      setTopBarImageDelete();
      setUserImageUrl("");
      showMessage("프로필 사진 삭제 완료", "success");
    },
    onError: (error: any) => {
      showMessage("프로필 사진 삭제 실패", "error");
      console.error(error);
    },
  });

  const mutation = useMutation({
    mutationFn: async (e: FormEvent) => {
      if (!session?.user.id) {
        showMessage("로그인 해라", "error");
        return;
      }
      if (session != null) {
        e.preventDefault();
        // FormData 객체에 닉네임과 프로필 이미지 추가
        const formData = new FormData();
        formData.append("nickname", nickname);
        formData.append("id", session.user.id);

        if (profileImage) formData.append("profileImage", profileImage);

        return await axios.post(`${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/update`, formData, {
          withCredentials: true,
        });
      }
    },
    retry: 1,
    retryDelay: () => 2000,
    onSuccess: async () => {
      // 기존에 있던 이미지 캐쉬파일 삭제해서, 다시 프로필 페이지 왔을때 원래 있던 사진이 잠시 보이는걸 방지함
      await queryClient.invalidateQueries({ queryKey: ["userInfo", session?.user.id] });
      await queryClient.refetchQueries({ queryKey: ["userTopImage", session?.user.id] });
      showMessage("프로필 변경 완료", "success");
      router.push("/");
    },
    onError: (error: any) => {
      if (error.response && error.response.data.statusCode === 401) {
        showMessage(`${error.response.data.message}`, "error");
      }
    },
  });

  // 비밀번호 변경 핸들러
  const handlePasswordChange = async () => {
    if (newPassword !== confirmPassword) {
      showMessage("비밀번호가 일치하지 않습니다.", "error");
      return;
    }
    try {
      await axios.post(
        `${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/password`,
        {
          id: session?.user.id,
          password: newPassword,
        },
        { withCredentials: true }
      );
      showMessage("비밀번호 변경 완료", "success");
      setOpenPasswordChange(false);
    } catch (error) {
      showMessage("비밀번호 변경 실패", "error");
    }
  };

  const [openPasswordChange, setOpenPasswordChange] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleStoryPageClick = (selectedItem: { selected: number }) => {
    const newPage = selectedItem.selected + 1;
    setStoryCurrentPage(newPage);
  };

  const handleCommentsPageClick = (selectedItem: { selected: number }) => {
    const newPage = selectedItem.selected + 1;
    setCommentsCurrentPage(newPage);
  };

  if (isLoading) return <Loading />;

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "row", // 한 줄에 나란히 배치
        alignItems: "flex-start", // 수직 정렬
        mt: 3,
        minHeight: "75vh",
      }}
    >
      <Box>
        <Typography
          variant="h6"
          gutterBottom
          sx={{ fontWeight: "bold", mb: 2, color: "primary.main", textAlign: "center" }}
        >
          작성한 글
        </Typography>
        <Box
          sx={{
            bgcolor: "background.paper",
            boxShadow: 2,
            borderRadius: 2,
            p: 3,
          }}
        >
          <CustomizedUserTables tableData={UserStory?.StoryResults || []} />
          <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
            <ProfilePagination
              pageCount={Math.ceil((UserStory?.StoryTotal || 0) / viewCount)}
              onPageChange={handleStoryPageClick}
              currentPage={storyCurrentPage}
            />
          </Box>
        </Box>
      </Box>
      <Container component="main" sx={{ mt: 8, width: "300px", marginLeft: "none", marginTop: "48px" }}>
        <Box
          display="flex"
          flexDirection="column"
          alignItems="center"
          sx={{
            bgcolor: "background.paper",
            boxShadow: 3,
            p: 3,
            borderRadius: 2,
          }}
        >
          <Typography variant="h5" gutterBottom sx={{ fontWeight: "bold", mb: 2 }}>
            프로필 수정
          </Typography>
          <Avatar
            src={previewImage}
            sx={{
              width: 120,
              height: 120,
              mb: 2,
              boxShadow: 2,
              border: "3px solid",
              borderColor: "primary.main",
            }}
          />
          <Box display="flex" gap={1} sx={{ mb: 2, textAlign: "center" }}>
            <Button variant="outlined" component="label" color="primary" sx={{ flexGrow: 1 }}>
              사진 <br />
              업로드
              <input type="file" hidden onChange={handleImageChange} />
            </Button>
            <Button
              variant="outlined"
              color="error"
              onClick={() => deleteProfileImageMutation.mutate()}
              sx={{ flexGrow: 1 }}
            >
              사진 <br />
              삭제
            </Button>
          </Box>
          <TextField
            label="닉네임"
            value={nickname}
            onChange={handleNicknameChange}
            variant="outlined"
            fullWidth
            sx={{ mb: 2 }}
          />
          <Button
            variant="contained"
            color="primary"
            fullWidth
            sx={{ mb: 2, py: 1.5, fontWeight: "bold" }}
            onClick={mutation.mutate}
          >
            저장하기
          </Button>
          <Button
            variant="contained"
            color="error"
            fullWidth
            sx={{ py: 1.5, fontWeight: "bold" }}
            onClick={() => setOpenPasswordChange(!openPasswordChange)}
          >
            {openPasswordChange ? "비밀번호 변경 취소" : "비밀번호 변경"}
          </Button>
          {openPasswordChange && (
            <Box sx={{ mt: 2, width: "100%", bgcolor: "grey.100", p: 2, borderRadius: 1, boxShadow: 1 }}>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: "bold", mb: 2, textAlign: "center" }}>
                비밀번호 변경
              </Typography>
              <TextField
                label="새 비밀번호"
                type="password"
                fullWidth
                variant="outlined"
                sx={{ mb: 2 }}
                onChange={(e) => setNewPassword(e.target.value)}
              />
              <TextField
                label="새 비밀번호 확인"
                type="password"
                fullWidth
                variant="outlined"
                sx={{ mb: 2 }}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
              <Button
                variant="contained"
                color="primary"
                fullWidth
                sx={{ py: 1.5, fontWeight: "bold" }}
                onClick={handlePasswordChange}
              >
                비밀번호 변경
              </Button>
            </Box>
          )}
        </Box>
      </Container>
      <Box>
        <Typography
          variant="h6"
          gutterBottom
          sx={{ fontWeight: "bold", mb: 2, color: "primary.main", textAlign: "center" }}
        >
          작성한 댓글
        </Typography>
        <Box
          sx={{
            bgcolor: "background.paper",
            boxShadow: 2,
            borderRadius: 2,
            p: 3,
          }}
        >
          <CustomizedUserCommentsTables tableData={UserComments?.CommentsResults || []} commentsFlag={false} />
          <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
            <ProfilePagination
              pageCount={Math.ceil((UserComments?.CommentsTotal || 0) / viewCount)}
              onPageChange={handleCommentsPageClick}
              currentPage={commentsCurrentPage}
            />
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

export default UserProfileEdit;
