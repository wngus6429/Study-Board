import { create } from "zustand";
import { persist } from "zustand/middleware";

interface ThemeState {
  isDarkMode: boolean;
  toggleTheme: () => void;
  setTheme: (isDark: boolean) => void;
}

export const useThemeStore = create<ThemeState>()(
  // persist는 zustand의 미들웨어로,
  // 스토어 상태를 브라우저 저장소(기본: localStorage)에 자동으로 저장하고 불러오는 기능
  persist(
    (set) => ({
      isDarkMode: false,
      toggleTheme: () => set((state) => ({ isDarkMode: !state.isDarkMode })),
      setTheme: (isDark: boolean) => set({ isDarkMode: isDark }),
    }),
    {
      name: "hobby-channel-theme-storage", // localStorage 키 이름
    }
  )
);
