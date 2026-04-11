# Study-Board 인증(Auth) 아키텍처 가이드

본 문서는 Study-Board 프로젝트의 프론트엔드(Next.js)와 백엔드(NestJS) 간의 로그인 인증 및 토큰 관리 아키텍처에 대해 상세히 설명합니다.

## 1. 개요 (Overview)

Study-Board의 인증 시스템은 **NextAuth(프론트엔드)**와 **JWT 기반의 HttpOnly 쿠키(백엔드)**를 혼합하여 사용하고 있습니다. 
프론트엔드 화면 상태 관리는 NextAuth의 세션(JWT)을 사용하고, 백엔드 API와의 통신은 HttpOnly 쿠키에 저장된 `access_token`과 `refresh_token`을 사용하여 보안성을 높였습니다.

## 2. 백엔드 (NestJS) 인증 구조

백엔드는 `access_token`과 `refresh_token`을 발급하고 관리하며, 보안을 위해 두 토큰 모두 **HttpOnly 쿠키**로 프론트엔드에 전달합니다.

### 2.1 로그인 및 토큰 발급 (`auth.controller.ts`)

일반적인 로그인 요청(`/auth/signin`) 시, 사용자의 자격 증명을 확인하고 두 개의 토큰을 발급하여 쿠키에 저장합니다.
* **Access Token**: 1시간 유효 (`TOKEN_EXPIRATION_TIME`)
* **Refresh Token**: 7일 유효

```typescript
@Post('signin')
async signin(@Body(ValidationPipe) userData: SigninUserDto, @Res() res: Response): Promise<void> {
  const user = await this.authUserService.signIn(userData);

  // JWT Access Token 생성 (1시간 유효)
  const accessToken = this.jwtService.sign(
    { id: user.id, user_email: user.user_email },
    { expiresIn: TOKEN_EXPIRATION_TIME },
  );

  // Refresh Token 생성 (7일 유효)
  const refreshToken = this.jwtService.sign(
    { id: user.id },
    { expiresIn: '7d' },
  );

  // Access Token을 HttpOnly 쿠키에 저장 (XSS 공격 방지)
  res.cookie('access_token', accessToken, {
    httpOnly: true, // JavaScript로 접근 불가
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict', // CSRF 공격 방지
  });

  // Refresh Token을 HttpOnly 쿠키에 저장
  res.cookie('refresh_token', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7일 (밀리초)
  });

  res.status(200).json({ accessToken });
}
```

*참고: NextAuth를 위한 세션 전용 로그인 엔드포인트(`/auth/signinSession`)도 존재하며, 이 경우 쿠키 설정 없이 사용자 정보 객체만 JSON으로 반환합니다.*

### 2.2 JWT 검증 전략 (`jwt.strategy.ts`)

백엔드의 API를 보호하는 Guard(`@UseGuards(AuthGuard('jwt'))`)는 `JwtStrategy`를 사용합니다. 
이 전략은 **HttpOnly 쿠키에서 `access_token`을 직접 추출**하여 검증합니다.

```typescript
// 쿠키에서 JWT 토큰 추출 설정
jwtFromRequest: ExtractJwt.fromExtractors([
  (req: Request) => {
    const token = req.cookies?.access_token;
    if (!token) {
      console.log('🍪 쿠키에서 JWT 토큰을 찾을 수 없음');
      return null;
    }
    return token;
  },
]),
```

### 2.3 토큰 재발급 (Refresh Token)

`access_token`이 만료되었을 때, 클라이언트는 `/auth/refresh` 엔드포인트를 호출합니다. 백엔드는 쿠키의 `refresh_token`을 검증한 뒤 새로운 토큰을 발급합니다.

```typescript
@Post('refresh')
async refreshToken(@Req() req: Request, @Res() res: Response) {
  const refreshToken = req.cookies?.refresh_token;
  if (!refreshToken) return res.status(401).json({ message: '리프레시 토큰이 없습니다.' });

  try {
    const payload = this.jwtService.verify(refreshToken, { secret: process.env.JWT_SECRET });
    const user = await this.authUserService.findUserById(payload.id);

    // 새로운 액세스/리프레시 토큰 생성 및 쿠키 덮어쓰기 로직...
  } catch (err) {
    // ...
  }
}
```

---

## 3. 프론트엔드 (Next.js) 인증 구조

