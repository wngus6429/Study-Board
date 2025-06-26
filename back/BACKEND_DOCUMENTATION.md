# 📚 Study Board 백엔드 API 문서

## 🏗️ 프로젝트 개요

Study Board는 학습 커뮤니티를 위한 종합 플랫폼으로, 게시글 작성, 실시간 채팅, 채널 구독, 알림 시스템 등 다양한 기능을 제공하는 NestJS 기반의 백엔드 서버입니다.

### 🎯 주요 특징

- 📝 **게시글 시스템**: CRUD, 검색, 추천/비추천, 이미지/동영상 첨부
- 🏢 **채널 시스템**: 채널 생성/관리, 구독, 채널별 게시글, 슬러그 기반 라우팅
- 💬 **실시간 채팅**: WebSocket 기반 채널 내 실시간 커뮤니케이션
- 🔔 **알림 시스템**: 게시글, 댓글, 쪽지, 채널 등 실시간 알림
- 👤 **사용자 관리**: 회원가입/로그인, 프로필 관리, 프로필 이미지
- 📨 **쪽지 시스템**: 1:1 개인 메시지, 읽음 상태 관리
- 🛡️ **콘텐츠 관리**: 신고, 블라인드 처리
- 📌 **스크랩 기능**: 게시글 북마크
- 💡 **건의사항**: 채널별 사이트 개선 피드백
- 📢 **공지사항**: 관리자 공지사항 시스템

---

## 🔧 기술 스택

### 🏛️ 프레임워크 & 언어

- **NestJS** 10.0+ - Node.js 백엔드 프레임워크
- **TypeScript** 5.1+ - 정적 타입 언어
- **Node.js** 20+ - JavaScript 런타임

### 🗄️ 데이터베이스

- **MySQL** 8.0+ - 관계형 데이터베이스
- **TypeORM** 0.3+ - ORM (Object-Relational Mapping)

### 🔌 실시간 통신

- **Socket.IO** 4.8+ - WebSocket 기반 실시간 통신
- **@nestjs/websockets** - NestJS WebSocket 모듈

### 🔐 인증 & 보안

- **Passport** - 인증 미들웨어
- **bcryptjs** - 비밀번호 암호화
- **express-session** - 세션 기반 인증
- **cookie-parser** - 쿠키 파싱

### 📁 파일 처리

- **Multer** - 파일 업로드 처리
- **@nestjs/serve-static** - 정적 파일 서빙

### 📖 API 문서화

- **Swagger** (@nestjs/swagger) - API 자동 문서화

### ✅ 검증 & 변환

- **class-validator** - DTO 검증
- **class-transformer** - 객체 변환

---

## 🏛️ 시스템 아키텍처

```
┌─────────────────────────────────────────────────────────────┐
│                       Frontend (Next.js)                   │
│                    http://localhost:3000                    │
└─────────────────────┬───────────────────────────────────────┘
                      │ HTTP/WebSocket
┌─────────────────────▼───────────────────────────────────────┐
│                   Backend (NestJS)                         │
│                 http://localhost:9999                      │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │ Controllers │  │  Services   │  │  Guards &   │        │
│  │   (API)     │  │ (Business)  │  │ Middleware  │        │
│  └─────────────┘  └─────────────┘  └─────────────┘        │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │   TypeORM   │  │  Socket.IO  │  │   Static    │        │
│  │  (Database) │  │ (Real-time) │  │ File Server │        │
│  └─────────────┘  └─────────────┘  └─────────────┘        │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│                   MySQL Database                           │
│                 board-study (DB명)                         │
└─────────────────────────────────────────────────────────────┘
```

---

## 📂 프로젝트 구조

