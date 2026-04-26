# AWS 포트폴리오 배포 설계서

이 문서는 Study Board 프로젝트를 향후 이직 포트폴리오로 보여주기 위해 AWS에 어떤 구조로 올리면 좋은지 정리한 배포 설계서입니다. 목표는 단순히 "동작하는 배포"가 아니라, 서비스 기업에서 기대하는 운영 관점의 기본기를 보여주는 것입니다.

## 1. 목표

### 포트폴리오에서 보여주고 싶은 역량

- 프론트엔드, 백엔드, DB, 파일 저장소를 분리한 웹 풀스택 배포 경험
- Docker 기반 컨테이너 배포 경험
- AWS 관리형 서비스 사용 경험
- HTTPS, 도메인, 로드밸런서, 보안그룹, IAM, private subnet 같은 운영 기본기
- RDS, S3, CloudFront를 이용한 실서비스형 구조
- GitHub Actions를 이용한 CI/CD 자동 배포
- 트래픽 증가와 장애 상황을 고려한 확장 설계
- 로그, 모니터링, 백업, 비용 관리에 대한 이해

### 권장 최종 구조

```text
User
  ↓
Route 53
  ↓
CloudFront
  ↓
AWS WAF
  ↓
Application Load Balancer
  ↓
ECS Fargate
  ↓
Backend API Container
  ↓
RDS MySQL/PostgreSQL

이미지/첨부파일:
Backend 또는 Frontend
  ↓
S3 Bucket
  ↓
CloudFront
```

프론트엔드가 정적 배포 가능한 구조라면 프론트엔드는 `S3 + CloudFront`에 올리고, 백엔드만 `ECS Fargate`로 운영하는 구성이 가장 깔끔합니다.

```text
Frontend:
Route 53 → CloudFront → S3

Backend:
Route 53 → CloudFront 또는 ALB → ECS Fargate → RDS

File:
S3 → CloudFront
```

## 2. 핵심 AWS 서비스 설명

### Route 53

AWS의 DNS 서비스입니다. 구매한 도메인 또는 외부 도메인을 AWS 리소스에 연결합니다.

예시:

- `study-board.com` → CloudFront
- `api.study-board.com` → ALB
- `www.study-board.com` → CloudFront

포트폴리오에서는 도메인 연결, HTTPS 적용, 프론트/API 도메인 분리까지 보여주면 좋습니다.

### ACM

AWS Certificate Manager입니다. HTTPS 인증서를 발급하고 관리합니다.

일반적으로 다음 리소스에 인증서를 붙입니다.

- CloudFront
- Application Load Balancer

포트폴리오에서는 "모든 외부 트래픽은 HTTPS로만 접근"하도록 구성하는 것이 좋습니다.

### CloudFront

AWS의 CDN 서비스입니다. 사용자와 가까운 엣지 서버에서 정적 파일, 이미지, 프론트엔드 빌드 결과물을 빠르게 전달합니다.

사용 위치:

- 프론트엔드 정적 파일 배포
- S3 이미지 서빙
- API 앞단 캐싱 또는 보안 계층으로 사용

CloudFront를 쓰면 단순히 S3에 파일을 공개하는 것보다 더 실서비스에 가까운 구조가 됩니다.

### S3

AWS의 객체 스토리지입니다. 이미지, 첨부파일, 정적 파일을 저장하는 데 사용합니다.

DB에는 파일 자체를 저장하지 않고 다음 정보만 저장하는 것이 좋습니다.

- S3 object key
- 파일 URL
- 원본 파일명
- MIME type
- 파일 크기

권장 방식:

- 사용자 업로드 파일은 S3에 저장
- public bucket을 직접 열지 않음
- CloudFront를 통해 읽기 제공
- 업로드는 가능하면 presigned URL 사용

### RDS

AWS의 관리형 관계형 데이터베이스 서비스입니다.

직접 EC2에 MySQL/PostgreSQL을 설치하는 방식보다 운영 부담이 적습니다.

RDS가 대신 관리해주는 것:

- DB 인스턴스 운영
- 자동 백업
- 스냅샷
- 모니터링 지표
- Multi-AZ 구성
- 버전 업그레이드 옵션

포트폴리오에서는 RDS를 private subnet에 두고 외부에서 직접 접근하지 못하게 구성하는 것이 중요합니다.

### ALB

Application Load Balancer입니다. HTTP/HTTPS 요청을 여러 서버 또는 컨테이너로 분산합니다.

주요 역할:

- HTTPS 요청 수신
- 백엔드 컨테이너로 트래픽 전달
- health check
- path 기반 라우팅
- target group 관리

예시:

```text
/api/* → backend target group
/*     → frontend target group
```

ECS Fargate와 함께 쓰면 컨테이너가 늘어나거나 교체되어도 ALB가 정상 컨테이너로만 트래픽을 보냅니다.

### ECS

Elastic Container Service입니다. AWS에서 Docker 컨테이너를 실행하고 관리하는 서비스입니다.

ECS에서 정하는 것:

- 어떤 Docker 이미지를 실행할지
- 몇 개의 컨테이너를 띄울지
- CPU/메모리를 얼마나 줄지
- 환경 변수를 어떻게 주입할지
- 배포 시 새 컨테이너로 어떻게 교체할지
- 장애난 컨테이너를 어떻게 다시 띄울지

### Fargate

Fargate는 ECS에서 컨테이너를 실행하는 서버리스 실행 방식입니다.

쉽게 말하면, EC2 서버를 직접 만들고 관리하지 않아도 Docker 컨테이너를 실행할 수 있게 해주는 방식입니다.

EC2 방식:

```text
EC2 생성
  ↓
Docker 설치
  ↓
보안 패치
  ↓
서버 용량 관리
  ↓
컨테이너 실행
```

Fargate 방식:

```text
Docker 이미지 준비
  ↓
ECS Task Definition 작성
  ↓
Fargate가 컨테이너 실행
```

Fargate의 장점:

- 서버 직접 관리가 필요 없음
- 컨테이너 단위로 CPU/메모리 설정 가능
- 장애난 task를 ECS가 다시 실행
- ALB와 연동해서 무중단에 가까운 rolling 배포 가능
- 포트폴리오에서 "컨테이너 기반 클라우드 운영 경험"을 보여주기 좋음

Fargate의 단점:

- 단순 EC2 1대보다 비용이 높을 수 있음
- 서버 내부에 직접 들어가서 이것저것 만지는 방식과 다름
- 로그, 환경 변수, 네트워크 설정을 AWS 방식으로 이해해야 함

포트폴리오 목적이라면 EC2 + Docker Compose보다 ECS Fargate가 더 좋은 선택입니다. 실무에서 컨테이너 운영과 배포 자동화를 설명하기 좋기 때문입니다.

### ECR

Elastic Container Registry입니다. AWS에서 제공하는 Docker 이미지 저장소입니다.

Docker 이미지를 만든 뒤 ECR에 push하고, ECS Fargate가 그 이미지를 pull해서 실행합니다.

흐름:

```text
GitHub Actions
  ↓
Docker build
  ↓
ECR push
  ↓
ECS Fargate deploy
```

예시:

```text
study-board-backend:latest
study-board-backend:2026-04-26-001
study-board-frontend:latest
```

운영에서는 `latest`만 쓰기보다 commit hash 또는 release tag를 함께 쓰는 것이 좋습니다.

### AWS WAF

Web Application Firewall입니다. CloudFront 또는 ALB 앞에서 비정상 요청을 막는 데 사용합니다.

사용 예시:

- 특정 IP 차단
- 국가 기반 차단
- SQL Injection/XSS 기본 룰 적용
- 짧은 시간에 너무 많은 요청을 보내는 IP 제한
- bot성 요청 제한

사용자가 말한 "수많은 요청 막기"는 Nginx만으로 처리할 수도 있지만, AWS에서는 WAF가 더 자연스러운 선택입니다.

권장 조합:

```text
AWS WAF rate-based rule
+ ALB health check
+ 애플리케이션 레벨 rate limit
```

### CloudWatch

AWS 로그와 모니터링 서비스입니다.

사용 위치:

- ECS 컨테이너 로그
- ALB access log
- RDS CPU/Connection 지표
- CloudFront 요청 지표
- 알람 설정

포트폴리오에서는 CloudWatch Logs에 백엔드 애플리케이션 로그가 쌓이도록 설정해두면 좋습니다.

## 3. 추천 아키텍처

### 1단계: 비용을 아낀 실전형 구성

처음부터 모든 것을 완벽하게 구성하면 비용과 시간이 커집니다. 1차 배포는 다음 정도가 적당합니다.

```text
Route 53
  ↓
CloudFront
  ↓
S3 frontend

api.study-board.com
  ↓
ALB
  ↓
ECS Fargate backend
  ↓
RDS

images.study-board.com
  ↓
CloudFront
  ↓
S3 image bucket
```

