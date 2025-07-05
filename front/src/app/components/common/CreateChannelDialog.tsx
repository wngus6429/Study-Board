"use client";
import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Typography,
  CircularProgress,
  useTheme,
} from "@mui/material";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import DeleteIcon from "@mui/icons-material/Delete";
import { UseMutationResult } from "@tanstack/react-query";

interface CreateChannelDialogProps {
  open: boolean;
  onClose: () => void;
  channelName: string;
  onChannelNameChange: (name: string) => void;
  channelSlug: string;
  onChannelSlugChange: (slug: string) => void;
  imageFile: File | null;
  imagePreview: string | null;
  onImageChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onImageRemove: () => void;
  onConfirm: () => void;
  createMutation: UseMutationResult<any, any, any, any>;
}

const CreateChannelDialog = ({
  open,
  onClose,
  channelName,
  onChannelNameChange,
  channelSlug,
  onChannelSlugChange,
  imageFile,
  imagePreview,
  onImageChange,
  onImageRemove,
  onConfirm,
  createMutation,
}: CreateChannelDialogProps) => {
  const theme = useTheme();

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle
        sx={{
          background: theme.palette.mode === "dark" ? "rgba(26, 26, 46, 0.95)" : "#f8f9fa",
          color: theme.palette.mode === "dark" ? "#ffffff" : "#1a1a2e",
          fontWeight: "bold",
        }}
      >
        새 채널 만들기
      </DialogTitle>
      <DialogContent
        sx={{
          background: theme.palette.mode === "dark" ? "rgba(26, 26, 46, 0.95)" : "#ffffff",
          pt: 2,
        }}
      >
        <TextField
          autoFocus
          margin="dense"
          label="채널 이름"
          fullWidth
          variant="outlined"
          value={channelName}
          onChange={(e) => onChannelNameChange(e.target.value)}
          sx={{ mb: 2 }}
        />
        <TextField
          margin="dense"
          label="채널 URL (영어 소문자, 숫자, 하이픈만 가능)"
          fullWidth
          variant="outlined"
          value={channelSlug}
          onChange={(e) => onChannelSlugChange(e.target.value.toLowerCase())}
          sx={{ mb: 2 }}
        />

        {/* 이미지 업로드 */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            채널 이미지 (선택사항)
          </Typography>
          <input
            accept="image/*"
            style={{ display: "none" }}
            id="channel-image-upload"
            type="file"
            onChange={onImageChange}
          />
          <label htmlFor="channel-image-upload">
            <Button variant="outlined" component="span" startIcon={<CloudUploadIcon />} sx={{ mb: 1 }} fullWidth>
              이미지 선택
            </Button>
          </label>

          {imagePreview && (
            <Box sx={{ mt: 2, textAlign: "center" }}>
              <Box
                component="img"
                src={imagePreview}
                alt="미리보기"
                sx={{
                  maxWidth: "100%",
                  maxHeight: 200,
                  borderRadius: 1,
                  border: "1px solid",
                  borderColor: theme.palette.divider,
                }}
              />
              <Box sx={{ mt: 1 }}>
                <Button
                  variant="outlined"
                  color="error"
                  size="small"
                  startIcon={<DeleteIcon />}
                  onClick={onImageRemove}
                >
                  이미지 제거
                </Button>
              </Box>
            </Box>
          )}
        </Box>
      </DialogContent>
      <DialogActions
        sx={{
          background: theme.palette.mode === "dark" ? "rgba(26, 26, 46, 0.95)" : "#f8f9fa",
          px: 3,
          pb: 2,
        }}
      >
        <Button onClick={onClose} disabled={createMutation.isPending}>
          취소
        </Button>
        <Button
          onClick={onConfirm}
          variant="contained"
          disabled={createMutation.isPending}
          sx={{
            background:
              theme.palette.mode === "dark"
                ? "linear-gradient(135deg, rgba(139, 92, 246, 0.8), rgba(6, 182, 212, 0.8))"
                : "linear-gradient(135deg, #1976d2, #42a5f5)",
          }}
        >
          {createMutation.isPending ? <CircularProgress size={20} sx={{ color: "inherit" }} /> : "생성"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CreateChannelDialog;
