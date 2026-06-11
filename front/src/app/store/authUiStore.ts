import { create } from "zustand";
import { persist } from "zustand/middleware";

interface AuthUiState {
  hasLocalLogout: boolean;
  markLocalLogout: () => void;
  clearLocalLogout: () => void;
}

export const useAuthUiStore = create<AuthUiState>()(
  persist(
    (set) => ({
      hasLocalLogout: false,
      markLocalLogout: () => set({ hasLocalLogout: true }),
      clearLocalLogout: () => set({ hasLocalLogout: false }),
    }),
    {
      name: "hobby-channel-auth-ui-storage",
    }
  )
);
