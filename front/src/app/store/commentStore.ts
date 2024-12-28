import { create } from "zustand";

interface CommentStore {
  isCommentOpen: boolean;
  openCloseComments: (isOpen: boolean) => void;
}

export const useComment = create<CommentStore>((set) => ({
  isCommentOpen: false,
  openCloseComments: (isOpen) => set({ isCommentOpen: isOpen }),
}));
