# 보안 수정 적용 안내

2026-09-09: 비밀번호 해시 공개, 소켓 발신자 사칭, JSON-LD XSS 대응.

## 변경 내용

- `User.password`를 TypeORM 기본 조회에서 제외하고 응답 직렬화에서도 제거한다. 로그인과 현재 비밀번호 확인에서만 명시적으로 조회한다. 공개 채널 목록·상세·슬러그 조회 및 채널 생성 응답은 허용한 필드만 반환한다. 공개 creator에는 id와 nickname만 포함한다.
- Socket.IO 연결 전에 기존 `access_token` 쿠키의 서명, 만료, 사용자 ID·이메일 및 실제 사용자 존재 여부를 확인한다. ID만 들어 있는 기존 refresh 토큰으로는 연결할 수 없다. 발신자 ID·닉네임을 클라이언트가 전달해도 사용하지 않는다.
- 소켓은 인증된 회원만 연결 가능하다. 채널 입장 전이나 다른 채널로의 메시지·타이핑 요청을 거부한다. 저장 실패 시 임시 메시지를 방송하지 않고, 토큰이 만료되면 연결을 종료한다.
- 브라우저 소켓 연결에 `withCredentials: true`를 적용했다. 만료 시 기존 refresh API를 통한 갱신을 한 번 시도하고, 로그아웃·계정 전환·채널 이동 후 이전 연결이 되살아나지 않도록 정리한다.
- 채널 목록과 상세의 JSON-LD에 공통 직렬화 함수를 적용했다. `<`를 Unicode escape로 바꿔 script 태그를 닫을 수 없게 하며, JSON 파싱 후 원래 문자열은 보존된다.

## 로컬과 AWS 적용

소스 변경은 NODE_ENV와 무관하게 적용된다. DB 컬럼 구조를 바꾸지 않으므로 이번 수정 때문에 DB_SYNC를 켜거나 별도 마이그레이션을 실행할 필요는 없다. 패키지 추가와 lockfile 변경도 없다.

프론트와 백엔드를 함께 다시 빌드하고 재시작해야 한다. 이전 프론트는 소켓에 쿠키를 보내지 않으므로 백엔드만 먼저 배포하면 업데이트 전 화면의 채팅 연결이 거부될 수 있다. 배포가 끝나면 열린 화면을 새로고침한다.

백엔드는 기존 JWT_SECRET을 유지한다. 프론트에 JWT_SECRET을 추가하거나 공개 환경변수로 복사하지 않는다.

`CORS_ORIGINS`에 브라우저 주소창의 실제 프론트 origin을 설정한다. 예: `http://localhost:3000` 또는 `https://board.example.com`. 포트를 쓰면 포함하고 경로·마지막 슬래시는 제외한다. 여러 값은 쉼표로 구분하며 공백은 제거된다. 설정을 생략하면 localhost:3000과 127.0.0.1:3000만 허용된다. 이 설정은 HTTP CORS, Socket.IO polling, WebSocket의 Origin 검증에 공통으로 사용한다.

`NEXT_PUBLIC_BASE_URL`은 브라우저가 접근할 백엔드 주소를 사용한다. 기존 로그인 HTTP API와 동일한 `access_token` 쿠키가 Socket.IO에도 전달되어야 한다.

현재 쿠키 정책은 SameSite=Strict다. 서로 다른 사이트의 프론트/백엔드, 특히 별개 공인 IP로 HTTP 운영하면 CORS 허용만으로는 쿠키가 전달되지 않을 수 있다. 이런 구성은 같은 사이트의 도메인/리버스 프록시를 사용하도록 맞춰야 한다. 이는 기존 HTTP 인증 API에도 적용되는 조건이며 이번 수정에서 쿠키 정책을 완화하지 않았다.

HTTPS 작업 전 HTTP로 운영하는 경우 기존 `COOKIE_SECURE=false` 설정이 필요할 수 있다. 이를 위해 NODE_ENV를 development로 바꾸지 않는다. AWS 백엔드는 NODE_ENV=production을 유지하고, HTTPS 전환 후 COOKIE_SECURE=true로 사용한다.

## 검증

두 디렉터리의 의존성이 설치된 상태에서 저장소 루트에서 실행:

```powershell
node back/node_modules/jest/bin/jest.js --config back/package.json --runInBand --silent
node --test scripts/security/frontend.test.cjs scripts/security/socket-integration.test.cjs
```

Jest는 back 디렉터리에서 `npm test -- --runInBand`로도 실행할 수 있다. 통합 테스트는 양쪽에 이미 설치된 Nest와 socket.io-client를 사용한다.

- 백엔드 Jest: 35개 통과. 기존 인증 테스트의 누락된 저장소 mock도 수정했다.
- 보안/통합 테스트: 20개 통과. 모의 DB와 임시 loopback 서버에서 개발/운영 모드의 polling·WebSocket, 사칭/위조/만료/refresh 토큰 거부, 다른 Origin 차단, 방 입장 검증, 저장 실패 방송 차단, 만료 시 연결 종료를 확인했다.
- 실제 채널 목록·상세 TSX의 서버 렌더링을 실행해 공격 문자열의 script 탈출을 검사했다.
- 백엔드와 프론트 프로덕션 빌드 통과.
- 별도 프론트 타입 검사에는 기존 오류 4개가 남아 있다(ChannelHeader, useCommentHandlers, CustomizedCardView). 이번 수정으로 추가된 타입 오류는 없으며, 기존 빌드의 타입 오류 무시 설정은 변경하지 않았다.

실제 AWS 인스턴스에 배포하거나 운영 DB/계정으로 테스트하지는 않았다. 운영 반영 후 공개 채널 응답에 password가 없는지, 로그인 상태에서 채팅이 연결되는지, 재접속과 로그아웃이 정상인지 확인해야 한다.

이 문서는 앞선 SECURITY_PERFORMANCE_REVIEW.md의 첫 세 항목에 대한 대응 기록이다. 해당 보고서의 비밀번호 변경 재인증, refresh 토큰의 서버 폐기/회전, 의존성 업데이트, 성능 개선 등 나머지 항목을 모두 해결한 것은 아니다.
