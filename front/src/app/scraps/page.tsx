"use client";
import React, { useEffect, useState } from "react";
import { styled } from "@mui/material/styles";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell, { tableCellClasses } from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Paper from "@mui/material/Paper";
import {
  Box,
  Typography,
  Button,
  Container,
  IconButton,
  Tooltip,
  Pagination,
  Alert,
  CircularProgress,
} from "@mui/material";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/ko";
import DeleteIcon from "@mui/icons-material/Delete";
import BookmarkIcon from "@mui/icons-material/Bookmark";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useMessage } from "../store/messageStore";
import Loading from "../components/common/Loading";

dayjs.extend(relativeTime);
dayjs.locale("ko");

const StyledTableCell = styled(TableCell)(({ theme }) => ({
  [`&.${tableCellClasses.head}`]: {
    backgroundColor: theme.palette.common.black,
    color: theme.palette.common.white,
  },
  [`&.${tableCellClasses.body}`]: {
    fontSize: 14,
  },
}));

const StyledTableRow = styled(TableRow)(({ theme }) => ({
  "&:nth-of-type(odd)": {
    backgroundColor: theme.palette.action.hover,
  },
  "&:last-child td, &:last-child th": {
    border: 0,
  },
  "&:hover": {
    backgroundColor: theme.palette.mode === "dark" ? "rgba(139, 92, 246, 0.15)" : "#ffdef0",
  },
}));

interface ScrapItem {
  id: number;
  Story: {
    id: number;
    title: string;
    category: string;
    created_at: string;
    read_count: number;
    like_count: number;
    comment_count: number;
    User: {
      id: string;
      nickname: string;
    };
    Channel: {
      id: number;
      slug: string;
      name: string;
    };
  };
  created_at: string;
}

interface ScrapResponse {
  scraps: ScrapItem[];
  total: number;
  page: number;
  totalPages: number;
  message: string;
}

