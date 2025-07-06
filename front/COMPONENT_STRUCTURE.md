# Next.js 프론트엔드 컴포넌트 구조 분석 (최신화)

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

### 🎨 CSS 및 정적 파일들

- `app/globals.css` - 전역 스타일
- `app/layout.module.css` - 레이아웃 스타일
- `app/page.module.css` - 메인 페이지 스타일
- `app/components/style/*.module.css` - 컴포넌트별 CSS 모듈
- `app/components/HtmlTable.module.css` - HTML 테이블 스타일
- `app/components/common/Pagination.module.css` - 페이지네이션 스타일
- `app/favicon.ico`, `app/icon.png` - 파비콘 및 아이콘
- `app/fonts/` - 폰트 파일들

### 🎨 UI 컴포넌트 (서버 컴포넌트)

| 파일 경로                  | 역할                                                |
| -------------------------- | --------------------------------------------------- |
| `components/ImageCard.tsx` | **이미지 카드** - 이미지 표시 카드                  |
| `components/VideoCard.tsx` | **비디오 카드** - 비디오 표시 카드                  |
| `components/HtmlTable.tsx` | **HTML 테이블** - 범용 HTML 테이블 컴포넌트         |
| `app/loading.tsx`          | **로딩 페이지** - 전역 로딩 상태 표시               |
| `app/not-found.tsx`        | **404 에러 페이지** - 페이지를 찾을 수 없을 때 표시 |

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

| 파일 경로                                              | 역할                                                       |
| ------------------------------------------------------ | ---------------------------------------------------------- |
| `(noLogin)/channels/page.tsx`                          | **채널 목록 페이지** - 모든 채널 표시                      |
| `(noLogin)/channels/ChannelsClient.tsx`                | **채널 목록 클라이언트** - 채널 목록 인터랙션 처리         |
| `(noLogin)/channels/[slug]/page.tsx`                   | **채널 상세 페이지** - 특정 채널의 게시글 목록             |
| `(noLogin)/channels/[slug]/ChannelsDetailClient.tsx`   | **채널 상세 클라이언트** - 채널 상세 인터랙션 처리 (995줄) |
| `(noLogin)/channels/[slug]/detail/story/[id]/page.tsx` | **게시글 상세 페이지** - 게시글 내용 및 댓글 (1269줄)      |
| `(noLogin)/channels/backup/page.tsx`                   | **채널 백업 페이지** - 채널 목록 백업 버전 (주석 처리)     |
| `(noLogin)/channel-notifications/page.tsx`             | **채널 알림 설정 페이지** - 채널별 알림 구독 관리          |
| `(noLogin)/notice/[id]/page.tsx`                       | **공지사항 상세 페이지** - 공지사항 내용                   |
| `(noLogin)/profile/[username]/page.tsx`                | **사용자 프로필 페이지** - 다른 사용자의 프로필 및 작성글  |

#### ✏️ 글 작성/수정 페이지

| 파일 경로                                                      | 역할                                                     |
| -------------------------------------------------------------- | -------------------------------------------------------- |
| `(afterLogin)/write/story/page.tsx`                            | **게시글 작성 페이지** - 새 게시글 작성 폼               |
| `(afterLogin)/write/suggestion/page.tsx`                       | **건의사항 작성 페이지** - 새 건의사항 작성 폼           |
| `(afterLogin)/write/notice/page.tsx`                           | **공지사항 작성 페이지** - 새 공지사항 작성 폼           |
| `(afterLogin)/edit/story/[id]/page.tsx`                        | **게시글 수정 페이지** - 기존 게시글 수정 폼             |
| `(afterLogin)/edit/suggestion/[id]/page.tsx`                   | **건의사항 수정 페이지** - 기존 건의사항 수정 폼         |
| `(afterLogin)/channels/[slug]/detail/suggestion/[id]/page.tsx` | **건의사항 상세 페이지** - 로그인 사용자용 건의사항 상세 |

#### 👤 사용자 기능 페이지

