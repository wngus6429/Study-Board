# 🛡️ Study-Board 프로젝트 보안 개선 보고서

본 보고서는 프로젝트 내 발견된 주요 보안 취약점들을 조치하고 개선한 내역을 정리한 것입니다. 서버 환경(EC2)에서 보다 안전하게 구동되도록 각종 하드코딩된 값과 검증 로직을 보완하였습니다.

---

## 🚨 1. 치명적인 보안 취약점 수정 (Critical)

### ① 프론트엔드 환경변수(`.env`) Git 노출 방지
- **문제점:** `front/.env` 파일이 Git에 트래킹되어 저장소에 노출되고 있었습니다.
- **조치 내용:** 
  - `git rm --cached front/.env` 명령어를 통해 Git 캐시에서 `.env` 파일을 제거했습니다.
  - `front/.gitignore` 파일에 `.env`를 추가하여 앞으로 커밋되지 않도록 조치했습니다.

### ② 클라이언트 사이트 비밀번호 노출 해결
- **문제점:** `front/.env` 파일에서 `NEXT_PUBLIC_SITE_PASSWORD`를 사용하여 브라우저(클라이언트) 환경에 비밀번호 평문이 그대로 노출되었습니다.
- **조치 내용:**
  - `front/.env` 파일 내 환경변수명을 `NEXT_PUBLIC_SITE_PASSWORD`에서 `SITE_PASSWORD`로 변경하여 서버에서만 접근할 수 있게 수정했습니다.
  - `front/src/app/actions/verifySitePassword.ts` 파일(Next.js Server Action)을 생성하여 **서버 환경에서 비밀번호를 안전하게 검증**하도록 변경했습니다.
  - `SitePasswordGate.tsx`에서 서버 액션을 호출하는 방식으로 로직을 개편했습니다.

### ③ 백엔드 JWT 시크릿 키 분리
- **문제점:** JWT 생성/검증에 사용되는 시크릿 키가 `'park'`이라는 문자열로 하드코딩되어 있었습니다.
- **조치 내용:**
  - `back/src/auth/auth.module.ts` 및 `jwt.strategy.ts`에서 하드코딩된 값을 `process.env.JWT_SECRET`으로 변경하여 환경 변수를 사용하도록 수정했습니다. 
  - `.env` 파일(백엔드)에서 안전한 키를 설정하여 사용할 수 있습니다.

### ④ TypeORM 스키마 동기화(Synchronize) 옵션 안전화
- **문제점:** `synchronize: true` 옵션이 켜져 있어 운영 환경(EC2) 실행 시 데이터베이스 구조가 강제로 변경되어 데이터가 날아갈 위험이 있었습니다.
- **조치 내용:**
  - `process.env.NODE_ENV !== 'production'` 조건문을 적용하여, 개발 환경에서만 자동 동기화되고 **운영 환경(production)에서는 `false`로 동작하도록** 방어 코드를 작성했습니다.

---

## ⚠️ 2. 파일 업로드 및 DB 연결 보안 강화 (High)

### ① 파일 업로드 취약점 방어 (사진 용량 5MB 제한)
- **문제점:** 파일 크기 제한 및 확장자 검증 로직이 주석 처리되어 있어 악성 스크립트 파일이 업로드 되거나, 무제한 용량으로 서버 디스크(EC2)가 가득 찰 수 있었습니다.
- **조치 내용:**
  - `AuthModule`, `ChannelsModule`, `SuggestionModule`의 `Multer` 설정에서 **사진 용량 한도를 5MB(`5 * 1024 * 1024`)** 로 제한했습니다.
  - `fileFilter`를 활성화하여 `image/`로 시작하는 파일만 업로드할 수 있도록 방어 로직을 복구했습니다.
  - *참고: `StoryModule`의 경우 동영상 업로드 기능이 있어, 서비스 로직에 맞게 한도를 50MB로 대폭 축소(기존 1000MB)하여 조치했습니다.*

### ② 데이터베이스(DB) 연결 정보 환경변수 처리
- **문제점:** `root`, `board-study`, `localhost` 등 DB 접근 정보가 하드코딩되어 소스코드 유출 시 DB까지 해킹될 가능성이 있었습니다.
- **조치 내용:**
  - `TypeOrmModule.forRootAsync`를 사용하여 `process.env.DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` 등의 환경변수를 불러와 연결하도록 수정했습니다.

---

## 💡 3. 서버 방어력 개선 (Medium)

### ① DTO Mass Assignment (파라미터 변조) 방지
- **문제점:** `main.ts`의 `ValidationPipe`에 옵션이 없어 DTO에 명시되지 않은 악성/관리자 속성(예: `isAdmin: true`)이 필터링 없이 그대로 백엔드에 들어올 수 있었습니다.
- **조치 내용:**
  - `whitelist: true` (정의되지 않은 속성 자동 제거)
  - `forbidNonWhitelisted: true` (정의되지 않은 속성 요청 시 즉시 차단)
  - 파이프라인 옵션을 추가하여 불필요하거나 악의적인 데이터 유입을 원천 차단했습니다.

### ② Helmet 미들웨어를 통한 웹 보안 헤더 강화
- **문제점:** 기본 Express 환경에서 XSS 방어나 클릭재킹 등을 막아주는 보안 헤더가 누락되어 있었습니다.
- **조치 내용:**
  - `helmet` 패키지를 설치(`npm install helmet`)하고 `main.ts`에 `app.use(helmet())`을 전역 적용하여 기본적인 HTTP 방어 헤더를 세팅했습니다.

---

### 📝 추후 권장 사항
1. **환경변수 세팅:** `back/.env` 및 `front/.env` 파일에 서버(운영) 환경에 맞는 실제 패스워드와 키값(예: `JWT_SECRET`)을 반드시 길고 복잡하게 구성해주세요.
2. **리미트(Rate Limit):** 현재 백엔드에 `@nestjs/throttler`를 설치해 두었으나, API 별로 무차별 대입 공격을 막기 위해 추후 앱 모듈에 Throttler 구성을 추가하시는 것을 권장합니다.
