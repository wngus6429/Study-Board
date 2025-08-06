"use client";

import React, { useState, useCallback, memo, useMemo } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  RadioGroup,
  Radio,
  TextField,
  Typography,
  Box,
  CircularProgress,
  useTheme,
  Theme,
  FormControlLabel,
} from "@mui/material";
import ReportIcon from "@mui/icons-material/Report";
import FlagIcon from "@mui/icons-material/Flag";

interface ReportModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (reason: string, customReason?: string) => Promise<void>;
  loading: boolean;
}

// reportReasons 배열을 컴포넌트 외부로 이동하여 불필요한 재생성 방지
const reportReasons = [
  { value: "스팸/도배", icon: "🚫", color: "#f59e0b" },
  { value: "욕설/비방", icon: "😡", color: "#ef4444" },
  { value: "음란물/성적 콘텐츠", icon: "🔞", color: "#ec4899" },
  { value: "폭력적 콘텐츠", icon: "⚔️", color: "#dc2626" },
  { value: "허위 정보", icon: "🚨", color: "#f97316" },
  { value: "저작권 침해", icon: "©️", color: "#8b5cf6" },
  { value: "개인정보 노출", icon: "🔓", color: "#06b6d4" },
  { value: "기타", icon: "❓", color: "#6b7280" },
] as const;

type ReportReason = {
  value: string;
  icon: string;
  color: string;
};

interface ReportReasonItemProps {
  reason: ReportReason;
  isSelected: boolean;
  theme: Theme;
}

const ReportReasonItemContent = memo(function ReportReasonItemContent({
  reason,
  isSelected,
  theme,
}: ReportReasonItemProps) {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1.5,
        width: "100%",
        maxWidth: "100%",
        overflow: "hidden",
      }}
    >
      <Radio
        checked={isSelected}
        value={reason.value}
        sx={{
          color: theme.palette.mode === "dark" ? "#94a3b8" : "#6b7280",
          "&.Mui-checked": {
            color: reason.color,
          },
          "& .MuiSvgIcon-root": {
            fontSize: 20,
          },
        }}
      />
      <Box
        sx={{
          fontSize: "1.5rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: 32,
          height: 32,
          borderRadius: "8px",
          background: isSelected
            ? `${reason.color}20`
            : theme.palette.mode === "dark"
              ? "rgba(55, 65, 81, 0.5)"
              : "rgba(243, 244, 246, 0.8)",
          transition: "all 0.2s ease",
        }}
      >
        {reason.icon}
      </Box>
      <Typography
        variant="body1"
        sx={{
          color: isSelected
            ? theme.palette.mode === "dark"
              ? "#ffffff"
              : "#1f2937"
            : theme.palette.mode === "dark"
              ? "#e2e8f0"
              : "#374151",
          fontWeight: isSelected ? 700 : 600,
          fontSize: "1rem",
          textShadow: isSelected && theme.palette.mode === "dark" ? "0 1px 2px rgba(0, 0, 0, 0.3)" : "none",
          transition: "all 0.2s ease",
          flex: 1,
          wordBreak: "keep-all",
          overflowWrap: "break-word",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {reason.value}
      </Typography>
    </Box>
  );
});

