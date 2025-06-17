# Next.js 프론트엔드 컴포넌트 구조 분석

## 📋 개요

Study-Board 프로젝트의 Next.js App Router 기반 프론트엔드 파일들을 서버 컴포넌트와 클라이언트 컴포넌트로 구분하여 정리합니다.

---

## 🖥️ 서버 컴포넌트 (Server Components)

> **특징**: `"use client"` 지시어가 없는 컴포넌트들로, 서버에서 렌더링됩니다.

### 🏠 루트 레이아웃 및 메인 페이지

| 파일 경로        | 역할                                                                             |
| ---------------- | -------------------------------------------------------------------------------- |
| `app/layout.tsx` | **루트 레이아웃** - 전체 애플리케이션의 공통 레이아웃, metadata 설정, SEO 최적화 |
| `app/page.tsx`   | **메인 페이지** - `/` 경로에서 `/channels`로 리다이렉트 처리                     |

### 📁 설정 및 유틸리티 파일

| 파일 경로                         | 역할                                                |
| --------------------------------- | --------------------------------------------------- |
| `app/store.ts`                    | **전역 스토어 설정** - Zustand 스토어 인스턴스 생성 |
| `pages/api/auth/[...nextauth].ts` | **NextAuth.js 설정** - 인증 관련 API 라우트         |
| `middleware.ts`                   | **미들웨어** - 라우트 보호 및 인증 체크             |

### 🎨 CSS 파일들

- `app/globals.css` - 전역 스타일
- `app/layout.module.css` - 레이아웃 스타일
- `app/page.module.css` - 메인 페이지 스타일
- `app/components/style/*.module.css` - 컴포넌트별 CSS 모듈

---

## 💻 클라이언트 컴포넌트 (Client Components)

> **특징**: `"use client"` 지시어가 있는 컴포넌트들로, 브라우저에서 실행됩니다.

### 📄 페이지 컴포넌트들

#### 🔐 인증 관련 페이지

| 파일 경로                       | 역할                                     |
| ------------------------------- | ---------------------------------------- |
| `(beforeLogin)/login/page.tsx`  | **로그인 페이지** - 사용자 로그인 폼     |
| `(beforeLogin)/signup/page.tsx` | **회원가입 페이지** - 사용자 회원가입 폼 |

#### 🏠 메인 콘텐츠 페이지

| 파일 경로                                                   | 역할                                                      |
| ----------------------------------------------------------- | --------------------------------------------------------- |
| `(noLogin)/channels/page.tsx`                               | **채널 목록 페이지** - 모든 채널 표시                     |
| `(noLogin)/channels/[slug]/page.tsx`                        | **채널 상세 페이지** - 특정 채널의 게시글 목록            |
| `(noLogin)/channels/[slug]/detail/story/[id]/page.tsx`      | **게시글 상세 페이지** - 게시글 내용 및 댓글              |
| `(noLogin)/channels/[slug]/detail/suggestion/[id]/page.tsx` | **건의사항 상세 페이지** - 건의사항 내용 및 댓글          |
| `(noLogin)/channel-notifications/page.tsx`                  | **채널 알림 설정 페이지** - 채널별 알림 구독 관리         |
| `(noLogin)/notice/[id]/page.tsx`                            | **공지사항 상세 페이지** - 공지사항 내용                  |
| `(noLogin)/profile/[username]/page.tsx`                     | **사용자 프로필 페이지** - 다른 사용자의 프로필 및 작성글 |

#### ✏️ 글 작성/수정 페이지

| 파일 경로                                    | 역할                                             |
| -------------------------------------------- | ------------------------------------------------ |
| `(afterLogin)/write/story/page.tsx`          | **게시글 작성 페이지** - 새 게시글 작성 폼       |
| `(afterLogin)/write/suggestion/page.tsx`     | **건의사항 작성 페이지** - 새 건의사항 작성 폼   |
| `(afterLogin)/write/notice/page.tsx`         | **공지사항 작성 페이지** - 새 공지사항 작성 폼   |
| `(afterLogin)/edit/story/[id]/page.tsx`      | **게시글 수정 페이지** - 기존 게시글 수정 폼     |
| `(afterLogin)/edit/suggestion/[id]/page.tsx` | **건의사항 수정 페이지** - 기존 건의사항 수정 폼 |

#### 👤 사용자 기능 페이지

