"use client";
import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  CircularProgress,
  useTheme,
} from "@mui/material";
import ImageIcon from "@mui/icons-material/Image";
import DeleteIcon from "@mui/icons-material/Delete";
import { UseMutationResult } from "@tanstack/react-query";

interface EditChannelImageDialogProps {
  open: boolean;
  onClose: () => void;
  imageFile: File | null;
  imagePreview: string | null;
  onImageChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onImageRemove: () => void;
  onConfirm: () => void;
  onDeleteExisting: () => void;
  uploadMutation: UseMutationResult<any, any, any, any>;
  deleteMutation: UseMutationResult<any, any, any, any>;
}

const EditChannelImageDialog = ({
  open,
  onClose,
  imageFile,
  imagePreview,
  onImageChange,
  onImageRemove,
  onConfirm,
  onDeleteExisting,
  uploadMutation,
  deleteMutation,
}: EditChannelImageDialogProps) => {
  const theme = useTheme();

  const isLoading = uploadMutation.isPending || deleteMutation.isPending;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle
        sx={{
          background: theme.palette.mode === "dark" ? "rgba(26, 26, 46, 0.95)" : "#f8f9fa",
          color: theme.palette.mode === "dark" ? "#ffffff" : "#1a1a2e",
          fontWeight: "bold",
        }}
      >
        채널 이미지 수정
      </DialogTitle>
      <DialogContent
        sx={{
          background: theme.palette.mode === "dark" ? "rgba(26, 26, 46, 0.95)" : "#ffffff",
          pt: 2,
        }}
      >
        <Box sx={{ mb: 2 }}>
          <input
            accept="image/*"
            style={{ display: "none" }}
            id="edit-channel-image-upload"
            type="file"
            onChange={onImageChange}
          />
          <label htmlFor="edit-channel-image-upload">
            <Button variant="outlined" component="span" startIcon={<ImageIcon />} sx={{ mb: 1 }} fullWidth>
              새 이미지 선택
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
                  선택 취소
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
          justifyContent: "space-between",
        }}
      >
        <Button
          onClick={onDeleteExisting}
          variant="outlined"
          color="error"
          disabled={isLoading}
          startIcon={<DeleteIcon />}
        >
          {deleteMutation.isPending ? <CircularProgress size={20} sx={{ color: "inherit" }} /> : "현재 이미지 삭제"}
        </Button>
        <Box>
          <Button onClick={onClose} disabled={isLoading} sx={{ mr: 1 }}>
            취소
          </Button>
          <Button
            onClick={onConfirm}
            variant="contained"
            disabled={!imageFile || isLoading}
            sx={{
              background:
                theme.palette.mode === "dark"
                  ? "linear-gradient(135deg, rgba(139, 92, 246, 0.8), rgba(6, 182, 212, 0.8))"
                  : "linear-gradient(135deg, #1976d2, #42a5f5)",
            }}
          >
            {uploadMutation.isPending ? <CircularProgress size={20} sx={{ color: "inherit" }} /> : "이미지 업데이트"}
          </Button>
        </Box>
      </DialogActions>
    </Dialog>
  );
};

export default EditChannelImageDialog;
