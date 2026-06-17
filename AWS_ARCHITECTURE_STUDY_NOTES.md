# Park Board AWS Architecture Study Notes

이 문서는 `park-board-aws-architecture-refined.drawio` 다이어그램을 기준으로, Study-Board가 AWS 위에서 어떻게 움직이는지 공부용으로 풀어쓴 설명이다.

핵심은 간단하다.

> 사용자는 public 영역의 Front EC2만 직접 접근하고, Backend EC2와 RDS는 private 영역에 둔다. Backend가 외부로 나가야 할 때는 NAT Gateway를 사용한다.

## 1. 전체 구조 한눈에 보기

현재 다이어그램의 큰 흐름은 아래와 같다.

```text
Internet User
  -> Internet Gateway
  -> Public Subnet
  -> Front EC2
  -> Backend EC2, private IP
  -> RDS, private access

Backend EC2
  -> NAT Gateway
  -> Internet Gateway
  -> S3 or external internet
```

관리자 SSH 흐름은 일반 사용자 트래픽과 분리된다.

```text
Admin SSH Client
  -> Bastion EC2, public subnet
  -> Backend EC2, private subnet
```

## 2. 구성 요소별 역할

### AWS Cloud

전체 AWS 리소스를 감싸는 가장 바깥 영역이다. 현재 리전은 `ap-northeast-3`로 표현되어 있다.

### VPC

`park-board-vpc`는 애플리케이션 전용 네트워크다.

CIDR은 `10.0.0.0/24`이고, 이 안에서 public subnet과 private subnet이 나뉜다.

중요한 점은 VPC 내부 통신에는 기본적으로 `local route`가 사용된다는 것이다.

예를 들어 Front EC2가 Backend EC2의 private IP로 요청하면 NAT Gateway를 거치지 않는다.

```text
Front EC2 -> Backend EC2
10.0.0.0/24 local route 사용
```

### Public Subnet

외부 인터넷에서 접근 가능한 리소스를 두는 영역이다.

현재 public subnet에는 아래 리소스가 있다.

- Front EC2
- Bastion EC2
- NAT Gateway
- Public Route Table

Public Route Table에는 아래 경로가 있다.

```text
10.0.0.0/24 -> local
0.0.0.0/0  -> Internet Gateway
```

즉, VPC 내부 주소는 VPC 내부에서 처리하고, 외부 인터넷으로 나가는 트래픽은 Internet Gateway로 보낸다.

### Front EC2

사용자가 직접 접속하는 서버다.

현재 구조에서는 브라우저가 Backend EC2에 직접 접근하면 안 된다. Backend는 private subnet에 있고 public IP가 없기 때문이다.

따라서 일반적인 구조는 아래처럼 이해하면 된다.

```text
Browser
  -> Front EC2
  -> Front 서버 또는 Next.js proxy/rewrite
  -> Backend EC2 private IP
```

즉, 브라우저 입장에서는 Front만 보이고, Backend는 Front 뒤에 숨어 있다.

### Backend EC2

API 서버가 실행되는 private 서버다.

Backend EC2는 public internet에서 직접 접근되지 않는다. 접근 가능한 경로는 크게 두 가지다.

- Front EC2가 API 요청을 private IP로 전달
- Bastion EC2를 통해 관리자가 SSH 접속

Backend가 DB에 접근할 때는 RDS private endpoint를 사용한다.

Backend가 S3나 외부 인터넷에 접근해야 할 때는 NAT Gateway를 통해 나간다.

### RDS

데이터베이스 계층이다.

RDS는 private access로 표현되어 있고, 일반 사용자나 public internet에서 직접 접근하지 않는다.

정상적인 접근 흐름은 아래와 같다.

```text
Backend EC2 -> RDS
```

보안그룹도 이 방향에 맞춰야 한다.

```text
RDS SG
  inbound 3306 from Backend SG only
```

### NAT Gateway

private subnet의 서버가 외부로 나갈 수 있게 해주는 출구다.

중요한 점은 NAT Gateway가 외부에서 private 서버로 들어오는 입구가 아니라는 것이다.

