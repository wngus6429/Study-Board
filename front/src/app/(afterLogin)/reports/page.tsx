"use client";
import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Box,
  Container,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Pagination,
  useTheme,
  Card,
  CardContent,
} from "@mui/material";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import axios from "@/app/api/axios";

// 신고 상태 타입
enum ReportStatus {
  PENDING = "pending",
  REVIEWING = "reviewing",
  APPROVED = "approved",
  REJECTED = "rejected",
}

// 신고 사유 타입
enum ReportReason {
  SPAM = "스팸/도배",
  ABUSE = "욕설/비방",
  ADULT_CONTENT = "음란물/성적 콘텐츠",
  VIOLENCE = "폭력적 콘텐츠",
  FALSE_INFO = "허위 정보",
  COPYRIGHT = "저작권 침해",
  PRIVACY = "개인정보 노출",
  OTHER = "기타",
}

interface Report {
  id: number;
  reason: ReportReason;
  custom_reason?: string;
  status: ReportStatus;
  admin_comment?: string;
  created_at: string;
  reviewed_at?: string;
  story: {
    id: number;
    title: string;
    content: string;
    category: string;
    created_at: string;
    author: string;
  };
  reporter: {
    id: number;
    nickname: string;
  };
  reviewer?: {
    id: number;
    nickname: string;
  };
}

interface ReportsResponse {
  reports: Report[];
  total: number;
}