구성 요소:

- Frontend: S3 + CloudFront
- Backend: ECS Fargate
- Image: S3 + CloudFront
- DB: RDS
- HTTPS: ACM
- DNS: Route 53
- Logs: CloudWatch
- CI/CD: GitHub Actions + ECR + ECS

### 2단계: 포트폴리오 완성형 구성

1차 배포가 안정화되면 다음 요소를 추가합니다.

- AWS WAF rate limit
- RDS private subnet 구성
- ECS service auto scaling
- ALB access log S3 저장
- RDS automated backup
- GitHub Actions 배포 자동화
- CloudWatch alarm
- IaC 도입: Terraform 또는 AWS CDK

### 3단계: 고급 운영 어필 요소

이직 포트폴리오에서 차별화하고 싶다면 다음 내용을 문서화합니다.

- 장애 시나리오
- 배포 rollback 방법
- RDS 백업/복구 전략
- 이미지 업로드 보안 전략
- API rate limit 정책
- 비용 절감 정책
- DB index 최적화 결과
- 부하 테스트 결과
- CloudWatch dashboard 캡처

## 4. Nginx를 넣어야 할까?

반드시 필요하지는 않습니다.

EC2에 직접 배포한다면 Nginx가 유용합니다.

```text
Internet
  ↓
Nginx
  ↓
Backend process
```

Nginx 역할:

- reverse proxy
- gzip 압축
- 정적 파일 서빙
- rate limit
- request body size 제한
- timeout 제어

하지만 ECS Fargate + ALB 구조에서는 ALB와 WAF가 많은 역할을 대신합니다.

권장 판단:

| 상황 | 권장 |
| --- | --- |
| EC2 단일 서버 배포 | Nginx 사용 |
| ECS Fargate + ALB | Nginx 생략 가능 |
| 아주 세밀한 proxy 제어 필요 | Nginx sidecar 또는 별도 proxy 고려 |
| 포트폴리오 클라우드 운영 어필 | WAF + ALB + app rate limit 권장 |

Study Board를 포트폴리오로 올린다면 Nginx보다 `AWS WAF + ALB + 애플리케이션 rate limit`을 먼저 보여주는 것이 좋습니다.

## 5. 요청 폭주 방어 설계

### 1차 방어: CloudFront

- 정적 파일 캐싱
- 이미지 캐싱
- 반복 요청 origin 전달 감소

### 2차 방어: AWS WAF

- IP별 요청 수 제한
- SQL Injection/XSS managed rule 적용
- 비정상 user-agent 차단

예시 정책:

```text
5분 동안 동일 IP에서 1,000회 이상 요청 시 차단 또는 CAPTCHA
```

실제 기준은 서비스 성격과 트래픽에 따라 조정합니다.

### 3차 방어: ALB

- 정상 ECS task에만 트래픽 전달
- health check 실패 task 제외
- TLS 종료

### 4차 방어: Application

로그인, 회원가입, 댓글 작성, 이미지 업로드 같은 API는 애플리케이션 레벨 제한이 필요합니다.

예시:

- 로그인 실패 5회 이상 제한
- 회원가입 IP 제한
- 이미지 업로드 용량 제한
- 댓글/게시글 작성 간격 제한
- refresh token 재발급 제한

## 6. S3 이미지 저장 설계

### 기본 원칙

이미지는 서버 디스크에 저장하지 않고 S3에 저장합니다.

나쁜 방식:

```text
backend/uploads/profile.jpg
```

권장 방식:

```text
s3://study-board-images/users/{userId}/profile/{fileId}.jpg
```

### DB 저장 예시

```text
id
user_id
object_key
original_name
content_type
size
created_at
```

`object_key` 예시:

```text
users/123/profile/20260426-uuid.jpg
boards/456/images/20260426-uuid.png
```

### 업로드 방식

#### 방식 A: 백엔드 경유 업로드

```text
Frontend → Backend → S3
```

장점:

- 구현이 단순함
- 백엔드에서 검증하기 쉬움

단점:

- 백엔드 서버 부하 증가
- 큰 파일 업로드에 불리함

#### 방식 B: Presigned URL 업로드

```text
Frontend → Backend에 업로드 URL 요청
Backend → Presigned URL 발급
Frontend → S3 직접 업로드
```

장점:

- 백엔드 부하 감소
- 실서비스에서 자주 쓰는 방식
- 포트폴리오 어필이 좋음

단점:

- 구현이 조금 더 복잡함
- 파일 타입/용량 검증 정책을 잘 잡아야 함

포트폴리오 목적이라면 presigned URL 방식을 추천합니다.

## 7. RDS 설계

### 네트워크

RDS는 public access를 끄고 private subnet에 둡니다.

```text
ECS Backend Task
  ↓
Security Group
  ↓
RDS private endpoint
```

권장 보안그룹:

- RDS inbound: backend ECS security group에서 오는 DB port만 허용
- 외부 IP에서 RDS 직접 접근 금지
- 개발 중 임시 접근이 필요하면 bastion host 또는 SSM 사용

### 백업

최소 설정:

- automated backup 7일
- deletion protection 활성화
- 중요한 변경 전 manual snapshot

포트폴리오 문서에는 다음 내용을 적으면 좋습니다.

```text
RDS는 private subnet에 배치하고, 백엔드 ECS task의 security group에서만 접근 가능하도록 제한했습니다.
운영 데이터 보호를 위해 automated backup과 deletion protection을 활성화했습니다.
```

## 8. CI/CD 설계

### 권장 흐름

```text
GitHub main branch push
  ↓
GitHub Actions
  ↓
Test
  ↓
Docker build
  ↓
ECR push
  ↓
ECS service update
  ↓
ALB health check
  ↓
배포 완료
```

### 백엔드 배포 흐름

```text
1. npm ci
2. npm test
3. docker build
4. docker tag
5. docker push to ECR
6. ECS task definition 갱신
7. ECS service update
```

### 프론트엔드 배포 흐름

정적 배포라면:

```text
1. npm ci
2. npm run build
3. S3 sync
4. CloudFront invalidation
```

컨테이너 배포라면:

```text
1. npm ci
2. npm run build
3. docker build
4. ECR push
5. ECS service update
```

## 9. 보안 체크리스트

- 모든 외부 요청 HTTPS 적용
- RDS public access 비활성화
- S3 bucket public access 차단
- S3 읽기는 CloudFront를 통해 제공
- IAM user access key를 코드에 저장하지 않음
- GitHub Actions secrets 사용
- ECS task role에 필요한 권한만 부여
- DB password, JWT secret, OAuth secret은 환경 변수 또는 Secrets Manager로 관리
- ALB security group은 80/443만 허용
- backend ECS security group은 ALB에서 오는 요청만 허용
- RDS security group은 backend ECS에서 오는 DB port만 허용
- 이미지 업로드 파일 타입과 용량 제한
- 로그인/회원가입/업로드 API rate limit 적용

## 10. 비용 관리

개인 포트폴리오에서 비용은 중요합니다. 처음부터 고가용성을 과하게 구성하지 않고, 비용이 드는 리소스를 명확히 관리해야 합니다.

### 비용이 커질 수 있는 서비스

- NAT Gateway
- ALB
- RDS
- Fargate task 상시 실행
- CloudFront 트래픽
- CloudWatch log 장기 보관

### 비용 절감 팁

- NAT Gateway는 꼭 필요한 경우에만 사용
- 개발/테스트용 RDS는 작은 인스턴스 사용
- CloudWatch log retention 설정
- Fargate task CPU/Memory를 과하게 잡지 않음
- 이미지 리사이징/압축 적용
- 사용하지 않는 ECR 이미지 정리
- S3 lifecycle rule 적용

### 현실적인 시작 비용 감각

정확한 비용은 리전과 트래픽에 따라 달라지지만, 개인 포트폴리오 운영 기준으로는 다음 항목이 주요 비용입니다.

| 서비스 | 비용 영향 |
| --- | --- |
| ALB | 고정 비용이 있어 체감 비용이 큼 |
| RDS | 인스턴스 상시 실행 비용 발생 |
| ECS Fargate | task가 떠 있는 시간만큼 비용 발생 |
| NAT Gateway | 사용 시 비용 부담이 큼 |
| S3/CloudFront | 트래픽이 적으면 비교적 저렴 |

비용을 줄이고 싶다면 1차 공개 버전은 다음 구성을 고려할 수 있습니다.

```text
Frontend: S3 + CloudFront
Backend: EC2 + Docker Compose
DB: RDS
File: S3
```

하지만 이직 포트폴리오 어필력은 다음 구성이 더 좋습니다.

```text
Frontend: S3 + CloudFront
Backend: ECS Fargate
DB: RDS
File: S3 + CloudFront
CI/CD: GitHub Actions + ECR
Security: WAF + Security Group + IAM
```

