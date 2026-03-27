# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Study-Board는 Next.js 14 프론트엔드 + NestJS 10 백엔드로 구성된 풀스택 커뮤니티 플랫폼이다. 실시간 채팅, 블라인드 시스템, 채널 구독, 신고 처리 등의 기능을 포함한다.

## Development Commands

### Frontend (`front/`)
```bash
npm run dev          # 개발 서버 (port 3000)
npm run build        # 프로덕션 빌드
npm run start        # 프로덕션 서버
npm run lint         # ESLint
```

### Backend (`back/`)
```bash
npm run start:dev    # Watch 모드 개발 서버 (port 8888)
npm run build        # dist/ 로 컴파일
npm run start:prod   # 프로덕션 실행
npm run lint         # ESLint + auto-fix
npm run format       # Prettier 포맷팅
npm run test         # Jest 단위 테스트
npm run test:cov     # 커버리지 리포트
npm run test:e2e     # E2E 테스트
```

### Setup
```bash
cd front && npm install
cd back && npm install
```
프론트와 백엔드는 별도의 package.json을 가지며, 각각 독립적으로 설치한다.

## Architecture

### 모노레포 구조 (워크스페이스 없음)
- `front/` — Next.js 14 (App Router), MUI v6, TypeScript
- `back/` — NestJS 10, TypeORM 0.3, MySQL, TypeScript

### 프론트엔드 라우팅 그룹
- `(beforeLogin)/` — 로그인/회원가입 페이지
- `(afterLogin)/` — 인증 필요 페이지 (글쓰기, 메시지, 알림, 설정 등)
- `(noLogin)/` — 인증 불필요 페이지 (채널, 프로필, 공지)

### 상태 관리 이중 구조
- **React Query (TanStack)**: 서버 상태 — API 데이터 캐싱, prefetch, optimistic update
- **Zustand**: 클라이언트 상태 — 12개 도메인별 스토어 (`src/app/store/`)

### 인증 흐름
NextAuth.js (프론트) → JWT 쿠키 → Passport.js + JWT Strategy (백엔드)
- Guards: `AuthGuard()`, `AdminGuard`, `LoggedInGuard`
- NextAuth 설정: `front/src/pages/api/auth/[...nextauth].ts`

### 백엔드 모듈 구조
NestJS의 모듈 기반 아키텍처. 각 모듈은 controller/service/module/dto로 구성된다.
- `board/` 모듈만 클린 아키텍처(Ports & Adapters) 패턴으로 `core/`(도메인)와 `infrastructure/`로 분리되어 있다.
- 엔티티는 `entities/` 디렉토리에 중앙 관리 (20개)

### 실시간 통신
Socket.IO — `channel-chat` 모듈의 Gateway에서 처리. `back/src/main.ts`에서 커스텀 IoAdapter 설정.

### 파일 업로드
- 개발: 로컬 디스크 (`upload/` 하위 5개 디렉토리)
- 프로덕션: AWS S3 (multer-s3)
- Next.js rewrites로 `/upload`, `/userUpload` 등을 백엔드로 프록시

### API 구조
- 프론트 API 함수: `front/src/app/api/` (Next.js API routes가 아닌 axios 래퍼)
- 백엔드 Swagger: `/api` 엔드포인트
- 프론트 → 백엔드 base URL: `NEXT_PUBLIC_BASE_URL` (기본 `http://localhost:8888`)

## Coding Conventions

### 명명 규칙
- 변수/함수: camelCase, 상수: UPPER_SNAKE_CASE
- React 컴포넌트: PascalCase, `function` 선언 + default export
- 유틸/API 함수: 화살표 함수 + named export
- Boolean: `is`, `has`, `can`, `should` 접두사
- 백엔드 파일: kebab-case (`channel-chat.controller.ts`)
- 엔티티: PascalCase (`ChannelChatMessage.entity.ts`)

### 문자열
- 프론트엔드: 더블 쿼트 사용
- 백엔드: 싱글 쿼트 사용 (Prettier 설정: `singleQuote: true`)

### Import 순서
1. React/외부 라이브러리
2. 내부 컴포넌트/유틸 (`@/` alias)
3. 타입 (`import type`)
4. 스타일 (CSS modules)

### Path Alias
- 프론트엔드: `@/*` → `./src/*`
