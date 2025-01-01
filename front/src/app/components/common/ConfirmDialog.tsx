import React from "react";
import { Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Button, Box } from "@mui/material";

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
          backgroundColor: "#f9f9f9", // 배경 색상
          boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.1)", // 그림자 효과
        },
      }}
    >
      <DialogTitle
        id="confirm-dialog-title"
        sx={{
          fontWeight: "bold",
          fontSize: "1.5rem",
          textAlign: "center",
          color: "#3f51b5", // 강조 색상
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
            color: "#555",
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
            backgroundColor: "#f44336",
            "&:hover": {
              backgroundColor: "#d32f2f", // 호버 시 색상 변경
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
