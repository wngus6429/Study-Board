# Study-Board 도커화(Docker) 가이드

> **작성일**: 2026년 2월 20일  
> **목적**: 현재 Study-Board 프로젝트에 맞춘 Docker 컨테이너화 가이드

---

## 📋 현재 프로젝트 구성 요약

| 구성요소 | 기술 스택 | 포트 |
|---------|-----------|------|
| 프론트엔드 | Next.js 14 (React 18) | 3000 |
| 백엔드 | NestJS 10 (Express) | 9999 |
| 데이터베이스 | MySQL 8.0+ | 3306 |
| WebSocket | Socket.IO 4.8.1 | 9999 (백엔드와 동일) |

### 현재 업로드 디렉토리 (5개)
- `upload/` — 게시글 첨부 이미지
- `userUpload/` — 사용자 프로필 이미지
- `channelUpload/` — 채널 대표 이미지
- `suggestionUpload/` — 건의사항 첨부 이미지
- `videoUpload/` — 게시글 첨부 동영상

---

## 🗂️ 전체 작업 순서

```
1단계: .dockerignore 파일 만들기
2단계: 백엔드(NestJS) Dockerfile 만들기
3단계: 프론트엔드(Next.js) Dockerfile 만들기
4단계: docker-compose.yml로 전체 묶기
5단계: 환경변수 분리하기 (.env)
6단계: 실행 및 테스트
```

---

## 1단계: .dockerignore 파일 만들기

> Docker 빌드할 때 불필요한 파일을 제외해서 빌드 속도를 올림

### `back/.dockerignore`
```
node_modules
dist
.git
*.md
.eslintrc.js
.prettierrc
```

### `front/.dockerignore`
```
node_modules
.next
.git
*.md
```

### 💡 왜 필요한가?
- `node_modules`는 Docker 안에서 새로 `npm install` 하기 때문에 로컬꺼 복사할 필요 없음
- 빌드 컨텍스트가 작아지면 → Docker 빌드 속도가 빨라짐

---

## 2단계: 백엔드(NestJS) Dockerfile

### `back/Dockerfile`
```dockerfile
# ============================================
# 1) 빌드 단계 (Build Stage)
# ============================================
FROM node:20-alpine AS builder

# 작업 디렉토리 설정
WORKDIR /app

# package.json만 먼저 복사 → npm install 캐싱 활용
COPY package.json package-lock.json ./

# 의존성 설치
RUN npm ci

# 소스코드 복사
COPY . .

# NestJS 빌드 (TypeScript → JavaScript)
RUN npm run build

# ============================================
# 2) 실행 단계 (Production Stage)
# ============================================
FROM node:20-alpine AS runner

WORKDIR /app

# 프로덕션 의존성만 설치
COPY package.json package-lock.json ./
RUN npm ci --only=production

# 빌드 결과물 복사
COPY --from=builder /app/dist ./dist

# 업로드 디렉토리 생성 (컨테이너 내부)
RUN mkdir -p upload userUpload channelUpload suggestionUpload videoUpload

# 포트 노출
EXPOSE 9999

# 서버 실행
CMD ["node", "dist/main"]
```

### 💡 핵심 포인트
- **멀티스테이지 빌드**: `builder`에서 빌드 → `runner`에서 실행. 최종 이미지 크기가 작아짐
- **`npm ci`**: `package-lock.json` 기반 정확한 버전 설치 (npm install보다 빠르고 안정적)
- **업로드 폴더**: 컨테이너 안에 만들되, 후에 **Volume으로 연결**해서 데이터 유지

---

## 3단계: 프론트엔드(Next.js) Dockerfile

### `front/Dockerfile`
```dockerfile
# ============================================
# 1) 의존성 설치 단계
# ============================================
FROM node:20-alpine AS deps

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

# ============================================
# 2) 빌드 단계
# ============================================
FROM node:20-alpine AS builder

WORKDIR /app

# 의존성 복사
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# 빌드 시 백엔드 URL 설정 (환경변수)
ENV NEXT_PUBLIC_BASE_URL=http://localhost:9999

# Next.js 빌드
RUN npm run build

# ============================================
# 3) 실행 단계
# ============================================
FROM node:20-alpine AS runner

WORKDIR /app

# 프로덕션 환경 설정
ENV NODE_ENV=production

# 필요한 파일만 복사 (standalone 모드가 아닌 경우)
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/public ./public

EXPOSE 3000

CMD ["npm", "start"]
```

### 💡 standalone 모드 (선택사항)
`next.config.js`에 아래를 추가하면 이미지 크기를 더 줄일 수 있음:
```js
module.exports = {
  output: 'standalone',
};
```
standalone 모드 사용 시, `COPY` 부분을 `.next/standalone`으로 변경해야 함.

---