```
back/
├── src/
│   ├── auth/                    # 🔐 인증/인가 모듈
│   ├── users/                   # 👤 사용자 관리 모듈
│   ├── story/                   # 📝 게시글 모듈
│   ├── comment/                 # 💬 댓글 모듈
│   ├── channels/                # 🏢 채널 관리 모듈
│   ├── channel-chat/            # 💬 실시간 채팅 모듈
│   ├── channel-notification/    # 🔔 채널 알림 모듈
│   ├── notification/            # 🔔 일반 알림 모듈
│   ├── messages/                # 📨 쪽지 모듈
│   ├── scrap/                   # 📌 스크랩 모듈
│   ├── blind/                   # 🛡️ 신고/블라인드 모듈
│   ├── suggestion/              # 💡 건의사항 모듈
│   ├── entities/                # 🗄️ 데이터베이스 엔티티
│   ├── common/                  # 🔧 공통 유틸리티
│   ├── constants/               # 📋 상수 정의
│   ├── migrations/              # 🔄 DB 마이그레이션
│   ├── app.module.ts            # 🏗️ 루트 모듈
│   ├── main.ts                  # 🚀 애플리케이션 진입점
│   └── httpException.Filter.ts  # ⚠️ 전역 예외 필터
├── upload/                      # 📁 게시글 이미지 업로드
├── userUpload/                  # 📁 사용자 프로필 이미지
├── channelUpload/               # 📁 채널 이미지
├── suggestionUpload/            # 📁 건의사항 이미지
├── test/                        # 🧪 테스트 파일
├── dist/                        # 📦 빌드 결과물
├── package.json                 # 📋 프로젝트 설정
└── tsconfig.json               # ⚙️ TypeScript 설정
```

---

## 📋 모듈별 상세 기능

### 🔐 Auth Module (인증/인가)

**경로**: `/src/auth/`
**주요 기능**:

- 회원가입/로그인 (세션 기반)
- 비밀번호 암호화 (bcrypt)
- 사용자 인증 가드
- 세션 관리
- 자동 로그인 처리

**주요 API**:

- `POST /auth/signup` - 회원가입
- `POST /auth/signin` - 로그인
- `POST /auth/logout` - 로그아웃
- `GET /auth/me` - 현재 사용자 정보
- `PUT /auth/updatePassword` - 비밀번호 변경

---

### 👤 Users Module (사용자 관리)

**경로**: `/src/users/`
**주요 기능**:

- 사용자 프로필 관리
- 프로필 이미지 업로드
- 사용자 정보 수정
- 사용자 검색
- 사용자별 게시글/댓글 조회

**주요 API**:

- `GET /users/profile/:username` - 사용자 프로필 조회
- `PUT /users/profile` - 프로필 수정
- `POST /users/upload-avatar` - 프로필 이미지 업로드
- `GET /users/:userId/stories` - 사용자 작성 게시글
- `GET /users/:userId/comments` - 사용자 작성 댓글

---

### 📝 Story Module (게시글)

**경로**: `/src/story/`
**주요 기능**:

- 게시글 CRUD (생성, 조회, 수정, 삭제)
- 다중 이미지/동영상 업로드
- 검색 기능 (제목, 내용, 작성자)
- 추천/비추천 시스템
- 카테고리별 분류 (잡담, 질문, 정보, 리뷰, 스샷, 기타)
- 채널별 게시글 필터링
- 공지사항 관리
- 조회수 카운팅
- 추천 랭킹 시스템

**주요 API**:

- `GET /api/story/pageTableData` - 테이블 형태 게시글 목록
- `GET /api/story/cardPageTableData` - 카드 형태 게시글 목록
- `GET /api/story/search` - 게시글 검색
- `GET /api/story/cardSearch` - 카드 형태 게시글 검색
- `GET /api/story/detail/:id` - 게시글 상세 조회
- `GET /api/story/detail/edit/:id` - 게시글 수정용 데이터 조회
- `POST /api/story/create` - 게시글 작성
- `POST /api/story/update/:id` - 게시글 수정
- `DELETE /api/story/:id` - 게시글 삭제
- `PUT /api/story/likeOrUnlike/:id` - 추천/비추천
- `GET /api/story/notices` - 공지사항 목록

---

### 💬 Comment Module (댓글)

**경로**: `/src/comment/`
**주요 기능**:

- 댓글 CRUD
- 대댓글 (계층형 구조, 최대 4단계)
- 댓글 추천/비추천
- 소프트 삭제
- 페이지네이션
- 댓글 수 카운팅

**주요 API**:

- `GET /api/comment/:storyId` - 게시글 댓글 목록
- `POST /api/comment` - 댓글 작성
- `PUT /api/comment/:id` - 댓글 수정
- `DELETE /api/comment/:id` - 댓글 삭제
- `PUT /api/comment/likeOrUnlike/:id` - 댓글 추천/비추천

---

### 🏢 Channels Module (채널 관리)

**경로**: `/src/channels/`
**주요 기능**:

- 채널 생성 및 관리
- 채널 구독/구독취소
- 채널별 게시글 통계
- 슬러그 기반 URL 라우팅
- 채널 이미지 업로드
- 채널 검색 및 카테고리 필터링
- HOT 채널 표시

**주요 API**:

- `GET /api/channels` - 채널 목록
- `POST /api/channels` - 채널 생성
- `GET /api/channels/slug/:slug` - 슬러그로 채널 조회
- `GET /api/channels/:id` - 채널 상세 정보
- `POST /api/channels/:id/subscribe` - 채널 구독
- `DELETE /api/channels/:id/subscribe` - 구독 취소

---

### 💬 Channel Chat Module (실시간 채팅)

**경로**: `/src/channel-chat/`
**주요 기능**:

- WebSocket 기반 실시간 채팅
- 채널별 채팅방
- 온라인 사용자 표시
- 타이핑 인디케이터
- 채팅 메시지 저장 및 조회
- 채팅 기록 관리

**WebSocket 이벤트**:

- `join-channel` - 채널 입장
- `leave-channel` - 채널 퇴장
- `send-message` - 메시지 전송
- `typing-start` - 타이핑 시작
- `typing-stop` - 타이핑 종료
- `user-joined` - 사용자 입장 알림
- `user-left` - 사용자 퇴장 알림

**주요 API**:

- `GET /api/channel-chat/:channelId/messages` - 채팅 메시지 조회
- `POST /api/channel-chat/:channelId/messages` - 메시지 전송 (HTTP)

---

### 🔔 Channel Notification Module (채널 알림)

**경로**: `/src/channel-notification/`
**주요 기능**:

- 채널별 알림 구독 관리
- 새 게시글 알림
- 알림 설정 on/off
- 읽지 않은 알림 카운팅

**주요 API**:

- `POST /api/channel-notifications/subscribe` - 채널 알림 구독
- `DELETE /api/channel-notifications/unsubscribe` - 채널 알림 구독 해제
- `GET /api/channel-notifications/unread` - 읽지 않은 채널 알림

---

### 🔔 Notification Module (알림 시스템)

**경로**: `/src/notification/`
**주요 기능**:

- 실시간 알림 생성/조회
- 채널 새 게시글 알림
- 댓글/대댓글 알림
- 쪽지 알림
- 읽음 상태 관리
- 알림 페이지네이션

**주요 API**:

- `GET /api/notifications` - 알림 목록
- `PUT /api/notifications/:id/read` - 알림 읽음 처리
- `PUT /api/notifications/mark-all-read` - 모든 알림 읽음 처리
- `DELETE /api/notifications/:id` - 알림 삭제

---

### 📨 Messages Module (쪽지 시스템)

**경로**: `/src/messages/`
**주요 기능**:

- 1:1 개인 쪽지
- 쪽지 읽음 상태 관리
- 쪽지함 (받은편지함, 보낸편지함)
- 쪽지 삭제
- 페이지네이션

**주요 API**:

- `GET /api/messages` - 쪽지 목록
- `POST /api/messages` - 쪽지 발송
- `GET /api/messages/:id` - 쪽지 상세 조회
- `PUT /api/messages/:id/read` - 읽음 처리
- `DELETE /api/messages/:id` - 쪽지 삭제

---

### 📌 Scrap Module (스크랩)

**경로**: `/src/scrap/`
**주요 기능**:

- 게시글 스크랩/북마크
- 개인 스크랩 목록 관리
- 스크랩 취소
- 페이지네이션

