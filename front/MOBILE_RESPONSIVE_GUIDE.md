# 모바일 반응형 대응 가이드

## 📱 개요

Study-Board 프로젝트는 현재 **PC와 태블릿 환경**을 중심으로 구현되어 있습니다. 모바일 환경을 위한 추가 작업이 필요한 상태입니다.

**작성일**: 2025년 11월 8일  
**프로젝트 버전**: 2.4.0  
**대상 화면**: 모바일 (~ 768px), 태블릿 (768px ~ 1500px), 데스크톱 (1500px ~)

---

## 🎯 현재 반응형 구조 분석

### 📊 화면 크기별 브레이크포인트

현재 프로젝트는 다음과 같은 브레이크포인트를 사용합니다:

| 화면 크기    | 범위           | 레이아웃 구조                                                | 대응 상태    |
| ------------ | -------------- | ------------------------------------------------------------ | ------------ |
| **데스크톱** | 1500px 이상    | Grid 3단 레이아웃 (Nav 100px + Content 1000px + Right 400px) | ✅ 완료      |
| **태블릿**   | 768px ~ 1500px | Flex 세로 레이아웃 (Content → Right → Nav)                   | ✅ 완료      |
| **모바일**   | 768px 이하     | 패딩/간격만 조정됨                                           | ⚠️ 부분 대응 |

### 📁 주요 반응형 파일

```
front/src/app/
├── layout.module.css          # 메인 레이아웃 반응형 스타일
├── globals.css                # 전역 스타일 및 다크모드
├── theme/theme.ts             # Material-UI 테마 설정
└── components/
    ├── TopBar.tsx             # 상단 바 (모든 화면 대응)
    ├── NavMenuBar.tsx         # 좌측 네비게이션 (모바일 숨김)
    └── common/RightView.tsx   # 우측 사이드바
```

---

## 🔍 현재 구현 상태

### ✅ 잘 대응되어 있는 부분

#### 1. **레이아웃 구조 전환** (`layout.module.css`)

```css
/* 데스크톱: Grid 3단 레이아웃 */
.content_wrapper {
  display: grid;
  grid-template-columns: 100px 1000px 400px;
  gap: 15px;
  width: 1465px;
}

/* 태블릿 이하: Flex 세로 레이아웃 */
@media (max-width: 1500px) {
  .content_wrapper {
    display: flex;
    flex-direction: column;
    width: 100%;
  }
}

/* 모바일: 패딩 축소 */
@media (max-width: 768px) {
  .content_wrapper {
    padding: 0 10px;
    gap: 15px;
  }
}
```

#### 2. **Material-UI 반응형 시스템**

- `NavMenuBar.tsx`에서 Material-UI 브레이크포인트 활용
- xs (모바일), sm (태블릿), md, lg, xl (데스크톱) 단계별 대응

```typescript
// NavMenuBar.tsx의 반응형 스타일
const containerStyles = {
  display: {
    xs: "none", // 모바일: 숨김
    sm: "block", // 태블릿 이상: 표시
    xl: "flex", // 초대형 화면: 고정 사이드바
  },
  position: {
    xs: "static",
    xl: "fixed", // 초대형 화면: 좌측 고정
  },
  width: {
    xs: "100%",
    xl: "230px", // 초대형 화면: 고정 너비
  },
};
```

#### 3. **다크모드 테마**

- 라이트/다크 모드 모두 반응형 지원
- CSS 변수 기반 테마 시스템
- Material-UI 테마와 통합

### ⚠️ 개선이 필요한 부분

#### 1. **모바일 네비게이션 부재**

```typescript
// NavMenuBar.tsx - Line 116
display: { xs: "none", sm: "block" }  // ❌ 모바일에서 완전히 숨김
```

- **문제점**: 모바일 사용자가 채널 네비게이션에 접근할 수 없음
- **영향**: 사용자 경험 저하, 채널 전환 불가

#### 2. **터치 친화적 UI 부족**

- 버튼 크기가 작아 터치하기 어려움 (권장: 최소 44x44px)
- 스와이프 제스처 미지원
- 터치 피드백 효과 부족

#### 3. **모바일 최적화 미흡**

- 테이블 컴포넌트가 작은 화면에서 잘림
- 긴 텍스트 줄바꿈 처리 부족
- 이미지 크기 조절 필요
- 모바일 키보드 대응 부족

