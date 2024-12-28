import { create } from "zustand";

interface MessageState {
  messageState: boolean;
  messageContent: string;
  messageStyle: "success" | "info" | "warning" | "error";
  messageTransition: "grow" | "slide" | "fade";
  showMessage: (
    content: string,
    style?: "success" | "info" | "warning" | "error",
    transitions?: "grow" | "slide" | "fade"
  ) => void;
  hideMessage: () => void;
}

export const useMessage = create<MessageState>((set) => ({
  // 메시지 초기 상태
  messageState: false,
  messageContent: "",
  messageStyle: "success",
  messageTransition: "fade",

  // 메시지를 보여주는 함수 (내용과 스타일을 업데이트)
  showMessage: (content, style = "success", transitions = "fade") =>
    set({
      messageState: true,
      messageContent: content,
      messageStyle: style,
      messageTransition: transitions,
    }),
  // 메시지 숨기고, 내용을 초기화하는 함수
  hideMessage: () => set({ messageState: false, messageContent: "" }),
}));
