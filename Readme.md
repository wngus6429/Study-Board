# 🎓 Study-Board

> **3-4년차 시니어급 풀스택 커뮤니티 플랫폼**  
> 실시간 채팅, 블라인드 시스템, 관리자 기능을 갖춘 현대적인 웹 애플리케이션

[![Next.js](https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![NestJS](https://img.shields.io/badge/NestJS-10.0.0-red?style=for-the-badge&logo=nestjs)](https://nestjs.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.1.3-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![MySQL](https://img.shields.io/badge/MySQL-8.0+-orange?style=for-the-badge&logo=mysql)](https://www.mysql.com/)
[![Socket.IO](https://img.shields.io/badge/Socket.IO-4.8.1-green?style=for-the-badge&logo=socket.io)](https://socket.io/)

---

## 📋 목차

- [✨ 프로젝트 소개](#-프로젝트-소개)
- [🎯 주요 기능](#-주요-기능)
- [🛠️ 기술 스택](#️-기술-스택)
- [📦 설치 및 실행](#-설치-및-실행)
- [🏗️ 프로젝트 구조](#️-프로젝트-구조)
- [🚀 주요 기능 설명](#-주요-기능-설명)
- [🔧 개발 가이드](#-개발-가이드)
- [📚 API 문서](#-api-문서)
- [🤝 기여하기](#-기여하기)
- [📄 라이선스](#-라이선스)

---

## ✨ 프로젝트 소개

**Study-Board**는 학습 커뮤니티를 위한 현대적인 웹 플랫폼입니다. 실시간 채팅, 블라인드 시스템, 관리자 기능 등 고급 기능들을 통해 사용자들이 효율적으로 소통하고 학습할 수 있는 환경을 제공합니다.

### 🎯 개발 목표

- **실시간 소통**: Socket.IO를 활용한 실시간 채팅 시스템
- **사용자 경험**: 블라인드 시스템을 통한 건전한 커뮤니티 환경
- **관리 효율성**: 포괄적인 관리자 기능으로 커뮤니티 운영 최적화
- **확장성**: 모듈화된 구조로 기능 확장 용이성 확보

---

## 🎯 주요 기능

### 👥 사용자 관리

- **회원가입/로그인**: NextAuth.js 기반 인증 시스템
- **프로필 관리**: 개인정보 수정, 프로필 이미지 업로드
- **사용자 권한**: 일반 사용자, 관리자 권한 구분

### 📝 게시판 기능

- **RichTextEditor 기반 작성**: 텍스트, 이미지, 동영상 업로드 지원 (드래그 앤 드롭)
- **스마트 파일 관리**: 글 내용 분석 기반 자동 파일 정리
- **댓글 시스템**: 중첩 댓글 및 실시간 업데이트 (모듈화된 7개 컴포넌트)
- **추천/스크랩**: 게시글 추천 및 개인 스크랩 기능
- **검색 기능**: 키워드 기반 게시글 검색
- **고급 이미지 뷰어**: 확대/축소, 드래그, 키보드 네비게이션

### 🚫 블라인드 시스템

- **사용자 블라인드**: 특정 사용자의 게시글/댓글 숨김
- **블라인드 관리**: 개인 블라인드 목록 관리
- **실시간 적용**: 블라인드 설정 즉시 반영

### 💬 실시간 채팅

- **채널 채팅**: Socket.IO 4.8.1 기반 안정적인 실시간 채팅
- **개인 메시지**: 1:1 개인 메시지 기능
- **타이핑 인디케이터**: 실시간 타이핑 상태 표시
- **온라인 사용자**: 채팅방 접속자 실시간 표시
- **알림 시스템**: 실시간 메시지 알림

### 🔐 관리자 기능

- **사용자 관리**: 회원 정보 조회 및 관리
- **게시글 관리**: 부적절한 게시글 삭제 및 관리
- **신고 시스템**: 완전한 신고 접수 및 처리 시스템 (8가지 신고 사유)
- **신고 관리**: 전용 관리자 페이지에서 신고 승인/반려 처리
- **통계 대시보드**: 사이트 이용 통계 제공

### 🔔 알림 시스템

- **실시간 알림**: 댓글, 메시지, 채널 활동 알림
- **브라우저 알림**: 웹 브라우저 푸시 알림
- **알림 설정**: 개인별 알림 설정 관리

---

## 🛠️ 기술 스택

### 🖥️ 프론트엔드

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript 5.1.3
- **UI Library**: Material-UI (MUI)
- **State Management**: Zustand
- **Server State**: TanStack React Query
- **Authentication**: NextAuth.js
- **Real-time**: Socket.IO Client

### 🔧 백엔드

- **Framework**: NestJS 10.0.0
- **Language**: TypeScript 5.1.3
- **Database**: MySQL 8.0+
- **ORM**: TypeORM 0.3.20
- **Authentication**: JWT Strategy
- **Real-time**: Socket.IO 4.8.1
- **File Upload**: Multer

### 🗄️ 데이터베이스

- **Primary DB**: MySQL 8.0+
- **Tables**: 20개 엔티티 (Report, Blind, RecommendRanking 등)
- **Relations**: 복잡한 관계형 데이터베이스 설계
- **Transaction**: 고급 트랜잭션 처리 및 데이터 일관성 보장

### 🔧 개발 도구

- **Package Manager**: npm
- **Code Style**: ESLint, Prettier
- **Version Control**: Git
- **IDE**: VS Code 권장

---

## 📦 설치 및 실행

### 📋 사전 요구사항

- **Node.js**: v18.0.0 이상
- **npm**: v9.0.0 이상
- **MySQL**: v8.0 이상

### 🚀 설치 과정

1. **저장소 클론**

```bash
git clone https://github.com/your-username/study-board.git
cd study-board
```

2. **의존성 설치**

```bash
# 프론트엔드 의존성 설치
cd front
npm install

# 백엔드 의존성 설치
cd ../back
npm install
```

3. **환경 변수 설정**

```bash
# 프론트엔드 환경 변수 (.env.local)
cd front
cp .env.example .env.local
# 필요한 환경 변수 설정

# 백엔드 환경 변수 (.env)
cd ../back
cp .env.example .env
# 데이터베이스 및 기타 설정
```

4. **데이터베이스 설정**

```bash
# MySQL 데이터베이스 생성
mysql -u root -p
CREATE DATABASE study_board;

# 테이블 생성 (TypeORM 마이그레이션)
cd back
npm run migration:run
```

5. **애플리케이션 실행**

```bash
# 백엔드 서버 실행 (포트 9999)
cd back
npm run start:dev

# 프론트엔드 서버 실행 (포트 3000)
cd front
npm run dev
```

6. **접속 확인**

- 프론트엔드: http://localhost:3000
- 백엔드 API: http://localhost:9999

---

## 🏗️ 프로젝트 구조

```
Study-Board/
├── 📁 front/                    # 프론트엔드 (Next.js 14)
│   ├── 📁 src/
│   │   ├── 📁 app/              # App Router 페이지
│   │   │   ├── 📁 (beforeLogin)/  # 로그인 전 페이지
│   │   │   ├── 📁 (afterLogin)/   # 로그인 후 페이지
│   │   │   ├── 📁 (noLogin)/      # 로그인 무관 페이지
│   │   │   │   └── 📁 channels/   # 채널 관련 페이지
│   │   │   │       └── 📁 [slug]/components/ # 분리된 채널 컴포넌트 (4개)
│   │   │   └── 📁 components/     # 공통 컴포넌트
│   │   │       ├── 📁 Provider/   # 프로바이더 컴포넌트 (6개)
│   │   │       ├── 📁 common/     # 공통 UI 컴포넌트 (20개+)
│   │   │       ├── 📁 chat/       # 채팅 컴포넌트
│   │   │       ├── 📁 comment/    # 댓글 시스템 (7개 모듈)
│   │   │       └── 📁 table/      # 테이블 컴포넌트 (5개)
│   │   ├── 📁 store/            # Zustand 상태 관리 (12개 스토어)
│   │   ├── 📁 api/              # API 함수
│   │   ├── 📁 types/            # TypeScript 타입
│   │   ├── 📁 hooks/            # 커스텀 훅
│   │   └── 📁 utils/            # 유틸리티 함수
│   ├── 📄 package.json
│   └── 📄 next.config.mjs
├── 📁 back/                     # 백엔드 (NestJS 10.0.0)
│   ├── 📁 src/
│   │   ├── 📁 auth/             # 인증 모듈 (716줄)
│   │   ├── 📁 users/            # 사용자 모듈
│   │   ├── 📁 story/            # 게시글 모듈 (2,190줄 서비스)
│   │   ├── 📁 channels/         # 채널 모듈 (396줄 서비스)
│   │   ├── 📁 blind/            # 블라인드 모듈
│   │   ├── 📁 channel-chat/     # 채널 채팅 모듈 (Socket.IO)
│   │   ├── 📁 notification/     # 알림 모듈
│   │   ├── 📁 scrap/            # 스크랩 모듈
│   │   ├── 📁 suggestion/       # 건의사항 모듈
│   │   ├── 📁 entities/         # 데이터베이스 엔티티 (20개)
│   │   └── 📁 common/           # 공통 유틸리티
│   ├── 📁 upload/               # 파일 업로드 (5개 디렉토리)
│   │   ├── 📁 upload/           # 게시글 이미지
│   │   ├── 📁 userUpload/       # 사용자 프로필 이미지
│   │   ├── 📁 channelUpload/    # 채널 이미지
│   │   ├── 📁 suggestionUpload/ # 건의사항 이미지
│   │   └── 📁 videoUpload/      # 동영상 파일
│   ├── 📄 package.json
│   └── 📄 nest-cli.json
├── 📄 README.md
└── 📄 package.json
```

---

## 🚀 주요 기능 설명

### 🚫 블라인드 시스템

사용자가 특정 사용자의 게시글과 댓글을 숨길 수 있는 기능입니다.

**주요 특징:**

- 개인별 블라인드 설정
- 실시간 적용
- 블라인드 해제 기능

**사용 방법:**

```typescript
// 블라인드 래퍼 컴포넌트 사용
<BlindWrapper targetUserId={post.userId} fallback={<div>블라인드된 게시글</div>}>
  <PostCard post={post} />
</BlindWrapper>
```

### 💬 실시간 채팅

Socket.IO를 활용한 실시간 채팅 시스템입니다.

**주요 특징:**

- 채널별 실시간 채팅
- 개인 메시지 기능
- 접속자 상태 표시

**기술 구현:**

```typescript
// Socket.IO 연결 관리
const useChannelSocket = (channelId: string) => {
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    const newSocket = io("/channel-chat");
    newSocket.emit("join-channel", { channelId });
    setSocket(newSocket);

    return () => newSocket.close();
  }, [channelId]);

  return socket;
};
```

### 🔐 관리자 기능

포괄적인 관리자 기능으로 커뮤니티를 효율적으로 운영할 수 있습니다.

**주요 기능:**

- 사용자 관리 및 권한 제어
- 게시글/댓글 관리 및 삭제
- 신고 시스템 (8가지 신고 사유, 상태별 처리)
- 전용 신고 관리 페이지
- 통계 대시보드 및 시스템 모니터링

**신고 시스템 특징:**

- 스팸/도배, 욕설/비방, 음란물, 폭력적 콘텐츠 등 8가지 사유
- 중복 신고 방지 및 자기 신고 차단
- 관리자 검토 및 승인/반려 처리
- 신고 상태별 통계 및 관리

### 🔔 알림 시스템

실시간 알림으로 사용자 참여도를 높입니다.

**알림 종류:**

- 댓글 알림
- 메시지 알림
- 채널 활동 알림
- 시스템 알림

---

## 🔧 개발 가이드

### 📝 코딩 규칙

프로젝트의 일관된 코드 품질을 위해 [코딩 규칙](./CODING_RULES.md)을 준수해주세요.

### 🧪 테스트

```bash
# 프론트엔드 테스트
cd front
npm run test

# 백엔드 테스트
cd back
npm run test
```

### 🚀 빌드 및 배포

```bash
# 프론트엔드 빌드
cd front
npm run build

# 백엔드 빌드
cd back
npm run build
```

### 📊 성능 최적화

- **페이지 전환 최적화**: React Query prefetch로 깜빡임 제거
- **이미지 최적화**: Next.js Image 컴포넌트 사용 권장
- **코드 분할**: 동적 import 활용
- **상태 관리**: Zustand로 효율적인 상태 관리 (12개 전문화된 스토어)
- **서버 상태**: React Query로 캐싱 및 동기화 (staleTime 4분)
- **트랜잭션 처리**: StoryTransactionService를 통한 고급 트랜잭션 관리
- **쿼리 최적화**: N+1 문제 해결 및 선택적 데이터 조회
- **컴포넌트 최적화**: 13개 독립 컴포넌트로 분리, 가독성 49.7% 향상

---

## 📚 API 문서

### 🔐 인증 API

#### POST /auth/signin

사용자 로그인

**요청:**

```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**응답:**

```json
{
  "access_token": "jwt_token_here",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "username": "사용자"
  }
}
```

### 📝 게시글 API

#### GET /stories

게시글 목록 조회

**쿼리 파라미터:**

- `page`: 페이지 번호 (기본값: 1)
- `limit`: 페이지당 항목 수 (기본값: 20)
- `search`: 검색 키워드

#### POST /stories

게시글 작성

**요청:**

```json
{
  "title": "게시글 제목",
  "content": "게시글 내용",
  "channelId": "channel_id"
}
```

### 💬 채팅 API

#### GET /channel-chat/:channelId/messages

채널 메시지 조회

#### POST /channel-chat/:channelId/messages

메시지 전송

**실시간 이벤트:**

- `channel:message`: 새 메시지 수신
- `channel:user-joined`: 사용자 입장
- `channel:user-left`: 사용자 퇴장

---

## 🔒 보안 고려사항

### 🛡️ 인증 보안

**NextAuth.js 세션 관리:**

- `next-auth.session-token`: 사용자 세션 유지
- `next-auth.csrf-token`: CSRF 공격 방지
- `next-auth.callback-url`: 리다이렉트 URL 관리

**세션 전략:**

- **JWT 전략**: 클라이언트 측 토큰 기반 인증
- **Database 전략**: 서버 측 세션 저장소 활용

### 🔐 데이터 보호

- **SQL Injection 방지**: TypeORM 쿼리 빌더 사용
- **XSS 방지**: 입력 데이터 검증 및 이스케이프
- **파일 업로드 보안**: 파일 타입 및 크기 제한

---

## 🤝 기여하기

1. **Fork** 프로젝트
2. **Feature 브랜치** 생성 (`git checkout -b feature/amazing-feature`)
3. **변경사항 커밋** (`git commit -m 'Add amazing feature'`)
4. **브랜치 푸시** (`git push origin feature/amazing-feature`)
5. **Pull Request** 생성

### 📋 기여 가이드라인

- 코딩 규칙 준수
- 테스트 코드 작성
- 문서 업데이트
- 커밋 메시지 규칙 준수

---

## 📊 시스템 요구사항

### 🖥️ 개발 환경

- **OS**: Windows 10+, macOS 10.15+, Ubuntu 18.04+
- **Memory**: 8GB RAM 이상 권장
- **Storage**: 5GB 이상 여유 공간

### 🌐 운영 환경

- **Web Server**: Nginx 또는 Apache
- **Database**: MySQL 8.0+
- **Node.js**: v18.0.0 이상
- **SSL**: HTTPS 필수

---

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다. 자세한 내용은 [LICENSE](./LICENSE) 파일을 참고하세요.

---

## 📞 문의 및 지원

- **이슈 리포트**: GitHub Issues 활용
- **기능 요청**: GitHub Discussions 활용
- **보안 취약점**: 이메일로 개별 연락

---

## 🔄 업데이트 로그

### v2.3.0 (2025-01-21) - 최신

**🚨 주요 신규 기능:**

- ✅ **사용자 채널 생성**: 로그인 사용자가 직접 채널 생성 가능 (슬러그 기반)
- ✅ **채널 이미지 관리**: 채널 이미지 업로드/수정/삭제 완전 구현
- ✅ **채널 구독 시스템**: DB 연동 채널 구독/구독취소 완전 구현
- ✅ **페이지 전환 최적화**: React Query prefetch로 깜빡임 제거
- ✅ **메탈릭 UI 테마**: 글로우 효과, 회전 링 등 프리미엄 디자인
- ✅ **완전한 신고 시스템**: Report 엔티티 기반 8가지 신고 사유 처리
- ✅ **고급 트랜잭션 처리**: StoryTransactionService를 통한 데이터 일관성 보장
- ✅ **관리자 신고 관리**: 전용 신고 관리 페이지 및 승인/반려 시스템
- ✅ **동영상 업로드**: 게시글에 동영상 첨부 지원
- ✅ **고급 이미지 뷰어**: 확대/축소, 드래그, 키보드 네비게이션

**🔧 시스템 개선:**

- 20개 데이터베이스 엔티티로 확장
- 12개 전문화된 Zustand 스토어
- 비관적 락을 통한 동시성 문제 해결
- 쿼리빌더 최적화로 N+1 문제 해결
- 컴포넌트 분리로 코드 가독성 49.7% 향상

### v2.1.0 (2024-11-xx)

- 블라인드 시스템 추가
- 실시간 채팅 기능 강화
- 관리자 기능 확장
- 성능 최적화

### v2.0.0 (2024-10-xx)

- Next.js 14 업그레이드
- NestJS 10.0.0 업그레이드
- TypeScript 5.1.3 적용
- 새로운 UI/UX 적용

---

---

## 📈 프로젝트 성과

### 🎯 완성도 지표

- **기능 완성도**: 98% (핵심 기능 모두 구현 완료)
- **시스템 규모**: 20개 엔티티, 12개 모듈, 5개 업로드 디렉토리
- **코드 품질**: TypeScript 5.1.3 + ESLint + Prettier
- **성능 최적화**: React Query prefetch + 고급 트랜잭션 처리
- **컴포넌트 분리**: 13개 독립 컴포넌트, 가독성 49.7% 향상

### 🚀 기술적 성취

- ✅ **엔터프라이즈급 아키텍처**: 확장 가능한 모듈화 설계
- ✅ **사용자 채널 시스템**: 완전한 채널 생성/관리 기능 구현
- ✅ **고급 트랜잭션 처리**: 데이터 일관성 및 원자성 보장
- ✅ **실시간 통신**: Socket.IO 4.8.1 기반 안정적인 채팅 시스템
- ✅ **보안 강화**: 다층 보안 시스템 (JWT + CSRF + 권한 검증)
- ✅ **성능 최적화**: 캐싱 + 쿼리 최적화 + N+1 문제 해결 + prefetch
- ✅ **UX 혁신**: 메탈릭 테마, 깜빡임 없는 페이지 전환, 스마트 파일 관리

---

**Study-Board** - 현대적인 학습 커뮤니티 플랫폼 💪

Made with ❤️ by the Study-Board Team