#### 4. **성능 최적화 필요**

- 모바일에서도 동일한 양의 데이터 로드
- 이미지 최적화 필요
- 코드 스플리팅 부족

---

## 🚀 모바일 대응 전략

### 전략 1: 기존 컴포넌트 개선 (추천 ⭐)

**장점**:

- 코드 베이스 통일
- 유지보수 용이
- 점진적 개선 가능

**단점**:

- 복잡한 조건부 렌더링
- 파일 크기 증가
- 성능 영향 가능

#### 구현 방법

##### A. 모바일 네비게이션 추가

1. **햄버거 메뉴 컴포넌트 생성**

```typescript
// components/MobileNavDrawer.tsx (신규 생성 필요)
"use client";
import { Drawer, IconButton } from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import { useState } from "react";

export default function MobileNavDrawer() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* 모바일에서만 표시되는 햄버거 버튼 */}
      <IconButton
        sx={{ display: { xs: "block", sm: "none" } }}
        onClick={() => setOpen(true)}
      >
        <MenuIcon />
      </IconButton>

      {/* 좌측에서 슬라이드되는 Drawer */}
      <Drawer
        anchor="left"
        open={open}
        onClose={() => setOpen(false)}
        sx={{ display: { xs: "block", sm: "none" } }}
      >
        {/* NavMenuBar 내용을 여기에 표시 */}
      </Drawer>
    </>
  );
}
```

2. **TopBar에 통합**

```typescript
// components/TopBar.tsx 수정
import MobileNavDrawer from "./MobileNavDrawer";

export default function TopBar() {
  return (
    <AppBar>
      <Toolbar>
        <MobileNavDrawer />  {/* 추가 */}
        {/* 기존 TopBar 내용 */}
      </Toolbar>
    </AppBar>
  );
}
```

##### B. 하단 네비게이션 바 추가

```typescript
// components/MobileBottomNav.tsx (신규 생성 필요)
"use client";
import { BottomNavigation, BottomNavigationAction, Paper } from "@mui/material";
import HomeIcon from "@mui/icons-material/Home";
import SearchIcon from "@mui/icons-material/Search";
import NotificationsIcon from "@mui/icons-material/Notifications";
import PersonIcon from "@mui/icons-material/Person";

export default function MobileBottomNav() {
  return (
    <Paper
      sx={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        display: { xs: "block", sm: "none" },  // 모바일에서만 표시
        zIndex: 1100
      }}
      elevation={3}
    >
      <BottomNavigation showLabels>
        <BottomNavigationAction label="홈" icon={<HomeIcon />} />
        <BottomNavigationAction label="검색" icon={<SearchIcon />} />
        <BottomNavigationAction label="알림" icon={<NotificationsIcon />} />
        <BottomNavigationAction label="프로필" icon={<PersonIcon />} />
      </BottomNavigation>
    </Paper>
  );
}
```

##### C. 테이블 반응형 개선

```typescript
// components/table/CustomizedTables.tsx 수정
<TableContainer
  sx={{
    // 모바일: 가로 스크롤 활성화
    overflowX: { xs: "auto", sm: "visible" },
    // 모바일: 컨테이너 최소 너비 제거
    minWidth: { xs: "100%", sm: 750 }
  }}
>
  <Table
    sx={{
      // 모바일: 테이블 최소 너비 조정
      minWidth: { xs: 320, sm: 750 }
    }}
  >
    {/* 테이블 내용 */}
  </Table>
</TableContainer>
```

##### D. 카드 뷰로 전환

```css
/* components/table/CustomizedTables.module.css */
@media (max-width: 768px) {
  /* 모바일에서 테이블을 카드 뷰로 전환 */
  .mobile-card-view {
    display: block;
  }

  .mobile-card-view tr {
    display: block;
    margin-bottom: 16px;
    border: 1px solid #e0e0e0;
    border-radius: 8px;
    padding: 12px;
  }

  .mobile-card-view td {
    display: block;
    text-align: left;
    padding: 8px 0;
    border: none;
  }

  .mobile-card-view td::before {
    content: attr(data-label);
    font-weight: bold;
    margin-right: 8px;
  }
}
```

##### E. 터치 친화적 버튼 크기