**주요 API**:

- `GET /api/scrap` - 스크랩 목록
- `POST /api/scrap/:storyId` - 스크랩 추가
- `DELETE /api/scrap/:storyId` - 스크랩 제거
- `GET /api/scrap/check/:storyId` - 스크랩 여부 확인

---

### 🛡️ Blind Module (신고/블라인드)

**경로**: `/src/blind/`
**주요 기능**:

- 게시글/댓글 신고 시스템
- 관리자 블라인드 처리
- 신고 사유 분류
- 신고 내역 관리

**주요 API**:

- `POST /api/blind/report` - 신고 접수
- `GET /api/blind/reports` - 신고 목록 (관리자)
- `PUT /api/blind/:id/process` - 신고 처리 (관리자)

---

### 💡 Suggestion Module (건의사항)

**경로**: `/src/suggestion/`
**주요 기능**:

- 채널별 사이트 개선 건의사항
- 사용자별 건의사항 관리
- 이미지 첨부 지원
- 카테고리별 분류 (건의/문의/신고)
- CRUD 기능

**주요 API**:

- `GET /api/suggestion/pageTableData` - 건의사항 목록 (채널별 + 사용자별)
- `POST /api/suggestion/create` - 건의사항 작성
- `GET /api/suggestion/detail/:id` - 건의사항 상세
- `GET /api/suggestion/detail/edit/:id` - 건의사항 수정용 데이터
- `POST /api/suggestion/update/:id` - 건의사항 수정
- `DELETE /api/suggestion/:id` - 건의사항 삭제

---

## 🗄️ 데이터베이스 스키마

### 📊 주요 엔티티 관계도

```
User (사용자)
├── has many Stories (게시글)
├── has many Comments (댓글)
├── has many Likes (추천/비추천)
├── has many Messages (sent/received)
├── has many Notifications (알림)
├── has many Scraps (스크랩)
├── has many Subscriptions (채널 구독)
├── has many Suggestions (건의사항)
├── has many ChannelNotificationSubscriptions (채널 알림 구독)
└── has one UserImage (프로필 이미지)

Story (게시글)
├── belongs to User (작성자)
├── belongs to Channel (채널)
├── has many Comments (댓글)
├── has many Likes (추천/비추천)
├── has many StoryImages (첨부 이미지)
├── has many StoryVideos (첨부 동영상)
└── has many Scraps (스크랩)

Channel (채널)
├── belongs to User (생성자)
├── has many Stories (게시글)
├── has many Subscriptions (구독자)
├── has many Suggestions (건의사항)
├── has many ChannelChatMessages (채팅 메시지)
├── has many ChannelNotificationSubscriptions (알림 구독)
└── has one ChannelImage (채널 이미지)

Comment (댓글)
├── belongs to Story (게시글)
├── belongs to User (작성자)
├── has many Likes (추천/비추천)
└── self-referencing (대댓글)

Suggestion (건의사항)
├── belongs to User (작성자)
├── belongs to Channel (채널)
└── has many SuggestionImages (첨부 이미지)

Notification (알림)
├── belongs to User (수신자)
├── belongs to Story (관련 게시글)
└── belongs to Comment (관련 댓글)
```

### 🔑 주요 테이블 구조

#### User (사용자)

```sql
- id: Primary Key (VARCHAR)
- user_email: 이메일 (로그인 ID)
- password: 암호화된 비밀번호
- nickname: 닉네임
- name: 실명
- created_at: 가입일
- updated_at: 수정일
```

#### Story (게시글)

```sql
- id: Primary Key (INT)
- title: 제목
- content: 내용 (TEXT)
- category: 카테고리
- like_count: 추천 수
- dislike_count: 비추천 수
- read_count: 조회수
- comments_count: 댓글 수
- imageFlag: 이미지 첨부 여부
- videoFlag: 동영상 첨부 여부
- isNotice: 공지사항 여부
- channelId: 채널 ID (FK)
- userId: 작성자 ID (FK)
- created_at: 작성일
- updated_at: 수정일
```