| 파일 경로                               | 역할                                                     |
| --------------------------------------- | -------------------------------------------------------- |
| `(afterLogin)/setting/profile/page.tsx` | **프로필 설정 페이지** - 개인정보 수정, 작성글/댓글 관리 |
| `(afterLogin)/messages/page.tsx`        | **메시지 페이지** - 개인 메시지 관리                     |
| `(afterLogin)/notifications/page.tsx`   | **알림 페이지** - 알림 목록 관리                         |
| `(afterLogin)/scraps/page.tsx`          | **스크랩 페이지** - 스크랩한 게시글 목록                 |
| `(afterLogin)/recent-views/page.tsx`    | **최근 본 글 페이지** - 최근 조회한 게시글 목록          |
| `(afterLogin)/blinds/page.tsx`          | **블라인드 페이지** - 블라인드 처리된 게시글 관리        |

#### 🚫 오류 페이지

| 파일 경로       | 역할                                                |
| --------------- | --------------------------------------------------- |
| `not-found.tsx` | **404 에러 페이지** - 페이지를 찾을 수 없을 때 표시 |

### 🧩 공통 컴포넌트들

#### 🏗️ 레이아웃 컴포넌트

| 파일 경로                   | 역할                                   |
| --------------------------- | -------------------------------------- |
| `components/TopBar.tsx`     | **상단 바** - 로고, 검색, 사용자 메뉴  |
| `components/NavMenuBar.tsx` | **네비게이션 메뉴** - 사이드바 메뉴    |
| `components/NavBar.tsx`     | **하단 네비게이션** - 모바일용 하단 바 |

#### 🔧 기능성 컴포넌트

| 파일 경로                       | 역할                                                   |
| ------------------------------- | ------------------------------------------------------ |
| `components/RQProvider.tsx`     | **React Query 프로바이더** - 데이터 fetching 상태 관리 |
| `components/ThemeProvider.tsx`  | **테마 프로바이더** - 다크/라이트 모드 제공            |
| `components/DarkModeToggle.tsx` | **다크모드 토글** - 테마 전환 버튼                     |

#### 🔔 알림 및 드롭다운

| 파일 경로                                    | 역할                                      |
| -------------------------------------------- | ----------------------------------------- |
| `components/NotificationDropdown.tsx`        | **알림 드롭다운** - 실시간 알림 목록      |
| `components/NoticesDropdown.tsx`             | **공지사항 드롭다운** - 공지사항 목록     |
| `components/ChannelNotificationDropdown.tsx` | **채널 알림 드롭다운** - 채널별 알림 설정 |

#### 📊 테이블 컴포넌트

| 파일 경로                                           | 역할                                                     |
| --------------------------------------------------- | -------------------------------------------------------- |
| `components/table/CustomizedTables.tsx`             | **기본 테이블** - 게시글 목록 테이블                     |
| `components/table/CustomizedCardView.tsx`           | **카드 뷰 테이블** - 카드 형태 게시글 목록               |
| `components/table/CustomizedSuggestionTable.tsx`    | **건의사항 테이블** - 건의사항 목록 테이블               |
| `components/table/CustomizedUserStoryTables.tsx`    | **사용자 게시글 테이블** - 프로필 페이지용 게시글 테이블 |
| `components/table/CustomizedUserCommentsTables.tsx` | **사용자 댓글 테이블** - 프로필 페이지용 댓글 테이블     |

#### 🎛️ 공통 UI 컴포넌트

| 파일 경로                                 | 역할                                                   |
| ----------------------------------------- | ------------------------------------------------------ |
| `components/common/AuthSessionCom.tsx`    | **세션 관리** - NextAuth 세션 프로바이더               |
| `components/common/Loading.tsx`           | **로딩 컴포넌트** - 데이터 로딩 시 표시                |
| `components/common/Pagination.tsx`        | **페이지네이션** - 페이지 이동 컨트롤                  |
| `components/common/ProfilePagination.tsx` | **프로필 페이지네이션** - 프로필 페이지용 페이지네이션 |
| `components/common/SearchBar.tsx`         | **검색 바** - 게시글 검색 기능                         |
| `components/common/ScrollUpButton.tsx`    | **상단 이동 버튼** - 페이지 최상단으로 스크롤          |

#### 💬 채팅 및 메시지

| 파일 경로                           | 역할                                  |
| ----------------------------------- | ------------------------------------- |
| `components/chat/ChannelChat.tsx`   | **채널 채팅** - 실시간 채널 채팅 기능 |
| `components/common/MessageView.tsx` | **메시지 뷰** - 개인 메시지 표시      |

