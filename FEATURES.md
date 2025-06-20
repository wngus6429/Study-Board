# Study-Board 프로젝트 기능 목록

## 📋 프로젝트 개요

- **프론트엔드**: Next.js 14, Material-UI, TanStack React Query, Zustand
- **백엔드**: NestJS 10, TypeORM
- **데이터베이스**: MySQL
- **인증**: NextAuth.js (JWT + Session)
- **상태관리**: Zustand (클라이언트 상태), React Query (서버 상태)

---

## 🔐 인증 및 사용자 관리

### 회원가입/로그인

- ✅ **회원가입**: 이메일, 닉네임, 비밀번호로 가입
- ✅ **로그인**: NextAuth.js 기반 인증 시스템
- ✅ **로그아웃**: 세션 종료 및 쿠키 삭제
- ✅ **중복 이메일 검증**: 가입 시 이메일 중복 체크
- ✅ **자동 로그인**: 회원가입 후 자동 로그인 처리
- ✅ **세션 관리**: JWT + 세션 기반 인증
- ✅ **리프레시 토큰**: 자동 토큰 갱신

### 프로필 관리

- ✅ **프로필 이미지**: 업로드 및 표시
- ✅ **비밀번호 변경**: 기존 비밀번호 확인 후 변경
- ✅ **프로필 조회**: 다른 사용자 프로필 보기
- ✅ **사용자별 게시글**: 특정 사용자가 작성한 글 목록
- ✅ **사용자별 댓글**: 특정 사용자가 작성한 댓글 목록

---

## 📝 게시글 관리

### 게시글 작성

- ✅ **카테고리 선택**: 잡담, 질문, 정보, 리뷰, 스샷, 기타
- ✅ **제목/내용 작성**: 텍스트 에디터
- ✅ **이미지 업로드**: 다중 이미지 업로드 지원
- ✅ **로딩 상태**: 등록 버튼 로딩 표시

### 게시글 조회

- ✅ **목록 보기**: 테이블/카드 형태 전환 가능
- ✅ **카테고리 필터**: 전체, 잡담, 질문, 정보, 리뷰, 스샷, 기타, 건의
- ✅ **정렬 기능**: 추천수, 등록일, 조회수별 정렬
- ✅ **페이지네이션**: 페이지 기반 네비게이션
- ✅ **검색 기능**: 제목/내용 검색
- ✅ **상세 보기**: 게시글 상세 페이지
- ✅ **조회수 표시**: 게시글 조회수 카운트

### 게시글 수정/삭제

- ✅ **게시글 수정**: 작성자만 수정 가능
- ✅ **이미지 수정**: 기존 이미지 삭제/추가
- ✅ **게시글 삭제**: 작성자만 삭제 가능
- ✅ **권한 검증**: URL 직접 접근 차단

---

## 💬 댓글 시스템

### 댓글 작성/관리

- ✅ **댓글 작성**: 게시글에 댓글 달기
- ✅ **대댓글 작성**: 댓글에 답글 달기 (최대 4단계 깊이)
- ✅ **댓글 수정**: 작성자만 수정 가능
- ✅ **댓글 삭제**: 작성자만 삭제 가능 (논리적 삭제)
- ✅ **댓글 수 표시**: 게시글별 댓글 개수 표시
- ✅ **댓글 페이지네이션**: 페이지 기반 댓글 로딩
- ✅ **댓글 하이라이트**: URL 해시 기반 특정 댓글 하이라이트
- ✅ **댓글 스크롤**: 특정 댓글로 자동 스크롤

### 댓글 조회

- ✅ **댓글 페이지네이션**: 댓글 목록 페이지 처리
- ✅ **대댓글 구조**: 계층형 댓글 구조 (최대 4단계)
- ✅ **삭제된 댓글 처리**: 삭제된 댓글 표시 방식
- ✅ **댓글 작성자 표시**: 작성자 프로필 이미지 및 닉네임
- ✅ **댓글 시간 표시**: 작성 시간 표시 (dayjs 사용)

---

## 👍 추천 시스템

### 추천 기능

- ✅ **게시글 추천**: 좋아요/싫어요 기능
- ✅ **추천수 표시**: 실시간 추천수 업데이트
- ✅ **추천수 정렬**: 추천수 기준 정렬
- ✅ **개념글 표시**: 일정 추천수 이상 게시글 HOT 표시
- ✅ **추천 랭킹**: 인기 게시글 별도 관리

---

## 🔔 알림 시스템

### 실시간 알림

- ✅ **댓글 알림**: 내 글에 댓글 달릴 때 알림
- ✅ **대댓글 알림**: 내 댓글에 답글 달릴 때 알림
- ✅ **알림 드롭다운**: 헤더에 알림 아이콘 및 드롭다운
- ✅ **읽지 않은 알림**: 배지로 개수 표시