```typescript
// globals.css 또는 theme.ts에 추가
const mobileTheme = {
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          "@media (max-width: 768px)": {
            minHeight: "44px", // 터치하기 좋은 최소 높이
            minWidth: "44px",
            fontSize: "16px", // 모바일 최적 폰트 크기
            padding: "12px 24px",
          },
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          "@media (max-width: 768px)": {
            width: "48px", // 터치 영역 확대
            height: "48px",
          },
        },
      },
    },
  },
};
```

---

### 전략 2: 모바일 전용 컴포넌트 생성 (선택적)

**장점**:

- 모바일 최적화된 경험
- 성능 최적화 가능
- 각 플랫폼에 최적화된 UI/UX

**단점**:

- 코드 중복
- 유지보수 부담 증가
- 개발 시간 증가

#### 구현 방법

##### A. 플랫폼별 컴포넌트 분리

```
src/app/components/
├── desktop/
│   ├── DesktopNavMenuBar.tsx
│   ├── DesktopTopBar.tsx
│   └── DesktopMainView.tsx
├── mobile/
│   ├── MobileNavDrawer.tsx
│   ├── MobileBottomNav.tsx
│   ├── MobileTopBar.tsx
│   └── MobileMainView.tsx
└── shared/
    ├── Button.tsx
    ├── Card.tsx
    └── Table.tsx
```

##### B. 반응형 래퍼 컴포넌트

```typescript
// components/ResponsiveWrapper.tsx
"use client";
import { useMediaQuery, useTheme } from "@mui/material";
import DesktopLayout from "./desktop/DesktopLayout";
import MobileLayout from "./mobile/MobileLayout";

export default function ResponsiveWrapper({ children }: { children: React.ReactNode }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  return isMobile ? (
    <MobileLayout>{children}</MobileLayout>
  ) : (
    <DesktopLayout>{children}</DesktopLayout>
  );
}
```

##### C. 커스텀 훅 활용

```typescript
// hooks/useResponsive.ts
import { useMediaQuery, useTheme } from "@mui/material";

export function useResponsive() {
  const theme = useTheme();

  return {
    isMobile: useMediaQuery(theme.breakpoints.down("sm")),
    isTablet: useMediaQuery(theme.breakpoints.between("sm", "md")),
    isDesktop: useMediaQuery(theme.breakpoints.up("lg")),
    isTouch: "ontouchstart" in window
  };
}

// 사용 예시
function MyComponent() {
  const { isMobile, isTouch } = useResponsive();

  return (
    <Button
      size={isMobile ? "large" : "medium"}
      onClick={isTouch ? handleTouchClick : handleClick}
    >
      클릭
    </Button>
  );
}
```

---

## 📝 구체적인 작업 항목

### Phase 1: 기본 모바일 네비게이션 (필수 ✅)

**예상 작업 시간**: 4-6시간

1. **MobileNavDrawer 컴포넌트 생성**

   - [ ] `components/MobileNavDrawer.tsx` 파일 생성
   - [ ] 햄버거 메뉴 버튼 구현
   - [ ] 좌측 Drawer 구현
   - [ ] NavMenuBar 내용 통합

2. **TopBar 수정**

   - [ ] MobileNavDrawer 통합
   - [ ] 모바일 화면에서 로고 크기 조정
   - [ ] 검색바 모바일 최적화

3. **하단 네비게이션 추가 (선택)**
   - [ ] `components/MobileBottomNav.tsx` 파일 생성
   - [ ] 주요 메뉴 4-5개 선정
   - [ ] 라우팅 연결
   - [ ] 다크모드 스타일 적용

**참고 코드 위치**:

- `src/app/components/NavMenuBar.tsx` (Line 110-131)
- `src/app/layout.tsx` (Line 50-66)

---

### Phase 2: 테이블 및 리스트 최적화 (필수 ✅)

**예상 작업 시간**: 6-8시간

1. **테이블 컴포넌트 반응형 개선**

   - [ ] `CustomizedTables.tsx` 모바일 가로 스크롤 추가
   - [ ] `CustomizedCardView.tsx` 카드 크기 조정
   - [ ] `CustomizedSuggestionTable.tsx` 열 우선순위 조정
   - [ ] 모바일에서 불필요한 열 숨김 처리

