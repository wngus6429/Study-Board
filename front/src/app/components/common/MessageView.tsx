"use client";
import React from "react";
import CustomSnackBar from "./CustomSnackBar";
import { useMessage } from "@/app/store";

export default function MessageView() {
  const { messageState, messageContent, messageStyle, hideMessage, messageTransition } = useMessage((state) => state);

  const handleClose = () => {
    hideMessage(); // 메시지 닫기
  };
  return (
    <>
      {messageState && (
        <CustomSnackBar
          open={messageState}
          setOpen={handleClose}
          message={messageContent}
          severity={messageStyle}
          transition={messageTransition}
        />
      )}
    </>
  );
}