const ReportModal: React.FC<ReportModalProps> = ({ open, onClose, onSubmit, loading }) => {
  const theme = useTheme();
  const [reportReason, setReportReason] = useState<string>("");
  const [customReason, setCustomReason] = useState<string>("");

  // 복잡한 스타일 객체들을 useMemo로 최적화
  const dialogPaperStyles = useMemo(
    () => ({
      borderRadius: "20px",
      background:
        theme.palette.mode === "dark"
          ? "linear-gradient(135deg, rgba(26, 26, 46, 0.95) 0%, rgba(45, 48, 71, 0.98) 100%)"
          : "linear-gradient(135deg, rgba(255, 255, 255, 0.98) 0%, rgba(248, 250, 252, 0.99) 100%)",
      backdropFilter: "blur(12px)",
      border: theme.palette.mode === "dark" ? "2px solid rgba(239, 68, 68, 0.2)" : "2px solid rgba(239, 68, 68, 0.15)",
      boxShadow:
        theme.palette.mode === "dark"
          ? "0 0 20px rgba(239, 68, 68, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.05)"
          : "0 0 20px rgba(239, 68, 68, 0.1), 0 10px 30px rgba(0, 0, 0, 0.05), inset 0 1px 0 rgba(255, 255, 255, 0.7)",
      overflow: "hidden",
      overflowX: "hidden",
      position: "relative",
      maxWidth: { xs: "95vw", sm: "600px" },
      width: "100%",
    }),
    [theme.palette.mode]
  );

  const dialogTitleStyles = useMemo(
    () => ({
      color: theme.palette.mode === "dark" ? "#ffffff" : "#1a1a2e",
      fontWeight: 800,
      fontSize: "1.5rem",
      display: "flex",
      alignItems: "center",
      gap: 1.5,
      textShadow: theme.palette.mode === "dark" ? "0 2px 4px rgba(0, 0, 0, 0.3)" : "none",
      position: "relative",
      zIndex: 2,
      pt: 3,
    }),
    [theme.palette.mode]
  );

  const iconBoxStyles = useMemo(
    () => ({
      position: "relative",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      width: 48,
      height: 48,
      borderRadius: "12px",
      background:
        theme.palette.mode === "dark"
          ? "linear-gradient(135deg, rgba(239, 68, 68, 0.15), rgba(220, 38, 38, 0.1))"
          : "linear-gradient(135deg, rgba(239, 68, 68, 0.08), rgba(220, 38, 38, 0.05))",
      border: theme.palette.mode === "dark" ? "2px solid rgba(239, 68, 68, 0.25)" : "2px solid rgba(239, 68, 68, 0.15)",
      boxShadow:
        theme.palette.mode === "dark"
          ? "0 0 10px rgba(239, 68, 68, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.05)"
          : "0 0 10px rgba(239, 68, 68, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.6)",
    }),
    [theme.palette.mode]
  );

  const reportIconStyles = useMemo(
    () => ({
      color: theme.palette.mode === "dark" ? "#fca5a5" : "#dc2626",
      fontSize: 28,
      filter: "drop-shadow(0 1px 2px rgba(0, 0, 0, 0.2))",
    }),
    [theme.palette.mode]
  );

  const dialogContentStyles = useMemo(
    () => ({
      position: "relative",
      zIndex: 2,
      pt: 2,
      overflowX: "hidden",
      width: "100%",
      boxSizing: "border-box",
    }),
    []
  );

  const descriptionTextStyles = useMemo(
    () => ({
      color: theme.palette.mode === "dark" ? "#e2e8f0" : "#374151",
      mb: 3,
      lineHeight: 1.6,
      wordBreak: "keep-all",
      overflowWrap: "break-word",
    }),
    [theme.palette.mode]
  );

  const radioGroupStyles = useMemo(
    () => ({
      gap: 1.5,
      width: "100%",
      overflow: "hidden",
    }),
    []
  );

  const customTextFieldStyles = useMemo(
    () => ({
      mt: 2,
      width: "100%",
      maxWidth: "100%",
      boxSizing: "border-box",
      "& .MuiOutlinedInput-root": {
        borderRadius: "12px",
        backgroundColor: theme.palette.mode === "dark" ? "rgba(239, 68, 68, 0.05)" : "rgba(255, 255, 255, 0.8)",
        "& fieldset": {
          borderColor: theme.palette.mode === "dark" ? "rgba(239, 68, 68, 0.3)" : "rgba(239, 68, 68, 0.2)",
        },
        "&:hover fieldset": {
          borderColor: theme.palette.mode === "dark" ? "rgba(239, 68, 68, 0.5)" : "rgba(239, 68, 68, 0.4)",
        },
        "&.Mui-focused fieldset": {
          borderColor: theme.palette.mode === "dark" ? "#ef4444" : "#dc2626",
        },
      },
      "& .MuiInputLabel-root": {
        color: theme.palette.mode === "dark" ? "#fca5a5" : "#dc2626",
        "&.Mui-focused": {
          color: theme.palette.mode === "dark" ? "#ef4444" : "#dc2626",
        },
      },
      "& .MuiInputBase-input": {
        color: theme.palette.mode === "dark" ? "#e2e8f0" : "#374151",
      },
    }),
    [theme.palette.mode]
  );

  const dialogActionsStyles = useMemo(
    () => ({
      position: "relative",
      zIndex: 2,
      px: { xs: 2, sm: 3 },
      pb: 3,
      gap: 1.5,
      width: "100%",
      maxWidth: "100%",
      boxSizing: "border-box",
      overflow: "hidden",
      flexWrap: { xs: "wrap", sm: "nowrap" },
    }),
    []
  );

  const cancelButtonStyles = useMemo(
    () => ({
      borderRadius: "12px",
      px: { xs: 2, sm: 3 },
      py: 1,
      borderColor: theme.palette.mode === "dark" ? "rgba(255, 255, 255, 0.3)" : "rgba(0, 0, 0, 0.3)",
      color: theme.palette.mode === "dark" ? "#e2e8f0" : "#374151",
      minWidth: { xs: "80px", sm: "auto" },
      flex: { xs: 1, sm: "none" },
      maxWidth: { xs: "48%", sm: "none" },
      "&:hover": {
        backgroundColor: theme.palette.mode === "dark" ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.05)",
      },
    }),
    [theme.palette.mode]
  );

  const submitButtonStyles = useMemo(
    () => ({
      borderRadius: "12px",
      px: { xs: 2, sm: 3 },
      py: 1,
      fontWeight: 600,
      position: "relative",
      overflow: "hidden",
      background: "linear-gradient(135deg, #ef4444, #dc2626, #b91c1c)",
      color: "white",
      transition: "all 0.3s ease",
      minWidth: { xs: "100px", sm: "auto" },
      flex: { xs: 1, sm: "none" },
      maxWidth: { xs: "48%", sm: "none" },
      "&:hover": {
        background: "linear-gradient(135deg, #dc2626, #b91c1c, #991b1b)",
        transform: "translateY(-1px)",
        boxShadow:
          theme.palette.mode === "dark" ? "0 4px 15px rgba(239, 68, 68, 0.2)" : "0 4px 15px rgba(239, 68, 68, 0.15)",
      },
      "&:disabled": {
        background: "linear-gradient(135deg, rgba(239, 68, 68, 0.5), rgba(220, 38, 38, 0.5))",
        transform: "none",
        boxShadow: "none",
      },
    }),
    [theme.palette.mode]
  );

  // 이벤트 핸들러들을 useCallback으로 최적화
  const handleClose = useCallback(() => {
    setReportReason("");
    setCustomReason("");
    onClose();
  }, [onClose]);

  const handleSubmit = useCallback(async () => {
    if (!reportReason) return;
    await onSubmit(reportReason, customReason);
    handleClose();
  }, [onSubmit, reportReason, customReason, handleClose]);

  const handleReportReasonChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setReportReason(e.target.value);
  }, []);

  const handleCustomReasonChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setCustomReason(e.target.value);
  }, []);

  // FormControlLabel 스타일을 생성하는 함수를 useMemo로 최적화
  const getFormControlLabelStyles = useCallback(
    (reason: ReportReason, isSelected: boolean) => ({
      m: 0,
      position: "relative",
      borderRadius: "14px",
      p: { xs: 1, sm: 1.5 },
      cursor: "pointer",
      transition: "all 0.2s ease-in-out",
      width: "100%",
      maxWidth: "100%",
      boxSizing: "border-box",
      overflow: "hidden",
      background: isSelected
        ? theme.palette.mode === "dark"
          ? `linear-gradient(135deg, ${reason.color}20, ${reason.color}10)`
          : `linear-gradient(135deg, ${reason.color}15, ${reason.color}08)`
        : theme.palette.mode === "dark"
          ? "linear-gradient(135deg, rgba(55, 65, 81, 0.4), rgba(75, 85, 99, 0.2))"
          : "linear-gradient(135deg, rgba(255, 255, 255, 0.8), rgba(248, 250, 252, 0.9))",
      border: isSelected
        ? `2px solid ${reason.color}${theme.palette.mode === "dark" ? "60" : "40"}`
        : theme.palette.mode === "dark"
          ? "2px solid rgba(75, 85, 99, 0.3)"
          : "2px solid rgba(229, 231, 235, 0.6)",
      boxShadow: isSelected
        ? theme.palette.mode === "dark"
          ? `0 0 15px ${reason.color}20, 0 4px 10px rgba(0, 0, 0, 0.2)`
          : `0 0 15px ${reason.color}15, 0 4px 10px rgba(0, 0, 0, 0.1)`
        : theme.palette.mode === "dark"
          ? "0 2px 8px rgba(0, 0, 0, 0.3)"
          : "0 2px 8px rgba(0, 0, 0, 0.05)",
      "&:hover": {
        transform: "translateY(-2px)",
        background: isSelected
          ? theme.palette.mode === "dark"
            ? `linear-gradient(135deg, ${reason.color}30, ${reason.color}15)`
            : `linear-gradient(135deg, ${reason.color}20, ${reason.color}10)`
          : theme.palette.mode === "dark"
            ? "linear-gradient(135deg, rgba(75, 85, 99, 0.5), rgba(107, 114, 128, 0.3))"
            : "linear-gradient(135deg, rgba(249, 250, 251, 0.95), rgba(243, 244, 246, 0.8))",
        boxShadow: isSelected
          ? theme.palette.mode === "dark"
            ? `0 0 25px ${reason.color}30, 0 6px 20px rgba(0, 0, 0, 0.3)`
            : `0 0 25px ${reason.color}25, 0 6px 20px rgba(0, 0, 0, 0.15)`
          : theme.palette.mode === "dark"
            ? "0 4px 15px rgba(0, 0, 0, 0.4)"
            : "0 4px 15px rgba(0, 0, 0, 0.1)",
      },
      "&:active": {
        transform: "translateY(-1px)",
      },
    }),
    [theme.palette.mode]
  );

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: dialogPaperStyles,
      }}
    >
      <DialogTitle sx={dialogTitleStyles}>
        <Box sx={iconBoxStyles}>
          <ReportIcon sx={reportIconStyles} />
        </Box>
        게시글 신고하기
      </DialogTitle>

      <DialogContent sx={dialogContentStyles}>
        <Typography variant="body1" sx={descriptionTextStyles}>
          이 게시글을 신고하는 이유를 선택해주세요. 신고는 신중하게 해주시기 바랍니다.
        </Typography>

        <FormControl component="fieldset" fullWidth sx={{ width: "100%", overflow: "hidden" }}>
          <RadioGroup value={reportReason} onChange={handleReportReasonChange} sx={radioGroupStyles}>
            {reportReasons.map((reason) => {
              const isSelected = reportReason === reason.value;
              return (
                <FormControlLabel
                  key={reason.value}
                  value={reason.value}
                  control={<Radio sx={{ display: "none" }} />}
                  label={<ReportReasonItemContent reason={reason} isSelected={isSelected} theme={theme} />}
                  sx={getFormControlLabelStyles(reason, isSelected)}
                />
              );
            })}
          </RadioGroup>
        </FormControl>

        {reportReason === "기타" && (
          <TextField
            fullWidth
            multiline
            rows={3}
            label="상세 사유를 입력해주세요"
            value={customReason}
            onChange={handleCustomReasonChange}
            sx={customTextFieldStyles}
          />
        )}
      </DialogContent>

      <DialogActions sx={dialogActionsStyles}>
        <Button onClick={handleClose} variant="outlined" sx={cancelButtonStyles}>
          취소
        </Button>

        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={loading || !reportReason}
          startIcon={loading ? <CircularProgress size={20} /> : <FlagIcon />}
          sx={submitButtonStyles}
        >
          {loading ? "신고 중..." : "신고하기"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ReportModal;
