"use client";
import React, { useLayoutEffect, useMemo } from "react";
import { CssBaseline } from "@mui/material";
import { createTheme, ThemeProvider as MuiThemeProvider } from "@mui/material/styles";
import { useThemeStore } from "../../store/themeStore";
import { lightTheme, darkTheme } from "../../theme/theme";

interface ThemeProviderProps {
  children: React.ReactNode;
}

export default function ThemeProvider({ children }: ThemeProviderProps) {
  const { isDarkMode } = useThemeStore();
  const themeMode = isDarkMode ? "dark" : "light";

  const currentTheme = useMemo(() => createTheme(themeMode === "dark" ? darkTheme : lightTheme), [themeMode]);

  useLayoutEffect(() => {
    document.documentElement.setAttribute("data-theme", themeMode);
  }, [themeMode]);

  return (
    <MuiThemeProvider theme={currentTheme}>
      <CssBaseline enableColorScheme />
      {children}
    </MuiThemeProvider>
  );
}
