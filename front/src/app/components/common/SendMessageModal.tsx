import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  IconButton,
  Typography,
  CircularProgress,
} from "@mui/material";
import { Close as CloseIcon, Send as SendIcon } from "@mui/icons-material";
import { useMutation } from "@tanstack/react-query";
import { sendMessage } from "@/app/api/messagesApi";
import { useMessage } from "@/app/store/messageStore";

interface SendMessageModalProps {
  open: boolean;
  onClose: () => void;
  receiverNickname: string;
}

const SendMessageModal: React.FC<SendMessageModalProps> = ({ open, onClose, receiverNickname }) => {
  const { showMessage } = useMessage();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [internalReceiverNickname, setInternalReceiverNickname] = useState("");

  // receiverNickname이 변경되면 내부 상태 업데이트
  useEffect(() => {
    if (receiverNickname && receiverNickname.trim()) {
      console.log("Setting internal receiver nickname:", receiverNickname);
      setInternalReceiverNickname(receiverNickname);
    }
  }, [receiverNickname]);

  // 디버깅을 위한 로그
  useEffect(() => {
    console.log("SendMessageModal receiverNickname:", receiverNickname);
    console.log("SendMessageModal internalReceiverNickname:", internalReceiverNickname);
  }, [receiverNickname, internalReceiverNickname]);

  // 쪽지 보내기 mutation
  const sendMessageMutation = useMutation({
    mutationFn: (messageData: { receiverNickname: string; title: string; content: string }) => sendMessage(messageData),
    onSuccess: () => {
      showMessage("쪽지가 성공적으로 전송되었습니다!", "success");
      handleClose();
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message || "쪽지 전송에 실패했습니다.";
      showMessage(errorMessage, "error");
    },
  });

  const handleClose = () => {
    onClose();
  };

  // 모달이 닫힐 때만 상태 초기화
  useEffect(() => {
    if (!open) {
      setTitle("");
      setContent("");
      setInternalReceiverNickname("");
    }
  }, [open]);

  const handleSubmit = () => {
    if (!title.trim()) {
      showMessage("제목을 입력해주세요.", "warning");
      return;
    }
    if (!content.trim()) {
      showMessage("내용을 입력해주세요.", "warning");
      return;
    }

    sendMessageMutation.mutate({
      receiverNickname: internalReceiverNickname.trim(),
      title: title.trim(),
      content: content.trim(),
    });
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          minHeight: 400,
        },
      }}
    >
      <DialogTitle
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          pb: 1,
        }}
      >
        <Typography variant="h6" component="span">
          쪽지 보내기
        </Typography>
        <IconButton onClick={handleClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ py: 2 }}>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <TextField
            label="받는 사람"
            value={internalReceiverNickname}
            disabled
            fullWidth
            variant="outlined"
            size="small"
          />
          <TextField
            label="제목"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            fullWidth
            variant="outlined"
            size="small"
            placeholder="제목을 입력하세요"
          />
          <TextField
            label="내용"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            fullWidth
            multiline
            rows={6}
            variant="outlined"
            placeholder="내용을 입력하세요"
          />
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleClose} variant="outlined">
          취소
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          startIcon={sendMessageMutation.isPending ? <CircularProgress size={16} /> : <SendIcon />}
          disabled={sendMessageMutation.isPending}
          sx={{
            background: "linear-gradient(135deg, #8b5cf6, #06b6d4)",
            "&:hover": {
              background: "linear-gradient(135deg, #7c3aed, #0891b2)",
            },
          }}
        >
          {sendMessageMutation.isPending ? "전송 중..." : "쪽지 보내기"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SendMessageModal;
