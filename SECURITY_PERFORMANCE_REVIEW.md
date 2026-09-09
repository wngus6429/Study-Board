# Study-Board 보안·성능 점검

점검일: 2026-09-09. 현재 로컬 소스와 lockfile 기준.

HTTPS 작업을 제외해도 먼저 수정해야 할 보안 문제가 있다. 특히 공개 응답의 비밀번호 해시 노출, 채팅 발신자 사칭, 채널 페이지의 저장형 XSS를 우선 처리해야 한다.

AWS 실행 환경, 배포된 커밋, 보안 그룹, IAM/S3 정책, DB 인덱스 실물, 운영 로그·부하 지표는 확인하지 않았다. 아래 재현은 모의 사용자·저장소·API 응답으로 실행했고 운영 서비스나 DB를 변경하지 않았다. 애플리케이션 소스는 수정하지 않았다.

## 1. 공개 채널 API에 생성자의 비밀번호 해시가 포함됨 — 높음

- 위치: `back/src/channels/channels.controller.ts:35`, `back/src/channels/channels.service.ts:29`, `back/src/entities/User.entity.ts:131`.
- 비로그인 채널 목록·상세·슬러그 조회에서 `creator` 관계를 조회하고 엔티티를 그대로 반환한다. `User.password`는 기본 조회 대상이며 응답 직렬화에서 제외하는 설정도 없다.
- 결과: 채널 생성자의 이메일과 비밀번호 해시가 공개 응답에 포함된다. 평문 비밀번호 노출은 아니지만, 해시를 확보한 외부인이 서버의 로그인 횟수 제한과 무관하게 비밀번호 추측을 시도할 수 있다.
- 검증: 실제 엔티티 메타데이터에서 password 기본 선택을 확인했고, 서비스에 넣은 모의 creator.password가 반환 결과에 남는 것을 확인했다. AWS 응답에 실제 노출됐는지는 별도 확인이 필요하다.
- 조치: 공개 응답 DTO에서 허용한 필드만 반환하고, password를 기본 조회에서 제외한다. 로그인·비밀번호 검증 쿼리는 필요한 경우에만 명시적으로 password를 선택하도록 함께 수정한다.

## 2. 로그인 토큰 없이 다른 사용자의 ID로 채팅 전송 가능 — 높음

- 위치: `back/src/channel-chat/channel-chat.gateway.ts:103`, `:123`, `:244`; `back/src/channel-chat/channel-chat.service.ts:88`.
- 소켓 연결에서 JWT를 검증하지 않는다. join_channel의 user_id와 user_nickname을 그대로 소켓에 저장하고, 메시지 저장 시 이 ID를 사용한다. 서비스는 해당 사용자가 존재하는지만 확인한다.
- 결과: 다른 회원의 ID를 알고 있으면 그 회원이 보낸 메시지로 저장할 수 있다. 공개 응답에 사용자 ID가 포함되므로 ID 비공개에 의존할 수도 없다.
- 검증: 토큰이 없는 모의 소켓에서 지정한 타인 ID가 메시지 저장 서비스에 전달되는 것을 실제 Gateway 메서드로 재현했다.
- 조치: 연결 시 JWT를 검증하여 발신자를 서버에서 결정한다. 채널 입장 상태·권한 및 토큰 만료를 확인하고 소켓 이벤트에도 메시지 빈도 제한을 적용한다. HTTP Throttler 등록만으로 이 Gateway의 인증과 메시지 제한이 구현되지는 않는다.

## 3. 채널 이름을 통한 저장형 XSS — 높음