export default function ReportsPage() {
  const theme = useTheme();
  const [page, setPage] = useState(1);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [statusFilter, setStatusFilter] = useState<ReportStatus | "">("");
  const [reviewDialog, setReviewDialog] = useState(false);
  const [reviewStatus, setReviewStatus] = useState<ReportStatus>(ReportStatus.APPROVED);
  const [adminComment, setAdminComment] = useState("");

  const limit = 10;
  const offset = (page - 1) * limit;

  // 신고 목록 조회
  const {
    data: reportsData,
    isLoading,
    refetch,
  } = useQuery<ReportsResponse>({
    queryKey: ["reports", page, statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams({
        offset: offset.toString(),
        limit: limit.toString(),
      });

      if (statusFilter) {
        params.append("status", statusFilter);
      }

      const response = await axios.get(`${process.env.NEXT_PUBLIC_BASE_URL}/api/story/admin/reports?${params}`, {
        withCredentials: true,
      });
      return response.data;
    },
  });

  // 상태별 색상 매핑
  const getStatusColor = (status: ReportStatus) => {
    switch (status) {
      case ReportStatus.PENDING:
        return "warning";
      case ReportStatus.REVIEWING:
        return "info";
      case ReportStatus.APPROVED:
        return "error";
      case ReportStatus.REJECTED:
        return "success";
      default:
        return "default";
    }
  };

  // 상태별 한글 텍스트
  const getStatusText = (status: ReportStatus) => {
    switch (status) {
      case ReportStatus.PENDING:
        return "대기중";
      case ReportStatus.REVIEWING:
        return "검토중";
      case ReportStatus.APPROVED:
        return "승인됨";
      case ReportStatus.REJECTED:
        return "반려됨";
      default:
        return status;
    }
  };

  const handleDetailClick = (report: Report) => {
    setSelectedReport(report);
  };

  const handleCloseDetail = () => {
    setSelectedReport(null);
  };

  const handleReviewClick = (report: Report) => {
    setSelectedReport(report);
    setReviewDialog(true);
    setReviewStatus(ReportStatus.APPROVED);
    setAdminComment("");
  };

  const handleReviewSubmit = async () => {
    if (!selectedReport) return;

    try {
      await axios.put(
        `${process.env.NEXT_PUBLIC_BASE_URL}/api/story/admin/reports/${selectedReport.id}/review`,
        {
          status: reviewStatus,
          admin_comment: adminComment,
        },
        { withCredentials: true }
      );

      setReviewDialog(false);
      setSelectedReport(null);
      refetch();
    } catch (error) {
      console.error("신고 검토 실패:", error);
    }
  };

  const totalPages = reportsData ? Math.ceil(reportsData.total / limit) : 0;

  if (isLoading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Typography>로딩 중...</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography
          variant="h4"
          component="h1"
          gutterBottom
          sx={{
            fontWeight: "bold",
            color: theme.palette.mode === "dark" ? "#A78BFA" : "#7C3AED",
          }}
        >
          신고 목록 관리
        </Typography>

        {/* 필터 */}
        <Box sx={{ mb: 3, display: "flex", gap: 2, alignItems: "center" }}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>상태 필터</InputLabel>
            <Select
              value={statusFilter}
              label="상태 필터"
              onChange={(e) => setStatusFilter(e.target.value as ReportStatus | "")}
            >
              <MenuItem value="">전체</MenuItem>
              <MenuItem value={ReportStatus.PENDING}>대기중</MenuItem>
              <MenuItem value={ReportStatus.REVIEWING}>검토중</MenuItem>
              <MenuItem value={ReportStatus.APPROVED}>승인됨</MenuItem>
              <MenuItem value={ReportStatus.REJECTED}>반려됨</MenuItem>
            </Select>
          </FormControl>

          <Typography variant="body2" color="text.secondary">
            총 {reportsData?.total || 0}건의 신고
          </Typography>
        </Box>

        {/* 신고 목록 테이블 */}
        <TableContainer component={Paper} sx={{ mb: 3 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>신고 ID</TableCell>
                <TableCell>게시글 제목</TableCell>
                <TableCell>신고 사유</TableCell>
                <TableCell>신고자</TableCell>
                <TableCell>상태</TableCell>
                <TableCell>신고일</TableCell>
                <TableCell>작업</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {reportsData?.reports.map((report) => (
                <TableRow key={report.id}>
                  <TableCell>{report.id}</TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ maxWidth: 200 }} noWrap>
                      {report.story.title}
                    </Typography>
                  </TableCell>
                  <TableCell>{report.reason}</TableCell>
                  <TableCell>{report.reporter.nickname}</TableCell>
                  <TableCell>
                    <Chip
                      label={getStatusText(report.status)}
                      color={getStatusColor(report.status) as any}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{format(new Date(report.created_at), "yyyy-MM-dd HH:mm", { locale: ko })}</TableCell>
                  <TableCell>
                    <Box sx={{ display: "flex", gap: 1 }}>
                      <Button size="small" variant="outlined" onClick={() => handleDetailClick(report)}>
                        상세
                      </Button>
                      {report.status === ReportStatus.PENDING && (
                        <Button
                          size="small"
                          variant="contained"
                          color="primary"
                          onClick={() => handleReviewClick(report)}
                        >
                          검토
                        </Button>
                      )}
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {/* 페이지네이션 */}
        {totalPages > 1 && (
          <Box sx={{ display: "flex", justifyContent: "center" }}>
            <Pagination count={totalPages} page={page} onChange={(_, newPage) => setPage(newPage)} color="primary" />
          </Box>
        )}
      </Box>

      {/* 신고 상세 다이얼로그 */}
      <Dialog open={Boolean(selectedReport && !reviewDialog)} onClose={handleCloseDetail} maxWidth="md" fullWidth>
        <DialogTitle>신고 상세 정보</DialogTitle>
        <DialogContent>
          {selectedReport && (
            <Box sx={{ mt: 2 }}>
              <Card sx={{ mb: 2 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    신고 정보
                  </Typography>
                  <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        신고 ID
                      </Typography>
                      <Typography variant="body1">{selectedReport.id}</Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        상태
                      </Typography>
                      <Chip
                        label={getStatusText(selectedReport.status)}
                        color={getStatusColor(selectedReport.status) as any}
                        size="small"
                      />
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        신고 사유
                      </Typography>
                      <Typography variant="body1">{selectedReport.reason}</Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        신고자
                      </Typography>
                      <Typography variant="body1">{selectedReport.reporter.nickname}</Typography>
                    </Box>
                  </Box>
                  {selectedReport.custom_reason && (
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="body2" color="text.secondary">
                        상세 사유
                      </Typography>
                      <Typography variant="body1">{selectedReport.custom_reason}</Typography>
                    </Box>
                  )}
                </CardContent>
              </Card>

              <Card sx={{ mb: 2 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    신고된 게시글
                  </Typography>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      제목
                    </Typography>
                    <Typography variant="body1">{selectedReport.story.title}</Typography>
                  </Box>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      작성자
                    </Typography>
                    <Typography variant="body1">{selectedReport.story.author}</Typography>
                  </Box>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      카테고리
                    </Typography>
                    <Typography variant="body1">{selectedReport.story.category}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      내용 미리보기
                    </Typography>
                    <Typography variant="body1">{selectedReport.story.content}</Typography>
                  </Box>
                </CardContent>
              </Card>

              {selectedReport.admin_comment && (
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      관리자 검토 의견
                    </Typography>
                    <Typography variant="body1">{selectedReport.admin_comment}</Typography>
                    {selectedReport.reviewer && (
                      <Box sx={{ mt: 1 }}>
                        <Typography variant="body2" color="text.secondary">
                          검토자: {selectedReport.reviewer.nickname}
                        </Typography>
                      </Box>
                    )}
                    {selectedReport.reviewed_at && (
                      <Box sx={{ mt: 1 }}>
                        <Typography variant="body2" color="text.secondary">
                          검토일시: {format(new Date(selectedReport.reviewed_at), "yyyy-MM-dd HH:mm", { locale: ko })}
                        </Typography>
                      </Box>
                    )}
                  </CardContent>
                </Card>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDetail}>닫기</Button>
        </DialogActions>
      </Dialog>

      {/* 신고 검토 다이얼로그 */}
      <Dialog open={reviewDialog} onClose={() => setReviewDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>신고 검토</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>검토 결과</InputLabel>
              <Select
                value={reviewStatus}
                label="검토 결과"
                onChange={(e) => setReviewStatus(e.target.value as ReportStatus)}
              >
                <MenuItem value={ReportStatus.APPROVED}>승인 (조치 필요)</MenuItem>
                <MenuItem value={ReportStatus.REJECTED}>반려 (조치 불필요)</MenuItem>
              </Select>
            </FormControl>

            <TextField
              fullWidth
              multiline
              rows={4}
              label="관리자 의견"
              value={adminComment}
              onChange={(e) => setAdminComment(e.target.value)}
              placeholder="검토 의견을 입력해주세요..."
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReviewDialog(false)}>취소</Button>
          <Button onClick={handleReviewSubmit} variant="contained" color="primary">
            검토 완료
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