```text
Backend EC2 -> NAT Gateway -> Internet
```

가능한 예시는 아래와 같다.

- Backend가 S3 API 호출
- Backend가 외부 OAuth API 호출
- Backend가 OS 패키지 업데이트
- Backend가 외부 메일/SMS API 호출

반대로 아래는 NAT Gateway의 역할이 아니다.

```text
Internet User -> NAT Gateway -> Backend EC2
```

이런 inbound 접근은 NAT Gateway로 할 수 없다.

### Bastion EC2

관리자가 private 서버에 SSH로 들어가기 위한 점프 서버다.

Backend EC2는 public IP가 없으므로 관리자가 바로 접속할 수 없다. 그래서 public subnet의 Bastion에 먼저 접속한 뒤, Bastion에서 Backend private IP로 들어간다.

```text
Admin
  -> Bastion EC2 public IP
  -> Backend EC2 private IP
```

Bastion 보안그룹은 매우 좁게 열어야 한다.

```text
Bastion SG
  inbound 22 from admin IP only
```

### S3

이미지, 업로드 파일, 정적 asset 등을 저장하는 object storage다.

현재 다이어그램에서는 Backend가 NAT Gateway를 통해 S3 public endpoint에 접근하는 형태로 표현했다.

```text
Backend EC2
  -> NAT Gateway
  -> Internet Gateway
  -> S3 public endpoint
```

운영 환경에서는 비용과 보안을 위해 S3 Gateway Endpoint를 추가하는 방법도 좋다.

```text
Backend EC2
  -> S3 Gateway Endpoint
  -> S3
```

이렇게 하면 S3 접근이 NAT Gateway 비용을 덜 사용하고, AWS 내부 경로로 처리된다.

## 3. 보안그룹 기준으로 이해하기

다이어그램 기준 보안그룹은 아래처럼 잡는 것이 자연스럽다.

```text
Front SG
  inbound 80/443 from Internet

Backend SG
  inbound app port from Front SG
  inbound 22 from Bastion SG

RDS SG
  inbound 3306 from Backend SG only

Bastion SG
  inbound 22 from admin IP only
```

여기서 중요한 포인트는 IP보다 보안그룹을 source로 잡는 방식이다.

예를 들어 Backend SG의 inbound를 `Front SG`에서만 허용하면, Front EC2의 private IP가 바뀌어도 보안 규칙이 더 안정적으로 유지된다.

```text
Backend SG inbound
  source: Front SG
  port: backend app port
```

RDS도 마찬가지다.

```text
RDS SG inbound
  source: Backend SG
  port: 3306
```

## 4. 요청 흐름 예시

### 예시 1. 사용자가 게시글 상세 페이지에 들어가는 경우

사용자가 브라우저에서 게시글 상세 페이지를 연다고 가정한다.

```text
https://example.com/channels/free/boards/123
```

흐름은 보통 아래처럼 움직인다.

```text
1. Browser가 Front EC2의 public 주소로 HTTP/HTTPS 요청
2. Internet Gateway를 통해 public subnet의 Front EC2에 도착
3. Front EC2의 Next.js 앱이 페이지 요청 처리
4. Front가 Backend API를 private IP로 호출
5. Backend가 RDS에서 게시글, 댓글, 작성자 정보 조회
6. Backend가 JSON 응답 반환
7. Front가 HTML 또는 API 응답을 Browser로 반환
8. Browser가 화면 렌더링
```

네트워크 경로로 보면 아래와 같다.

```text
Browser
  -> IGW
  -> Front EC2
  -> Backend EC2 private IP
  -> RDS
```

여기서 `Front EC2 -> Backend EC2`는 NAT Gateway를 지나지 않는다.

둘 다 같은 VPC 안에 있으므로 `10.0.0.0/24 local route`로 처리된다.

```text
Front EC2 -> Backend EC2
route: 10.0.0.0/24 local
```

### 예시 2. 게시글 상세 페이지에 이미지가 포함된 경우

게시글 본문에 이미지가 포함되어 있다고 가정한다.

