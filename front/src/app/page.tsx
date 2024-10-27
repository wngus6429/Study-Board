"use client";
import { Alert } from "@mui/material";
import CustomSnackBar from "./components/common/CustomSnackBar";
import Loading from "./components/common/Loading";
import MainView from "./components/MainView";
import { useLoading, useMessage } from "./store";

export default function Home() {
  const { loadingState } = useLoading((state) => state);
  const { messageState, messageContent, messageStyle, hideMessage, messageTransition } = useMessage((state) => state);

  const handleClose = () => {
    hideMessage(); // 메시지 상태를 숨김으로 설정
  };

  return (
    <>
      <div style={{ backgroundColor: "white" }}>
        {loadingState && <Loading />}
        {/* Alert 하는곳 */}
        {messageState && (
          <CustomSnackBar
            open={messageState}
            setOpen={handleClose}
            message={messageContent}
            severity={messageStyle}
            transition={messageTransition}
          />
        )}
        <MainView />
      </div>
    </>
  );
}