| 파일 경로                               | 역할                                                     |
| --------------------------------------- | -------------------------------------------------------- |
| `(afterLogin)/setting/profile/page.tsx` | **프로필 설정 페이지** - 개인정보 수정, 작성글/댓글 관리 |
| `(afterLogin)/messages/page.tsx`        | **메시지 페이지** - 개인 메시지 관리                     |
| `(afterLogin)/notifications/page.tsx`   | **알림 페이지** - 알림 목록 관리                         |
| `(afterLogin)/scraps/page.tsx`          | **스크랩 페이지** - 스크랩한 게시글 목록                 |
| `(afterLogin)/recent-views/page.tsx`    | **최근 본 글 페이지** - 최근 조회한 게시글 목록          |
| `(afterLogin)/blinds/page.tsx`          | **블라인드 페이지** - 블라인드 처리된 게시글 관리        |
| `(afterLogin)/reports/page.tsx`         | **신고 관리 페이지** - 신고 목록 및 관리 (관리자용)      |

### 🧩 공통 컴포넌트들

#### 🏗️ 레이아웃 컴포넌트

| 파일 경로                   | 역할                                   |
| --------------------------- | -------------------------------------- |
| `components/TopBar.tsx`     | **상단 바** - 로고, 검색, 사용자 메뉴  |
| `components/NavMenuBar.tsx` | **네비게이션 메뉴** - 사이드바 메뉴    |
| `components/NavBar.tsx`     | **하단 네비게이션** - 모바일용 하단 바 |

#### 🔧 Provider 컴포넌트

| 파일 경로                                      | 역할                                                   |
| ---------------------------------------------- | ------------------------------------------------------ |
| `components/Provider/RQProvider.tsx`           | **React Query 프로바이더** - 데이터 fetching 상태 관리 |
| `components/Provider/ThemeProvider.tsx`        | **테마 프로바이더** - 다크/라이트 모드 제공            |
| `components/Provider/AuthSessionCom.tsx`       | **세션 관리** - NextAuth 세션 프로바이더               |
| `components/Provider/SitePasswordGate.tsx`     | **사이트 비밀번호 게이트** - 사이트 접근 제한          |
| `components/Provider/SubscriptionProvider.tsx` | **구독 프로바이더** - 알림 구독 관리                   |
| `components/Provider/BrowserNotification.tsx`  | **브라우저 알림** - 웹 푸시 알림                       |

#### 🎛️ 기능성 컴포넌트

| 파일 경로                        | 역할                                         |
| -------------------------------- | -------------------------------------------- |
| `components/DarkModeToggle.tsx`  | **다크모드 토글** - 테마 전환 버튼           |
| `components/RecommendButton.tsx` | **추천 버튼** - 게시글 추천/비추천 버튼      |
| `components/BlindWrapper.tsx`    | **블라인드 래퍼** - 블라인드 처리 컨테이너   |
| `components/BlindedContent.tsx`  | **블라인드 콘텐츠** - 블라인드 처리된 콘텐츠 |

#### 🔔 알림 및 드롭다운

| 파일 경로                                    | 역할                                      |
| -------------------------------------------- | ----------------------------------------- |
| `components/NotificationDropdown.tsx`        | **알림 드롭다운** - 실시간 알림 목록      |
| `components/NoticesDropdown.tsx`             | **공지사항 드롭다운** - 공지사항 목록     |
| `components/ChannelNotificationDropdown.tsx` | **채널 알림 드롭다운** - 채널별 알림 설정 |

#### 📊 테이블 컴포넌트

| 파일 경로                                           | 역할                                                        |
| --------------------------------------------------- | ----------------------------------------------------------- |
| `components/table/CustomizedTables.tsx`             | **기본 테이블** - 게시글 목록 테이블                        |
| `components/table/CustomizedCardView.tsx`           | **카드 뷰 테이블** - 카드 형태 게시글 목록 (다크 테마 개선) |
| `components/table/CustomizedSuggestionTable.tsx`    | **건의사항 테이블** - 건의사항 목록 테이블                  |
| `components/table/CustomizedUserStoryTables.tsx`    | **사용자 게시글 테이블** - 프로필 페이지용 게시글 테이블    |
| `components/table/CustomizedUserCommentsTables.tsx` | **사용자 댓글 테이블** - 프로필 페이지용 댓글 테이블        |

#### 🎛️ 공통 UI 컴포넌트