2. **카드 뷰 전환 (선택)**

   - [ ] 모바일용 카드 레이아웃 CSS 작성
   - [ ] 데이터 레이블 추가
   - [ ] 터치 피드백 효과 추가

3. **페이지네이션 개선**
   - [ ] `Pagination.tsx` 버튼 크기 확대
   - [ ] 페이지 번호 개수 모바일 최적화 (5개 → 3개)
   - [ ] 스와이프 제스처 추가 (선택)

**참고 코드 위치**:

- `src/app/components/table/` (모든 테이블 컴포넌트)
- `src/app/components/common/Pagination.tsx`

---

### Phase 3: 터치 UI 최적화 (권장 ⭐)

**예상 작업 시간**: 4-5시간

1. **버튼 및 인터랙티브 요소**

   - [ ] `theme.ts` 모바일 버튼 크기 조정 (최소 44x44px)
   - [ ] 터치 영역 확대 (padding 증가)
   - [ ] 터치 피드백 애니메이션 추가
   - [ ] 롱프레스 제스처 추가 (선택)

2. **폼 입력 최적화**

   - [ ] `RichTextEditor.tsx` 모바일 툴바 재배치
   - [ ] 입력 필드 크기 확대
   - [ ] 모바일 키보드 대응 (viewport 조정)
   - [ ] 자동완성 최적화

3. **이미지 뷰어 개선**
   - [ ] `ImageViewer.tsx` 핀치 줌 추가
   - [ ] 스와이프 네비게이션 개선
   - [ ] 로딩 스켈레톤 추가
   - [ ] 이미지 레이지 로딩

**참고 코드 위치**:

- `src/app/theme/theme.ts`
- `src/app/(noLogin)/channels/[slug]/detail/story/[id]/components/ImageViewer.tsx`

---

### Phase 4: 성능 최적화 (선택적)

**예상 작업 시간**: 6-10시간

1. **코드 스플리팅**

   - [ ] Next.js Dynamic Import 활용
   - [ ] 모바일 전용 번들 분리
   - [ ] 라우트 기반 코드 스플리팅

2. **이미지 최적화**

   - [ ] Next.js Image 컴포넌트 적용
   - [ ] WebP 포맷 전환
   - [ ] 반응형 이미지 (srcset)
   - [ ] 블러 플레이스홀더

3. **데이터 로딩 최적화**
   - [ ] 무한 스크롤 구현
   - [ ] 페이지당 항목 수 조정 (모바일: 10개, 데스크톱: 20개)
   - [ ] 프리페치 최적화
   - [ ] 캐싱 전략 개선

---

### Phase 5: 추가 모바일 기능 (선택적)

**예상 작업 시간**: 8-12시간

1. **PWA (Progressive Web App) 지원**

   - [ ] `manifest.json` 생성
   - [ ] Service Worker 구현
   - [ ] 오프라인 지원
   - [ ] 앱 설치 프롬프트

2. **모바일 제스처**

   - [ ] 스와이프 네비게이션
   - [ ] Pull-to-refresh
   - [ ] 스와이프로 삭제
   - [ ] 드래그 앤 드롭

3. **모바일 전용 기능**
   - [ ] 위치 기반 서비스 (선택)
   - [ ] 카메라 직접 연동
   - [ ] 푸시 알림 최적화
   - [ ] 다크모드 자동 전환 (시스템 설정 연동)

---

## 🛠️ 권장 작업 순서

### 최소 작업 (MVP)

필수 기능만 구현하여 모바일 사용 가능하게 만들기

```
1. Phase 1: 모바일 네비게이션 추가 (햄버거 메뉴)
2. Phase 2: 테이블 가로 스크롤 추가
3. Phase 3: 버튼 크기 확대 (44x44px)
```

**예상 소요 시간**: 2-3일  
**결과**: 모바일에서 기본적인 탐색과 사용 가능

---

### 표준 작업 (권장 ⭐)

사용자 경험을 고려한 완전한 모바일 대응

```
1. Phase 1: 모바일 네비게이션 (햄버거 + 하단 바)
2. Phase 2: 테이블 최적화 (스크롤 + 카드 뷰 전환)
3. Phase 3: 터치 UI 최적화 (버튼, 폼, 이미지)
4. Phase 4: 기본 성능 최적화 (이미지, 코드 스플리팅)
```

