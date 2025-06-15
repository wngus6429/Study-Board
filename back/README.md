# 📚 Study Board Backend

Study Board는 학습 커뮤니티를 위한 종합 플랫폼의 백엔드 서버입니다.

## 🚀 빠른 시작

```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm run start:dev

# 프로덕션 빌드
npm run build
npm run start:prod
```

## 🌐 서버 정보

- **백엔드 서버**: http://localhost:9999
- **API 문서**: http://localhost:9999/api (Swagger UI)
- **Socket.IO**: http://localhost:9999/socket.io/

## 🏛️ 주요 기능

- 📝 **게시글 시스템**: CRUD, 검색, 추천/비추천
- 🏢 **채널 시스템**: 채널 생성/관리, 구독
- 💬 **실시간 채팅**: WebSocket 기반 채널 채팅
- 🔔 **알림 시스템**: 실시간 알림
- 👤 **사용자 관리**: 인증/인가, 프로필 관리
- 📨 **쪽지 시스템**: 1:1 개인 메시지

## 🔧 기술 스택

- **NestJS** - Node.js 백엔드 프레임워크
- **TypeScript** - 정적 타입 언어
- **MySQL** - 관계형 데이터베이스
- **TypeORM** - ORM
- **Socket.IO** - 실시간 통신

## 📖 상세 문서

전체 시스템 구조, API 명세, 설치 가이드 등 상세한 정보는 다음 문서를 참조하세요:

**👉 [BACKEND_DOCUMENTATION.md](./BACKEND_DOCUMENTATION.md)**

## 🛠️ 개발 명령어

```bash
# 개발 서버 (자동 재시작)
npm run start:dev

# 코드 린팅
npm run lint

# 코드 포맷팅
npm run format

# 테스트 실행
npm run test

# 테스트 커버리지
npm run test:cov
```

## 📋 사전 요구사항

- Node.js 20+
- MySQL 8.0+
- npm 또는 yarn

## 🗄️ 데이터베이스 설정

```sql
-- MySQL에서 데이터베이스 생성
CREATE DATABASE `board-study` CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
```

`src/app.module.ts`에서 데이터베이스 연결 정보를 수정하세요.

---

**개발팀**: StudyBoard Team  
**문서 업데이트**: 2024년
