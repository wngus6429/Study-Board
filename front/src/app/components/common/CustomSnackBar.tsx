import { Alert, Snackbar } from "@mui/material";
import React from "react";

interface CustomSnackBarProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  message: string;
  severity?: "success" | "info" | "warning" | "error";
}

export default function CustomSnackBar({ open, setOpen, message, severity = "success" }: CustomSnackBarProps) {
  const handleClose = (event?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === "clickaway") {
      return;
    }
    setOpen(false);
  };

  return (
    <Snackbar
      open={open}
      autoHideDuration={4000}
      onClose={handleClose}
      anchorOrigin={{ vertical: "top", horizontal: "center" }}
    >
      <Alert onClose={handleClose} severity={severity} style={{ backgroundColor: "#FFEB3B", color: "#000" }}>
        {message}
      </Alert>
    </Snackbar>
  );
}