| 파일 경로                                  | 역할                                                   |
| ------------------------------------------ | ------------------------------------------------------ |
| `components/common/Loading.tsx`            | **로딩 컴포넌트** - 데이터 로딩 시 표시                |
| `components/common/ErrorView.tsx`          | **에러 뷰** - 에러 상황 표시                           |
| `components/common/Pagination.tsx`         | **페이지네이션** - 페이지 이동 컨트롤                  |
| `components/common/ProfilePagination.tsx`  | **프로필 페이지네이션** - 프로필 페이지용 페이지네이션 |
| `components/common/SearchBar.tsx`          | **검색 바** - 게시글 검색 기능                         |
| `components/common/ScrollUpButton.tsx`     | **상단 이동 버튼** - 페이지 최상단으로 스크롤          |
| `components/common/RightView.tsx`          | **우측 뷰** - 우측 사이드바 컨텐츠                     |
| `components/common/ChannelTopStories.tsx`  | **채널 인기 게시글** - 채널별 인기 게시글 표시         |
| `components/common/Advertisement.tsx`      | **광고 컴포넌트** - 광고 표시 영역                     |
| `components/common/CommentsView.tsx`       | **댓글 뷰** - 댓글 목록 및 작성 폼                     |
| `components/common/ConfirmDialog.tsx`      | **확인 다이얼로그** - 확인/취소 다이얼로그             |
| `components/common/ConfirmModal.tsx`       | **확인 모달** - 모달 형태 확인 창                      |
| `components/common/CustomSelect.tsx`       | **커스텀 셀렉트** - 커스텀 드롭다운 선택 컴포넌트      |
| `components/common/CustomSnackBar.tsx`     | **커스텀 스낵바** - 알림 메시지 표시                   |
| `components/common/InputFileUpload.tsx`    | **파일 업로드** - 파일 업로드 입력 컴포넌트            |
| `components/common/RichTextEditor.tsx`     | **리치 텍스트 에디터** - 게시글 작성용 에디터          |
| `components/common/SendMessageModal.tsx`   | **메시지 전송 모달** - 쪽지 전송 모달                  |
| `components/common/UserMenuPopover.tsx`    | **사용자 메뉴 팝오버** - 사용자 메뉴 드롭다운          |
| `components/common/MessageView.tsx`        | **메시지 뷰** - 개인 메시지 표시                       |
| `components/common/ReportModal.tsx`        | **신고 모달** - 게시글/댓글 신고 모달                  |
| `components/common/ChannelNoticeModal.tsx` | **채널 공지 모달** - 채널 공지사항 모달                |

#### 🏗️ 다이얼로그 컴포넌트

| 파일 경로                                                    | 역할                                                    |
| ------------------------------------------------------------ | ------------------------------------------------------- |
| `components/common/ChannelDialog/CreateChannelDialog.tsx`    | **채널 생성 다이얼로그** - 새 채널 생성 모달            |
| `components/common/ChannelDialog/EditChannelImageDialog.tsx` | **채널 이미지 편집 다이얼로그** - 채널 이미지 수정 모달 |

#### 💬 채팅 및 메시지

| 파일 경로                         | 역할                                  |
| --------------------------------- | ------------------------------------- |
| `components/chat/ChannelChat.tsx` | **채널 채팅** - 실시간 채널 채팅 기능 |

#### 💾 백업 컴포넌트

| 파일 경로                                    | 역할                                                      |
| -------------------------------------------- | --------------------------------------------------------- |
| `components/BackUp/MainView.backup.tsx`      | **메인 뷰 백업** - 메인 뷰 백업 버전 (주석 처리)          |
| `components/BackUp/MainViewClientBackUp.tsx` | **메인 뷰 클라이언트 백업** - 클라이언트 백업 (주석 처리) |

### 🎯 채널 상세 페이지 - 분리된 컴포넌트들

> **2024년 12월 업데이트**: 채널 상세 페이지 (ChannelsDetailClient.tsx)를 4개의 독립적인 컴포넌트로 분리하여 **코드 가독성 52.6% 향상** (2074줄 → 995줄)

#### 📂 `(noLogin)/channels/[slug]/components/`