DB에는 보통 이미지 파일 자체가 아니라 이미지 경로나 key가 저장된다.

예시는 아래와 같다.

```text
post table
  id: 123
  title: "배포 후기"
  content: "..."
  imageKey: "uploads/posts/123/main.png"
```

상세 페이지 조회 흐름은 아래처럼 나눠서 볼 수 있다.

```text
1. Browser -> Front EC2
2. Front EC2 -> Backend EC2
3. Backend EC2 -> RDS에서 게시글 조회
4. Backend가 imageKey 또는 imageUrl을 응답에 포함
5. Browser가 이미지 URL을 보고 이미지를 요청
```

이미지 요청 방식은 구현에 따라 달라진다.

#### 방식 A. S3 객체가 public 또는 presigned URL인 경우

Backend가 브라우저에게 S3 URL을 내려준다.

```text
Browser
  -> S3 URL
```

이 방식은 브라우저가 S3에 직접 접근한다.

장점은 Front/Backend 서버 부하가 줄어든다는 것이다.

단점은 S3 권한, URL 만료, CORS 설정을 신경 써야 한다.

#### 방식 B. Backend가 이미지를 대신 가져오는 경우

브라우저는 Backend API나 Front proxy에 이미지 요청을 보낸다.

```text
Browser
  -> Front EC2
  -> Backend EC2
  -> NAT Gateway
  -> S3
```

이 방식은 private 파일 접근 제어를 서버에서 강하게 통제하기 좋다.

단점은 이미지 트래픽이 서버를 거치므로 서버 부하가 늘어난다.

현재 다이어그램은 Backend가 S3에 접근하는 경로를 표현했으므로, 공부용으로는 방식 B 또는 서버가 presigned URL을 발급하는 방식을 먼저 떠올리면 된다.

### 예시 3. 사용자가 이미지를 업로드하는 경우

사용자가 게시글 작성 화면에서 이미지를 첨부한다고 가정한다.

일반적인 서버 경유 업로드 흐름은 아래와 같다.

```text
1. Browser가 이미지 파일을 Front EC2로 업로드
2. Front EC2가 업로드 요청을 Backend EC2로 프록시
3. Backend EC2가 파일 검증
4. Backend EC2가 S3에 파일 업로드
5. Backend EC2가 RDS에 파일 key 또는 URL 저장
6. Backend가 업로드 결과를 Front에 반환
7. Front가 Browser에 성공 응답 반환
```

네트워크 경로는 아래와 같다.

```text
Browser
  -> Front EC2
  -> Backend EC2
  -> NAT Gateway
  -> S3

Backend EC2
  -> RDS
```

이때 Backend에서 할 수 있는 검증은 아래와 같다.

- 로그인 사용자 확인
- 파일 크기 제한
- MIME type 확인
- 확장자 확인
- 이미지 리사이징 또는 썸네일 생성
- S3 key 생성
- DB에 업로드 메타데이터 저장

예시 데이터는 아래처럼 저장될 수 있다.

```text
upload table
  id: 501
  userId: 10
  bucket: "park-board-upload"
  objectKey: "uploads/users/10/2026/06/profile.png"
  contentType: "image/png"
  size: 182340
```

운영 최적화를 한다면 presigned URL 방식도 가능하다.

```text
1. Browser -> Front -> Backend: 업로드 URL 요청
2. Backend -> S3: presigned URL 생성
3. Backend -> Browser: presigned URL 반환
4. Browser -> S3: 직접 업로드
5. Browser -> Backend: 업로드 완료 알림
6. Backend -> RDS: 메타데이터 저장
```

이 방식은 대용량 파일 업로드 시 서버 부하를 줄일 수 있다.

### 예시 4. 사용자가 로그인하는 경우

Study-Board는 프론트에서 NextAuth.js를 사용하고, 백엔드는 JWT/Passport 기반 인증 흐름을 가진다.

로그인 흐름은 대략 아래처럼 이해할 수 있다.

