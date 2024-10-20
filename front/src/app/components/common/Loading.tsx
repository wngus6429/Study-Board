import { CircularProgress } from "@mui/material";
import React from "react";

export default function Loading() {
  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", marginRight: 100 }}>
      <CircularProgress />
    </div>
  );
}
