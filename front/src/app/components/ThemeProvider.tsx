"use client";
import React, { useLayoutEffect, useCallback } from "react";
import { ThemeProvider as MuiThemeProvider, CssBaseline } from "@mui/material";
import { useThemeStore } from "../store/themeStore";
import { lightTheme, darkTheme } from "../theme/theme";

interface ThemeProviderProps {
  children: React.ReactNode;
}

export default function ThemeProvider({ children }: ThemeProviderProps) {
  const { isDarkMode } = useThemeStore();

  const currentTheme = isDarkMode ? darkTheme : lightTheme;

  // 테마 전환 최적화를 위한 useLayoutEffect 사용
  const updateTheme = useCallback(() => {
    const html = document.documentElement;

    // DOM 변경을 한 번에 batch 처리
    requestAnimationFrame(() => {
      if (isDarkMode) {
        html.setAttribute("data-theme", "dark");
      } else {
        html.removeAttribute("data-theme");
      }
    });
  }, [isDarkMode]);

  useLayoutEffect(() => {
    updateTheme();
  }, [updateTheme]);

  return (
    <MuiThemeProvider theme={currentTheme}>
      <CssBaseline enableColorScheme />
      {children}
    </MuiThemeProvider>
  );
}