```text
1. Browser가 로그인 요청을 Front EC2로 전송
2. Front의 NextAuth 관련 로직이 요청 처리
3. 필요한 경우 Front가 Backend 인증 API 호출
4. Backend가 RDS에서 사용자 정보 확인
5. Backend가 인증 결과 반환
6. Front가 세션 또는 JWT 쿠키 설정
7. 이후 요청은 쿠키를 포함해서 Front에 전달
```

네트워크 흐름은 게시글 상세 조회와 비슷하다.

```text
Browser
  -> Front EC2
  -> Backend EC2
  -> RDS
```

여기서도 Browser가 Backend private IP로 직접 요청하지 않는다.

### 예시 5. 실시간 채팅을 사용하는 경우

프로젝트에는 Socket.IO 기반 `channel-chat` 모듈이 있다.

중요한 점은 WebSocket도 결국 브라우저에서 접근 가능한 public endpoint가 필요하다는 것이다.

Backend EC2가 private subnet에만 있다면 브라우저가 직접 Backend의 Socket.IO endpoint에 붙을 수 없다.

따라서 가능한 구조는 아래 중 하나다.

```text
방식 A
Browser -> Front EC2 reverse proxy -> Backend EC2 Socket.IO

방식 B
Browser -> ALB public endpoint -> Backend EC2 Socket.IO

방식 C
Browser -> 별도 public WebSocket gateway -> Backend service
```

현재 다이어그램에는 ALB가 없으므로, 다이어그램 기준으로는 Front EC2가 WebSocket proxy 역할을 하거나, 이후 ALB를 추가하는 방향을 생각해야 한다.

### 예시 6. 관리자가 Backend 서버에 접속하는 경우

관리자가 Backend EC2에 SSH로 접근하려고 한다.

Backend EC2는 private subnet에 있으므로 public internet에서 바로 접근할 수 없다.

흐름은 아래와 같다.

```text
1. Admin PC -> Bastion EC2 public IP로 SSH
2. Bastion EC2 -> Backend EC2 private IP로 SSH
3. Backend 서버에서 로그 확인, 배포 확인, 설정 확인
```

보안그룹은 아래처럼 제한해야 한다.

```text
Bastion SG
  inbound 22 from admin IP only

Backend SG
  inbound 22 from Bastion SG only
```

관리 편의만 보고 Backend에 public IP를 붙이면 구조가 단순해 보일 수는 있다. 하지만 보안 관점에서는 private subnet에 두고 Bastion을 통하는 방식이 더 낫다.

## 5. NAT와 local route를 구분하는 법

이 다이어그램에서 가장 헷갈리기 쉬운 부분은 NAT Gateway다.

아래 요청은 NAT를 사용하지 않는다.

```text
Front EC2 -> Backend EC2
Backend EC2 -> RDS
Bastion EC2 -> Backend EC2
```

이 요청들은 VPC 내부 private IP 대역에서 움직인다.

따라서 route table의 `10.0.0.0/24 local`이 사용된다.

아래 요청은 NAT Gateway를 사용할 수 있다.

```text
Backend EC2 -> S3 public endpoint
Backend EC2 -> 외부 API
Backend EC2 -> OS package repository
```

이 요청들은 목적지가 VPC 내부 CIDR 밖이다.

따라서 private route table의 `0.0.0.0/0 -> NAT Gateway` 경로가 사용된다.

## 6. Private Subnet 2는 어떻게 봐야 하나

다이어그램의 Private Subnet 2는 별도 route table association이 명시적으로 보이지 않는 예비 private subnet으로 표현했다.

AWS에서는 subnet에 명시적인 route table association이 없으면 VPC main route table을 사용한다.

즉, 정확히 판단하려면 아래를 확인해야 한다.

```text
1. Private Subnet 2에 explicit route table association이 있는가?
2. 없다면 VPC main route table은 어떤 route를 가지고 있는가?
3. main route table에 0.0.0.0/0 -> NAT Gateway가 있는가?
4. 아니면 local route만 있는가?
```

실무에서는 subnet마다 어떤 route table이 연결되어 있는지 명확히 문서화하는 것이 좋다.

