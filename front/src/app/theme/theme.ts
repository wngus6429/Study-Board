import { createTheme } from "@mui/material/styles";
import type { PaletteMode, ThemeOptions } from "@mui/material/styles";

// Static surfaces keep both themes consistent without blur or animation loops.
const buildTheme = (mode: PaletteMode) => {
  const isDark = mode === "dark";
  const border = isDark ? "#34433f" : "#dce2d8";
  const options: ThemeOptions = {
    palette: {
      mode,
      primary: {
        main: isDark ? "#c5e994" : "#476546",
        contrastText: isDark ? "#152327" : "#ffffff",
      },
      secondary: { main: isDark ? "#b6a4d8" : "#73658c" },
      background: {
        default: isDark ? "#10191b" : "#f3f4ef",
        paper: isDark ? "#192427" : "#ffffff",
      },
      text: {
        primary: isDark ? "#e8eee6" : "#22332f",
        secondary: isDark ? "#a8b8b0" : "#66736a",
      },
      divider: border,
    },
    typography: {
      fontFamily: 'Arial, "Noto Sans KR", "Malgun Gothic", sans-serif',
      h1: { fontWeight: 750, letterSpacing: "-.05em" },
      h2: { fontWeight: 700, letterSpacing: "-.04em" },
      h3: { fontWeight: 700, letterSpacing: "-.03em" },
      button: { fontWeight: 700, textTransform: "none" },
    },
    shape: { borderRadius: 10 },
    components: {
      MuiButton: {
        defaultProps: { disableElevation: true },
        styleOverrides: {
          root: {
            borderRadius: 8,
            transition: "background-color 160ms ease, border-color 160ms ease",
            padding: "8px 16px",
          },
        },
      },
      MuiPaper: { styleOverrides: { root: { backgroundImage: "none" } } },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 16,
            border: `1px solid ${border}`,
            boxShadow: "none",
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            backgroundImage: "none",
            boxShadow: "none",
            borderBottom: `1px solid ${border}`,
          },
        },
      },
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            backgroundColor: isDark ? "#192427" : "#ffffff",
            fontSize: 14,
          },
          notchedOutline: { borderColor: border },
        },
      },
      MuiTooltip: {
        styleOverrides: { tooltip: { borderRadius: 6, fontSize: 12 } },
      },
      MuiTableCell: {
        styleOverrides: {
          head: {
            backgroundColor: isDark ? "#22322d" : "#eaf0e5",
            fontWeight: 700,
          },
        },
      },
      MuiTab: {
        styleOverrides: { root: { textTransform: "none", fontWeight: 600 } },
      },
    },
  };
  return createTheme(options);
};

export const lightTheme = buildTheme("light");
export const darkTheme = buildTheme("dark");
