"use client";
import { CircularProgress } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import React from "react";

export default function Loading() {
  const theme = useTheme();

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        backgroundColor: theme.palette.mode === "dark" ? "rgba(18, 18, 18, 0.3)" : "rgba(255, 255, 255, 0.3)",
        backdropFilter: "blur(1px)",
        zIndex: 9999,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        transition: "background-color 0.3s ease",
      }}
    >
      <div
        style={{
          textAlign: "center",
          backgroundColor: theme.palette.mode === "dark" ? "#1e1e1e" : "#ffffff",
          padding: "24px 32px",
          borderRadius: "12px",
          boxShadow: theme.palette.mode === "dark" ? "0 8px 24px rgba(0, 0, 0, 0.5)" : "0 8px 24px rgba(0, 0, 0, 0.15)",
          border: theme.palette.mode === "dark" ? "1px solid #333333" : "1px solid #e0e0e0",
        }}
      >
        <CircularProgress
          size={48}
          thickness={4}
          sx={{
            color: theme.palette.mode === "dark" ? "#bb86fc" : "#1976d2",
            marginBottom: 1,
          }}
        />
        <div
          style={{
            marginTop: "12px",
            fontSize: "14px",
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
