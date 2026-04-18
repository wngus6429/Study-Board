# 🔒 Study-Board 보안 감사 보고서

> 작성일: 2026-04-18
> 대상: `back/` (NestJS 10), `front/` (Next.js 14)
> 범위: 인증/인가, 파일 업로드, CORS, 데이터 노출, 설정

---

## 📊 요약

| 등급 | 개수 | 대표 이슈 |
| --- | --- | --- |
| 🔴 Critical | 3 | 비밀번호 재설정 인증 우회, IDOR, AdminGuard 무력화 |
| 🟠 High | 5 | DB 자동 동기화 기본 ON, CORS 기본값, SameSite, Rate Limit 부재, Swagger 노출 |
| 🟡 Medium | 4 | 업로드 파일 필터 부재, 업로드 경로 추측, 민감 정보 로깅, 테스트용 엔드포인트 |
| 🟢 Good | 4 | bcrypt, HttpOnly 쿠키, Helmet, ValidationPipe whitelist |

---

## 🔴 Critical (즉시 수정 필요)

### 1. 비밀번호 재설정 인증 우회 (Account Takeover)

**파일**: `back/src/auth/auth.controller.ts:812`, `back/src/auth/auth.service.ts:851`

`POST /api/auth/reset-password`는 `user_email` + `new_password`만 받으면 **아무나 해당 계정의 비밀번호를 변경**할 수 있습니다. 이메일 소유권 검증이 전혀 없습니다.

```ts
// 현재 구현 (취약)
async resetPassword(resetPasswordDto: ResetPasswordDto) {
  const { user_email, new_password } = resetPasswordDto;
  const user = await this.userRepository.findOne({ where: { user_email } });
  // ❌ 토큰 검증 없이 바로 비밀번호 변경
  await this.userRepository.update(user.id, { password: hashedPassword });
}
```

**영향**: 이메일 주소만 알면 모든 계정 탈취 가능.

**해결 방안**:
1. `PasswordResetToken` 엔티티 생성 (token, userId, expiresAt, used)
2. `/forgot-password`에서 일회용 토큰 생성 → **이메일 전송** (nodemailer 등)
3. `/reset-password`는 `token` 필수 파라미터로 받고, 유효성 + 만료 + 사용 여부 검증
4. 토큰 만료 시간 10~30분, 사용 후 즉시 폐기

---

### 2. IDOR (Insecure Direct Object Reference)

**파일**: `back/src/auth/auth.controller.ts` (다수)

여러 엔드포인트가 `@UseGuards(AuthGuard())`만 적용하고, **body의 `id`/`userId`가 JWT 사용자와 일치하는지 검증하지 않습니다.**

| 엔드포인트 | 파일 라인 | 위험도 |
| --- | --- | --- |
| `POST /api/auth/password` | `auth.controller.ts:527` | 🔴 **타인 비밀번호 변경 가능** |
| `POST /api/auth/verifyPassword` | `auth.controller.ts:560` | 🟠 타인 비밀번호 존재 확인 |
| `POST /api/auth/update` | `auth.controller.ts:441` | 🟠 타인 프로필 변경 |
| `DELETE /api/auth/delete` | `auth.controller.ts:489` | 🟠 타인 이미지 삭제 |
| `POST /api/auth/userStoryTableData` | `auth.controller.ts:328` | 🟡 정보 노출 |
| `POST /api/auth/userCommentsTableData` | `auth.controller.ts:359` | 🟡 정보 노출 |

**해결 방안**:

```ts
// ✅ 수정 예시 - GetUser 데코레이터 사용
@Post('password')
@UseGuards(AuthGuard())
async changePassword(
  @GetUser() user: User,
  @Body() body: { password: string },
): Promise<void> {
  // JWT에서 가져온 user.id만 신뢰, body의 id는 무시
  await this.authUserService.changePassword({ id: user.id, password: body.password });
}
```

---

### 3. AdminGuard 채널 관리자 체크 무력화

**파일**: `back/src/auth/admin.guard.ts:120-138`

```ts
private isChannelAdmin(request: any, user: any): boolean {
  if (user.is_super_admin) return true;
  const channelId = request.params.channelId;
  const channelSlug = request.params.slug;
  if (channelId || channelSlug) {
    // 여기서는 간단히 true 반환 (추후 채널 서비스에서 구현)
    return true; // ❌ 로그인만 하면 채널 관리자 권한 획득
  }
  return false;
}
```

**영향**: `@AdminRequired(AdminLevel.CHANNEL_ADMIN)`이 붙은 엔드포인트에서 인증된 사용자 누구나 채널 관리자 권한 획득.

**해결 방안**: 실제로 `Channel` 엔티티를 조회해서 `creator_id === user.id` 또는 별도 `ChannelAdmin` 테이블 검증 구현.

---

## 🟠 High

### 4. DB 자동 동기화 기본값이 ON

**파일**: `back/src/app.module.ts:77`

```ts
synchronize: process.env.DB_SYNC !== 'false'
```

`DB_SYNC` env를 안 넣으면 운영에서도 `synchronize: true` — 스키마 자동 변경으로 **데이터 유실 위험**.

**해결**: 기본값을 `false`로 뒤집기. `process.env.DB_SYNC === 'true'`로 변경.

---

### 5. CORS 기본값이 localhost

**파일**: `back/src/main.ts:79`, `back/src/main.ts:29`

```ts
origin: process.env.CORS_ORIGINS?.split(',') ?? ['http://localhost:3000']
```