프론트엔드는 **NextAuth**를 사용하여 로그인 상태를 UI 수준에서 관리하며, **Axios Interceptor**를 통해 백엔드 API 통신 시 토큰 만료를 자동으로 처리합니다.

### 3.1 NextAuth 설정 (`[...nextauth].ts`)

NextAuth는 `CredentialsProvider`와 `GoogleProvider`를 지원합니다. 
* `CredentialsProvider`의 `authorize` 함수에서 백엔드의 `/api/auth/signinSession` API를 호출하여 사용자 정보를 받아옵니다.
* 받아온 정보를 바탕으로 NextAuth 자체 JWT 세션을 생성합니다. (기본 30분 유지)

```typescript
export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        user_email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        try {
          const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/signinSession`, {
            method: "POST",
            body: JSON.stringify(credentials),
            headers: { "Content-Type": "application/json" },
          });
          if (!res.ok) return null;
          
          const user = await res.json();
          return {
            id: user.id,
            user_email: user.user_email,
            nickname: user.nickname,
            image: user.image,
            is_super_admin: user.is_super_admin,
          };
        } catch (error) { return null; }
      },
    }),
    // ... GoogleProvider 생략
  ],
  callbacks: {
    async jwt({ token, user, trigger, session: newSession }) {
      if (user) {
        token.id = (user as any).id;
        token.user_email = (user as any).user_email;
        // ... 커스텀 필드 저장
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.id as string;
      session.user.user_email = token.user_email as string;
      // ... 세션에 정보 주입
      return session;
    },
  },
  session: { strategy: "jwt", maxAge: 1800 },
};
```

### 3.2 Axios 인터셉터를 통한 자동 토큰 갱신 (`axios.ts`)

모든 백엔드 API 요청은 커스텀 Axios 인스턴스를 통해 이루어집니다. 
이때 백엔드에서 `401 Unauthorized` (access_token 만료) 에러가 반환되면, **인터셉터가 이를 가로채어 자동으로 `/api/auth/refresh` API를 호출하고 원래의 요청을 재시도**합니다.

```typescript
// axios.ts
const instance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_BASE_URL,
  withCredentials: true, // 중요: 백엔드로 쿠키(토큰) 전송을 위해 필수
});

instance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // 401 에러(인증 실패)이고, 아직 재시도하지 않은 요청인 경우
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // 리프레시 토큰으로 새로운 액세스 토큰 갱신 요청 (쿠키 포함)
        await axios.post(`${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/refresh`, {}, { 
          withCredentials: true 
        });
        
        // 새로운 토큰(쿠키 갱신됨)으로 원래 실패했던 API 요청 재시도
        return instance(originalRequest);
      } catch (refreshError) {
        // 리프레시 토큰도 만료된 경우 강제 로그아웃 (로그인 페이지로 이동)
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);
```

## 4. 인증 흐름 요약 (Authentication Flow)

1. **로그인 시도:** 사용자가 프론트엔드에서 로그인 정보를 입력합니다.
2. **NextAuth 세션 생성:** NextAuth가 백엔드의 `/api/auth/signinSession`을 통해 사용자 정보를 검증하고, 프론트엔드 상태 관리를 위한 `Session(JWT)`을 생성합니다.
3. **토큰 발급 (선택적):** 일반적인 `/auth/signin` API 호출 시, 백엔드는 `access_token`과 `refresh_token`을 HttpOnly 쿠키에 담아 응답합니다. (NextAuth 흐름과 별도로 API 통신을 위해 사용됨)
4. **API 요청:** 프론트엔드는 Axios(`withCredentials: true`)를 사용하여 API를 요청하며, 이때 HttpOnly 쿠키에 저장된 토큰이 브라우저에 의해 자동으로 백엔드에 전송됩니다.
5. **토큰 만료 시 (401 에러):** 
   - 백엔드는 쿠키의 `access_token`이 만료되었으면 401 응답을 내립니다.
   - 프론트엔드의 Axios 인터셉터가 401을 감지하고 백엔드의 `/auth/refresh`를 호출합니다.
   - 백엔드는 쿠키의 `refresh_token`을 확인하고 새로운 토큰 쌍을 쿠키로 재설정합니다.
   - 인터셉터는 원래 하려던 API 요청을 재시도합니다.
6. **완전 만료:** `refresh_token`마저 만료된 경우 갱신에 실패하며, 사용자는 `/login` 페이지로 강제 리다이렉트 됩니다.
