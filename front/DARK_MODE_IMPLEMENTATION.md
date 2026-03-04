# 다크모드/라이트모드 구현 가이드

이 문서는 Next.js 14 + Material-UI + Zustand를 사용한 완전한 다크모드/라이트모드 구현 방법을 설명합니다.

## 📋 목차

1. [기술 스택](#기술-스택)
2. [핵심 아키텍처](#핵심-아키텍처)
3. [구현 단계](#구현-단계)
4. [파일 구조](#파일-구조)
5. [전체 코드](#전체-코드)

---

## 🛠 기술 스택

```json
{
  "@mui/material": "^6.0.1",
  "@mui/icons-material": "^6.2.0",
  "@emotion/react": "^11.13.3",
  "@emotion/styled": "^11.13.0",
  "zustand": "^5.0.0",
  "next": "14.2.15",
  "react": "^18"
}
```

---

## 🏗 핵심 아키텍처

### 1. **상태 관리** (Zustand)

- localStorage에 테마 상태 자동 저장/복원
- 간단한 API로 전역 상태 관리

### 2. **스타일링** (Material-UI)

- 두 개의 완전한 테마 객체 (lightTheme, darkTheme)
- 컴포넌트별 세밀한 스타일 커스터마이징
- 네온 효과를 포함한 다크모드 디자인

### 3. **CSS 변수** (globals.css)

- CSS Custom Properties로 기본 색상 관리
- 시스템 다크모드 선호도 감지

### 4. **레이아웃 통합** (Next.js App Router)

- ThemeProvider로 전체 앱 감싸기
- 서버 컴포넌트와 클라이언트 컴포넌트 조합

---

## 📝 구현 단계

### Step 1: 패키지 설치

```bash
npm install @mui/material @mui/icons-material @emotion/react @emotion/styled zustand
```

### Step 2: 프로젝트 구조 생성

```
src/
├── app/
│   ├── components/
│   │   ├── DarkModeToggle.tsx      # 토글 버튼
│   │   └── Provider/
│   │       └── ThemeProvider.tsx   # 테마 프로바이더
│   ├── store/
│   │   └── themeStore.ts           # Zustand 상태 관리
│   ├── theme/
│   │   └── theme.ts                # MUI 테마 설정
│   ├── globals.css                 # 전역 CSS
│   └── layout.tsx                  # 루트 레이아웃
```

### Step 3: 파일별 코드 구현

---

## 📁 파일 구조

```
프로젝트/
├── src/app/
│   ├── store/themeStore.ts           ← 상태 관리
│   ├── theme/theme.ts                ← MUI 테마 정의
│   ├── components/
│   │   ├── DarkModeToggle.tsx        ← 토글 버튼 컴포넌트
│   │   └── Provider/
│   │       └── ThemeProvider.tsx     ← 테마 프로바이더
│   ├── globals.css                   ← CSS 변수 & 스크롤바
│   └── layout.tsx                    ← 앱 전체 레이아웃
```

---

## 💾 전체 코드

### 1️⃣ Zustand 스토어 (`src/app/store/themeStore.ts`)

```typescript
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface ThemeState {
  isDarkMode: boolean;
  toggleTheme: () => void;
  setTheme: (isDark: boolean) => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      isDarkMode: false,
      toggleTheme: () => set((state) => ({ isDarkMode: !state.isDarkMode })),
      setTheme: (isDark: boolean) => set({ isDarkMode: isDark }),
    }),
    {
      name: "theme-storage", // localStorage 키 이름 (원하는 대로 변경)
    }
  )
);
```

**핵심 포인트:**

- `persist` 미들웨어로 localStorage 자동 저장
- `name` 옵션으로 저장 키 지정
- `toggleTheme`으로 테마 전환, `setTheme`으로 직접 설정

---

### 2️⃣ Material-UI 테마 정의 (`src/app/theme/theme.ts`)

```typescript
import { createTheme, ThemeOptions } from "@mui/material/styles";

// 공통 테마 설정
const commonTheme: ThemeOptions = {
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: { fontWeight: 700 },
    h2: { fontWeight: 600 },
    h3: { fontWeight: 600 },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: "none",
          fontWeight: 600,
          borderRadius: 12,
          transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        },
      },
    },
  },
};

// 라이트 테마
export const lightTheme = createTheme({
  ...commonTheme,
  palette: {
    mode: "light",
    primary: {
      main: "#6366f1",
      light: "#818cf8",
      dark: "#4f46e5",
      contrastText: "#ffffff",
    },
    secondary: {
      main: "#ec4899",
      light: "#f472b6",
      dark: "#db2777",
      contrastText: "#ffffff",
    },
    background: {
      default: "#f8fafc",
      paper: "#ffffff",
    },
    text: {
      primary: "#1e293b",
      secondary: "#64748b",
    },
  },
  components: {
    ...commonTheme.components,
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: "#ffffff",
          color: "#1e293b",
          boxShadow:
            "0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)",
        },
      },
    },
  },
});

// 다크 테마 (네온 스타일)
export const darkTheme = createTheme({
  ...commonTheme,
  palette: {
    mode: "dark",
    primary: {
      main: "#8b5cf6",
      light: "#a78bfa",
      dark: "#7c3aed",
      contrastText: "#ffffff",
    },
    secondary: {
      main: "#06b6d4",
      light: "#22d3ee",
      dark: "#0891b2",
      contrastText: "#ffffff",
    },
    background: {
      default: "#0f0f23",
      paper: "#1a1a2e",
    },
    text: {
      primary: "#e2e8f0",
      secondary: "#94a3b8",
    },
    error: {
      main: "#ef4444",
      light: "#f87171",
      dark: "#dc2626",
    },
    warning: {
      main: "#f59e0b",
      light: "#fbbf24",
      dark: "#d97706",
    },
    info: {
      main: "#3b82f6",
      light: "#60a5fa",
      dark: "#2563eb",
    },
    success: {
      main: "#10b981",
      light: "#34d399",
      dark: "#059669",
    },
  },
  components: {
    ...commonTheme.components,
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: "#1a1a2e",
          color: "#e2e8f0",
          boxShadow:
            "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
          borderBottom: "1px solid rgba(139, 92, 246, 0.2)",
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: "none",
          fontWeight: 600,
          borderRadius: 12,
          transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          "&:hover": {
            boxShadow: "0 0 20px rgba(139, 92, 246, 0.4)",
            transform: "translateY(-1px)",
          },
        },
        contained: {
          background: "linear-gradient(45deg, #8b5cf6 30%, #06b6d4 90%)",
          boxShadow: "0 4px 15px 0 rgba(139, 92, 246, 0.3)",
          "&:hover": {
            background: "linear-gradient(45deg, #7c3aed 30%, #0891b2 90%)",
            boxShadow: "0 6px 20px 0 rgba(139, 92, 246, 0.5)",
          },
        },
        outlined: {
          borderColor: "rgba(139, 92, 246, 0.5)",
          color: "#8b5cf6",
          "&:hover": {
            borderColor: "#8b5cf6",
            backgroundColor: "rgba(139, 92, 246, 0.1)",
            boxShadow: "0 0 15px rgba(139, 92, 246, 0.3)",
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          backgroundColor: "#1a1a2e",
          border: "1px solid rgba(139, 92, 246, 0.2)",
          "&:hover": {
            border: "1px solid rgba(139, 92, 246, 0.4)",
            boxShadow: "0 8px 25px rgba(139, 92, 246, 0.15)",
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          "& .MuiOutlinedInput-root": {
            "& fieldset": {
              borderColor: "rgba(139, 92, 246, 0.3)",
            },
            "&:hover fieldset": {
              borderColor: "rgba(139, 92, 246, 0.5)",
            },
            "&.Mui-focused fieldset": {
              borderColor: "#8b5cf6",
              boxShadow: "0 0 10px rgba(139, 92, 246, 0.3)",
            },
          },
        },
      },
    },
    MuiAvatar: {
      styleOverrides: {
        root: {
          border: "2px solid rgba(139, 92, 246, 0.3)",
          "&:hover": {
            border: "2px solid rgba(139, 92, 246, 0.6)",
            boxShadow: "0 0 15px rgba(139, 92, 246, 0.4)",
          },
        },
      },
    },
  },
});
```

**핵심 포인트:**

- 라이트/다크 두 개의 완전한 테마 객체
- `palette.mode`로 MUI 컴포넌트 자동 대응
- `components` 섹션에서 개별 컴포넌트 스타일 커스터마이징
- 다크모드에 네온 효과 적용 (그라디언트, 그림자, 호버 효과)

---

### 3️⃣ 테마 프로바이더 (`src/app/components/Provider/ThemeProvider.tsx`)

```tsx
"use client";
import React, { useLayoutEffect, useCallback } from "react";
import { ThemeProvider as MuiThemeProvider, CssBaseline } from "@mui/material";
import { useThemeStore } from "../../store/themeStore";
import { lightTheme, darkTheme } from "../../theme/theme";

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
```

**핵심 포인트:**

- `"use client"` 지시어로 클라이언트 컴포넌트 선언
- Zustand 스토어에서 `isDarkMode` 상태 구독
- `data-theme` 속성을 HTML 요소에 설정 (CSS 변수 연동)
- `useLayoutEffect`로 DOM 업데이트 전 테마 적용 (깜빡임 방지)
- `CssBaseline`으로 브라우저 기본 스타일 초기화

---

### 4️⃣ 다크모드 토글 버튼 (`src/app/components/DarkModeToggle.tsx`)

```tsx
"use client";
import React from "react";
import { IconButton, Tooltip, useTheme } from "@mui/material";
import { Brightness4, Brightness7 } from "@mui/icons-material";
import { useThemeStore } from "../store/themeStore";
import { styled } from "@mui/material/styles";

const StyledToggleButton = styled(IconButton)(({ theme }) => ({
  position: "relative",
  width: 48,
  height: 48,
  borderRadius: "50%",
  transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
  overflow: "hidden",

  // 라이트 모드 스타일
  ...(theme.palette.mode === "light" && {
    backgroundColor: "rgba(99, 102, 241, 0.1)",
    color: "#6366f1",
    border: "2px solid rgba(99, 102, 241, 0.2)",
    "&:hover": {
      backgroundColor: "rgba(99, 102, 241, 0.2)",
      transform: "scale(1.05)",
      boxShadow: "0 4px 15px rgba(99, 102, 241, 0.3)",
    },
  }),

  // 다크 모드 스타일 (네온 효과)
  ...(theme.palette.mode === "dark" && {
    backgroundColor: "rgba(139, 92, 246, 0.1)",
    color: "#a78bfa",
    border: "2px solid rgba(139, 92, 246, 0.3)",
    boxShadow: "0 0 10px rgba(139, 92, 246, 0.2)",

    "&:hover": {
      backgroundColor: "rgba(139, 92, 246, 0.2)",
      transform: "scale(1.05)",
      boxShadow:
        "0 0 20px rgba(139, 92, 246, 0.4), 0 0 40px rgba(139, 92, 246, 0.2)",
      border: "2px solid rgba(139, 92, 246, 0.5)",
    },

    "&:active": {
      transform: "scale(0.95)",
      boxShadow: "0 0 25px rgba(139, 92, 246, 0.6)",
    },

    // 네온 글로우 효과
    "&::before": {
      content: '""',
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      borderRadius: "50%",
      background:
        "linear-gradient(45deg, rgba(139, 92, 246, 0.1), rgba(6, 182, 212, 0.1))",
      opacity: 0,
      transition: "opacity 0.3s ease",
    },

    "&:hover::before": {
      opacity: 1,
    },
  }),

  // 아이콘 애니메이션
  "& .MuiSvgIcon-root": {
    fontSize: "1.5rem",
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",

    "&:hover": {
      transform: "rotate(180deg)",
    },
  },
}));

const DarkModeToggle: React.FC = () => {
  const { isDarkMode, toggleTheme } = useThemeStore();
  const theme = useTheme();

  return (
    <Tooltip
      title={isDarkMode ? "라이트 모드로 전환" : "다크 모드로 전환"}
      placement="bottom"
      arrow
    >
      <StyledToggleButton
        onClick={toggleTheme}
        aria-label="테마 전환"
        size="medium"
      >
        {isDarkMode ? <Brightness7 /> : <Brightness4 />}
      </StyledToggleButton>
    </Tooltip>
  );
};

export default DarkModeToggle;
```

**핵심 포인트:**

- `styled()` API로 조건부 스타일링
- `theme.palette.mode`로 현재 테마 감지
- 라이트/다크 각각 다른 아이콘 표시
- 호버, 액티브 상태 애니메이션
- 다크모드에서 네온 글로우 효과

---

### 5️⃣ 전역 CSS (`src/app/globals.css`)

```css
:root {
  --background: #f8fafc;
  --foreground: #1e293b;
  --primary: #6366f1;
  --secondary: #ec4899;
}

/* 다크모드 CSS 변수 */
[data-theme="dark"] {
  --background: #0f0f23;
  --foreground: #e2e8f0;
  --primary: #8b5cf6;
  --secondary: #06b6d4;
}

/* 시스템 다크모드 감지 */
@media (prefers-color-scheme: dark) {
  :root {
    --background: #0f0f23;
    --foreground: #e2e8f0;
  }
}

html,
body {
  max-width: 100vw;
  overflow-x: hidden;
}

.alwaysScroll {
  overflow-y: scroll;
}

body {
  color: var(--foreground);
  background: var(--background);
  font-family: "Inter", "Roboto", "Helvetica", "Arial", sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  will-change: auto;
}

/* 스크롤바 스타일 (라이트모드) */
::-webkit-scrollbar {
  width: 8px;
}

::-webkit-scrollbar-track {
  background: #f1f5f9;
}

::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}

/* 다크모드 스크롤바 스타일 (네온 효과) */
[data-theme="dark"] ::-webkit-scrollbar {
  width: 8px;
}

[data-theme="dark"] ::-webkit-scrollbar-track {
  background: #1a1a2e;
}

[data-theme="dark"] ::-webkit-scrollbar-thumb {
  background: linear-gradient(45deg, #8b5cf6, #06b6d4);
  border-radius: 4px;
}

[data-theme="dark"] ::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(45deg, #7c3aed, #0891b2);
  box-shadow: 0 0 10px rgba(139, 92, 246, 0.3);
}

* {
  box-sizing: border-box;
  padding: 0;
  margin: 0;
}

a {
  color: inherit;
  text-decoration: none;
}

/* 리스트 기본 스타일 */
ol,
ul {
  padding-left: 24px;
  margin: 12px 0;
  list-style-position: outside;
}

ol {
  list-style-type: decimal;
}

ul {
  list-style-type: disc;
}

li {
  margin: 6px 0;
  padding-left: 4px;
}

@media (prefers-color-scheme: dark) {
  html {
    color-scheme: dark;
  }
}
```

**핵심 포인트:**

- CSS Custom Properties로 테마 변수 정의
- `[data-theme="dark"]` 선택자로 다크모드 스타일 적용
- 스크롤바 커스터마이징 (라이트/다크 각각)
- 시스템 다크모드 선호도 감지 (`prefers-color-scheme`)

---

### 6️⃣ 루트 레이아웃 (`src/app/layout.tsx`)

```tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import ThemeProvider from "./components/Provider/ThemeProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Your App Name",
  description: "Your App Description",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="alwaysScroll">
      <body className={inter.className}>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
```

**핵심 포인트:**

- 서버 컴포넌트로 유지 (SEO 최적화)
- `ThemeProvider`로 전체 앱 감싸기
- `alwaysScroll` 클래스로 스크롤바 항상 표시 (레이아웃 시프트 방지)

---

## 🎯 사용 방법

### 1. 토글 버튼 배치

원하는 컴포넌트(예: TopBar, Header)에 토글 버튼 추가:

```tsx
import DarkModeToggle from "@/app/components/DarkModeToggle";

export default function TopBar() {
  return (
    <header>
      {/* 다른 요소들 */}
      <DarkModeToggle />
    </header>
  );
}
```

### 2. 다른 컴포넌트에서 테마 상태 접근

```tsx
"use client";
import { useThemeStore } from "@/app/store/themeStore";
import { useTheme } from "@mui/material";

export default function MyComponent() {
  const { isDarkMode } = useThemeStore();
  const theme = useTheme(); // MUI 테마 객체 접근

  return (
    <div
      style={{
        backgroundColor: theme.palette.background.paper,
        color: theme.palette.text.primary,
      }}
    >
      현재 모드: {isDarkMode ? "다크" : "라이트"}
    </div>
  );
}
```

### 3. CSS 변수 사용

```css
.my-custom-element {
  background-color: var(--background);
  color: var(--foreground);
  border: 1px solid var(--primary);
}
```

---

## 🎨 커스터마이징 가이드

### 색상 변경

`src/app/theme/theme.ts`에서 팔레트 색상 수정:

```typescript
// 라이트 테마
primary: {
  main: "#YOUR_COLOR",  // 메인 색상
  light: "#LIGHTER",    // 밝은 변형
  dark: "#DARKER",      // 어두운 변형
}
```

### 컴포넌트 스타일 추가

```typescript
components: {
  MuiChip: {
    styleOverrides: {
      root: {
        // 라이트/다크 공통 스타일
        fontWeight: 500,
      },
    },
  },
}
```

### 네온 효과 제거

다크 테마에서 네온 효과를 원하지 않으면 `boxShadow`, `background: linear-gradient` 등을 제거하세요.

---

## ⚡ 성능 최적화

### 1. `useLayoutEffect` 사용

- 화면 렌더링 **전** 테마 적용 → 깜빡임 방지

### 2. `requestAnimationFrame`

- DOM 업데이트를 브라우저 페인트 사이클에 맞춰 최적화

### 3. `persist` 미들웨어

- localStorage 자동 동기화로 새로고침 시에도 테마 유지

### 4. CSS Custom Properties

- JavaScript 없이 스타일 전환 가능
- 브라우저 네이티브 기능 활용

---

## 🐛 문제 해결

### Q1. 새로고침 시 테마가 깜빡입니다

**A:** `ThemeProvider`에서 `useLayoutEffect` 사용 확인. Next.js의 경우 `"use client"` 지시어 필수.

### Q2. localStorage에 저장되지 않습니다

**A:** Zustand `persist` 미들웨어의 `name` 옵션 확인. 브라우저 개발자 도구 → Application → Local Storage에서 확인.

### Q3. MUI 컴포넌트 스타일이 적용되지 않습니다

**A:** `theme.ts`의 `components` 섹션에서 올바른 컴포넌트 이름 사용 확인 (`Mui` 접두사 필수).

### Q4. 시스템 다크모드를 따르게 하고 싶습니다

**A:** `ThemeProvider.tsx`에서 초기값 설정 시 `window.matchMedia` 사용:

```typescript
const [isDarkMode, setIsDarkMode] = useState(() => {
  if (typeof window !== "undefined") {
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  }
  return false;
});
```

---

## 📌 체크리스트

다른 프로젝트에 적용 시 확인 사항:

- [ ] `zustand` 패키지 설치
- [ ] `@mui/material`, `@emotion/react`, `@emotion/styled` 설치
- [ ] `themeStore.ts` 생성 및 localStorage 키 이름 변경
- [ ] `theme.ts` 생성 및 색상 커스터마이징
- [ ] `ThemeProvider.tsx` 생성 (`"use client"` 필수)
- [ ] `DarkModeToggle.tsx` 생성
- [ ] `globals.css`에 CSS 변수 및 스크롤바 스타일 추가
- [ ] `layout.tsx`에서 `ThemeProvider`로 감싸기
- [ ] TopBar/Header에 `DarkModeToggle` 배치

---

## 🚀 확장 아이디어

### 1. 애니메이션 추가

```tsx
import { motion } from "framer-motion";

<motion.div
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  transition={{ duration: 0.3 }}
>
  {children}
</motion.div>;
```

### 2. 시스템 테마 자동 감지

```typescript
useEffect(() => {
  const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
  const handleChange = (e: MediaQueryListEvent) => {
    setTheme(e.matches);
  };
  mediaQuery.addEventListener("change", handleChange);
  return () => mediaQuery.removeEventListener("change", handleChange);
}, []);
```

### 3. 여러 테마 옵션 (라이트/다크/오토)

```typescript
type ThemeMode = "light" | "dark" | "auto";

interface ThemeState {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
}
```

---

## 📖 참고 자료

- [Material-UI Theming](https://mui.com/material-ui/customization/theming/)
- [Zustand Documentation](https://docs.pmnd.rs/zustand/getting-started/introduction)
- [Next.js App Router](https://nextjs.org/docs/app)
- [CSS Custom Properties](https://developer.mozilla.org/en-US/docs/Web/CSS/Using_CSS_custom_properties)

---

## 🎁 보너스: TypeScript 타입 안전성

### MUI 테마 타입 확장

```typescript
// src/theme/theme.d.ts
import "@mui/material/styles";

declare module "@mui/material/styles" {
  interface Palette {
    custom: {
      neon: string;
      glow: string;
    };
  }
  interface PaletteOptions {
    custom?: {
      neon?: string;
      glow?: string;
    };
  }
}
```

그리고 테마에서 사용:

```typescript
export const darkTheme = createTheme({
  palette: {
    custom: {
      neon: "#8b5cf6",
      glow: "#06b6d4",
    },
  },
});
```

---

## ✅ 최종 정리

이 구현은 다음과 같은 장점을 제공합니다:

✨ **완전한 타입 안전성** (TypeScript)  
✨ **자동 상태 저장** (Zustand persist)  
✨ **깜빡임 없는 전환** (useLayoutEffect + requestAnimationFrame)  
✨ **세밀한 스타일 제어** (MUI 테마 + CSS 변수)  
✨ **성능 최적화** (효율적인 리렌더링)  
✨ **접근성** (ARIA 레이블, Tooltip)  
✨ **반응형 디자인** (모든 화면 크기 대응)

이 문서를 다른 프로젝트의 AI에게 제공하면 동일한 다크모드 시스템을 구축할 수 있습니다! 🎉
