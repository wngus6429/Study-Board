import { TextField } from "@mui/material";
import React from "react";

export default function StoryWrite() {
  return (
    <>
      <TextField
        required
        id="filled-required"
        label="제목"
        defaultValue="Hello World"
        variant="filled"
      />
      <TextField
        id="filled-multiline-flexible"
        label="내용"
        multiline
        maxRows={4}
        variant="filled"
      />
    </>
  );
}