### 알림 관리

- ✅ **알림 목록**: 전체 알림 페이지
- ✅ **알림 읽음 처리**: 개별/전체 읽음 처리
- ✅ **알림 삭제**: 알림 삭제 기능
- ✅ **알림 페이지네이션**: 알림 목록 페이지 처리
- ✅ **알림 클릭 이동**: 알림 클릭 시 해당 게시글로 이동

---

## 📢 공지사항 시스템

### 공지사항 관리

- ✅ **공지사항 작성**: 관리자 공지사항 작성
- ✅ **공지사항 목록**: 별도 공지사항 페이지
- ✅ **공지사항 표시**: 메인에서 공지 뱃지 표시

---

## 💡 건의사항 시스템

### 건의사항 관리

- ✅ **건의사항 작성**: 건의, 문의, 신고 카테고리
- ✅ **건의사항 목록**: 건의사항 전용 페이지
- ✅ **건의사항 CRUD**: 생성, 조회, 수정, 삭제

---

## 📺 채널 시스템

### 채널 기능

- ✅ **채널 목록**: 카드 형태 채널 목록 페이지
- ✅ **채널 검색**: 채널 이름/설명으로 검색
- ✅ **카테고리 필터**: 기술, 게임, 생활, 여행, 건강, 엔터테인먼트
- ✅ **HOT 채널**: 인기 채널 표시
- ✅ **채널 상세**: 개별 채널 페이지
- ✅ **채널 통계**: 멤버 수, 게시글 수 표시
- ✅ **태그 시스템**: 채널별 태그 표시
- ✅ **구독 기능**: 채널 구독/구독 해제 (UI만)
- ✅ **알림 설정**: 채널 알림 on/off (UI만)

### 채널 내 기능

- ✅ **탭 네비게이션**: 게시글, 공지사항, 채널 정보
- ✅ **채널 게시글**: 채널별 게시글 목록
- ✅ **채널 규칙**: 채널 운영 규칙 표시
- ✅ **운영진 정보**: 채널 운영진 목록

---

## 🎨 UI/UX 기능

### 테마 시스템

- ✅ **다크/라이트 모드**: 테마 전환 기능
- ✅ **네온 스타일**: 다크모드 네온 디자인
- ✅ **반응형 디자인**: 모바일/태블릿/데스크톱 대응
- ✅ **커스텀 테마**: Material-UI 테마 커스터마이징
- ✅ **애니메이션**: 부드러운 전환 효과

### 네비게이션

- ✅ **사이드 메뉴**: 왼쪽 네비게이션 메뉴
- ✅ **상단 바**: 로고, 검색, 알림, 프로필
- ✅ **브레드크럼**: 현재 위치 표시
- ✅ **뒤로가기**: 이전 페이지 상태 유지
- ✅ **모바일 메뉴**: 햄버거 메뉴 및 드로어

### 사용자 경험

- ✅ **로딩 상태**: 스켈레톤/스피너 로딩
- ✅ **에러 처리**: 에러 메시지 및 재시도
- ✅ **무한 스크롤**: 일부 목록에서 무한 스크롤
- ✅ **위로 스크롤**: 페이지 상단 이동 버튼
- ✅ **호버 효과**: 인터랙티브 호버 애니메이션
- ✅ **페이지 전환**: 부드러운 페이지 전환 효과
- ✅ **데이터 캐싱**: React Query 기반 효율적인 데이터 관리

---

## 🔍 검색 및 필터링

### 검색 기능

- ✅ **통합 검색**: 제목/내용 통합 검색
- ✅ **실시간 검색**: 입력 시 즉시 검색
- ✅ **검색 결과 하이라이트**: 검색어 강조 표시

### 필터링 및 정렬

- ✅ **카테고리 필터**: 게시글 카테고리별 필터
- ✅ **정렬 옵션**: 최신순, 추천순, 조회순
- ✅ **URL 상태 관리**: 페이지, 정렬 상태 URL 반영

---

## 📊 데이터 관리

### 캐싱 및 성능

- ✅ **React Query**: 서버 상태 관리 및 캐싱
- ✅ **Optimistic Updates**: 낙관적 업데이트
- ✅ **Background Refetch**: 백그라운드 데이터 갱신
- ✅ **Error Retry**: 실패 시 자동 재시도
- ✅ **keepPreviousData**: 페이지네이션 깜빡임 방지
- ✅ **Stale Time**: 데이터 신선도 관리
- ✅ **Cache Invalidation**: 효율적인 캐시 무효화

### 데이터 최적화

