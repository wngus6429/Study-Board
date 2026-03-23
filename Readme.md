# 🎓 Study-Board

> **풀스택 커뮤니티 플랫폼** — 실시간 채팅, 클린 아키텍처, 블라인드 시스템, 관리자 기능을 갖춘 현대적인 웹 애플리케이션

[![Next.js](https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![NestJS](https://img.shields.io/badge/NestJS-10.0.0-red?style=for-the-badge&logo=nestjs)](https://nestjs.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.1.3-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![MySQL](https://img.shields.io/badge/MySQL-8.0+-orange?style=for-the-badge&logo=mysql)](https://www.mysql.com/)
[![Socket.IO](https://img.shields.io/badge/Socket.IO-4.8.1-green?style=for-the-badge&logo=socket.io)](https://socket.io/)
[![React Query](https://img.shields.io/badge/React_Query-5-FF4154?style=for-the-badge&logo=reactquery)](https://tanstack.com/query)
[![Zustand](https://img.shields.io/badge/Zustand-4-brown?style=for-the-badge)](https://zustand-demo.pmnd.rs/)

---

## 📋 목차

- [✨ 프로젝트 소개](#-프로젝트-소개)
- [🛠️ 기술 스택과 선택 이유](#️-기술-스택과-선택-이유)
- [🏗️ 시스템 아키텍처](#️-시스템-아키텍처)
- [🧱 클린 아키텍처 상세](#-클린-아키텍처-상세)
- [🎯 주요 기능](#-주요-기능)
- [🔥 기술적 도전과 해결](#-기술적-도전과-해결)
- [📁 프로젝트 구조](#-프로젝트-구조)
- [🚀 설치 및 실행](#-설치-및-실행)
- [📚 API 문서](#-api-문서)

---

## ✨ 프로젝트 소개

**Study-Board**는 학습 커뮤니티를 위한 웹 플랫폼입니다. 단순한 CRUD 게시판을 넘어, 실시간 채팅, 블라인드 시스템, 신고 처리, 채널 구독, 트랜잭션 기반 데이터 일관성 등 실무 수준의 기능을 구현했습니다.

### 🎯 이 프로젝트에서 집중한 것

- 🧱 **아키텍처 설계**: 클린 아키텍처(Ports & Adapters)를 별도 모듈로 구현하여, 계층 분리와 의존성 역전 원칙을 실전 적용
- 🔒 **데이터 일관성**: 비관적 락과 트랜잭션을 통한 동시성 문제 해결
- ⚡ **실시간 통신**: Socket.IO 기반 채널 채팅과 알림 시스템
- 📦 **확장 가능한 설계**: 20개 엔티티, 12개 모듈로 분리된 NestJS 백엔드

### 📊 프로젝트 규모

| 항목 | 수치 |
|------|------|
| 🗄️ 데이터베이스 엔티티 | 20개 |
| 📦 백엔드 모듈 | 12개 |
| 🗂️ 프론트엔드 Zustand 스토어 | 12개 |
| 📁 파일 업로드 디렉토리 | 5개 (이미지, 프로필, 채널, 건의사항, 동영상) |

---

## 🛠️ 기술 스택과 선택 이유

### 🖥️ Frontend

| 기술 | 선택 이유 |
|------|-----------|
| **Next.js 14 (App Router)** | SSR/SSG 지원, 파일 기반 라우팅, Image 최적화, 그리고 App Router의 레이아웃 시스템으로 인증 상태별 페이지 그룹 분리 |
| **Material-UI (MUI)** | 풍부한 컴포넌트 라이브러리로 일관된 디자인 시스템 구축. 테마 커스터마이징으로 다크/라이트 모드 지원 |
| **TanStack React Query** | 서버 상태 관리 전용. staleTime 설정으로 불필요한 API 호출 감소, prefetch로 페이지 전환 시 깜빡임 제거, optimistic update로 즉각적인 UX 제공 |
| **Zustand** | 클라이언트 상태 관리. Redux 대비 보일러플레이트가 적고, 12개 도메인별 스토어로 관심사 분리. React Query와 역할을 명확히 나눔 |
| **NextAuth.js** | JWT + Session 하이브리드 인증. 리프레시 토큰 자동 갱신, CSRF 보호 내장 |

### 🔧 Backend

| 기술 | 선택 이유 |
|------|-----------|
| **NestJS 10** | 모듈 기반 아키텍처로 기능별 분리 용이. DI 컨테이너가 클린 아키텍처의 의존성 역전 구현에 적합. Decorator 기반 코드로 가독성 확보 |
| **TypeORM 0.3.20** | Active Record/Data Mapper 패턴 모두 지원. QueryBuilder로 복잡한 쿼리 최적화 가능. 클린 아키텍처에서 Infrastructure 계층에 격리하기 좋음 |
| **Socket.IO 4.8.1** | 채널 채팅과 실시간 알림에 사용. Room 기반 채널 분리, 네임스페이스로 채팅/알림 이벤트 격리 |
| **MySQL 8.0+** | 20개 엔티티 간 복잡한 관계(1:N, N:M)를 관계형 DB로 관리. 비관적 락과 트랜잭션 지원 |

### 🔄 상태 관리 전략

```
┌─────────────────────────────────────────────────┐
│              상태 관리 이중 구조                    │
├────────────────────┬────────────────────────────┤
│   React Query      │     Zustand                │
│   (서버 상태)       │     (클라이언트 상태)         │
├────────────────────┼────────────────────────────┤
│ - 게시글 목록/상세   │ - 블라인드 사용자 목록        │
│ - 댓글 데이터       │ - UI 테마 설정              │
│ - 채널 정보        │ - 모달/토스트 상태            │
│ - 알림 데이터       │ - 로컬 필터/정렬 상태         │
│ - 사용자 프로필     │ - 채팅 연결 상태             │
├────────────────────┼────────────────────────────┤
│ 캐싱, 재검증,       │ 즉각 반영,                  │
│ 백그라운드 갱신      │ 구독 기반 리렌더링           │
└────────────────────┴────────────────────────────┘
```

---

## 🏗️ 시스템 아키텍처

```
                    ┌──────────────┐
                    │   Client     │
                    │  (Browser)   │
                    └──────┬───────┘
                           │
              ┌────────────┼────────────┐
              │ HTTP       │ WebSocket  │
              ▼            ▼            │
     ┌────────────┐  ┌──────────┐     │
     │  Next.js   │  │ Socket.IO│     │
     │  Frontend  │  │  Client  │     │
     │  (SSR/CSR) │  └────┬─────┘     │
     └─────┬──────┘       │           │
           │              │           │
           ▼              ▼           │
     ┌─────────────────────────────┐  │
     │      NestJS Backend         │  │
     ├─────────────────────────────┤  │
     │ ┌─────┐ ┌───────┐ ┌─────┐ │  │
     │ │Auth │ │Story  │ │Board│ │  │
     │ │Mod. │ │Module │ │(CA) │ │  │
     │ ├─────┤ ├───────┤ ├─────┤ │  │
     │ │Chan.│ │Blind  │ │Noti.│ │  │
     │ │Mod. │ │Module │ │Mod. │ │  │
     │ ├─────┤ ├───────┤ ├─────┤ │  │
     │ │Chat │ │Scrap  │ │Msg. │ │  │
     │ │(WS) │ │Module │ │Mod. │ │  │
     │ └─────┘ └───────┘ └─────┘ │  │
     ├─────────────────────────────┤  │
     │     TypeORM + Entities      │  │
     └─────────────┬───────────────┘  │
                   │                  │
                   ▼                  │
            ┌────────────┐            │
            │  MySQL 8.0 │            │
            │ (20 Tables)│            │
            └────────────┘            │
```

---

## 🧱 클린 아키텍처 상세

게시판 모듈(`board/`)에 클린 아키텍처(Hexagonal Architecture / Ports & Adapters)를 적용했습니다. 기존 Story 모듈과의 비교를 통해 아키텍처 패턴의 실제 이점을 확인할 수 있습니다.

### ❓ 왜 클린 아키텍처를 적용했는가

기존 `story` 모듈은 Controller → Service → Repository가 직접 의존하는 전통적인 3계층 구조입니다. 이 구조에서 겪은 문제점:

1. **Service가 TypeORM에 직접 의존** - ORM을 교체하거나 테스트 시 전체 수정 필요
2. **비즈니스 로직과 DB 로직이 혼재** - 서비스 파일이 2,190줄로 비대해짐
3. **테스트 시 DB 연결 필요** - 단위 테스트가 어려움

이를 해결하기 위해 별도 `board` 모듈에 클린 아키텍처를 적용하여, 같은 기능을 다른 설계 방식으로 구현했습니다.

### 📂 계층 구조

```
board/
├── board.module.ts                              # DI 설정 (NestJS Module)
│
├── core/                                        # 내부 원 (프레임워크 독립)
│   ├── domain/
│   │   └── board.entity.ts                     # 순수 도메인 모델
│   └── application/
│       ├── ports/
│       │   ├── in/
│       │   │   └── board.use-case.ts           # Input Port (유스케이스 인터페이스)
│       │   └── out/
│       │       └── board.repository.port.ts    # Output Port (저장소 인터페이스)
│       └── services/
│           └── board.service.ts                # 유스케이스 구현체
│
└── infrastructure/                              # 외부 원 (프레임워크 의존)
    └── adapters/
        ├── in/web/
        │   ├── board.controller.ts             # Input Adapter (HTTP)
        │   └── dto/                            # 요청/응답 DTO
        └── out/persistence/
            ├── board.repository.ts             # Output Adapter (TypeORM)
            └── mapper/
                └── board.mapper.ts             # 도메인 <-> DB 엔티티 변환
```

### 🔁 의존성 흐름

```
  ┌──────────────────────────────────────────────────────┐
  │              Infrastructure (외부)                     │
  │                                                      │
  │  ┌──────────────┐              ┌──────────────────┐  │
  │  │ Controller   │              │ Repository       │  │
  │  │ (Input       │              │ (Output          │  │
  │  │  Adapter)    │              │  Adapter)        │  │
  │  └──────┬───────┘              └───────▲──────────┘  │
  │         │ depends on                   │ implements   │
  └─────────┼──────────────────────────────┼─────────────┘
            │                              │
  ┌─────────▼──────────────────────────────┼─────────────┐
  │              Application (내부)                        │
  │                                                      │
  │  ┌──────────────┐              ┌──────────────────┐  │
  │  │ BoardUseCase │              │ BoardRepository  │  │
  │  │ (Input Port) │◄────────────│ Port             │  │
  │  └──────┬───────┘  implements  │ (Output Port)    │  │
  │         │                      └───────▲──────────┘  │
  │         │                              │              │
  │  ┌──────▼───────────────────────────────┐            │
  │  │         BoardService                  │            │
  │  │  - Input Port 구현                    │            │
  │  │  - Output Port에 의존 (인터페이스)     │            │
  │  └──────────────────────────────────────┘            │
  │                                                      │
  ├──────────────────────────────────────────────────────┤
  │              Domain (핵심)                             │
  │                                                      │
  │  ┌──────────────────────────────────────┐            │
  │  │          Board Entity                 │            │
  │  │  - 순수 TypeScript 클래스             │            │
  │  │  - 프레임워크 의존성 없음             │            │
  │  │  - 비즈니스 규칙 캡슐화              │            │
  │  └──────────────────────────────────────┘            │
  └──────────────────────────────────────────────────────┘
```

**핵심: 의존성 방향이 항상 안쪽(Domain)을 향합니다.** 외부 계층(Infrastructure)이 내부 계층(Application/Domain)에 의존하지, 그 반대가 아닙니다.

### 💻 주요 코드 패턴

#### 1️⃣ 순수 도메인 모델 - 프레임워크 의존성 없음

```typescript
// core/domain/board.entity.ts
export class Board {
  constructor(
    public readonly id: number | null,
    public title: string,
    public content: string,
    public category: string,
    public readonly authorId: string,
    public viewCount: number,
    public createdAt: Date,
    public updatedAt: Date,
  ) {}

  // 비즈니스 규칙이 도메인 객체 안에 캡슐화됨
  incrementViewCount() {
    this.viewCount += 1;
  }

  updateContent(title: string, content: string) {
    if (!title || title.trim() === '') {
      throw new Error('제목은 필수입니다.');
    }
    this.title = title;
    this.content = content;
    this.updatedAt = new Date();
  }
}
```

TypeORM `@Entity()` 데코레이터가 없는 순수 클래스입니다. ORM이 바뀌어도 이 코드는 변경할 필요가 없습니다.

#### 2️⃣ Port(인터페이스) 정의 - Symbol 기반 DI 토큰

```typescript
// core/application/ports/out/board.repository.port.ts
export const BOARD_REPOSITORY = Symbol('BOARD_REPOSITORY');

export interface BoardRepositoryPort {
  save(board: Board): Promise<Board>;
  findById(id: number): Promise<Board | null>;
  findAll(offset: number, limit: number): Promise<{ boards: Board[]; total: number }>;
  delete(id: number): Promise<void>;
}
```

`Symbol`을 DI 토큰으로 사용하여, 문자열 충돌 없이 인터페이스를 주입합니다. Application 계층이 "데이터를 어떻게 저장할지"가 아니라 "무엇이 필요한지"만 정의합니다.

#### 3️⃣ 유스케이스 서비스 - 인터페이스에만 의존

```typescript
// core/application/services/board.service.ts
@Injectable()
export class BoardService implements BoardUseCase {
  constructor(
    @Inject(BOARD_REPOSITORY)
    private readonly boardRepository: BoardRepositoryPort, // 인터페이스에 의존
  ) {}

  async updateBoard(command: UpdateBoardCommand): Promise<Board> {
    const board = await this.boardRepository.findById(command.boardId);

    if (board.authorId !== command.authorId) {
      throw new ForbiddenException('본인의 글만 수정할 수 있습니다.');
    }

    // 도메인 객체의 메서드를 통해 비즈니스 규칙 실행
    board.updateContent(command.title, command.content);

    return this.boardRepository.save(board);
  }
}
```

`BoardService`는 `BoardRepositoryPort` 인터페이스에만 의존합니다. TypeORM, MongoDB, 메모리 저장소 등 어떤 구현체든 주입 가능합니다.

#### 4️⃣ Adapter - 인터페이스 구현 + Mapper로 변환

```typescript
// infrastructure/adapters/out/persistence/board.repository.ts
@Injectable()
export class BoardRepository implements BoardRepositoryPort {
  constructor(
    @InjectRepository(Story)
    private readonly typeOrmRepository: Repository<Story>,
  ) {}

  async save(board: Board): Promise<Board> {
    const storyEntity = BoardMapper.toPersistence(board);  // Domain -> DB Entity
    const saved = await this.typeOrmRepository.save(storyEntity);
    return BoardMapper.toDomain(saved);                     // DB Entity -> Domain
  }
}
```

TypeORM 의존성이 이 파일에만 격리됩니다. `BoardMapper`가 도메인 모델과 DB 엔티티 간 변환을 담당합니다.

#### 5️⃣ Module에서 DI 바인딩

```typescript
// board.module.ts
@Module({
  providers: [
    { provide: BOARD_REPOSITORY, useClass: BoardRepository },  // Output Port -> Adapter
    { provide: BOARD_USE_CASE, useClass: BoardService },       // Input Port -> Service
  ],
})
export class BoardModule {}
```

NestJS Module이 "어떤 인터페이스에 어떤 구현체를 연결할지" 결정하는 유일한 장소입니다.

### ⚖️ 기존 모듈과의 비교

| 관점 | 기존 Story 모듈 (3계층) | Board 모듈 (클린 아키텍처) |
|------|------------------------|--------------------------|
| **Service 의존성** | TypeORM Repository 직접 주입 | `BoardRepositoryPort` 인터페이스 주입 |
| **도메인 모델** | TypeORM Entity = 도메인 모델 (혼재) | 순수 Board 클래스와 Story Entity 분리 |
| **비즈니스 규칙** | Service 메서드 안에 산재 | Domain Entity 메서드에 캡슐화 |
| **테스트** | DB 연결 또는 TypeORM mock 필요 | 인터페이스만 mock하면 됨 |
| **DB 교체 시** | Service 전체 수정 | Adapter만 교체 |
| **파일 수** | 3개 (Controller, Service, Module) | 9개 (계층별 분리) |
| **적합한 상황** | 빠른 개발, 단순한 도메인 | 복잡한 비즈니스 로직, 장기 유지보수 |

### 🌊 데이터 흐름 (게시글 수정 요청)

```
1. PUT /api/board-clean/:id (HTTP 요청)
       │
2. BoardController (Input Adapter)
   - UpdateBoardDto 유효성 검증 (class-validator)
   - DTO를 UpdateBoardCommand로 변환
       │
3. BoardService (Use Case)
   - boardRepository.findById(id)로 도메인 객체 조회
   - authorId 일치 여부 확인 (권한 검증)
   - board.updateContent(title, content) 호출 (도메인 규칙)
   - boardRepository.save(board)로 저장
       │
4. BoardRepository (Output Adapter)
   - BoardMapper.toPersistence(board) → TypeORM Entity 변환
   - typeOrmRepository.save() → DB 저장
   - BoardMapper.toDomain(saved) → 도메인 Entity로 변환 후 반환
```

---

## 🎯 주요 기능

### 📝 게시판 시스템

- ✅ **Rich Text Editor**: 이미지/동영상 업로드, 드래그 앤 드롭 지원
- ✅ **카테고리 분류**: 잡담, 질문, 정보, 리뷰, 스샷, 기타
- ✅ **정렬/검색/필터링**: 추천순, 최신순, 조회순 정렬 + 키워드 검색
- ✅ **페이지네이션**: 페이지 상태 URL 반영, 뒤로가기 시 상태 유지
- ✅ **고급 이미지 뷰어**: 줌인/줌아웃, 드래그 이동, 키보드 네비게이션
- ✅ **댓글 시스템**: 최대 4단계 중첩 댓글, 논리적 삭제, URL 해시 기반 하이라이트
- ✅ **추천 시스템**: 좋아요/싫어요, 추천 랭킹, 개념글(HOT) 표시

### 📺 채널 시스템

- ✅ 사용자 직접 채널 생성/관리
- ✅ 채널별 게시글, 공지사항, 건의사항 탭
- ✅ DB 연동 구독/알림 시스템
- ✅ 채널 이미지 업로드/관리

### 💬 실시간 채팅 (Socket.IO)

- ✅ 채널별 실시간 채팅
- ✅ 접속자 목록 표시
- ✅ 블라인드 사용자 메시지 자동 숨김
- ✅ 이모지 반응

### 🚫 블라인드 시스템

- ✅ 사용자 단위 블라인드 설정
- ✅ 게시글, 댓글, 채팅, 검색 결과, 알림 전체에 일괄 적용
- ✅ `BlindWrapper` 재사용 컴포넌트로 구현
- ✅ Zustand 스토어를 통한 전역 상태 관리

### 🔔 알림 시스템

- ✅ 댓글/대댓글 알림, 채널 활동 알림, 쪽지 알림
- ✅ 브라우저 푸시 알림
- ✅ 읽음/삭제 처리
- ✅ 블라인드 사용자 알림 자동 차단

### 🔐 관리자 기능

- ✅ 사용자 관리 (경고/정지/영구 정지)
- ✅ 신고 시스템 (8가지 사유, PENDING → REVIEWING → APPROVED/REJECTED)
- ✅ 통계 대시보드 (가입자, 게시글, 신고 현황)
- ✅ 공지사항 관리 (우선순위, 자동 만료)
- ✅ IP 차단, 키워드 필터

### 💌 쪽지 시스템

- ✅ 사용자 간 1:1 메시지
- ✅ 읽음 상태 관리
- ✅ 검색/페이지네이션

### 🛡️ 보안

- ✅ **인증**: JWT + Session 하이브리드 (NextAuth.js)
- ✅ **XSS 방지**: DOMPurify HTML Sanitization
- ✅ **CSRF 보호**: NextAuth.js 내장 CSRF 토큰
- ✅ **보안 헤더**: X-Frame-Options, X-XSS-Protection, CSP
- ✅ **SQL Injection 방지**: TypeORM QueryBuilder 사용
- ✅ **Rate Limiting**: API 요청 제한
- ✅ **파일 업로드 검증**: 타입/크기 제한

---

## 🔥 기술적 도전과 해결

### ⚔️ 1. 동시성 문제 - 추천 수 정합성

**문제**: 여러 사용자가 동시에 같은 게시글을 추천할 때, race condition으로 추천 수가 누락되는 현상

**해결**: `StoryTransactionService`에서 비관적 락(Pessimistic Lock) + 트랜잭션 적용

```typescript
// 비관적 락으로 동시 접근 제어
const story = await queryRunner.manager.findOne(Story, {
  where: { id: storyId },
  lock: { mode: 'pessimistic_write' },
});
story.like_count += 1;
await queryRunner.manager.save(story);
await queryRunner.commitTransaction();
```

실패 시 자동 롤백 + 업로드된 파일 정리까지 처리합니다.

### 🐌 2. N+1 쿼리 문제

**문제**: 게시글 목록 조회 시 각 게시글마다 작성자 정보를 개별 쿼리로 조회 → 20개 게시글에 21번의 쿼리 실행

**해결**: TypeORM QueryBuilder로 JOIN 쿼리 최적화 + 선택적 데이터 조회

```typescript
// QueryBuilder로 필요한 데이터만 JOIN하여 단일 쿼리로 처리
const stories = await this.storyRepository
  .createQueryBuilder('story')
  .leftJoinAndSelect('story.User', 'user')
  .select(['story.id', 'story.title', 'user.username', 'user.profileImage'])
  .skip(offset)
  .take(limit)
  .getMany();
```

### 💫 3. 페이지 전환 깜빡임

**문제**: 게시글 목록 → 상세 → 뒤로가기 시 데이터 재요청으로 화면 깜빡임 발생

**해결**: React Query의 `keepPreviousData` + `prefetchQuery` 조합

- `staleTime: 4분`으로 캐시 유지
- `prefetchQuery`로 다음 페이지 미리 로드
- `keepPreviousData`로 새 데이터 도착 전까지 이전 데이터 표시
- URL에 페이지/정렬 상태를 반영하여 뒤로가기 시 상태 복원

### 🎭 4. 블라인드 시스템의 일관된 적용

**문제**: 게시글, 댓글, 채팅, 검색, 알림 등 모든 화면에서 블라인드 사용자의 콘텐츠를 숨겨야 함

**해결**: Zustand 전역 스토어 + `BlindWrapper` 컴포넌트 패턴

```typescript
// 재사용 가능한 BlindWrapper로 모든 콘텐츠에 일괄 적용
<BlindWrapper targetUserId={post.userId} fallback={<div>블라인드된 게시글</div>}>
  <PostCard post={post} />
</BlindWrapper>
```

로그인 시 블라인드 목록을 자동 로드하고, 설정 변경 시 모든 컴포넌트에 즉시 반영됩니다.

---

## 📁 프로젝트 구조

```
Study-Board/
├── front/                          # Frontend (Next.js 14)
│   └── src/
│       ├── app/
│       │   ├── (beforeLogin)/      # 비로그인 전용 (로그인, 회원가입)
│       │   ├── (afterLogin)/       # 로그인 필수 (글쓰기, 프로필)
│       │   ├── (noLogin)/          # 로그인 무관 (게시글 목록, 채널)
│       │   └── components/         # 공통 컴포넌트
│       │       ├── Provider/       # 6개 프로바이더 (Auth, Query, Theme 등)
│       │       ├── common/         # 공통 UI (20개+)
│       │       ├── chat/           # 채팅 컴포넌트
│       │       ├── comment/        # 댓글 시스템 (7개 모듈)
│       │       └── table/          # 테이블 컴포넌트 (5개)
│       ├── store/                  # Zustand 스토어 (12개)
│       ├── api/                    # API 호출 함수
│       ├── types/                  # TypeScript 타입 정의
│       ├── hooks/                  # 커스텀 훅
│       └── utils/                  # 유틸리티 함수
│
├── back/                           # Backend (NestJS 10)
│   └── src/
│       ├── auth/                   # 인증 모듈 (JWT, NextAuth 연동)
│       ├── story/                  # 게시글 모듈 (기존 3계층 구조)
│       ├── board/                  # 게시판 모듈 (클린 아키텍처)
│       │   ├── core/               #   내부: Domain + Application
│       │   └── infrastructure/     #   외부: Controller + Repository
│       ├── channels/               # 채널 모듈
│       ├── channel-chat/           # 실시간 채팅 (Socket.IO Gateway)
│       ├── blind/                  # 블라인드 모듈
│       ├── notification/           # 알림 모듈
│       ├── comment/                # 댓글 모듈
│       ├── scrap/                  # 스크랩 모듈
│       ├── messages/               # 쪽지 모듈
│       ├── entities/               # TypeORM 엔티티 (20개)
│       └── common/                 # 공통 유틸리티
│
└── 문서/
    ├── FEATURES.md                 # 기능 목록
    ├── CODING_RULES.md             # 코딩 규칙
    ├── API명세서.docx               # API 명세
    └── AWS_DEPLOYMENT_GUIDE.md     # 배포 가이드
```

---

## 🚀 설치 및 실행

### 📋 사전 요구사항

- Node.js v18.0.0+
- MySQL 8.0+
- npm v9.0.0+

### 📦 설치

```bash
# 저장소 클론
git clone https://github.com/your-username/study-board.git
cd study-board

# 프론트엔드
cd front && npm install

# 백엔드
cd ../back && npm install
```

### ⚙️ 환경 변수

```bash
# front/.env.local
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret
NEXT_PUBLIC_API_URL=http://localhost:8888

# back/.env
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=your-password
DB_DATABASE=study_board
JWT_SECRET=your-jwt-secret
```

### ▶️ 실행

```bash
# 백엔드 (포트 8888)
cd back && npm run start:dev

# 프론트엔드 (포트 3000)
cd front && npm run dev
```

---

## 📚 API 문서

### 🔐 인증

| Method | Endpoint | 설명 |
|--------|----------|------|
| POST | `/auth/signin` | 로그인 |
| POST | `/auth/signup` | 회원가입 |
| POST | `/auth/refresh` | 토큰 갱신 |

### 📝 게시글 (기존 3계층)

| Method | Endpoint | 설명 |
|--------|----------|------|
| GET | `/stories` | 게시글 목록 (페이지네이션, 정렬, 검색) |
| GET | `/stories/:id` | 게시글 상세 |
| POST | `/stories` | 게시글 작성 (이미지/동영상 업로드) |
| PUT | `/stories/:id` | 게시글 수정 |
| DELETE | `/stories/:id` | 게시글 삭제 |

### 🧱 게시판 (클린 아키텍처)

| Method | Endpoint | 설명 |
|--------|----------|------|
| GET | `/api/board-clean/list` | 게시글 목록 |
| GET | `/api/board-clean/:id` | 게시글 상세 |
| POST | `/api/board-clean/create` | 게시글 작성 |
| PUT | `/api/board-clean/:id` | 게시글 수정 |
| DELETE | `/api/board-clean/:id` | 게시글 삭제 |

### 💬 채팅 (Socket.IO)

| Event | 방향 | 설명 |
|-------|------|------|
| `channel:message` | Server → Client | 새 메시지 수신 |
| `channel:user-joined` | Server → Client | 사용자 입장 |
| `channel:user-left` | Server → Client | 사용자 퇴장 |

### 🔗 기타 주요 API

| Method | Endpoint | 설명 |
|--------|----------|------|
| POST | `/blind` | 사용자 블라인드 등록 |
| GET | `/notifications` | 알림 목록 |
| POST | `/scrap/:storyId` | 게시글 스크랩 |
| POST | `/report` | 게시글 신고 |
| GET | `/channels` | 채널 목록 |

---

## 📄 라이선스

MIT License

---

**Study-Board** — 현대적인 학습 커뮤니티 플랫폼 🚀

Made with ❤️ using Next.js + NestJS + TypeScript
