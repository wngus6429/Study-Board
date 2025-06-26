import { CircularProgress, useTheme } from "@mui/material";
import React from "react";

export default function Loading() {
  const theme = useTheme();

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        width: "100vw",
        position: "fixed",
        top: 0,
        left: 0,
        backgroundColor: theme.palette.mode === "dark" ? "#121212" : "#ffffff",
        zIndex: 9999,
        transition: "background-color 0.3s ease",
      }}
    >
      <div style={{ textAlign: "center" }}>
        <CircularProgress
          size={60}
          thickness={4}
          sx={{
            color: theme.palette.mode === "dark" ? "#bb86fc" : "#1976d2",
            marginBottom: 2,
          }}
        />
        <div
          style={{
            marginTop: "16px",
            fontSize: "16px",
            color: theme.palette.mode === "dark" ? "#e0e0e0" : "#666666",
            fontWeight: 500,
          }}
        >
          로딩 중...
        </div>
      </div>
    </div>
  );
}
