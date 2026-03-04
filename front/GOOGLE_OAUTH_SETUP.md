# Google OAuth 로그인 설정 가이드 (NextAuth v4 + Next.js 14)

이 문서는 현재 프로젝트(front)에서 Google 로그인(NextAuth + Google Provider)을 활성화하는 방법을 정리합니다.

## 1) 사전 준비
- NextAuth 버전: 4.x (현재 package.json: `next-auth@^4.24.10`)
- Next.js 버전: 14.2.x
- 이미 Credentials 로그인(이메일/비밀번호)과 세션 커스텀 필드가 구성되어 있음

## 2) Google Cloud Console 설정
1. https://console.cloud.google.com/ 에 접속하여 프로젝트를 선택/생성합니다.
2. [API 및 서비스] → [사용자 인증 정보]로 이동합니다.
3. [사용자 인증 정보 만들기] → [OAuth 클라이언트 ID] 선택
4. 애플리케이션 유형: `웹 애플리케이션`
5. 승인된 자바스크립트 원본(Origin) 추가
   - 로컬 개발: `http://localhost:3000`
6. 승인된 리디렉션 URI 추가
   - `http://localhost:3000/api/auth/callback/google`
   - 배포 환경에서도 `https://YOUR_DOMAIN/api/auth/callback/google` 형태로 추가
7. 생성된 `클라이언트 ID`와 `클라이언트 보안 비밀`을 환경변수로 설정합니다.

## 3) 환경 변수 설정 (.env.local)
프로젝트 `front` 루트에 `.env.local` 파일을 만들고 다음을 채워주세요.

```
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=랜덤_긴_문자열
GOOGLE_CLIENT_ID=콘솔에서_발급받은_ID
GOOGLE_CLIENT_SECRET=콘솔에서_발급받은_SECRET

# 이미 사용 중인 값 (참고)
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

- NEXTAUTH_SECRET은 `openssl rand -base64 32` 등으로 생성한 안전한 문자열을 권장합니다.
- 배포 시에는 실제 도메인으로 `NEXTAUTH_URL`을 변경하고, 같은 키를 서버 환경변수에 등록하세요.

## 4) 코드 변경 요약
- 파일: `src/pages/api/auth/[...nextauth].ts`
  - `GoogleProvider`를 추가했고, `profile()`에서 우리 서비스 세션 스키마(`user_email`, `nickname`, `image`, `is_super_admin`)로 정규화했습니다.
  - `jwt` 콜백에서 OAuth/자격증명 모두 동일 포맷으로 토큰을 구성하도록 보정했습니다.
- 파일: `src/app/(beforeLogin)/login/page.tsx`
  - "Google로 계속하기" 버튼을 추가하고, `signIn("google")`로 리다이렉트를 시작합니다.

## 5) 실행 방법
개발 모드로 실행:

```bash
# Windows PowerShell 기준
$env:NODE_ENV="development"; npm run dev
```

브라우저에서 http://localhost:3000 접속 후 로그인 페이지에서 "Google로 계속하기" 버튼을 클릭합니다.

## 6) 세션 필드 매핑
우리 프로젝트는 세션에 아래 필드를 사용합니다.
- `user.id`
- `user.user_email`
- `user.nickname`
- `user.image`
- `user.is_super_admin`

Google 로그인 시 profile()에서 위 필드를 생성하므로, Credentials/Google 모두 동일한 세션 구조를 보장합니다.

## 7) 주의 사항 및 팁
- Google OAuth에서 이메일이 비공개로 설정된 계정은 `email`이 내려오지 않을 수 있습니다. 이 경우 `nickname`은 name 기반으로 구성됩니다.
- 기존 백엔드 토큰/쿠키 연동이 필요한 경우, Google 로그인 성공 후 백엔드에 세션 연동용 엔드포인트가 필요할 수 있습니다. (현재 흐름은 NextAuth로만 처리)
- 다중 도메인(로컬/스테이징/프로덕션)에서는 각각 리디렉션 URI를 모두 등록하세요.

## 8) 배포 체크리스트
- 환경변수(NEXTAUTH_URL, NEXTAUTH_SECRET, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET)를 배포 환경에 등록
- 도메인 기반 리디렉션 URI를 Google 콘솔에 추가
- HTTPS 사용(권장)

끝.