export default function ScrapsPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { showMessage } = useMessage();
  const queryClient = useQueryClient();
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // 로그인 상태 확인
  useEffect(() => {
    if (status === "unauthenticated") {
      showMessage("로그인이 필요합니다.", "warning");
      router.push("/login");
    }
  }, [status, router]);

  // 스크랩 목록 조회
  const {
    data: scrapsData,
    isLoading,
    isError,
    error,
  } = useQuery<ScrapResponse>({
    queryKey: ["scraps", currentPage],
    queryFn: async () => {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_BASE_URL}/api/scrap?page=${currentPage}&limit=${itemsPerPage}`,
        { withCredentials: true }
      );
      return response.data;
    },
    enabled: !!session?.user,
    staleTime: 1000 * 60 * 2,
  });

  // 스크랩 삭제 mutation
  const deleteScrapMutation = useMutation({
    mutationFn: async (scrapId: number) => {
      return await axios.delete(`${process.env.NEXT_PUBLIC_BASE_URL}/api/scrap/item/${scrapId}`, {
        withCredentials: true,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scraps"] });
      showMessage("스크랩이 삭제되었습니다.", "success");
    },
    onError: (error: any) => {
      console.error("스크랩 삭제 실패", error);
      showMessage(error.response?.data?.message || "스크랩 삭제 중 오류가 발생했습니다.", "error");
    },
  });

  // 페이지 변경 핸들러
  const handlePageChange = (event: React.ChangeEvent<unknown>, page: number) => {
    setCurrentPage(page);
  };

  // 스크랩 삭제 핸들러
  const handleDeleteScrap = (scrapId: number, storyTitle: string) => {
    if (window.confirm(`"${storyTitle}" 스크랩을 삭제하시겠습니까?`)) {
      deleteScrapMutation.mutate(scrapId);
    }
  };

  // 게시물로 이동
  const handleStoryClick = (scrap: ScrapItem) => {
    const { Story } = scrap;
    if (Story.Channel?.slug) {
      router.push(`/channels/${Story.Channel.slug}/detail/story/${Story.id}`);
    } else {
      // 채널 정보가 없는 경우 기본 경로로 이동
      router.push(`/detail/${Story.id}`);
    }
  };

  if (status === "loading" || isLoading) {
    return <Loading />;
  }

  if (status === "unauthenticated") {
    return null; // useEffect에서 리다이렉트 처리
  }

  if (isError) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="error">스크랩 목록을 불러오는 중 오류가 발생했습니다.</Alert>
      </Container>
    );
  }

  const scraps = scrapsData?.scraps || [];
  const totalPages = scrapsData?.totalPages || 0;

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <BookmarkIcon color="primary" />
          <Typography variant="h4" component="h1">
            내 스크랩
          </Typography>
        </Box>
        {scraps.length > 0 && (
          <Typography variant="body2" color="text.secondary">
            총 {scrapsData?.total || 0}개의 스크랩
          </Typography>
        )}
      </Box>

      <TableContainer component={Paper}>
        <Table
          aria-label="scraps table"
          sx={{
            "& .MuiTableCell-root": {
              borderBottom: "none",
            },
          }}
        >
          <TableHead>
            <TableRow>
              <StyledTableCell sx={{ width: "45%" }}>제목</StyledTableCell>
              <StyledTableCell sx={{ width: "12%", textAlign: "center" }}>카테고리</StyledTableCell>
              <StyledTableCell sx={{ width: "12%", textAlign: "center" }}>작성자</StyledTableCell>
              <StyledTableCell sx={{ width: "12%", textAlign: "center" }}>조회수</StyledTableCell>
              <StyledTableCell sx={{ width: "12%", textAlign: "right" }}>스크랩일</StyledTableCell>
              <StyledTableCell sx={{ width: "7%", textAlign: "center" }}>삭제</StyledTableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {scraps.length === 0 ? (
              <StyledTableRow>
                <StyledTableCell colSpan={6} align="center" sx={{ height: "200px" }}>
                  <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                    <BookmarkIcon sx={{ fontSize: 48, color: "text.secondary" }} />
                    <Typography variant="h6" color="text.secondary">
                      스크랩한 게시물이 없습니다
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      게시물에서 스크랩 버튼을 눌러 저장해보세요
                    </Typography>
                  </Box>
                </StyledTableCell>
              </StyledTableRow>
            ) : (
              scraps.map((scrap: ScrapItem) => (
                <StyledTableRow key={scrap.id} onClick={() => handleStoryClick(scrap)} sx={{ cursor: "pointer" }}>
                  <StyledTableCell>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Typography variant="body1" color="text.primary" noWrap>
                        {scrap.Story.title}
                      </Typography>
                    </Box>
                  </StyledTableCell>
                  <StyledTableCell align="center">
                    <Typography variant="body2" color="text.secondary">
                      {scrap.Story.category}
                    </Typography>
                  </StyledTableCell>
                  <StyledTableCell align="center">
                    <Typography variant="body2" color="text.secondary">
                      {scrap.Story.User.nickname}
                    </Typography>
                  </StyledTableCell>
                  <StyledTableCell align="center">
                    <Typography variant="body2" color="text.secondary">
                      {scrap.Story.read_count.toLocaleString()}
                    </Typography>
                  </StyledTableCell>
                  <StyledTableCell align="right">
                    <Typography variant="body2" color="text.secondary">
                      {dayjs(scrap.created_at).fromNow()}
                    </Typography>
                  </StyledTableCell>
                  <StyledTableCell align="center">
                    <Tooltip title="스크랩 삭제">
                      <IconButton
                        size="small"
                        color="error"
                        onClick={(e) => {
                          e.stopPropagation(); // 행 클릭 이벤트 방지
                          handleDeleteScrap(scrap.id, scrap.Story.title);
                        }}
                        disabled={deleteScrapMutation.isPending}
                      >
                        {deleteScrapMutation.isPending ? (
                          <CircularProgress size={16} />
                        ) : (
                          <DeleteIcon fontSize="small" />
                        )}
                      </IconButton>
                    </Tooltip>
                  </StyledTableCell>
                </StyledTableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* 페이지네이션 */}
      {totalPages > 1 && (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 3 }}>
          <Pagination count={totalPages} page={currentPage} onChange={handlePageChange} color="primary" size="large" />
        </Box>
      )}
    </Container>
  );
}
