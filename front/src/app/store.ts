import { create } from "zustand";

interface LoginState {
  loginState: boolean;
  login: () => void;
  logout: () => void;
}

export const useLogin = create<LoginState>((set) => ({
  loginState: false,
  login: () => set({ loginState: true }),
  logout: () => set({ loginState: false }),
}));

// 리액트쿼리 isLoading을 대체하는 로딩 상태
interface LoadingState {
  loadingState: boolean;
  loadingIn: () => void;
  loadingOut: () => void;
}

export const useLoading = create<LoadingState>((set) => ({
  loadingState: false,
  loadingIn: () => set({ loadingState: true }),
  loadingOut: () => set({ loadingState: false }),
}));

interface MessageState {
  messageState: boolean;
  messageContent: string;
  messageStyle: "success" | "info" | "warning" | "error";
  showMessage: (content: string, style?: "success" | "info" | "warning" | "error") => void;
  hideMessage: () => void;
}

export const useMessage = create<MessageState>((set) => ({
  messageState: false,
  messageContent: "",
  messageStyle: "success",

  // 메시지를 보여주는 함수 (내용과 스타일을 업데이트)
  showMessage: (content, style = "success") =>
    set({
      messageState: true,
      messageContent: content,
      messageStyle: style,
    }),
  // 메시지 숨기고, 내용을 초기화하는 함수
  hideMessage: () => set({ messageState: false, messageContent: "" }),
}));
