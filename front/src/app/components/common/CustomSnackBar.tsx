import { Alert, Grow, Slide, Snackbar } from "@mui/material";
import React from "react";

interface CustomSnackBarProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  message: string;
  severity?: "success" | "info" | "warning" | "error";
  transition?: "grow" | "slide" | "fade";
}

function GrowTransition(props: any) {
  return <Grow {...props} />;
}

function SlideTransition(props: any) {
  return <Slide {...props} direction="up" />;
}

export default function CustomSnackBar({
  open,
  setOpen,
  message,
  severity = "success",
  transition = "fade",
}: CustomSnackBarProps) {
  const handleClose = (event?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === "clickaway") {
      return;
    }
    setOpen(false);
  };

  const getTransitionComponent = () => {
    switch (transition) {
      case "grow":
        return GrowTransition;
      case "slide":
        return SlideTransition;
      case "fade":
    }
  };

  return (
    <Snackbar
      open={open}
      autoHideDuration={2000}
      onClose={handleClose}
      anchorOrigin={{ vertical: "top", horizontal: "center" }}
      TransitionComponent={getTransitionComponent()}
    >
      <Alert onClose={handleClose} severity={severity}>
        {message}
      </Alert>
    </Snackbar>
  );
}