**예상 소요 시간**: 1-2주  
**결과**: 모바일 우선 설계에 준하는 사용자 경험

---

### 완전 작업 (이상적)

PWA 및 고급 기능 포함

```
1-4. 표준 작업 모두 완료
5. Phase 5: PWA 및 고급 모바일 기능
6. 세밀한 애니메이션 및 전환 효과
7. 모바일 A/B 테스트 및 최적화
```

**예상 소요 시간**: 3-4주  
**결과**: 네이티브 앱과 유사한 경험 제공

---

## 📐 Material-UI 브레이크포인트 가이드

### 기본 브레이크포인트

```typescript
// Material-UI 기본 브레이크포인트
{
  xs: 0,      // 모바일 (0px ~)
  sm: 600,    // 태블릿 세로 (600px ~)
  md: 900,    // 태블릿 가로 (900px ~)
  lg: 1200,   // 노트북 (1200px ~)
  xl: 1536    // 데스크톱 (1536px ~)
}
```

### 커스텀 브레이크포인트 (프로젝트 기준)

```typescript
// theme.ts에 추가 권장
const customBreakpoints = {
  values: {
    xs: 0, // 모바일
    sm: 600, // 태블릿
    md: 900, // 태블릿 가로
    lg: 1200, // 작은 데스크톱
    xl: 1500, // 표준 데스크톱 (현재 프로젝트 기준)
    xxl: 1920, // 대형 모니터
  },
};
```

### 사용 예시

```typescript
// 1. sx prop 사용
<Box
  sx={{
    width: { xs: "100%", sm: "600px", md: "900px", lg: "1200px" },
    padding: { xs: 2, sm: 3, md: 4 },
    display: { xs: "block", md: "flex" }
  }}
>

// 2. useMediaQuery 사용
import { useMediaQuery, useTheme } from "@mui/material";

function MyComponent() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const isTablet = useMediaQuery(theme.breakpoints.between("sm", "md"));
  const isDesktop = useMediaQuery(theme.breakpoints.up("lg"));

  if (isMobile) return <MobileView />;
  if (isTablet) return <TabletView />;
  return <DesktopView />;
}

// 3. theme.breakpoints 함수 사용
const styles = {
  root: {
    [theme.breakpoints.down("sm")]: {
      fontSize: "14px"
    },
    [theme.breakpoints.up("md")]: {
      fontSize: "16px"
    }
  }
}
```

---

## 🎨 모바일 디자인 가이드라인

### 1. 터치 영역 (Touch Target)

```
✅ 권장
- 최소 크기: 44x44px (Apple HIG)
- 최소 크기: 48x48px (Material Design)
- 버튼 간 간격: 최소 8px

❌ 피해야 할 것
- 32x32px 이하의 터치 영역
- 빽빽하게 배치된 버튼들
- 작은 체크박스/라디오 버튼
```

### 2. 폰트 크기

```
✅ 권장
- 본문: 16px (1rem)
- 작은 텍스트: 14px (0.875rem)
- 제목: 20-24px (1.25-1.5rem)
- 버튼 텍스트: 16px

❌ 피해야 할 것
- 12px 이하 폰트 (가독성 저하)
- 긴 문장에 굵은 폰트 사용
```

### 3. 간격 (Spacing)

```
✅ 권장
- 컨테이너 패딩: 16-24px
- 요소 간 간격: 12-16px
- 섹션 간 간격: 24-32px
- 카드 내부 패딩: 16px

❌ 피해야 할 것
- 8px 이하 패딩 (답답함)
- 화면 가장자리까지 꽉 찬 콘텐츠
```

### 4. 콘텐츠 우선순위

```
모바일에서 우선적으로 표시해야 할 것:
1. 핵심 콘텐츠 (게시글, 댓글)
2. 주요 액션 버튼 (작성, 검색)
3. 네비게이션 (햄버거 메뉴)

숨기거나 축소해도 되는 것:
1. 사이드바 광고
2. 부가 정보 (조회수, 날짜)
3. 불필요한 장식 요소
```

---

## 🔧 주요 파일 수정 가이드

### 1. layout.module.css

**현재 상태**:

```css
@media (max-width: 768px) {
  .content_wrapper {
    padding: 0 10px; /* 너무 작음 */
    gap: 15px;
  }
}
```

