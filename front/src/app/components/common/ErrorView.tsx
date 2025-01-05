import { Box, Card, Typography } from "@mui/material";
import React from "react";

export default function ErrorView() {
  return (
    <Box display="flex" justifyContent="center">
      <Card sx={{ padding: 3, boxShadow: 3 }}>
        <Typography variant="h6" color="error" gutterBottom>
          오류가 발생했습니다. 다시 시도해주세요.
        </Typography>
      </Card>
    </Box>
  );
}
