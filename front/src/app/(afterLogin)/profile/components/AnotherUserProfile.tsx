import Loading from "@/app/components/common/Loading";
import CustomizedUserCommentsTables from "@/app/components/CustomizedUserCommentsTables";
import CustomizedUserTables from "@/app/components/CustomizedUserStoryTables";
import { Avatar, Box, Container, Typography } from "@mui/material";
import React from "react";

interface Props {
  userDetail: any;
}

export default function AnotherUserProfile({ userDetail }: Props) {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "row", // 한 줄에 나란히 배치
        alignItems: "flex-start", // 수직 정렬
        mt: 3,
        minHeight: "65vh",
      }}
    >
      <Box>
        <Typography
          variant="h6"
          gutterBottom
          sx={{ fontWeight: "bold", mb: 2, color: "primary.main", textAlign: "center" }}
        >
          최근 작성한 글
        </Typography>
        <Box
          sx={{
            bgcolor: "background.paper",
            boxShadow: 2,
            borderRadius: 2,
            p: 3,
          }}
        >
          <CustomizedUserTables tableData={userDetail?.posts || []} />
        </Box>
      </Box>
      <Container component="main" sx={{ mt: 8, width: "300px", marginTop: "48px" }}>
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
          {/* 제목 */}
          <Typography variant="h5" gutterBottom sx={{ fontWeight: "bold", mb: 2 }}>
            프로필 보기
          </Typography>

          {/* 프로필 사진 */}
          <Avatar
            src={`${process.env.NEXT_PUBLIC_BASE_URL}${userDetail.user.image?.link}`} // 기본 프로필 이미지 설정
            sx={{
              width: 120,
              height: 120,
              mb: 2,
              boxShadow: 2,
              border: "3px solid",
              borderColor: "primary.main",
            }}
          />
          {/* 닉네임 */}
          <Typography variant="h6" gutterBottom sx={{ fontWeight: "bold", mb: 1, textAlign: "center" }}>
            {userDetail.user.nickname}
          </Typography>
        </Box>
      </Container>

      <Box>
        <Typography
          variant="h6"
          gutterBottom
          sx={{ fontWeight: "bold", mb: 2, color: "primary.main", textAlign: "center" }}
        >
          최근 작성한 댓글
        </Typography>
        <Box
          sx={{
            bgcolor: "background.paper",
            boxShadow: 2,
            borderRadius: 2,
            p: 3,
          }}
        >
          <CustomizedUserCommentsTables tableData={userDetail?.comments || []} commentsFlag={true} />
        </Box>
      </Box>
    </Box>
  );
}
