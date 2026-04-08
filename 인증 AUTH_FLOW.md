# 🔐 Study-Board 인증 시스템(Auth Flow) 완벽 가이드

오랜만에 돌아오셔서 인증 로직이 어떻게 흘러가는지 기억이 안 나실 때, 이 문서만 쭉 읽으시면 현재 코드 베이스(`back/src/auth`)가 어떻게 동작하는지 완벽하게 파악하실 수 있습니다.

---

## 🏗️ 전체적인 아키텍처 개요

현재 게시판의 인증 시스템은 **Stateless (JWT 기반)** 로직을 채택하고 있으며, **보안상 가장 권장되는 HttpOnly 쿠키 방식**을 혼합해서 사용하고 있습니다. 

*   **비밀번호 암호화:** `bcryptjs` (단방향 해시 암호화)
*   **토큰 발급:** Access Token (1시간) + Refresh Token (7일)
*   **토큰 저장소:** 브라우저의 `HttpOnly` 쿠키 (XSS 공격 방어)
*   **인증 미들웨어:** NestJS의 `@nestjs/passport` + `JwtStrategy` + `AuthGuard()`

---

## 🔄 시나리오별 동작 원리

### 1. 🐣 회원가입 (`POST /api/auth/signup`)

1. 클라이언트가 이메일(`user_email`), 닉네임(`nickname`), 비밀번호(`password`)를 보냅니다.
2. `AuthService.signUp`에서 이메일 중복, 닉네임 중복을 `User` 테이블에서 검사합니다.
3. **가장 중요한 부분:** `password`를 디비에 평문으로 넣지 않고, `bcrypt.genSalt()`를 생성한 뒤 `bcrypt.hash(password, salt)`로 강력하게 해시화합니다.
4. 해시화된 비밀번호를 가진 사용자를 DB에 저장하고 `201 Created`를 반환합니다.

### 2. 🔑 로그인 (`POST /api/auth/signin`)

1. 사용자가 이메일과 비밀번호를 보냅니다.
2. `AuthService.signIn`이 해당 이메일을 가진 User를 조회합니다.
3. DB에 저장된 해시화된 비밀번호와 입력받은 비밀번호를 `bcrypt.compare()`로 비교하여 일치하는지 확인합니다.
4. 비밀번호가 일치하면 `AuthController`로 돌아옵니다.
5. **토큰 발급 및 쿠키 굽기:**
   * **Access Token:** 사용자 ID(`id`)와 이메일(`user_email`)을 넣고 **1시간 수명**으로 발급.
   * **Refresh Token:** 사용자 ID(`id`)만 넣고 **7일 수명**으로 발급.
   * 이 발급된 두 개의 토큰을 **`res.cookie()`를 통해 `HttpOnly`, `Strict`, `Secure(운영계)` 쿠키**에 구워버립니다. (자바스크립트 우회 탈취 원천 차단)
6. 로그인 성공 응답 시 프론트엔드가 상태 처리를 할 수 있도록 `accessToken`을 Body에도 담아 내려줍니다.

### 3. 🛡️ API 접근 권한 검증 (`@UseGuards(AuthGuard())`)

1. 프로필 수정, 내 글 쓰기 등 로그인이 필요한 엔드포인트에는 `@UseGuards(AuthGuard())`가 달려 있습니다.
2. 클라이언트가 이 API들을 호출하면, 브라우저가 알아서 쿠키에 들어있던 `access_token`을 백엔드로 가져옵니다.
3. `JwtStrategy`가 토큰의 서명(Secret Key)과 만료 시간을 검사하고, 통과되면 `req.user` 안에 파싱된 데이터(id, email)를 담아줍니다. (이후 `@GetUser()` 데코레이터로 꺼내 씁니다.)

### 4. 🔄 토큰 갱신 (Refresh Token 활용) (`POST /api/auth/refresh`)

Access Token(수명 1시간)이 만료되었을 때, 사용자를 강제로 로그아웃시키지 않고 몰래 토큰을 연장해주는 마법 같은 API입니다.

1. 프론트엔드가 401(만료) 에러를 맞으면, 이 `/refresh` API를 때립니다.
2. `AuthController.refreshToken`은 브라우저 쿠키에 들어있던 `refresh_token`(수명 7일)을 꺼내 검증합니다.
3. 조작되지 않고 아직 7일이 안 지났다면, 해당 유저의 DB를 다시 조회합니다.
4. **새로운 Access Token(1시간)과 새로운 Refresh Token(7일)** 을 한 번 더 구워서 돌려줍니다. (이를 RTR - Refresh Token Rotation 기법이라고 부르며 최고 수준의 보안입니다!)

### 5. 🚪 로그아웃 (`POST /api/auth/logout`)

1. 사용자가 로그아웃을 누릅니다.
2. `res.clearCookie()`를 통해 브라우저에 구워놨던 `access_token`과 `refresh_token` 쿠키를 전부 삭제(무효화)합니다.

---

## 🎯 면접용/포트폴리오 어필 핵심 요약

만약 이력서나 면접 때 인증 어떻게 짰냐고 물어보시면, 이렇게 대답하시면 게임 끝납니다.

> "NestJS와 Passport를 이용해 완전한 Stateless 형태의 JWT 인증망을 구축했습니다.
> 보안성을 최대로 높이기 위해 LocalStorage 대신 XSS 방어가 가능한 **HttpOnly + SameSite Strict 쿠키**에 토큰을 저장되도록 구현했습니다.
> 또한, 사용자 편의성과 탈취 방지를 동시에 잡기 위해 **Refresh Token Rotation(RTR)** 방식을 구현하여, 1시간마다 액세스 토큰이 만료되어도 사용자가 모르게 서버 단에서 토큰을 자동 재갱신해 주는 유연한 토큰 사이클을 구축했습니다."
