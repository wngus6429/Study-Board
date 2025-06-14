"use client";
import React, { useState, useEffect } from "react";
import {
  Container,
  Typography,
  Box,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Divider,
  CircularProgress,
  Pagination,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Snackbar,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import WarningIcon from "@mui/icons-material/Warning";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { getBlindUsers, addBlindUser, removeBlindUser } from "../api/blind";
import { IBlindUser } from "../types/blind";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";
import { useBlindStore } from "../store/blindStore";

export default function BlindsPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const queryClient = useQueryClient();
  const { setBlindUsers } = useBlindStore();

  const [page, setPage] = useState(1);
  const [openDialog, setOpenDialog] = useState(false);
  const [targetUserNickname, setTargetUserNickname] = useState("");
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" as "success" | "error" });

  // 블라인드 해제 확인 다이얼로그 상태 추가
  const [openRemoveDialog, setOpenRemoveDialog] = useState(false);
  const [selectedBlindUser, setSelectedBlindUser] = useState<{ id: number; nickname: string } | null>(null);

  const limit = 10;

  // 블라인드 목록 조회
  const { data, isLoading, error } = useQuery({
    queryKey: ["blindUsers", page],
    queryFn: () => getBlindUsers(page, limit),
    enabled: !!session?.user && status === "authenticated",
  });

  // 블라인드 사용자 추가
  const addMutation = useMutation({
    mutationFn: addBlindUser,
    onSuccess: (newBlindUser) => {
      queryClient.invalidateQueries({ queryKey: ["blindUsers"] });
      setOpenDialog(false);
      setTargetUserNickname("");
      setSnackbar({ open: true, message: "사용자를 블라인드 목록에 추가했습니다.", severity: "success" });
    },
    onError: (error: any) => {
      setSnackbar({
        open: true,
        message: error.response?.data?.message || "블라인드 추가에 실패했습니다.",
        severity: "error",
      });
    },
  });

  // 블라인드 해제
  const removeMutation = useMutation({
    mutationFn: removeBlindUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["blindUsers"] });
      setSnackbar({ open: true, message: "블라인드를 해제했습니다.", severity: "success" });
    },
    onError: (error: any) => {
      setSnackbar({
        open: true,
        message: error.response?.data?.message || "블라인드 해제에 실패했습니다.",
        severity: "error",
      });
    },
  });

  // 블라인드 목록이 변경될 때마다 스토어 업데이트
  useEffect(() => {
    if (data?.items) {
      setBlindUsers(data.items);
    }
  }, [data?.items, setBlindUsers]);

  // 로그인 체크
  if (status === "loading") {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  if (!session?.user) {
    router.push("/login");
    return null;
  }

  // 시간 포맷팅
  const formatTime = (dateString: string) => {
    return formatDistanceToNow(new Date(dateString), {
      addSuffix: true,
      locale: ko,
    });
  };

  const handleAddBlindUser = () => {
    if (!targetUserNickname.trim()) {
      setSnackbar({ open: true, message: "닉네임을 입력해주세요.", severity: "error" });
      return;
    }
    addMutation.mutate({ targetUserNickname: targetUserNickname.trim() });
  };

  const handleRemoveBlindUser = (blindId: number, nickname: string) => {
    setSelectedBlindUser({ id: blindId, nickname });
    setOpenRemoveDialog(true);
  };

  const confirmRemoveBlindUser = () => {
    if (selectedBlindUser) {
      removeMutation.mutate(selectedBlindUser.id);
      setOpenRemoveDialog(false);
      setSelectedBlindUser(null);
    }
  };

  const cancelRemoveBlindUser = () => {
    setOpenRemoveDialog(false);
    setSelectedBlindUser(null);
  };

  const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  if (error) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Typography color="error">블라인드 목록을 불러오는 중 오류가 발생했습니다.</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 3 }}>
        {/* 헤더 */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4" fontWeight="bold">
            블라인드 관리
          </Typography>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setOpenDialog(true)} color="primary">
            사용자 블라인드
          </Button>
        </Box>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          블라인드된 사용자의 게시글과 댓글은 "블라인드된 사용자입니다."로 표시됩니다.
        </Typography>

        <Divider sx={{ mb: 2 }} />

        {/* 블라인드 목록 */}
        {isLoading ? (
          <Box display="flex" justifyContent="center" py={5}>
            <CircularProgress />
          </Box>
        ) : !data || data.items.length === 0 ? (
          <Box py={5} textAlign="center">
            <Typography color="text.secondary">블라인드된 사용자가 없습니다.</Typography>
          </Box>
        ) : (
          <>
            <List>
              {data.items.map((blindUser, index) => (
                <React.Fragment key={blindUser.id}>
                  <ListItem>
                    <ListItemText
                      primary={
                        <Typography variant="body1" fontWeight="medium">
                          {blindUser.targetUser.nickname}
                        </Typography>
                      }
                      secondary={
                        <>
                          <Typography variant="caption" color="text.secondary">
                            블라인드 시간: {formatTime(blindUser.createdAt)}
                          </Typography>
                        </>
                      }
                    />
                    <ListItemSecondaryAction>
                      <IconButton
                        edge="end"
                        aria-label="블라인드 해제"
                        onClick={() => handleRemoveBlindUser(blindUser.id, blindUser.targetUser.nickname)}
                        color="error"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                  {index < data.items.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>

            {/* 페이지네이션 */}
            {data.totalPages > 1 && (
              <Box display="flex" justifyContent="center" mt={3}>
                <Pagination count={data.totalPages} page={page} onChange={handlePageChange} color="primary" />
              </Box>
            )}
          </>
        )}
      </Paper>

      {/* 블라인드 추가 다이얼로그 */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>사용자 블라인드</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            블라인드하려는 사용자의 닉네임을 입력해주세요.
          </Typography>
          <TextField
            autoFocus
            margin="dense"
            label="닉네임"
            type="text"
            fullWidth
            variant="outlined"
            value={targetUserNickname}
            onChange={(e) => setTargetUserNickname(e.target.value)}
            placeholder="예: testuser"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>취소</Button>
          <Button onClick={handleAddBlindUser} variant="contained" disabled={addMutation.isPending}>
            {addMutation.isPending ? "추가 중..." : "블라인드"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 블라인드 해제 확인 다이얼로그 */}
      <Dialog open={openRemoveDialog} onClose={cancelRemoveBlindUser} maxWidth="sm" fullWidth>
        <DialogTitle
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            color: "error.main",
            fontWeight: "bold",
          }}
        >
          <WarningIcon color="error" />
          블라인드 해제 확인
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 2,
              py: 2,
            }}
          >
            <VisibilityOffIcon sx={{ fontSize: 48, color: "text.secondary" }} />
            <Typography variant="body1" color="text.primary" textAlign="center">
              <strong>"{selectedBlindUser?.nickname}"</strong> 사용자의 블라인드를 해제하시겠습니까?
            </Typography>
            <Typography variant="body2" color="text.secondary" textAlign="center">
              해제 후 해당 사용자의 게시글과 댓글이 다시 표시됩니다.
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={cancelRemoveBlindUser} variant="outlined" sx={{ minWidth: 80 }}>
            취소
          </Button>
          <Button
            onClick={confirmRemoveBlindUser}
            variant="contained"
            color="error"
            startIcon={<DeleteIcon />}
            sx={{ minWidth: 80 }}
          >
            해제
          </Button>
        </DialogActions>
      </Dialog>

      {/* 스낵바 */}
      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={handleCloseSnackbar}>
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: "100%" }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
}
