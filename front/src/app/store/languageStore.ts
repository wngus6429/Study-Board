import { create } from "zustand";
import { persist } from "zustand/middleware";

export type AppLanguage = "ja" | "ko";

interface LanguageState {
  language: AppLanguage;
  setLanguage: (language: AppLanguage) => void;
}

export const useLanguageStore = create<LanguageState>()(
  persist(
    (set) => ({
      language: "ja",
      setLanguage: (language) => set({ language }),
    }),
    {
      name: "hobby-channel-language-storage",
    }
  )
);