- 위치: `back/src/channels/channels.controller.ts:81`, `back/src/channels/channels.service.ts:203`, `front/src/app/(noLogin)/channels/[slug]/page.tsx:195`.
- 채널 이름은 공백 여부만 검사한 뒤 저장한다. 서버 페이지가 이 이름을 포함한 JSON을 JSON.stringify만 거쳐 script 태그 안에 삽입한다. JSON.stringify는 HTML의 script 종료 태그를 무력화하지 않는다.
- 결과: 채널 생성 권한이 있는 회원이 이름에 특수한 문자열을 저장하면 방문자의 브라우저에서 스크립트가 실행될 수 있다. HttpOnly 쿠키가 있어도 같은 사이트에서 인증된 API 요청을 보내는 공격은 가능하다.
- 검증: 실제 페이지 TSX를 변환하고 fetch·하위 화면만 모의 처리하여 서버 렌더링했다. 모의 채널 이름이 JSON-LD script 밖의 실행 가능한 script 요소로 출력됐다. 브라우저·운영 서버에 공격 요청을 보내지는 않았다.
- 조치: JSON-LD 직렬화 시 `<`를 Unicode escape로 치환하고 해당 패턴을 쓰는 다른 페이지도 점검한다. CSP는 추가 방어로 검토한다.
- 참고: [Next.js JSON-LD 공식 안내](https://nextjs.org/docs/app/guides/json-ld).

## 4. 현재 비밀번호 확인 없이 비밀번호 변경 가능 — 높음

- 위치: `back/src/auth/auth.controller.ts:550`, `back/src/auth/auth.service.ts:661`.
- verifyPassword와 password API가 분리돼 있지만, password API는 앞선 검증 성공 여부나 현재 비밀번호를 확인하지 않는다. 새 비밀번호도 DTO가 아닌 인라인 타입으로 받아 서버의 비밀번호 정책 검증이 빠져 있다.
- 결과: 인증 세션을 사용할 수 있는 공격자는 기존 비밀번호를 모르는 상태에서도 비밀번호를 변경할 수 있다. 위 XSS와 결합하면 영향이 커진다. 비로그인 상태에서 곧바로 변경 가능하다는 뜻은 아니다.
- 검증: 실제 changePassword 서비스에 모의 사용자 ID와 새 비밀번호만 전달해 저장까지 진행됨을 확인했다.
- 조치: 현재 비밀번호와 새 비밀번호를 동일 API에서 검증하거나 짧은 수명의 재인증 증명을 요구한다. 변경 후 기존 세션을 폐기하는 절차도 필요하다.

## 5. 액세스 토큰으로 리프레시 토큰 발급 가능, 토큰 폐기 부재 — 높음

- 위치: `back/src/auth/auth.controller.ts:193`, `:267`, `:653`; `back/src/auth/jwt.strategy.ts:104`; `back/src/constants/tokenTime.ts:1`.
- access/refresh 토큰이 같은 서명 키를 사용하고 용도 구분 claim·검사가 없다. refresh API는 서명과 payload.id만 확인하므로 access 토큰도 받아들인다. 반대로 JWT 인증 전략도 ID만 든 refresh 토큰을 거부하지 않는다.
- 로그아웃은 브라우저 쿠키만 지우고, refresh 토큰을 서버에 등록하거나 이전 토큰을 무효화하는 처리가 없다. 비밀번호 변경에도 토큰 폐기가 없다.
- 결과: 탈취한 토큰을 갱신하면서 접근을 연장할 수 있다. 새 refresh 토큰을 발급하는 현재 동작만으로는 이전 토큰 재사용이 차단되지 않는다. 실제 access 만료 시간 상수는 86,400초, 즉 24시간이다.
- 검증: 실제 AuthController.refreshToken과 JwtService에 테스트용 키로 서명한 access 토큰을 넣어 HTTP 200과 refresh 쿠키 발급을 확인했다.
- 조치: 토큰 용도·발급 대상 검증, refresh 토큰 서버 저장/해시화, 회전 및 재사용 탐지, 로그아웃·비밀번호 변경 시 폐기를 구현한다.

## 6. 공개 취약점이 있는 의존성 — 높음

- `front/package.json:39` 및 lockfile: Next.js 14.2.15.
- `back/package-lock.json:8581`: Multer 1.4.4-lts.1 (`@nestjs/platform-express` 경유).
- Next.js는 Middleware 인증 우회 CVE-2025-29927의 영향 버전에 해당한다. 이 프로젝트에는 인증 Middleware와 자체 호스팅용 next start가 있다. 백엔드의 별도 AuthGuard까지 이 취약점만으로 우회되는 것은 아니다.
- Next.js 14 App Router 관련 후속 DoS 보안 공지도 있다. Multer 현재 고정 버전에는 잘못된 multipart 요청에 의한 프로세스 종료 취약점이 공개돼 있다. 업로드 인증이 있으면 공격 가능 대상은 해당 API 접근 권한에 따라 달라진다.
- 조치: 현재 지원되는 보안 패치 버전으로 Next.js와 관련 패키지, Nest 업로드 의존성을 함께 갱신하고 호환성을 검증한다. 과거 공지의 최소 패치 버전을 현재의 최종 안전 버전으로 간주하면 안 된다.
- 참고: [Next.js Middleware 보안 공지](https://vercel.com/blog/postmortem-on-next-js-middleware-bypass), [Next.js 후속 보안 공지](https://nextjs.org/blog/security-update-2025-12-11), [Multer 유지관리자 보안 공지](https://github.com/expressjs/multer/security/advisories/GHSA-fjgf-rc76-4x9p), [Multer 보안 공지 목록](https://github.com/expressjs/multer/security/advisories).
- npm audit는 현재 실행 환경에서 registry audit 요청 오류로 완료하지 못했다. 전체 의존성 취약점 수는 확인하지 않았으며, 위 항목은 lockfile과 유지관리자 공지의 버전 범위를 대조한 결과다.

## 7. 업로드 비용·자원 사용 및 로컬 파일 충돌 — 중간

- 위치: `back/src/story/story.module.ts:39`, `back/src/common/utils/multer.options.ts:41`, `back/src/suggestion/suggestion.module.ts:14`.
- 게시글 업로드는 파일당 1000 MiB, 최대 10개다. 애플리케이션 설정상 요청당 약 9.77 GiB까지 허용한다. 앞단 프록시의 추가 제한은 확인하지 않았다. 전송 전체를 RAM에 올린다는 의미는 아니지만 대역폭·연결·디스크/S3 비용 부담은 크다.
- 건의사항 업로드는 파일당 제한만 있고 명시적인 파일 개수 제한이 없다. 채널·건의사항 공통 업로더에는 파일 형식 필터가 없다. 게시글 필터는 클라이언트가 지정한 MIME 값에 의존한다.
- 로컬 업로드 파일명은 원래 이름+날짜여서 같은 날 같은 이름을 업로드하면 기존 파일을 덮어쓸 수 있다. 운영 S3 키는 UUID여서 이 충돌 경로가 다르다.
- 조치: 기능별 현실적인 크기·개수·요청 총량과 사용자별 저장량 제한, 파일 내용 검증, 로컬 UUID 이름을 적용한다.

## 8. 댓글 페이지네이션이 DB 조회량을 줄이지 못함 — 중간

- 위치: `back/src/comment/comment.service.ts:254`, `:374`, `:384`.
- 매 요청마다 해당 글의 댓글 전체와 작성자·부모·자식 관계를 조회한다. 이후 Node.js에서 트리 생성·평탄화 후 slice로 화면의 한 페이지를 만든다.
- 결과: 화면에 댓글 10개를 보여줘도 댓글이 많은 글에서는 전체 댓글 규모만큼 DB·메모리·CPU 부담이 발생한다. 현재 운영 지연이 발생했다고 측정한 것은 아니다.
- 조치: 댓글/대댓글의 표시 순서를 정의한 다음 필요한 ID를 DB에서 페이지 단위로 고르고, 그 범위의 관계만 조회하도록 변경한다.

## 9. 조회 상한과 일부 쿼리 비용 — 중간

- 위치: `back/src/story/story.service.ts:172`, `back/src/channel-chat/channel-chat.controller.ts:54`, `back/src/story/story.service.ts:392`, `back/src/channels/channels.service.ts:31`.
- 게시글·채팅 API의 limit에 최대값을 강제하는 검증이 없어 매우 큰 조회량을 요청할 수 있다. 채널 목록도 전체 조회다. 기본값이 10/50인 것과 최대값을 제한하는 것은 다르다.
- 댓글 검색은 전체 댓글에서 LIKE 검색으로 모든 일치 게시글 ID를 메모리에 가져온 후 IN 조건으로 다시 검색한다. 최종 결과 페이지가 작아도 앞선 작업은 커질 수 있다.
- 채널 상세에서 구독 관계 전체를 로드한다. 미읽은 알림도 전체 조회하며 프론트는 15초마다 재조회한다 (`back/src/notification/notification.service.ts:82`, `front/src/app/components/NotificationDropdown.tsx:25`).
- 조치: page/limit를 DTO로 검증하고 상한을 강제한다. DB 내 EXISTS/조인·페이지네이션, 알림 개수 조회와 목록 분리 등을 적용하고 운영 쿼리 계획으로 검증한다.

## 10. 빌드·테스트가 배포 문제를 충분히 걸러내지 못함 — 중간

- `front/next.config.mjs:4`와 `:7`에서 ESLint와 TypeScript 오류를 빌드 중 무시한다.
- 프론트 `tsc --noEmit --incremental false`: 오류 4개. ChannelHeader의 optional creator 접근 1개, useCommentHandlers의 잘못된 setter 인자 관련 2개, CustomizedCardView의 존재하지 않는 inline prop 1개.
- 백엔드 동일 방식의 tsconfig.build.json 타입 검사: 통과.
- 백엔드 Jest: 6개 suite 중 5개 통과, 1개 실패. 총 22개 테스트 중 11개 통과, 11개 실패. AuthService 테스트에 PasswordResetTokenRepository mock이 빠져 초기화 단계에서 실패한다. 이것만으로 운영 AuthService가 실행되지 않는다는 뜻은 아니다.
- 일부 테스트는 expect(true).toBe(true)여서 기능 회귀를 검증하지 못한다.
- 조치: 실제 타입 오류와 테스트 구성을 수정한 뒤 빌드 오류 무시를 해제하고 인증·권한·업로드의 회귀 테스트를 추가한다.

## AWS에서 별도로 확인해야 할 사항

1. 백엔드 실행 프로세스의 NODE_ENV가 production인지 확인. 로컬 `.env`는 development다. 비운영 모드의 forgot-password API는 resetToken을 응답하므로 이 설정으로 공개하면 이메일을 아는 것만으로 비밀번호 재설정을 진행할 수 있다 (`back/src/auth/auth.service.ts:879`). production 분기에도 실제 이메일 전송 구현은 없고 성공 메시지만 반환한다.
2. DB_SYNC=false와 실제 적용된 DB 인덱스·백업/복구 확인. 소스에는 여러 복합 인덱스와 동기화 opt-in이 있으나 이것이 AWS DB 반영 여부를 증명하지는 않는다.
3. DB 3306 포트의 인터넷 공개 여부, EC2 인바운드 제한, S3 공개/쓰기 권한, 앱 IAM 최소 권한 확인.
4. Nginx/ALB 뒤라면 실제 클라이언트 IP가 요청 횟수 제한에 사용되는지 확인. 현재 소스에는 trust proxy 설정이 없어서 프록시 구조에 따라 서로 다른 사용자가 같은 제한을 공유할 수 있다. 무조건 모든 프록시를 신뢰하도록 설정해서도 안 된다.
5. EC2 메모리·CPU, DB 느린 쿼리, 응답시간 p95, S3/네트워크 사용량 측정. 현재 점검에는 운영 부하 시험이나 처리량 보증이 포함되지 않는다.

HTTPS는 요청대로 이번 수정 우선순위에서 별도로 두었다. 다만 공개 HTTP로 실제 비밀번호와 로그인 쿠키를 전송하는 위험은 HTTPS 적용 전까지 남는다.

## 이미 있는 방어

bcrypt 비밀번호 해시, HttpOnly/SameSite 쿠키, 여러 API의 AuthGuard와 작성자 검사, Helmet, CORS 허용 목록, 전역 HTTP Throttler 및 일부 인증 API의 더 낮은 한도, DTO가 적용된 요청의 ValidationPipe, 여러 DB 복합 인덱스, production Swagger 비활성화가 있다. 실제 `.env` 파일은 현재 Git 추적 대상이 아니며 예제만 추적된다. Git 과거 이력 전체의 비밀정보 유출 여부는 검사하지 않았다.

## 권장 순서

1. 공개 응답 비밀번호 해시 제거, 소켓 발신자 인증, JSON-LD XSS 차단.
2. 비밀번호 변경 재인증·토큰 수명주기 정리, 취약 의존성 업데이트, AWS production 환경 확인.
3. 업로드 제한·조회 상한·댓글 DB 페이지네이션, 타입 검사와 테스트 복구.
4. 운영 지표와 실제 쿼리 계획을 기반으로 추가 성능 개선.