#### 🎨 콘텐츠 표시 컴포넌트

| 파일 경로                  | 역할                                        |
| -------------------------- | ------------------------------------------- |
| `components/MainView.tsx`  | **메인 뷰** - 메인 페이지 콘텐츠            |
| `components/HtmlTable.tsx` | **HTML 테이블** - 범용 HTML 테이블 컴포넌트 |
| `components/ImageCard.tsx` | **이미지 카드** - 이미지 표시 카드          |
| `components/VideoCard.tsx` | **비디오 카드** - 비디오 표시 카드          |

#### 🔒 보안 및 접근 제어

| 파일 경로                                | 역할                                          |
| ---------------------------------------- | --------------------------------------------- |
| `components/common/SitePasswordGate.tsx` | **사이트 비밀번호 게이트** - 사이트 접근 제한 |
| `components/BlindWrapper.tsx`            | **블라인드 래퍼** - 블라인드 처리 컨테이너    |
| `components/BlindedContent.tsx`          | **블라인드 콘텐츠** - 블라인드 처리된 콘텐츠  |

#### 🔔 브라우저 기능

| 파일 경로                                    | 역할                                 |
| -------------------------------------------- | ------------------------------------ |
| `components/common/BrowserNotification.tsx`  | **브라우저 알림** - 웹 푸시 알림     |
| `components/common/SubscriptionProvider.tsx` | **구독 프로바이더** - 알림 구독 관리 |

---

## 🏪 스토어 (Zustand)

### 상태 관리 파일들

| 파일 경로                | 역할                                       |
| ------------------------ | ------------------------------------------ |
| `store/themeStore.ts`    | **테마 상태** - 다크/라이트 모드 상태 관리 |
| `store/userInfoStore.ts` | **사용자 정보 상태** - 로그인 사용자 정보  |
| `store/messageStore.ts`  | **메시지 상태** - 알림 메시지 표시 상태    |
| `store/pageStore.ts`     | **페이지 상태** - 페이지네이션 상태        |
| `store/commentStore.ts`  | **댓글 상태** - 댓글 관련 상태             |
| `store/blindStore.ts`    | **블라인드 상태** - 블라인드 기능 상태     |

---

## 🔧 API 및 유틸리티

### API 모듈

| 파일 경로             | 역할                                  |
| --------------------- | ------------------------------------- |
| `api/axios.ts`        | **Axios 설정** - HTTP 클라이언트 설정 |
| `api/channelsApi.ts`  | **채널 API** - 채널 관련 API 호출     |
| `api/messagesApi.ts`  | **메시지 API** - 메시지 관련 API 호출 |
| `api/notification.ts` | **알림 API** - 알림 관련 API 호출     |

### 유틸리티

| 파일 경로             | 역할                                   |
| --------------------- | -------------------------------------- |
| `utils/websocket.ts`  | **웹소켓 유틸** - 실시간 통신 유틸리티 |
| `const/VIEW_COUNT.ts` | **상수 정의** - 뷰 카운트 관련 상수    |

---

## 📁 타입 정의

| 파일 경로                  | 역할                                    |
| -------------------------- | --------------------------------------- |
| `types/next-auth.d.ts`     | **NextAuth 타입** - 인증 관련 타입 정의 |
| `types/userType.ts`        | **사용자 타입** - 사용자 관련 타입      |
| `types/storyDetailType.ts` | **게시글 타입** - 게시글 관련 타입      |
| `types/tableType.ts`       | **테이블 타입** - 테이블 관련 타입      |

---

## 🎯 주요 특징

### 서버 컴포넌트의 장점

- 🚀 **SEO 최적화**: metadata 설정 가능
- ⚡ **빠른 초기 로딩**: 서버에서 HTML 사전 렌더링
- 📦 **번들 크기 감소**: 클라이언트로 전송되는 JavaScript 최소화

### 클라이언트 컴포넌트의 장점

- 🎭 **인터랙티브한 UI**: 상태 관리, 이벤트 처리
- 🔄 **실시간 업데이트**: React Query, WebSocket 활용
- 💾 **브라우저 API 사용**: localStorage, sessionStorage 등

### 하이브리드 구조

- 서버 컴포넌트(layout.tsx)가 클라이언트 컴포넌트들을 감싸는 구조
- 각 컴포넌트의 특성에 맞는 최적화된 렌더링 방식 적용
- SEO와 사용자 경험을 모두 고려한 균형잡힌 아키텍처