**권장 수정**:

```css
@media (max-width: 768px) {
  .content_wrapper {
    padding: 0 16px; /* 16px로 증가 */
    gap: 20px; /* 간격 증가 */
  }

  .main_content {
    padding: 0;
    width: 100%;
    max-width: 100%;
  }

  /* 모바일에서 하단 네비게이션 공간 확보 */
  .main_container {
    padding-bottom: 80px;
  }
}
```

---

### 2. NavMenuBar.tsx

**현재 상태** (Line 116):

```typescript
display: { xs: "none", sm: "block" }  // 모바일에서 숨김
```

**권장 수정**:

```typescript
// 모바일: Drawer로 표시, 데스크톱: 고정 사이드바
const navContent = (
  <Box sx={containerStyles}>
    {/* NavMenuBar 내용 */}
  </Box>
);

// 데스크톱
const desktopNav = (
  <Box sx={{ display: { xs: "none", md: "block" } }}>
    {navContent}
  </Box>
);

// 모바일
const mobileNav = (
  <Drawer
    anchor="left"
    open={mobileOpen}
    onClose={() => setMobileOpen(false)}
    sx={{ display: { xs: "block", md: "none" } }}
  >
    {navContent}
  </Drawer>
);

return (
  <>
    {desktopNav}
    {mobileNav}
  </>
);
```

---

### 3. TopBar.tsx

**권장 추가**:

```typescript
// TopBar.tsx - 햄버거 메뉴 버튼 추가
export default function TopBar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <AppBar>
      <Toolbar>
        {/* 모바일: 햄버거 메뉴 */}
        <IconButton
          sx={{
            display: { xs: "block", md: "none" },
            mr: 2,
            width: 48,
            height: 48
          }}
          onClick={() => setMobileMenuOpen(true)}
        >
          <MenuIcon />
        </IconButton>

        {/* 로고 */}
        <Link href="/">
          <Box
            component="img"
            src="/logo.png"
            sx={{
              height: { xs: 32, sm: 40 },  // 모바일에서 작게
              cursor: "pointer"
            }}
          />
        </Link>

        {/* 나머지 TopBar 내용 */}
      </Toolbar>
    </AppBar>
  );
}
```

---

### 4. theme.ts

**권장 추가**:

```typescript
// theme.ts - 모바일 최적화 스타일
export const mobileOptimizedTheme = createTheme({
  ...commonTheme,
  breakpoints: {
    values: {
      xs: 0,
      sm: 600,
      md: 900,
      lg: 1200,
      xl: 1500, // 프로젝트 기준
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          // 모바일에서 터치하기 좋은 크기
          "@media (max-width: 600px)": {
            minHeight: 44,
            minWidth: 44,
            fontSize: 16,
            padding: "12px 24px",
          },
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          "@media (max-width: 600px)": {
            width: 48,
            height: 48,
          },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          "@media (max-width: 600px)": {
            fontSize: 14,
            padding: "8px",
          },
        },
      },
    },
  },
});
```

---

## 📱 테스트 가이드

### 1. 브라우저 개발자 도구

```
Chrome DevTools:
1. F12 또는 Ctrl+Shift+I
2. Toggle device toolbar (Ctrl+Shift+M)
3. 테스트할 디바이스 선택:
   - iPhone SE (375x667)
   - iPhone 12 Pro (390x844)
   - Samsung Galaxy S20 (360x800)
   - iPad (768x1024)
```

### 2. 실제 디바이스 테스트

```
테스트 필수 항목:
✅ 터치 반응성
✅ 스크롤 성능
✅ 텍스트 가독성
✅ 버튼 크기 적절성
✅ 네비게이션 접근성
✅ 키보드 표시 시 레이아웃
```

### 3. 성능 측정 도구

```
추천 도구:
- Lighthouse (Chrome DevTools)
- WebPageTest
- GTmetrix

측정 지표:
- First Contentful Paint (FCP): < 1.8초
- Largest Contentful Paint (LCP): < 2.5초
- Cumulative Layout Shift (CLS): < 0.1
- First Input Delay (FID): < 100ms
```

---

## 🚨 주의사항

### 1. iOS Safari 특이사항