| 파일 경로                                                       | 역할                                                              | 줄 수 |
| --------------------------------------------------------------- | ----------------------------------------------------------------- | ----- |
| `(noLogin)/channels/[slug]/components/ChannelHeader.tsx`        | **채널 헤더** - 채널 정보, 아바타, 생성자 정보 표시               | 226   |
| `(noLogin)/channels/[slug]/components/ChannelActionButtons.tsx` | **채널 액션 버튼** - 실시간 채팅, 공지사항, 구독, 알림 토글 버튼  | 339   |
| `(noLogin)/channels/[slug]/components/ChannelTabNavigation.tsx` | **채널 탭 네비게이션** - 탭 전환, 뷰 모드 토글, 글쓰기 버튼       | 351   |
| `(noLogin)/channels/[slug]/components/ChannelControlPanel.tsx`  | **채널 컨트롤 패널** - 정렬 옵션, 추천 랭킹, 페이지네이션, 검색바 | 327   |

#### 📂 `(noLogin)/channels/[slug]/detail/story/[id]/components/`

| 파일 경로                                                                 | 역할                                                               | 줄 수 |
| ------------------------------------------------------------------------- | ------------------------------------------------------------------ | ----- |
| `(noLogin)/channels/[slug]/detail/story/[id]/components/ImageViewer.tsx`  | **이미지 뷰어** - 이미지 확대/축소, 드래그, 키보드 네비게이션 기능 | 357   |
| `(noLogin)/channels/[slug]/detail/story/[id]/components/StoryActions.tsx` | **스토리 액션** - 스크랩, 신고, 수정, 삭제, 관리자 삭제 버튼       | 363   |

#### 🎨 스타일 컴포넌트

| 파일 경로                                  | 역할                                                   |
| ------------------------------------------ | ------------------------------------------------------ |
| `(noLogin)/channels/[slug]/components.tsx` | **공통 스타일 컴포넌트** - 메탈릭 스타일 컴포넌트 모음 |
| `(noLogin)/channels/[slug]/styles.ts`      | **스타일 정의** - 그라데이션, 메탈릭 스타일 함수 모음  |

### 실제 사용 중인 클라이언트 컴포넌트들

대부분의 페이지와 인터랙티브 컴포넌트들이 클라이언트 컴포넌트로 구성되어 있으며, 다음과 같은 특징을 가집니다:

- **상태 관리**: React Hook, Zustand 상태 관리 라이브러리 사용
- **데이터 페칭**: React Query (TanStack Query) 사용
- **실시간 기능**: WebSocket, Server-Sent Events 활용
- **UI 인터랙션**: Material-UI 컴포넌트 활용한 복잡한 인터랙션

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

---

## 🔄 최신 업데이트 (2025년 7월)

### 🎯 주요 개선 사항

#### 1. 채널 상세 페이지 컴포넌트 분리 (2024년 12월)

- **목적**: 가독성 향상 및 유지보수성 개선
- **성과**: 2074줄 → 995줄 (52.6% 감소)
- **분리 컴포넌트**: 4개의 독립적인 컴포넌트로 분리
- **효과**: 초보자도 이해하기 쉬운 구조로 개선

#### 2. 게시글 상세 페이지 컴포넌트 분리 (2025년 7월)

- **목적**: 복잡한 기능의 모듈화 및 재사용성 향상
- **분리된 컴포넌트**:
  - `ImageViewer.tsx` (357줄): 이미지 확대/축소, 드래그, 키보드 네비게이션
  - `StoryActions.tsx` (363줄): 스크랩, 신고, 수정, 삭제, 관리자 기능
- **효과**: 기능별 분리로 유지보수성 향상, 코드 재사용성 증대

#### 3. 다크 테마 UI 개선 (2024년 12월)

- **대상**: `CustomizedCardView.tsx` 컴포넌트
- **개선점**: 다크 모드에서 보라색 그라데이션 적용
- **효과**: 일관된 다크 테마 경험 제공

#### 4. 채널 알림 시스템 개선 (2024년 12월)

- **문제**: 프론트엔드와 백엔드 알림 상태 비동기화
- **해결**: 실시간 상태 동기화 및 에러 처리 개선
- **효과**: 사용자 친화적인 알림 관리 시스템 구축

### 새로 추가된 기능

