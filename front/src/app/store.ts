// zustand를 사용하여 상태관리를 하는 파일
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

interface CommentStore {
  isCommentOpen: boolean;
  commentsData: any; // 데이터 타입을 구체적으로 정의
  openCloseComments: (isOpen: boolean, data: any) => void;
}

export const useComment = create<CommentStore>((set) => ({
  isCommentOpen: false,
  commentsData: null,
  openCloseComments: (isOpen, data) => set({ isCommentOpen: isOpen, commentsData: data }),
}));

interface UserImageState {
  userImageUrl: string;
  setUserImageUrl: (url: string) => void;
  TopBarImageDelete: boolean;
  setTopBarImageDelete: () => void;
}

export const useUserImage = create<UserImageState>((set) => ({
  userImageUrl: "",
  setUserImageUrl: (url) => set({ userImageUrl: url }),
  TopBarImageDelete: false,
  setTopBarImageDelete: () => set({ TopBarImageDelete: true }),
}));