## 4단계: docker-compose.yml (핵심!)

> 프로젝트 루트(`Study-Board/`)에 생성

### `docker-compose.yml`
```yaml
version: '3.8'

services:
  # ============================================
  # 🗄️ MySQL 데이터베이스
  # ============================================
  db:
    image: mysql:8.0
    container_name: study-board-db
    restart: always
    environment:
      MYSQL_ROOT_PASSWORD: 6429           # 현재 app.module.ts에 설정된 비밀번호
      MYSQL_DATABASE: board-study         # 현재 사용 중인 DB 이름
      MYSQL_CHARSET: utf8mb4              # 이모지 지원
      MYSQL_COLLATION: utf8mb4_general_ci
    ports:
      - "3306:3306"
    volumes:
      - mysql_data:/var/lib/mysql         # DB 데이터 영속화 (컨테이너 삭제해도 유지)
    command: --character-set-server=utf8mb4 --collation-server=utf8mb4_general_ci
    healthcheck:                          # DB 준비 상태 체크
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost"]
      interval: 10s
      timeout: 5s
      retries: 5

  # ============================================
  # ⚙️ NestJS 백엔드
  # ============================================
  backend:
    build:
      context: ./back                     # back 폴더 기준으로 빌드
      dockerfile: Dockerfile
    container_name: study-board-backend
    restart: always
    ports:
      - "9999:9999"
    environment:
      DB_HOST: db                         # docker-compose 내부에서는 서비스명으로 접근
      DB_PORT: 3306
      DB_USERNAME: root
      DB_PASSWORD: 6429
      DB_DATABASE: board-study
    volumes:
      # 업로드 파일을 호스트와 공유 (컨테이너 꺼져도 파일 유지)
      - ./back/upload:/app/upload
      - ./back/userUpload:/app/userUpload
      - ./back/channelUpload:/app/channelUpload
      - ./back/suggestionUpload:/app/suggestionUpload
      - ./back/videoUpload:/app/videoUpload
    depends_on:
      db:
        condition: service_healthy         # DB가 준비된 후에 백엔드 시작

  # ============================================
  # 🌐 Next.js 프론트엔드
  # ============================================
  frontend:
    build:
      context: ./front                    # front 폴더 기준으로 빌드
      dockerfile: Dockerfile
    container_name: study-board-frontend
    restart: always
    ports:
      - "3000:3000"
    environment:
      NEXT_PUBLIC_BASE_URL: http://backend:9999   # 백엔드 접근 URL
      NEXTAUTH_URL: http://localhost:3000
    depends_on:
      - backend                           # 백엔드가 먼저 시작된 후에 프론트 시작

# ============================================
# 📦 볼륨 정의
# ============================================
volumes:
  mysql_data:                             # MySQL 데이터 영속 저장소
```

### 💡 핵심 개념 설명

| 개념 | 설명 |
|------|------|
| `depends_on` | 서비스 시작 순서 지정. DB → 백엔드 → 프론트 순서로 뜸 |
| `healthcheck` | DB가 진짜 쿼리 받을 준비가 됐는지 확인 후 백엔드 시작 |
| `volumes` | 컨테이너가 삭제돼도 데이터 유지. 업로드 파일과 DB 데이터 보존 |
| `environment` | 환경변수로 설정값 주입. 하드코딩 대신 이걸로 관리 |
| `DB_HOST: db` | 컨테이너끼리는 서비스명(`db`)으로 통신. `localhost`가 아님! |

---

## 5단계: 백엔드 환경변수 대응 (app.module.ts 수정 필요)

현재 `app.module.ts`에 DB 정보가 **하드코딩**되어 있음:
```typescript
// 현재 (하드코딩)
TypeOrmModule.forRoot({
  host: 'localhost',
  port: 3306,
  username: 'root',
  password: '6429',
  database: 'board-study',
  ...
})
```

Docker에서 쓰려면 **환경변수로 변경**해야 함:
```typescript
// 변경 후 (환경변수 사용)
TypeOrmModule.forRoot({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 3306,
  username: process.env.DB_USERNAME || 'root',
  password: process.env.DB_PASSWORD || '6429',
  database: process.env.DB_DATABASE || 'board-study',
  ...
})
```

> 💡 `|| 'localhost'`로 기본값을 남겨두면, Docker 없이 로컬에서도 기존처럼 작동함

### CORS도 수정 필요 (main.ts)
현재 `localhost:3000`만 허용 중인데, Docker 환경에서는:
```typescript
// 현재
origin: ['http://localhost:3000', 'http://127.0.0.1:3000']

// Docker 환경 추가
origin: [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://frontend:3000',  // Docker 내부 통신용
]
```

---

## 6단계: 실행하기

### 🚀 전체 서비스 한번에 올리기
```bash
# 프로젝트 루트(Study-Board/)에서 실행
docker-compose up --build
```