## 11. README에 어필할 문장 예시

포트폴리오 README에는 기능 설명뿐 아니라 운영 설계 의도를 짧게 적는 것이 좋습니다.

예시:

```text
Study Board는 AWS 기반으로 배포된 학습 커뮤니티 서비스입니다.
프론트엔드는 S3와 CloudFront로 정적 리소스를 배포하고, 백엔드는 Docker 이미지로 패키징하여 ECR에 저장한 뒤 ECS Fargate에서 실행합니다.
API 트래픽은 ALB를 통해 정상 task로 라우팅되며, 데이터베이스는 public access를 차단한 RDS private subnet에 구성했습니다.
사용자 업로드 이미지는 S3에 저장하고 CloudFront로 서빙하여 애플리케이션 서버의 파일 저장 의존성을 제거했습니다.
GitHub Actions를 통해 테스트, Docker build, ECR push, ECS 배포를 자동화했습니다.
```

## 12. 면접에서 설명할 포인트

### 왜 EC2가 아니라 Fargate를 썼는가?

컨테이너 실행 환경을 직접 관리하기보다 애플리케이션 배포와 운영 안정성에 집중하기 위해 Fargate를 선택했다고 설명할 수 있습니다. EC2 방식은 서버 패치, Docker daemon 관리, 인스턴스 용량 관리가 필요하지만, Fargate는 task 단위로 CPU/Memory를 지정하고 ECS가 task 상태를 관리합니다.

### 왜 ECR을 썼는가?

ECS에서 실행할 Docker 이미지를 AWS 내부 registry에 저장하기 위해 ECR을 사용했다고 설명하면 됩니다. GitHub Actions에서 이미지를 빌드한 뒤 ECR에 push하고, ECS는 해당 이미지를 pull하여 새 task를 실행합니다.

### 왜 이미지를 S3에 저장했는가?

서버 로컬 디스크에 파일을 저장하면 컨테이너 교체, scale out, 장애 복구 시 파일 일관성을 유지하기 어렵습니다. S3를 사용하면 애플리케이션 서버는 stateless하게 유지되고, 파일은 내구성이 높은 객체 스토리지에 저장됩니다.

### 왜 RDS를 썼는가?

직접 DB 서버를 운영하는 대신 백업, 모니터링, 스냅샷, 장애 대응 옵션을 제공하는 관리형 DB를 사용하기 위해 RDS를 선택했다고 설명할 수 있습니다.

### 왜 WAF가 필요한가?

로그인, 검색, 게시글 작성, 이미지 업로드처럼 비용이 큰 요청을 무제한으로 허용하면 장애나 비용 증가로 이어질 수 있습니다. WAF rate-based rule과 애플리케이션 rate limit을 함께 적용해 외부 공격성 트래픽과 비정상 사용을 줄일 수 있습니다.

## 13. 구축 순서

추천 순서는 다음과 같습니다.

1. 로컬 Docker build 확인
2. S3 이미지 업로드 구조 정리
3. RDS 생성 및 백엔드 연결
4. ECR repository 생성
5. 백엔드 Docker image ECR push
6. ECS cluster, task definition, service 생성
7. ALB 연결 및 health check 설정
8. Route 53, ACM, HTTPS 연결
9. 프론트엔드 S3 + CloudFront 배포
10. GitHub Actions CI/CD 구성
11. CloudWatch logs 확인
12. WAF rate limit 추가
13. README와 아키텍처 다이어그램 정리

## 14. 최종 권장안

Study Board를 이직 포트폴리오로 공개한다면 최종적으로 다음 구성을 추천합니다.

```text
DNS:
Route 53

HTTPS:
ACM

Frontend:
S3 + CloudFront

Backend:
ECR + ECS Fargate + ALB

Database:
RDS private subnet

File Storage:
S3 + CloudFront

Security:
AWS WAF
Security Group
IAM 최소 권한
Secrets Manager 또는 GitHub Actions Secrets

Monitoring:
CloudWatch Logs
CloudWatch Alarms

CI/CD:
GitHub Actions
```

이 구성은 개인 프로젝트치고는 충분히 실서비스에 가깝고, 4년차 웹 풀스택 개발자의 포트폴리오로 설명하기 좋은 수준입니다. 핵심은 단순히 AWS 서비스를 많이 쓰는 것이 아니라, 각 서비스를 왜 선택했고 어떤 문제를 해결했는지 문서와 코드에서 드러나게 만드는 것입니다.