## 7. 현재 다이어그램에 없는 것들

현재 다이어그램은 기본 네트워크 구조를 설명하기 좋지만, 실제 운영 수준에서는 아래 요소도 고려할 수 있다.

### ALB

Front와 Backend 앞에 Application Load Balancer를 둘 수 있다.

특히 Backend API나 Socket.IO를 안정적으로 public endpoint에 연결하려면 ALB가 유용하다.

```text
Browser -> ALB -> Front EC2
Browser -> ALB -> Backend EC2
```

다만 Backend를 private로 유지하려면 ALB는 public subnet에 두고, target group은 private subnet의 Backend EC2를 바라보게 구성한다.

### HTTPS 인증서

실제 서비스라면 Route 53, ACM, ALB 또는 Nginx를 통해 HTTPS를 구성해야 한다.

```text
Browser -> HTTPS -> ALB or Front EC2
```

### CloudFront

정적 파일이나 이미지가 많아지면 CloudFront를 S3 앞에 둘 수 있다.

```text
Browser -> CloudFront -> S3
```

장점은 캐싱, 전송 속도, TLS, edge location 활용이다.

### S3 Gateway Endpoint

Backend가 S3에 자주 접근한다면 S3 Gateway Endpoint를 추가하는 것이 좋다.

```text
Backend EC2 -> S3 Gateway Endpoint -> S3
```

이렇게 하면 S3 트래픽이 NAT Gateway를 덜 사용한다.

### Secrets Manager or Parameter Store

DB 비밀번호, JWT secret, OAuth secret 같은 값은 코드나 `.env` 파일에만 두기보다 AWS Secrets Manager 또는 SSM Parameter Store로 관리할 수 있다.

### CloudWatch

운영 중에는 로그와 메트릭이 중요하다.

확인 대상은 아래와 같다.

- Front EC2 로그
- Backend EC2 로그
- RDS CPU, connection, slow query
- NAT Gateway traffic
- S3 request count
- 4xx, 5xx 에러

## 8. 면접이나 발표에서 설명하는 순서

이 구조를 설명할 때는 아래 순서가 가장 자연스럽다.

```text
1. 사용자는 Front EC2만 접근한다.
2. Backend와 RDS는 private subnet에 둬서 외부 직접 접근을 막았다.
3. Front는 Backend private IP로 API 요청을 보낸다.
4. Backend는 RDS에 접근해 데이터를 처리한다.
5. Backend가 S3나 외부 API에 접근할 때는 NAT Gateway를 사용한다.
6. 관리자는 Bastion을 통해서만 private 서버에 SSH 접속한다.
7. 보안그룹은 Front, Backend, RDS, Bastion의 접근 방향에 맞춰 최소 권한으로 제한한다.
```

짧게 말하면 아래처럼 정리할 수 있다.

```text
Public에는 사용자 진입점과 Bastion, NAT만 둔다.
Backend와 DB는 private에 둔다.
내부 통신은 local route, 외부 egress는 NAT Gateway를 사용한다.
```

## 9. 체크리스트

다이어그램을 보고 실제 AWS 설정을 확인할 때는 아래를 보면 된다.

- Front EC2에 public IP 또는 EIP가 있는가?
- Backend EC2에 public IP가 없는가?
- Public subnet route table에 `0.0.0.0/0 -> IGW`가 있는가?
- Private subnet route table에 `0.0.0.0/0 -> NAT Gateway`가 있는가?
- Front에서 Backend private IP와 app port로 통신 가능한가?
- Backend에서 RDS endpoint와 3306 포트로 통신 가능한가?
- Backend에서 S3 접근이 가능한가?
- Bastion SSH는 admin IP에서만 가능한가?
- Backend SSH는 Bastion SG에서만 가능한가?
- RDS inbound는 Backend SG에서만 가능한가?
- Socket.IO를 브라우저가 접근할 public endpoint가 있는가?

이 체크리스트를 통과하면 현재 다이어그램의 의도와 실제 AWS 구성이 대체로 일치한다고 볼 수 있다.