- ✅ **페이지네이션**: 대용량 데이터 페이지 처리
- ✅ **지연 로딩**: 필요 시점에 데이터 로드
- ✅ **데이터 정규화**: 효율적인 데이터 구조
- ✅ **이미지 최적화**: Next.js Image 컴포넌트 활용
- ✅ **코드 스플리팅**: 동적 임포트로 번들 최적화

---

## 🛡️ 보안 및 권한

### 인증/인가

- ✅ **JWT 토큰**: 안전한 토큰 기반 인증
- ✅ **CSRF 보호**: CSRF 토큰 검증
- ✅ **세션 관리**: 안전한 세션 처리
- ✅ **권한 검증**: API 레벨 권한 체크

### 데이터 보안

- ✅ **입력 검증**: 클라이언트/서버 입력 검증
- ✅ **XSS 방지**: 사용자 입력 이스케이프
- ✅ **CORS 설정**: 적절한 CORS 정책

---

## 🚀 개발 도구 및 최적화

### 개발 환경

- ✅ **TypeScript**: 타입 안전성
- ✅ **ESLint/Prettier**: 코드 품질 관리
- ✅ **Hot Reload**: 개발 시 실시간 업데이트

### 성능 최적화

- ✅ **이미지 최적화**: Next.js Image 컴포넌트
- ✅ **코드 스플리팅**: 동적 임포트
- ✅ **번들 최적화**: 웹팩 최적화 설정

---

## 📱 반응형 및 접근성

### 반응형 디자인

- ✅ **모바일 최적화**: 터치 친화적 인터페이스
- ✅ **태블릿 지원**: 중간 화면 크기 대응
- ✅ **데스크톱 최적화**: 큰 화면 활용

### 접근성

- ✅ **키보드 네비게이션**: 키보드만으로 조작 가능
- ✅ **스크린 리더**: 시각 장애인 지원
- ✅ **색상 대비**: 충분한 색상 대비율

---

## 🔧 관리자 기능

### 슈퍼 관리자

- ✅ **관리자 권한**: 슈퍼 관리자 기능 구현
- ✅ **공지사항 관리**: 공지사항 작성/수정/삭제
- ✅ **사용자 관리**: 사용자 권한 관리

---

## 📈 통계 및 분석

### 게시글 통계

- ✅ **조회수 추적**: 게시글별 조회수
- ✅ **추천수 집계**: 실시간 추천수 계산
- ✅ **댓글 수 집계**: 게시글별 댓글 수

### 사용자 활동

- ✅ **작성 글 수**: 사용자별 작성 글 통계
- ✅ **댓글 수**: 사용자별 댓글 통계
- ✅ **활동 기록**: 사용자 활동 추적

---

## 🎯 향후 개발 예정 기능

### 채널 시스템 확장

- 🔄 **실제 구독 기능**: DB 연동 구독 시스템
- 🔄 **채널 생성**: 사용자가 직접 채널 생성
- 🔄 **채널 관리**: 채널 운영진 권한 시스템
- 🔄 **채널 통계**: 채널별 활동 통계
- 🔄 **채널 검색**: 고급 검색 필터링

### 고급 기능

- 🔄 **실시간 채팅**: WebSocket 기반 실시간 채팅
- 🔄 **파일 업로드**: 이미지 외 파일 업로드
- 🔄 **멘션 시스템**: @사용자명 멘션 기능
- 🔄 **태그 시스템**: 게시글 태그 기능
- 🔄 **북마크**: 게시글 북마크 기능
- 🔄 **공유 기능**: 소셜 미디어 공유

### 성능 개선

- 🔄 **무한 스크롤**: 전체 목록 무한 스크롤
- 🔄 **이미지 압축**: 자동 이미지 최적화
- 🔄 **CDN 연동**: 정적 파일 CDN 서빙
- 🔄 **서버 사이드 렌더링**: SEO 최적화
- 🔄 **프리페칭**: 데이터 프리페칭

---

## 📝 기술 스택 상세

### Frontend

- **Framework**: Next.js 14 (App Router)
- **UI Library**: Material-UI (MUI)
- **State Management**: TanStack React Query, Zustand
- **Authentication**: NextAuth.js
- **Styling**: CSS Modules, Emotion
- **Language**: TypeScript

### Backend

- **Framework**: NestJS 10
- **ORM**: TypeORM
- **Database**: MySQL
- **Authentication**: JWT, Passport
- **Validation**: class-validator
- **Documentation**: Swagger

### DevOps & Tools

- **Version Control**: Git
- **Package Manager**: npm
- **Code Quality**: ESLint, Prettier
- **Development**: Hot Reload, TypeScript

---

_마지막 업데이트: 2024년 3월_
