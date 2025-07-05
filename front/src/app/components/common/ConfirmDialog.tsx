import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  Box,
  useTheme,
} from "@mui/material";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open,
  title,
  description,
  onConfirm,
  onCancel,
  confirmText = "확인", // 기본 확인 텍스트
  cancelText = "취소", // 기본 취소 텍스트
}) => {
  const theme = useTheme();

  return (
    <Dialog
      open={open}
      onClose={onCancel}
      aria-labelledby="confirm-dialog-title"
      aria-describedby="confirm-dialog-description"
      sx={{
        "& .MuiDialog-paper": {
          borderRadius: "16px", // 둥근 모서리
          padding: "10px", // 내부 여백
          backgroundColor: theme.palette.mode === "dark" ? "rgba(26, 26, 46, 0.95)" : "#f9f9f9", // 테마별 배경 색상
          boxShadow:
            theme.palette.mode === "dark" ? "0px 8px 25px rgba(139, 92, 246, 0.15)" : "0px 4px 10px rgba(0, 0, 0, 0.1)", // 테마별 그림자 효과
          border: theme.palette.mode === "dark" ? "1px solid rgba(139, 92, 246, 0.3)" : "none",
        },
      }}
    >
      <DialogTitle
        id="confirm-dialog-title"
        sx={{
          fontWeight: "bold",
          fontSize: "1.5rem",
          textAlign: "center",
          color: theme.palette.mode === "dark" ? "#a78bfa" : "#3f51b5", // 테마별 강조 색상
        }}
      >
        {title}
      </DialogTitle>
      <DialogContent
        sx={{
          display: "flex",
          justifyContent: "center",
          textAlign: "center",
          padding: "12px 24px",
        }}
      >
        <DialogContentText
          id="confirm-dialog-description"
          sx={{
            fontSize: "1rem",
            color: theme.palette.mode === "dark" ? "#e2e8f0" : "#555", // 테마별 텍스트 색상
            whiteSpace: "pre-line", // 줄바꿈 지원 추가
          }}
        >
          {description}
        </DialogContentText>
      </DialogContent>
      <DialogActions
        sx={{
          display: "flex",
          justifyContent: "center",
          gap: "16px", // 버튼 간격
          padding: "8px",
        }}
      >
        <Button
          onClick={onCancel}
          variant="outlined"
          color="primary"
          sx={{
            textTransform: "none", // 대문자 방지
            fontWeight: "bold",
            borderRadius: "8px",
            padding: "8px 16px",
            color: theme.palette.mode === "dark" ? "#a78bfa" : "#3f51b5",
            borderColor: theme.palette.mode === "dark" ? "rgba(139, 92, 246, 0.5)" : "#3f51b5",
            "&:hover": {
              backgroundColor: theme.palette.mode === "dark" ? "rgba(139, 92, 246, 0.1)" : "rgba(63, 81, 181, 0.04)",
              borderColor: theme.palette.mode === "dark" ? "rgba(139, 92, 246, 0.8)" : "#3f51b5",
            },
          }}
        >
          {cancelText}
        </Button>
        <Button
          onClick={onConfirm}
          variant="contained"
          color="error"
          sx={{
            textTransform: "none", // 대문자 방지
            fontWeight: "bold",
            borderRadius: "8px",
            padding: "8px 16px",
            backgroundColor: theme.palette.mode === "dark" ? "#dc2626" : "#f44336",
            "&:hover": {
              backgroundColor: theme.palette.mode === "dark" ? "#b91c1c" : "#d32f2f", // 테마별 호버 색상
            },
          }}
        >
          {confirmText}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ConfirmDialog;

// {openConfirmDialog && (
//     <ConfirmDialog
//       open={openConfirmDialog}
//       title="댓글 삭제"
//       description="댓글을 삭제하시겠습니까? 삭제된 댓글은 복구할 수 없습니다."
//       onConfirm={confirmDelete}
//       onCancel={cancelDelete}
//       confirmText="삭제"
//       cancelText="취소"
//     />
//   )}
// const [openConfirmDialog, setOpenConfirmDialog] = useState(false);
//   const [commentToDelete, setCommentToDelete] = useState<number | null>(null);

//   const handleDeleteClick = (commentId: number) => {
//     setCommentToDelete(commentId);
//     setOpenConfirmDialog(true);
//   };

//   const confirmDelete = () => {
//     if (commentToDelete !== null) {
//       deleteMutation.mutate({ commentId: commentToDelete });
//       setCommentToDelete(null);
//       setOpenConfirmDialog(false);
//     }
//   };

//   const cancelDelete = () => {
//     setCommentToDelete(null);
//     setOpenConfirmDialog(false);
//   };