#### Channel (채널)

```sql
- id: Primary Key (INT)
- channel_name: 채널명
- slug: URL 슬러그 (UNIQUE)
- story_count: 게시글 수
- subscriber_count: 구독자 수
- creatorId: 생성자 ID (FK)
- created_at: 생성일
- updated_at: 수정일
```

#### Suggestion (건의사항)

```sql
- id: Primary Key (INT)
- category: 카테고리 (건의/문의/신고)
- title: 제목
- content: 내용 (TEXT)
- userId: 작성자 ID (FK)
- channelId: 채널 ID (FK, nullable)
- created_at: 작성일
- updated_at: 수정일
- deleted_at: 삭제일 (nullable)
```

#### ChannelChatMessage (채널 채팅 메시지)

```sql
- id: Primary Key (INT)
- message: 메시지 내용
- channelId: 채널 ID (FK)
- userId: 작성자 ID (FK)
- created_at: 작성일
```

---

## 🚀 설치 및 실행

### 📋 사전 요구사항

- Node.js 20+
- MySQL 8.0+
- npm 또는 yarn

### 🔧 설치 과정

1. **의존성 설치**

```bash
cd back
npm install
```

2. **데이터베이스 설정**

```sql
-- MySQL에서 데이터베이스 생성
CREATE DATABASE `board-study` CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
```

3. **환경 설정**
   `src/app.module.ts`에서 데이터베이스 연결 정보 수정:

```typescript
TypeOrmModule.forRoot({
  type: 'mysql',
  host: 'localhost',
  port: 3306,
  username: 'your_username',
  password: 'your_password',
  database: 'board-study',
  synchronize: true, // 개발 환경에서만 true
  // ...
});
```

4. **업로드 디렉토리 생성**

```bash
mkdir upload userUpload channelUpload suggestionUpload
```

5. **애플리케이션 실행**

```bash
# 개발 모드 (자동 재시작)
npm run start:dev

# 일반 실행
npm run start

# 프로덕션 모드
npm run start:prod
```

### 🌐 접속 정보

- **백엔드 서버**: http://localhost:9999
- **API 문서 (Swagger)**: http://localhost:9999/api
- **Socket.IO 엔드포인트**: http://localhost:9999/socket.io/
- **정적 파일**: http://localhost:9999/upload/, /userUpload/, /channelUpload/, /suggestionUpload/

---

## 🧪 테스트

### 테스트 실행

```bash
# 단위 테스트
npm run test

# E2E 테스트
npm run test:e2e

# 테스트 커버리지
npm run test:cov

# 테스트 감시 모드
npm run test:watch
```

---

## 🛠️ 개발 도구

### 코드 품질 관리

```bash
# ESLint (코드 린팅 및 자동 수정)
npm run lint

# Prettier (코드 포맷팅)
npm run format
```

### NestJS CLI 활용

```bash
# 새 모듈 생성
nest g module feature-name

# 컨트롤러 생성
nest g controller feature-name

# 서비스 생성
nest g service feature-name

# CRUD 리소스 자동 생성
nest g resource feature-name

# WebSocket 게이트웨이 생성
nest g gateway feature-name
```

---

## 📡 API 문서

### Swagger UI

개발 서버 실행 후 http://localhost:9999/api 에서 상세한 API 문서를 확인할 수 있습니다.

### 주요 API 엔드포인트

#### 인증

- `POST /auth/signup` - 회원가입
- `POST /auth/signin` - 로그인
- `POST /auth/logout` - 로그아웃
- `PUT /auth/updatePassword` - 비밀번호 변경

#### 게시글

- `GET /api/story/pageTableData` - 게시글 목록 (테이블)
- `GET /api/story/cardPageTableData` - 게시글 목록 (카드)
- `POST /api/story/create` - 게시글 작성
- `GET /api/story/detail/:id` - 게시글 상세
- `PUT /api/story/likeOrUnlike/:id` - 추천/비추천
- `GET /api/story/search` - 게시글 검색

#### 채널

