"use client";
import React, { useEffect, useLayoutEffect } from "react";
import { CssBaseline } from "@mui/material";
import { ThemeProvider as MuiThemeProvider } from "@mui/material/styles";
import { useThemeStore } from "../../store/themeStore";
import { lightTheme, darkTheme } from "../../theme/theme";
import {
  lightTheme as classicLightTheme,
  darkTheme as classicDarkTheme,
} from "../../theme/classicTheme";
import { useAppearanceStore } from "../../store/appearanceStore";

interface ThemeProviderProps {
  children: React.ReactNode;
}

export default function ThemeProvider({ children }: ThemeProviderProps) {
  const { isDarkMode } = useThemeStore();
  const themeMode = isDarkMode ? "dark" : "light";
  const appearance = useAppearanceStore((state) => state.appearance);

  const currentTheme =
    appearance === "orbital"
      ? isDarkMode
        ? darkTheme
        : lightTheme
      : isDarkMode
        ? classicDarkTheme
        : classicLightTheme;

  useEffect(() => {
    void useAppearanceStore.persist.rehydrate();
  }, []);

  useLayoutEffect(() => {
    document.documentElement.setAttribute("data-theme", themeMode);
    document.documentElement.setAttribute("data-appearance", appearance);
  }, [themeMode, appearance]);

  return (
    <MuiThemeProvider theme={currentTheme}>
      <CssBaseline enableColorScheme />
      {children}
    </MuiThemeProvider>
  );
}