- ✅ **관리자 신고 관리**: 신고 목록 조회 및 처리 시스템
- ✅ **채널 관리 시스템**: 채널 생성, 이미지 업로드, 구독 관리
- ✅ **채널 알림 시스템**: 채널별 알림 구독 관리 페이지 및 컴포넌트
- ✅ **고급 이미지 뷰어**: 확대/축소, 드래그, 키보드 네비게이션 기능
- ✅ **스토리 액션 시스템**: 스크랩, 신고, 수정, 삭제, 관리자 기능 통합
- ✅ **스크랩 기능**: 게시글 스크랩 및 관리 시스템
- ✅ **최근 조회 기능**: 최근 본 글 추적 및 표시
- ✅ **실시간 채널 채팅**: WebSocket 기반 채널 내 실시간 채팅
- ✅ **건의사항 시스템**: 채널별 건의사항 작성 및 관리
- ✅ **리치 텍스트 에디터**: 게시글 작성용 고급 에디터
- ✅ **파일 업로드**: 이미지/동영상 첨부 기능
- ✅ **브라우저 알림**: 웹 푸시 알림 지원

### 개선된 기능

- 🔧 **상태 관리 확장**: 12개의 전문화된 Zustand 스토어
- 🔧 **API 모듈화**: 기능별 API 모듈 분리 및 관리자 API 추가
- 🔧 **컴포넌트 세분화**: 재사용 가능한 공통 컴포넌트 확장
- 🔧 **타입 안전성**: TypeScript 타입 정의 강화
- 🔧 **UI/UX 개선**: 다크모드, 반응형 디자인 지원
- 🔧 **채널 시스템**: 채널 중심의 아키텍처로 개선

### 아키텍처 개선사항

- 🏗️ **클라이언트 컴포넌트 분리**: 페이지별 Client 컴포넌트 분리로 성능 최적화
- 🏗️ **Provider 패턴**: 다양한 Provider 컴포넌트로 관심사 분리
- 🏗️ **모듈화**: 기능별 모듈 분리로 유지보수성 향상
- 🏗️ **컴포넌트 재사용성**: 독립적인 컴포넌트 분리로 재사용 가능한 구조 구축

---

## 📊 파일 크기 현황

### 📏 주요 페이지 컴포넌트 크기

| 파일명                       | 줄 수   | 상태          | 비고                                     |
| ---------------------------- | ------- | ------------- | ---------------------------------------- |
| `detail/story/[id]/page.tsx` | 1,269줄 | **분리 진행** | 게시글 상세 페이지 (2개 컴포넌트 분리됨) |
| `ChannelsDetailClient.tsx`   | 995줄   | **개선됨**    | 52.6% 감소 (2074→995)                    |
| `MainView.tsx`               | 789줄   | **주석 처리** | 대부분 주석 처리됨                       |
| `ImageViewer.tsx`            | 357줄   | **분리됨**    | 게시글 상세에서 분리된 이미지 뷰어       |
| `StoryActions.tsx`           | 363줄   | **분리됨**    | 게시글 상세에서 분리된 액션 버튼         |
| `CustomizedTables.tsx`       | 257줄   | **적정**      | 기본 테이블 컴포넌트                     |

### 📈 컴포넌트 분리 성과

- **채널 상세 페이지**: 2074줄 → 995줄 (52.6% 감소)
- **게시글 상세 페이지**: 1269줄 + 분리된 컴포넌트 2개 (720줄)
  - ImageViewer.tsx: 357줄 (이미지 뷰어 기능)
  - StoryActions.tsx: 363줄 (액션 버튼 기능)
- **분리된 컴포넌트**: 총 6개의 독립적인 컴포넌트 (226~363줄)
- **유지보수성**: 기능별 분리로 수정 용이성 증대
- **가독성**: 초보자도 이해하기 쉬운 구조
- **재사용성**: 독립적인 컴포넌트로 다른 페이지에서도 활용 가능

---

## 📞 지원 및 문의

이 문서에 대한 질문이나 개선 사항이 있으시면 개발팀에 문의해 주세요.

**개발팀**: StudyBoard Team  
**프로젝트**: Study Board Frontend Components  
**버전**: 2.3.0  
**마지막 업데이트**: 2025년 7월 6일

---

_이 문서는 Study Board 프론트엔드 시스템의 전체적인 컴포넌트 구조와 기능을 설명합니다. 개발 과정에서 지속적으로 업데이트됩니다._
