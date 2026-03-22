# 백엔드 클린 아키텍처 가이드 (게시판 CRUD 예시)

## 📌 개요
이 문서는 백엔드 프로젝트에 적용된 **클린 아키텍처(Clean Architecture)** 의 개념과, `Board` 모듈(게시판 CRUD 예제)을 바탕으로 한 데이터의 흐름 및 구조를 이해하기 쉽게 설명하기 위해 작성되었습니다.

> **💡 왜 클린 아키텍처인가요?**
> 외부 요인(데이터베이스, 웹 프레임워크, UI 등)의 변경이 비즈니스 규칙(핵심 로직)에 영향을 주지 않도록 시스템을 분리하는 구조입니다. 유지보수가 용이해지고 각 레이어별 테스트가 매우 쉬워집니다.

---

## 🏗️ 폴더 구조 및 역할
클린 아키텍처는 크게 **도메인(Domain) - 애플리케이션(Application) - 인프라스트럭처(Infrastructure)** 3가지 계층으로 나뉩니다.

```text
src/board/
├── core/                                # 외부 라이브러리(TypeORM, NestJS 웹 등)에 의존하지 않는 순수 비즈니스 로직
│   ├── domain/                          # 1. 도메인 레이어
│   │   └── board.entity.ts              # 비즈니스 규칙을 가진 순수 도메인 객체 (DB 엔티티 아님!)
│   │
│   └── application/                     # 2. 애플리케이션 레이어 (유스케이스)
│       ├── ports/                       # 인터페이스(Port) 선언부
│       │   ├── in/                      # 들어오는 요청 (Controller가 사용할 Use Case 인터페이스)
│       │   │   └── board.use-case.ts
│       │   └── out/                     # 나가는 요청 (Service가 의존할 Repository 인터페이스)
│       │       └── board.repository.port.ts
│       │
│       └── services/                    # 비즈니스 흐름 제어 (Use Case 구현체)
│           └── board.service.ts
│
├── infrastructure/                      # 3. 인프라스트럭처 레이어 (외부 기술 구현)
│   └── adapters/                        # Port를 구현하거나(Out) Use Case를 호출(In)하는 어댑터
│       ├── in/                          # 입력 어댑터
│       │   └── web/                     # HTTP 컨트롤러
│       │       ├── board.controller.ts
│       │       └── dto/                 # 요청 데이터 구조
│       └── out/                         # 출력 어댑터
│           └── persistence/             # 데이터베이스 관련
│               ├── board.repository.ts  # TypeORM을 사용하는 Repository 구현체
│               └── mapper/
│                   └── board.mapper.ts  # TypeORM Entity ↔ Domain Entity 변환기
│
└── board.module.ts                      # 의존성 주입(DI) 및 모듈 조립
```

---

## 🔄 데이터 흐름 (Data Flow)

클린 아키텍처에서는 **의존성(Dependency)이 항상 외부 계층에서 내부 계층(Core)으로만** 향해야 합니다.
`Controller` -> `Use Case(Interface)` -> `Service` -> `Repository Port(Interface)` <- `TypeORM Repository`

### 예시: 📝 게시글 작성 (Create Board) 흐름

1. **[사용자/프론트엔드]** 가 `POST /api/board`로 데이터를 보냅니다.
2. **[Controller (In Adapter)]**
   - HTTP 요청을 받고 DTO(`CreateBoardDto`)로 검증합니다.
   - `BoardUseCase`(인터페이스)의 `createBoard()` 메서드를 호출합니다. (이때 Controller는 Service 구현체를 모릅니다)
3. **[Service (Application)]**
   - 전달받은 데이터로 순수 **Domain Entity**(`Board`)를 생성합니다.
   - 도메인 규칙을 검증합니다 (예: 제목 길이 제한 등).
   - 저장하기 위해 `BoardRepositoryPort`(인터페이스)의 `save()`를 호출합니다.
4. **[TypeORM Repository (Out Adapter)]**
   - `BoardMapper`를 사용해 순수 Domain Entity를 **TypeORM Entity**(`Story` 테이블 등)로 변환합니다.
   - DB에 데이터를 저장(INSERT)합니다.
   - 저장된 DB 데이터를 다시 순수 Domain Entity로 변환해 반환합니다.
5. **[응답]**
   - Service가 Domain Entity를 반환하면, Controller는 이를 클라이언트가 원하는 형식(JSON)으로 변환해 응답합니다.

---

## ✨ 핵심 포인트 (공부용)

1. **의존성 역전 원칙 (DIP - Dependency Inversion Principle)**
   - `board.service.ts` 파일(Core)을 보면 `TypeORM`이나 `Repository` 클래스를 직접 import하지 않습니다.
   - 오직 `board.repository.port.ts`(인터페이스)만 바라봅니다.
   - 이렇게 하면 나중에 TypeORM을 Prisma나 Mongoose로 바꾸더라도 `board.service.ts`는 단 한 줄도 수정할 필요가 없습니다!

2. **Domain Entity vs TypeORM Entity**
   - `src/entities/Story.entity.ts`: DB 테이블 스키마와 1:1 매칭되는 TypeORM 전용 객체.
   - `src/board/core/domain/board.entity.ts`: DB가 뭔지 전혀 모르는 순수한 비즈니스 객체.
   - `board.mapper.ts`가 이 둘 사이를 통역해주는 역할을 합니다.

3. **In/Out Port & Adapter**
   - **Port**: 통로(인터페이스)
   - **Adapter**: 그 통로에 꽂히는 실제 기기(구현체)
   - `Controller`는 웹과 애플리케이션을 연결하는 **Input Adapter**.
   - `TypeORM Repository`는 애플리케이션과 DB를 연결하는 **Output Adapter**.

이 폴더 구조와 흐름을 바탕으로 코드를 읽어보시면 클린 아키텍처의 강력한 의존성 분리를 느끼실 수 있습니다!