```typescript
// iOS에서 100vh 문제 해결
const actualVH = window.innerHeight * 0.01;
document.documentElement.style.setProperty('--vh', `${actualVH}px`);

// CSS
.full-height {
  height: 100vh;           /* 폴백 */
  height: calc(var(--vh, 1vh) * 100);  /* 실제 높이 */
}
```

### 2. 터치 이벤트 vs 마우스 이벤트

```typescript
// ❌ 잘못된 방법 - onClick만 사용
<div onClick={handleClick}>

// ✅ 올바른 방법 - 터치와 마우스 모두 처리
<div
  onClick={handleClick}
  onTouchStart={(e) => e.stopPropagation()}  // 터치 최적화
  style={{ cursor: 'pointer', WebkitTapHighlightColor: 'transparent' }}
>
```

### 3. 가로/세로 방향 전환

```typescript
// 방향 전환 감지
useEffect(() => {
  const handleOrientationChange = () => {
    // 레이아웃 재계산
  };

  window.addEventListener("orientationchange", handleOrientationChange);
  return () => window.removeEventListener("orientationchange", handleOrientationChange);
}, []);
```

---

## 📚 참고 자료

### Material-UI 공식 문서

- [Responsive UI](https://mui.com/material-ui/react-use-media-query/)
- [Breakpoints](https://mui.com/material-ui/customization/breakpoints/)
- [Mobile Components](https://mui.com/material-ui/react-bottom-navigation/)

### 디자인 가이드라인

- [Apple Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/)
- [Material Design](https://m3.material.io/)
- [Web.dev - Mobile UX](https://web.dev/mobile/)

### Next.js 최적화

- [Next.js Image Optimization](https://nextjs.org/docs/pages/building-your-application/optimizing/images)
- [Font Optimization](https://nextjs.org/docs/pages/building-your-application/optimizing/fonts)
- [Code Splitting](https://nextjs.org/docs/pages/building-your-application/optimizing/lazy-loading)

---

## 🎯 결론

### 현재 상태 요약

| 영역          | PC  | 태블릿 | 모바일 |
| ------------- | :-: | :----: | :----: |
| 레이아웃      | ✅  |   ✅   |   ⚠️   |
| 네비게이션    | ✅  |   ✅   |   ❌   |
| 테이블/리스트 | ✅  |   ✅   |   ⚠️   |
| 버튼/인터랙션 | ✅  |   ✅   |   ⚠️   |
| 폼 입력       | ✅  |   ✅   |   ⚠️   |
| 이미지        | ✅  |   ✅   |   ⚠️   |
| 성능          | ✅  |   ✅   |   ⚠️   |

**범례**: ✅ 완료 / ⚠️ 부분 대응 / ❌ 미대응

### 권장 사항

1. **모바일 전용 컴포넌트를 만들지 말고, 기존 컴포넌트를 개선하세요** ⭐

   - 코드 중복 방지
   - 유지보수 용이
   - 점진적 개선 가능

2. **최소 작업부터 시작하세요**

   - Phase 1 (네비게이션) → Phase 2 (테이블) → Phase 3 (터치 UI)
   - 단계별로 테스트하며 진행
   - 사용자 피드백 반영

3. **Material-UI의 반응형 시스템을 최대한 활용하세요**

   - `sx` prop의 브레이크포인트 기능
   - `useMediaQuery` 훅
   - Grid/Flex 레이아웃 시스템

4. **성능 최적화는 기본 기능 구현 후에 진행하세요**
   - 먼저 작동하게 만들고
   - 그 다음 빠르게 만들기
   - 데이터로 측정하며 개선

### 다음 단계

1. 이 문서를 팀과 공유하고 우선순위 논의
2. Phase 1 (모바일 네비게이션) 작업 시작
3. 실제 모바일 디바이스에서 테스트
4. 사용자 피드백 수집 및 개선
5. Phase 2, 3로 점진적 확장

---

**문서 관리**:

- **작성자**: AI Assistant
- **최종 수정일**: 2025년 11월 8일
- **관련 문서**: `COMPONENT_STRUCTURE.md`, `DARK_MODE_IMPLEMENTATION.md`
- **프로젝트**: Study-Board Frontend
- **버전**: 1.0.0

---

_이 문서는 Study-Board 프로젝트의 모바일 반응형 대응을 위한 가이드입니다. 프로젝트 진행 상황에 따라 지속적으로 업데이트됩니다._