`CORS_ORIGINS` env 누락 시 `localhost`만 허용 + `credentials: true`. 운영 env 사고 시 서비스 장애.

**해결**: 운영에서는 env 필수화. 미설정 시 부트스트랩 실패 또는 빈 배열.

---

### 6. SameSite=strict + 크로스 도메인 운영

**파일**: `back/src/auth/auth.controller.ts:187-196`

```ts
res.cookie('access_token', accessToken, {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict', // ❌ 크로스 도메인이면 쿠키 전송 안 됨
});
```

프론트/백엔드 도메인이 다르면 쿠키가 실리지 않아 인증 자체가 깨짐.

**해결**: 운영에서 `sameSite: 'none'` + `secure: true` (크로스 도메인 시), 같은 도메인이면 `'lax'` 권장.

---

### 7. 로그인/비밀번호 API Rate Limit 부재

`/signin`, `/forgot-password`, `/reset-password`, `/verifyPassword`에 throttling이 없어 **무차별 대입 공격 가능**.

**해결**:
```bash
npm i @nestjs/throttler
```

```ts
// app.module.ts
ThrottlerModule.forRoot([{ ttl: 60000, limit: 10 }])

// auth.controller.ts
@Throttle({ default: { limit: 5, ttl: 60000 } })
@Post('signin')
```

---

### 8. Swagger 문서 운영 노출

**파일**: `back/src/main.ts:129`

```ts
SwaggerModule.setup('api', app, document);
```

운영 환경에서도 `/api`로 전체 엔드포인트 공개 → 공격 표면 노출.

**해결**:
```ts
if (process.env.NODE_ENV !== 'production') {
  SwaggerModule.setup('api', app, document);
}
```

---

## 🟡 Medium

### 9. 업로드 파일 타입 검증 부재

**파일**: `back/src/common/utils/multer.options.ts`

공용 `getMulterOptions`에 `fileFilter`가 없습니다. `.html`, `.svg`(저장형 XSS), `.exe` 등 업로드 가능.

**해결**:
```ts
fileFilter: (req, file, cb) => {
  const allowed = /^image\/(jpeg|png|gif|webp)$|^video\/(mp4|webm)$/;
  if (allowed.test(file.mimetype)) cb(null, true);
  else cb(new Error('허용되지 않은 파일 형식입니다.'), false);
}
```

---

### 10. 업로드 파일 경로 추측 가능 + 접근 제어 없음

**파일**: `back/src/main.ts:91-105`

모든 업로드 디렉토리가 인증 없이 `useStaticAssets`로 공개됩니다. 파일명 규칙이 `원본명_YYYYMMDD.ext`라 추측이 쉽습니다.

**해결**:
- 파일명을 UUID로 변경 (이미 S3 경로는 UUID 사용 중, 로컬도 통일)
- 민감 파일은 presigned URL 또는 권한 검사 미들웨어 적용

---

### 11. 민감 정보 로깅

전반적으로 `console.log`로 이메일/닉네임/userId를 대량 출력합니다 (`auth.service.ts`, `auth.controller.ts` 전체).

**해결**:
- 운영에서는 `Logger` 사용 + 로그 레벨 분리
- PII는 해시하거나 마스킹 (`u***@***.com`)

---

### 12. 테스트용 엔드포인트 운영 노출

**파일**: `back/src/auth/auth.controller.ts:220` (`/signinSession`)

주석에 "개발/테스트 목적"이라고 적혀 있지만 운영에도 노출 중.

**해결**: 운영 빌드에서 제거하거나 `NODE_ENV` 가드 추가.

---

## 🟢 잘 되어 있는 부분

- ✅ **bcrypt** 비밀번호 해시화 (salt 자동 생성)
- ✅ **HttpOnly 쿠키**로 JWT 저장 (XSS 완화)
- ✅ **Helmet** 보안 헤더 적용
- ✅ **ValidationPipe** `whitelist: true` + `transform: true`
- ✅ JWT 검증 시 **DB 사용자 재조회** (토큰 탈취 대응)
- ✅ Refresh Token 분리 운영

---

## 🎯 수정 우선순위 로드맵

### 1주차 — Critical 차단
- [ ] **#1** 비밀번호 재설정에 이메일 토큰 도입
- [ ] **#2** 모든 인증 엔드포인트를 `@GetUser()` 패턴으로 교체
- [ ] **#3** `AdminGuard.isChannelAdmin` 실제 DB 검증 구현

### 2주차 — High 차단
- [ ] **#4** `synchronize` 기본값 `false`로 변경
- [ ] **#5** 운영 환경 CORS env 필수화
- [ ] **#6** 운영용 쿠키 설정 (`sameSite: 'none'` + `secure`)
- [x] **#7** `@nestjs/throttler`로 로그인/비밀번호 API Rate Limit
- [ ] **#8** Swagger 운영 차단

### 3주차 — Medium 정리
- [ ] **#9** 업로드 `fileFilter` 공용화
- [ ] **#10** 파일명 UUID 통일 + 정적 접근 제어
- [ ] **#11** 로깅 정책 수립 (PII 마스킹)
- [ ] **#12** 테스트 엔드포인트 정리

---

## 📎 참고

- [OWASP Top 10 (2021)](https://owasp.org/Top10/)
- [NestJS 공식 Security](https://docs.nestjs.com/security/authentication)
- [OWASP Password Reset Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Forgot_Password_Cheat_Sheet.html)
