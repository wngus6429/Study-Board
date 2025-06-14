import { create } from "zustand";
import { IBlindUser } from "../types/blind";

interface BlindState {
  blindUsers: IBlindUser[];
  blindedUserIds: Set<string>;

  // Actions
  setBlindUsers: (users: IBlindUser[]) => void;
  addBlindUser: (user: IBlindUser) => void;
  removeBlindUser: (blindId: number) => void;
  isUserBlinded: (userId: string) => boolean;
  clearBlindUsers: () => void;
}

export const useBlindStore = create<BlindState>((set, get) => ({
  blindUsers: [],
  blindedUserIds: new Set(),

  setBlindUsers: (users) =>
    set({
      blindUsers: users,
      blindedUserIds: new Set(users.map((u) => u.targetUserId)),
    }),

  addBlindUser: (user) =>
    set((state) => {
      const newBlindUsers = [...state.blindUsers, user];
      const newBlindedUserIds = new Set(state.blindedUserIds);
      newBlindedUserIds.add(user.targetUserId);

      return {
        blindUsers: newBlindUsers,
        blindedUserIds: newBlindedUserIds,
      };
    }),

  removeBlindUser: (blindId) =>
    set((state) => {
      const userToRemove = state.blindUsers.find((u) => u.id === blindId);
      const newBlindUsers = state.blindUsers.filter((u) => u.id !== blindId);
      const newBlindedUserIds = new Set(state.blindedUserIds);

      if (userToRemove) {
        newBlindedUserIds.delete(userToRemove.targetUserId);
      }

      return {
        blindUsers: newBlindUsers,
        blindedUserIds: newBlindedUserIds,
      };
    }),

  isUserBlinded: (userId) => {
    return get().blindedUserIds.has(userId);
  },

  clearBlindUsers: () => set({ blindUsers: [], blindedUserIds: new Set() }),
}));
