"use client";
import { FormEvent, useEffect, useState } from "react";
import { TextField, Button, Avatar, Typography, Box, Container, CircularProgress, useTheme } from "@mui/material";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useSession } from "next-auth/react";
import Loading from "@/app/components/common/Loading";
import { useRouter } from "next/navigation";
import { useMessage } from "@/app/store/messageStore";
import { useUserImage } from "@/app/store/userImageStore";
import { USER_TABLE_VIEW_COUNT } from "@/app/const/VIEW_COUNT";
import CustomizedUserTables from "@/app/components/table/CustomizedUserStoryTables";
import Pagination from "@/app/components/common/Pagination";
import CustomizedUserCommentsTables from "@/app/components/table/CustomizedUserCommentsTables";
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
  const theme = useTheme();

  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: session, status, update } = useSession();
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
    staleTime: 1000 * 10, // 10초간 캐시 유지 (게시판 실시간성 고려)
    gcTime: 1000 * 30, // 30초간 가비지 컬렉션 방지
  });

  const [storyCurrentPage, setStoryCurrentPage] = useState<number>(1);
  const [commentsCurrentPage, setCommentsCurrentPage] = useState<number>(1);

  const viewCount: number = USER_TABLE_VIEW_COUNT;

  const {
    data: UserStory,
    error: UserTableError,
    isLoading: UserStoryIsLoading,
    isFetching: UserStoryIsFetching,
    isPlaceholderData: UserStoryIsPlaceholderData,
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
    retry: 1,
    retryDelay: () => 2000,
    staleTime: 1000 * 10, // 10초간 캐시 유지 (게시판 실시간성 고려)
    gcTime: 1000 * 30, // 30초간 가비지 컬렉션 방지
    placeholderData: (previousData) => previousData, // 이전 데이터 유지로 깜빡임 방지
    refetchOnWindowFocus: false, // 윈도우 포커스 시 재요청 방지
  });

  const {
    data: UserComments,
    error: UserCommentsTableError,
    isLoading: UserCommentsIsLoading,
    isFetching: UserCommentsIsFetching,
    isPlaceholderData: UserCommentsIsPlaceholderData,
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
    staleTime: 1000 * 10, // 10초간 캐시 유지 (게시판 실시간성 고려)
    gcTime: 1000 * 30, // 30초간 가비지 컬렉션 방지
    placeholderData: (previousData) => previousData, // 이전 데이터 유지로 깜빡임 방지
    refetchOnWindowFocus: false, // 윈도우 포커스 시 재요청 방지
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
      // 이미지 파일인지 확인
      const validImageTypes = ["image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml", "image/bmp"];
      if (!validImageTypes.includes(file.type)) {
        showMessage("이미지 파일만 업로드 가능합니다 (JPG, PNG, GIF, WEBP, SVG, BMP).", "error");
        return;
      }

      if (file.size > 500 * 1024) {
        showMessage("파일 크기가 너무 큽니다. 500KB 이하의 파일을 선택하세요.", "error");
        return;
      }
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
    onSuccess: async () => {
      setPreviewImage(null);
      queryClient.removeQueries({ queryKey: ["userTopImage", session?.user.id] });
      setTopBarImageDelete();
      setUserImageUrl("");
      showMessage("프로필 사진 삭제 완료", "success");
      await update({ image: null });
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
    onSuccess: async (res) => {
      await update({
        image: res?.data.image,
        nickname: res?.data.nickname, // 닉네임도 바뀌었으면 함께 넘겨주세요
      });
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

  const [verifyPassword, setVerifyPassword] = useState<boolean>(false);
  const [verifyInputPassword, setVerifyInputPassword] = useState<string>("");

  // 현재 비밀번호 검증 함수 (API 엔드포인트는 실제 상황에 맞게 수정하세요)
  const handleVerifyCurrentPassword = async () => {
    try {
      const res = await axios.post(
        `${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/verifyPassword`,
        {
          id: session?.user.id,
          currentPassword: verifyInputPassword,
        },
        { withCredentials: true }
      );
      if (res.data) {
        setIsVerified(true);
        setVerifyPassword(false);
        showMessage("현재 비밀번호 확인 완료", "success");
      } else {
        showMessage("현재 비밀번호가 일치하지 않습니다.", "error");
      }
    } catch (error) {
      showMessage("비밀번호 확인 에러", "error");
    }
  };
  // 비밀번호 확인 완료되면, 비밀번호 변경 입력창 보이게함
  const [isVerified, setIsVerified] = useState<boolean>(false);
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
      setIsVerified(false);
    } catch (error) {
      showMessage("비밀번호 변경 실패", "error");
    }
  };

  if (isLoading) return <Loading />;

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        mt: 3,
        minHeight: "75vh",
        gap: 4,
      }}
    >
      {/* 첫 번째 행: 프로필 수정 + 작성한 글 테이블 */}
      <Box
        sx={{
          display: "flex",
          flexDirection: "row",
          gap: 4,
          width: "100%",
          maxWidth: "1400px",
          alignItems: "flex-start",
        }}
      >
        {/* 왼쪽: 프로필 수정 영역 */}
        <Box sx={{ width: "400px", flexShrink: 0 }}>
          <Box
            sx={{
              bgcolor: "background.paper",
              boxShadow: 3,
              p: 3,
              borderRadius: 2,
            }}
          >
            <Typography
              variant="h6"
              gutterBottom
              sx={{ fontWeight: "bold", mb: 2, color: "primary.main", textAlign: "center" }}
            >
              프로필 수정
            </Typography>
            {/* 프로필 사진과 입력 요소들을 한 줄로 배치 */}
            <Box display="flex" flexDirection="row" alignItems="flex-start" sx={{ gap: 3, mb: 3 }}>
              <Avatar
                src={previewImage}
                sx={{
                  width: 120,
                  height: 120,
                  boxShadow: 2,
                  border: "3px solid",
                  borderColor: "primary.main",
                  flexShrink: 0,
                }}
              />
              <Box sx={{ flexGrow: 1, display: "flex", flexDirection: "column", gap: 2 }}>
                <Box display="flex" gap={1}>
                  <Button variant="outlined" component="label" color="primary" sx={{ flexGrow: 1 }}>
                    사진 업로드
                    <input type="file" hidden onChange={handleImageChange} accept="image/*" />
                  </Button>
                  <Button
                    variant="outlined"
                    color="error"
                    onClick={() => deleteProfileImageMutation.mutate()}
                    sx={{ flexGrow: 1 }}
                  >
                    사진 삭제
                  </Button>
                </Box>
                <TextField
                  label="닉네임"
                  value={nickname}
                  onChange={handleNicknameChange}
                  variant="outlined"
                  fullWidth
                />
                <Button
                  variant="contained"
                  color="primary"
                  fullWidth
                  sx={{ py: 1.5, fontWeight: "bold" }}
                  onClick={mutation.mutate}
                >
                  저장하기
                </Button>
              </Box>
            </Box>

            {/* 비밀번호 변경 버튼은 아래에 별도로 배치 */}
            <Button
              variant="contained"
              color="error"
              fullWidth
              sx={{ py: 1.5, fontWeight: "bold" }}
              onClick={() => setVerifyPassword(!verifyPassword)}
            >
              {verifyPassword ? "비밀번호 변경 취소" : "비밀번호 변경"}
            </Button>

            {verifyPassword && (
              <Box
                sx={{
                  mt: 2,
                  width: "100%",
                  bgcolor: "background.paper",
                  p: 2,
                  borderRadius: 1,
                  boxShadow: 2,
                  border: 1,
                  borderColor: "divider",
                }}
              >
                <TextField
                  label="원래 비밀번호"
                  type="password"
                  fullWidth
                  variant="outlined"
                  sx={{ mb: 2 }}
                  onChange={(e) => setVerifyInputPassword(e.target.value)}
                />
                <Button
                  variant="contained"
                  color="warning"
                  fullWidth
                  sx={{ py: 1.5, fontWeight: "bold" }}
                  onClick={() => handleVerifyCurrentPassword()}
                >
                  확인하기
                </Button>
              </Box>
            )}
            {isVerified && (
              <Box
                sx={{
                  mt: 2,
                  width: "100%",
                  bgcolor: "background.paper",
                  p: 2,
                  borderRadius: 1,
                  boxShadow: 2,
                  border: 1,
                  borderColor: "divider",
                }}
              >
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
                  sx={{ py: 1.5, fontWeight: "bold", mb: 1 }}
                  onClick={handlePasswordChange}
                >
                  비밀번호 변경
                </Button>
                <Button
                  variant="outlined"
                  color="secondary"
                  fullWidth
                  sx={{ py: 1.5, fontWeight: "bold" }}
                  onClick={() => setIsVerified(false)}
                >
                  비밀번호 변경 취소
                </Button>
              </Box>
            )}
          </Box>
        </Box>

        {/* 오른쪽: 작성한 글 테이블 */}
        <Box sx={{ flexGrow: 1 }}>
          <Box
            sx={{
              bgcolor: "background.paper",
              boxShadow: 2,
              borderRadius: 2,
              p: 3,
              position: "relative",
              minHeight: "400px",
            }}
          >
            <Typography
              variant="h6"
              gutterBottom
              sx={{ fontWeight: "bold", mb: 2, color: "primary.main", textAlign: "center" }}
            >
              작성한 글
            </Typography>
            {UserStoryIsFetching && !UserStoryIsPlaceholderData && (
              <Box
                sx={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  bgcolor: theme.palette.mode === "dark" ? "rgba(26, 26, 46, 0.9)" : "rgba(255, 255, 255, 0.8)",
                  zIndex: 1,
                  borderRadius: 2,
                }}
              >
                <CircularProgress
                  size={40}
                  sx={{
                    color: theme.palette.mode === "dark" ? "#a78bfa" : "primary.main",
                  }}
                />
              </Box>
            )}
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
      </Box>

      {/* 두 번째 행: 작성한 댓글 테이블 (전체 너비) */}
      <Box sx={{ width: "100%", maxWidth: "1400px" }}>
        <Box
          sx={{
            bgcolor: "background.paper",
            boxShadow: 2,
            borderRadius: 2,
            p: 3,
            position: "relative",
            minHeight: "400px",
          }}
        >
          <Typography
            variant="h6"
            gutterBottom
            sx={{ fontWeight: "bold", mb: 2, color: "primary.main", textAlign: "center" }}
          >
            작성한 댓글
          </Typography>
          {UserCommentsIsFetching && !UserCommentsIsPlaceholderData && (
            <Box
              sx={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                bgcolor: theme.palette.mode === "dark" ? "rgba(26, 26, 46, 0.9)" : "rgba(255, 255, 255, 0.8)",
                zIndex: 1,
                borderRadius: 2,
              }}
            >
              <CircularProgress
                size={40}
                sx={{
                  color: theme.palette.mode === "dark" ? "#a78bfa" : "primary.main",
                }}
              />
            </Box>
          )}
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