### 개별 확인
```bash
# 실행 중인 컨테이너 확인
docker-compose ps

# 백엔드 로그 보기
docker-compose logs backend

# 프론트엔드 로그 보기
docker-compose logs frontend

# DB에 직접 접속
docker-compose exec db mysql -u root -p6429 board-study
```

### 서비스 내리기
```bash
# 전체 중지
docker-compose down

# 전체 중지 + DB 데이터도 삭제 (주의!)
docker-compose down -v
```

---

## 🧠 Docker 핵심 개념 정리 (공부용)

### 컨테이너 vs 이미지
```
이미지 (Image)     = 설계도. Dockerfile로 만듦
컨테이너 (Container) = 설계도로 만든 실제 실행 인스턴스
```

### Volume이 왜 필요한가?
```
컨테이너는 삭제하면 내부 데이터도 사라짐
Volume으로 연결하면 → 호스트(내 PC)에 데이터 저장
→ 컨테이너를 삭제하고 다시 만들어도 데이터 유지

실제 사례:
  - mysql_data 볼륨 → DB 데이터 유지
  - ./back/upload 마운트 → 업로드한 이미지 유지
```

### 네트워크 (서비스 간 통신)
```
docker-compose 안의 서비스들은 같은 네트워크에 있음
→ 서비스명으로 서로 접근 가능

예시:
  백엔드에서 DB 접근 → host를 'localhost'가 아니라 'db'로!
  프론트에서 백엔드 접근 → 'http://backend:9999'
  브라우저에서 접근 → 'http://localhost:3000' (포트포워딩)
```

### 멀티스테이지 빌드
```
왜 쓰는가?
  → 빌드에 필요한 도구(TypeScript, 빌드 도구 등)는 실행할 때 필요 없음
  → 빌드 스테이지에서 컴파일 → 실행 스테이지에는 결과물만 복사
  → 최종 이미지 크기가 훨씬 작아짐 (배포 속도 향상)
```

---

## ⚠️ 주의사항

### 1. 현재 프로젝트에서 수정이 필요한 파일들
| 파일 | 수정 내용 |
|------|-----------|
| `back/src/app.module.ts` | DB 연결 정보 → 환경변수로 변경 |
| `back/src/main.ts` | CORS origin에 Docker 내부 호스트 추가 |

### 2. `synchronize: true` 문제
현재 TypeORM 설정에 `synchronize: true`가 있음.
- 개발 시에는 편리하지만, **Docker로 운영 배포할 때는 반드시 `false`로** 변경
- 대신 `typeorm migration:run`으로 스키마 관리

### 3. 파일 업로드 경로
Docker 컨테이너 안의 경로(`/app/upload`)와 호스트 경로(`./back/upload`)가
Volume으로 연결되므로 경로 설정 잘 확인해야 함.

### 4. Windows에서 Docker 사용 시
- **Docker Desktop for Windows** 설치 필요
- WSL 2 백엔드 권장 (성능이 훨씬 좋음)
- 파일 시스템 성능: WSL 내부에 프로젝트를 두면 더 빠름

---

## 📁 최종 파일 트리 (Docker 추가 후)

```
Study-Board/
├── docker-compose.yml          ← 새로 생성
├── back/
│   ├── Dockerfile              ← 새로 생성
│   ├── .dockerignore           ← 새로 생성
│   ├── package.json
│   ├── src/
│   │   ├── app.module.ts       ← 환경변수로 수정
│   │   ├── main.ts             ← CORS 수정
│   │   └── ...
│   ├── upload/                 ← Volume으로 연결
│   ├── userUpload/             ← Volume으로 연결
│   ├── channelUpload/          ← Volume으로 연결
│   ├── suggestionUpload/       ← Volume으로 연결
│   └── videoUpload/            ← Volume으로 연결
├── front/
│   ├── Dockerfile              ← 새로 생성
│   ├── .dockerignore           ← 새로 생성
│   ├── package.json
│   └── src/
└── ...
```

---

## ✅ 체크리스트 (따라하기)

- [ ] Docker Desktop 설치 (Windows)
- [ ] `back/.dockerignore` 생성
- [ ] `front/.dockerignore` 생성
- [ ] `back/Dockerfile` 생성
- [ ] `front/Dockerfile` 생성
- [ ] `docker-compose.yml` 생성 (프로젝트 루트)
- [ ] `app.module.ts` DB 설정 → 환경변수로 변경
- [ ] `main.ts` CORS → Docker 호스트 추가
- [ ] `docker-compose up --build` 실행
- [ ] `http://localhost:3000` 접속 확인
- [ ] `http://localhost:9999/api` Swagger 확인

---

_마지막 업데이트: 2026년 2월 20일_