- `GET /api/channels` - 채널 목록
- `GET /api/channels/slug/:slug` - 슬러그로 채널 조회
- `POST /api/channels/:id/subscribe` - 채널 구독

#### 건의사항

- `GET /api/suggestion/pageTableData` - 건의사항 목록 (채널별 + 사용자별)
- `POST /api/suggestion/create` - 건의사항 작성
- `GET /api/suggestion/detail/:id` - 건의사항 상세

#### 실시간 채팅 (WebSocket)

- `join-channel` - 채널 입장
- `send-message` - 메시지 전송
- `typing-start/stop` - 타이핑 표시

#### 알림

- `GET /api/notifications` - 알림 목록
- `PUT /api/notifications/:id/read` - 알림 읽음 처리
- `GET /api/channel-notifications/unread` - 읽지 않은 채널 알림

#### 쪽지

- `GET /api/messages` - 쪽지 목록
- `POST /api/messages` - 쪽지 발송
- `PUT /api/messages/:id/read` - 쪽지 읽음 처리

---

## 🔒 보안 고려사항

### 인증 & 인가

- 세션 기반 인증 (express-session)
- bcrypt를 이용한 비밀번호 암호화
- CORS 설정으로 허용된 도메인만 접근 가능
- 인증 가드를 통한 API 보호

### 데이터 검증

- class-validator를 통한 DTO 검증
- TypeORM을 통한 SQL 인젝션 방지
- 파일 업로드 시 확장자 및 크기 제한
- 입력 데이터 sanitization

### 에러 처리

- 전역 예외 필터로 일관된 에러 응답
- 민감한 정보 노출 방지
- 적절한 HTTP 상태 코드 사용

---

## 🚀 배포 고려사항

### 환경 변수 관리

프로덕션 환경에서는 다음 정보를 환경 변수로 관리해야 합니다:

- 데이터베이스 연결 정보
- 세션 시크릿 키
- JWT 시크릿 (사용 시)
- 파일 업로드 경로
- CORS 허용 도메인

### 성능 최적화

- 데이터베이스 인덱스 최적화
- 이미지 압축 및 CDN 사용
- 캐싱 전략 (Redis 등)
- 로드 밸런싱
- 정적 파일 서빙 최적화

### 모니터링

- 애플리케이션 로그 관리
- 성능 모니터링 (APM)
- 에러 추적 (Sentry 등)
- WebSocket 연결 모니터링

---

## 🔄 최근 업데이트 (2024년 12월)

### 새로 추가된 기능

- ✅ **건의사항 채널별 필터링**: 각 채널별로 독립적인 건의사항 관리
- ✅ **실시간 채널 채팅**: Socket.IO 기반 채널 내 실시간 커뮤니케이션
- ✅ **채널 알림 시스템**: 채널별 새 게시글 알림 구독/해제
- ✅ **쪽지 시스템**: 사용자 간 1:1 개인 메시지
- ✅ **스크랩 기능**: 게시글 북마크 및 관리
- ✅ **동영상 업로드**: 게시글에 동영상 첨부 지원
- ✅ **프로필 이미지**: 사용자 프로필 이미지 업로드
- ✅ **채널 이미지**: 채널 대표 이미지 설정

### 개선된 기능

- 🔧 **API 엔드포인트 정리**: RESTful API 구조 개선
- 🔧 **데이터베이스 스키마 최적화**: 관계형 데이터 구조 개선
- 🔧 **에러 처리 강화**: 더 나은 예외 처리 및 응답
- 🔧 **타입 안전성**: TypeScript 타입 정의 강화

---

## 📞 지원 및 문의

이 문서에 대한 질문이나 개선 사항이 있으시면 개발팀에 문의해 주세요.

**개발팀**: StudyBoard Team  
**프로젝트**: Study Board Backend API  
**버전**: 2.0.0  
**마지막 업데이트**: 2024년 12월

---

_이 문서는 Study Board 백엔드 시스템의 전체적인 구조와 기능을 설명합니다. 개발 과정에서 지속적으로 업데이트됩니다._
