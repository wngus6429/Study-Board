# 일본 서비스/SI 이직용 AWS 배포 구조 정리

Study-Board를 일본 서비스 회사 또는 대형 SI 면접에서 설명하기 좋은 수준으로 AWS에 올리는 구조를 정리한다. 목표는 "최대한 복잡한 클라우드 구성"이 아니라, 풀스택 개발자가 실서비스 운영 기본기를 이해하고 있다는 것을 보여주는 것이다.

## 1. 결론

이 프로젝트는 다음 구조를 1차 목표로 잡는 것이 가장 적절하다.

```text
사용자
  |
Route 53
  |
ACM HTTPS
  |
Application Load Balancer
  |-----------------------------|
  |                             |
ECS Fargate Frontend        ECS Fargate Backend
Next.js 14                  NestJS 10 API + Socket.IO
Port 3000                   Port 8888
  |                             |
  |                             |---- RDS MySQL
  |                             |
  |                             |---- S3 Upload Bucket
  |                                      |
  |                                  CloudFront
  |
CloudWatch Logs / Metrics
Secrets Manager / Parameter Store
ECR
GitHub Actions
```

추천 리전은 일본 기업 포트폴리오 목적이면 `ap-northeast-1` 도쿄 리전이다.

## 2. 왜 이 구조가 맞는가

### EC2 한 대 배포보다 좋은 점

EC2 한 대에 프론트, 백엔드, MySQL, 파일 업로드를 전부 넣으면 빠르게 배포할 수는 있지만, 운영 관점에서 보여줄 수 있는 것이 적다.

면접에서 어필하기 좋은 포인트는 다음이다.

- 프론트, 백엔드, DB, 파일 저장소를 분리했다.
- 컨테이너 이미지를 ECR에 올리고 ECS Fargate에서 실행한다.
- RDS는 private subnet에 두고 외부 직접 접근을 막았다.
- 업로드 파일은 서버 디스크가 아니라 S3에 저장한다.
- HTTPS, ALB, 보안그룹, 환경변수, 로그, 백업을 고려했다.
- Socket.IO 실시간 채팅은 ALB WebSocket 지원을 통해 서비스한다.

### EKS까지 가지 않는 이유

EKS는 Kubernetes 운영 경험을 보여주기에는 좋지만, 개인 포트폴리오에는 과하다. 이 프로젝트는 Next.js, NestJS, MySQL, S3, Socket.IO를 안정적으로 운영하는 것이 핵심이므로 ECS Fargate가 더 현실적이다.

면접에서는 이렇게 설명하면 된다.

> Kubernetes까지 도입하면 운영 복잡도가 커진다고 판단했습니다. 이 서비스 규모에서는 ECS Fargate로 컨테이너 배포, 오토스케일링, 롤링 배포를 충분히 보여줄 수 있어 ECS를 선택했습니다.

## 3. 서비스 구성

### Frontend

- AWS 서비스: ECS Fargate
- 런타임: Next.js 14
- 포트: `3000`
- 이미지 저장소: ECR
- 도메인 예시: `https://study-board.example.com`

이 프로젝트는 `next-auth`와 Next.js 서버 실행이 있으므로, 처음부터 S3 정적 호스팅으로 빼기보다 `next start` 기반 컨테이너로 운영하는 편이 단순하다.

환경변수 예시:

```text
NEXTAUTH_URL=https://study-board.example.com
NEXTAUTH_SECRET=...
NEXT_PUBLIC_BASE_URL=https://api.study-board.example.com
NEXT_PUBLIC_SITE_PASSWORD=...
```

### Backend

- AWS 서비스: ECS Fargate
- 런타임: NestJS 10
- 포트: `8888`
- API 도메인 예시: `https://api.study-board.example.com`
- WebSocket 엔드포인트: `https://api.study-board.example.com/socket.io/`

환경변수 예시:

```text
NODE_ENV=production
PORT=8888
CORS_ORIGINS=https://study-board.example.com
JWT_SECRET=...
DB_HOST=...
DB_PORT=3306
DB_USERNAME=...
DB_PASSWORD=...
DB_DATABASE=...
DB_SYNC=false
AWS_REGION=ap-northeast-1
S3_BUCKET_NAME=study-board-prod-uploads
```

운영에서는 `DB_SYNC=false`를 고정한다. TypeORM `synchronize`는 개발 편의 기능이므로 운영 DB에서는 migration 또는 명시적인 schema 변경으로 관리하는 것이 맞다.

### Database

- AWS 서비스: RDS MySQL
- 엔진: MySQL 8
- 네트워크: private subnet
- 접근 허용: Backend ECS Security Group에서만 `3306`
- 백업: 자동 백업 7일 이상
- 권장: 초기에는 Single-AZ, 포트폴리오 완성 후 Multi-AZ 옵션 설명 가능

비용이 크게 문제되지 않는다면 Multi-AZ까지 켜도 된다. 다만 면접에서는 "개인 운영 비용과 장애 대응 수준을 고려해 Single-AZ로 시작하고, 운영 전환 시 Multi-AZ로 변경 가능하게 설계했다"라고 설명해도 충분하다.

### File Upload

- AWS 서비스: S3
- 전송 방식: 현재 백엔드 multer-s3 구조 유지
- 읽기 제공: CloudFront
- S3 public access: 차단 권장
- CloudFront에서 S3를 읽도록 구성

현재 프로젝트는 로컬 디스크 업로드 디렉토리와 S3 업로드 코드를 모두 고려한 구조다. AWS 배포에서는 백엔드가 업로드 요청을 받고 S3에 저장하는 방식으로 시작한다.

권장 파일 URL 구조:

```text
https://cdn.study-board.example.com/uploads/...
https://cdn.study-board.example.com/userUpload/...
https://cdn.study-board.example.com/channelUpload/...
```

나중에 개선할 수 있는 포인트:

- presigned URL 업로드로 백엔드 부하 감소
- 이미지 리사이징 Lambda
- 바이러스 검사 파이프라인
- CloudFront signed URL 또는 signed cookie

## 4. 네트워크 구조

VPC는 2개 AZ를 사용하는 기본적인 운영형 구조로 만든다.

```text
VPC 10.0.0.0/16

Public Subnet A
  - ALB
  - NAT Gateway

Public Subnet C
  - ALB

Private App Subnet A
  - ECS Frontend Task
  - ECS Backend Task

Private App Subnet C
  - ECS Frontend Task
  - ECS Backend Task

Private DB Subnet A/C
  - RDS MySQL
```

### Security Group

ALB Security Group:

```text
Inbound
- 80  from 0.0.0.0/0
- 443 from 0.0.0.0/0

Outbound
- Frontend ECS SG 3000
- Backend ECS SG 8888
```

Frontend ECS Security Group:

```text
Inbound
- 3000 from ALB SG

Outbound
- 443 to internet or NAT
- 8888 to Backend ECS SG, 필요한 경우
```

Backend ECS Security Group:

```text
Inbound
- 8888 from ALB SG

Outbound
- 3306 to RDS SG
- 443 to S3/AWS APIs
```

RDS Security Group:

```text
Inbound
- 3306 from Backend ECS SG

Outbound
- 기본값 유지
```

## 5. ALB 라우팅

도메인을 분리하는 구성이 가장 설명하기 쉽다.

```text
study-board.example.com      -> Frontend target group
api.study-board.example.com  -> Backend target group
cdn.study-board.example.com  -> CloudFront + S3
```

ALB listener:

```text
80
  -> 443 redirect

443
  host: study-board.example.com
    -> frontend target group, port 3000

  host: api.study-board.example.com
    -> backend target group, port 8888
```

Socket.IO도 `api.study-board.example.com`으로 받는다. ALB는 WebSocket 업그레이드를 지원하므로 별도 WebSocket 서버를 만들 필요는 없다.

## 6. Socket.IO 운영 기준

현재 백엔드 Gateway는 접속 유저 상태를 메모리 `Map`으로 들고 있다. 따라서 첫 배포는 Backend task를 1개로 시작하는 것이 안전하다.

```text
초기 운영:
- backend desired count = 1
- ALB WebSocket 지원 사용
- CloudWatch Logs로 연결/메시지 오류 확인
```

트래픽이 늘어서 Backend task를 2개 이상으로 늘리려면 다음 개선이 필요하다.

```text
확장 운영:
- ElastiCache Redis 추가
- Socket.IO Redis adapter 적용
- 접속 유저 presence 상태를 Redis로 이동
- 필요 시 ALB stickiness 검토
```

면접에서는 이 지점을 명확히 말하는 것이 좋다.

> 현재 구조는 단일 backend task에서 안정적으로 운영하는 것을 1차 목표로 했습니다. WebSocket 수평 확장 시에는 인메모리 상태를 Redis로 분리하고 Socket.IO Redis adapter를 적용해야 합니다.

## 7. CI/CD

GitHub Actions로 다음 흐름을 만든다.

```text
Pull Request
  - front npm run build
  - back npm run build
  - back npm run test

main merge
  - Docker build frontend
  - Docker build backend
  - Push to ECR
  - ECS service update
  - ALB health check 통과 후 배포 완료
```

ECS 배포는 rolling update로 충분하다. Blue/Green까지 넣으면 보기에는 좋지만, 처음부터 넣으면 설정 복잡도가 커진다.

포트폴리오에서 추가로 보여주면 좋은 것:

- GitHub Actions workflow 파일
- ECR 이미지 태그 전략: `git sha`
- ECS task definition revision
- 실패 시 이전 task revision으로 rollback

## 8. 로그와 모니터링

필수:

- CloudWatch Logs: frontend/backend 컨테이너 로그
- CloudWatch Metrics: ECS CPU/Memory, ALB 5xx, target response time
- RDS Metrics: CPU, connection, storage, slow query

알람 예시:

```text
ALB 5xx count > 5 for 5 minutes
ECS CPU > 70% for 10 minutes
ECS Memory > 80% for 10 minutes
RDS FreeStorageSpace low
RDS DatabaseConnections high
```

면접에서는 로그를 "에러가 났을 때 어디서 확인하는가" 관점으로 설명하면 좋다.

## 9. 보안 기준

최소 기준:

- HTTPS 강제
- RDS public access 비활성화
- S3 public access 차단
- IAM access key를 코드와 `.env`에 커밋하지 않기
- Secrets Manager 또는 SSM Parameter Store로 민감값 관리
- ECS task role에 필요한 S3 권한만 부여
- Swagger `/api`는 운영에서 접근 제한 또는 비활성화
- CORS는 실제 프론트 도메인만 허용
- `DB_SYNC=false`

S3 IAM 예시:

```text
Backend ECS Task Role
- s3:PutObject
- s3:GetObject
- s3:DeleteObject

Resource
- arn:aws:s3:::study-board-prod-uploads/*
```

## 10. 비용을 너무 아끼지 않는 현실적 사양

포트폴리오 목적의 현실적인 시작 사양:

```text
ECS Frontend
- 0.5 vCPU / 1GB
- desired count 1

ECS Backend
- 0.5 vCPU / 1GB
- desired count 1

RDS MySQL
- db.t4g.micro 또는 db.t4g.small
- storage 20GB+

ALB
- 1개

S3 + CloudFront
- 업로드 파일 제공

NAT Gateway
- 비용은 있지만 private subnet ECS 운영을 설명하기 좋음
```

복지나 지원으로 비용 부담이 작다면 NAT Gateway와 RDS를 쓰는 쪽이 좋다. 비용을 극단적으로 줄이려면 EC2 + Docker Compose도 가능하지만, 이직 포트폴리오 관점에서는 설득력이 떨어진다.

## 11. 구현 순서

1. 프론트/백엔드 Dockerfile 작성
2. 로컬 Docker build 확인
3. ECR repository 2개 생성
4. VPC, subnet, security group 생성
5. RDS MySQL 생성
6. S3 upload bucket 생성
7. ECS cluster 생성
8. frontend/backend task definition 작성
9. ALB target group과 listener rule 작성
10. Route 53 도메인 연결
11. ACM 인증서 적용
12. GitHub Actions 배포 자동화
13. CloudWatch 로그와 알람 설정
14. README 또는 포트폴리오 문서에 아키텍처 캡처 추가

## 12. 면접에서 말할 핵심 스토리

한국어:

> 이 프로젝트는 단순 EC2 배포가 아니라, 프론트엔드, 백엔드, DB, 파일 저장소를 분리해서 AWS 운영 구조로 설계했습니다. Next.js와 NestJS는 각각 ECS Fargate 컨테이너로 운영하고, DB는 private subnet의 RDS MySQL을 사용했습니다. 업로드 파일은 S3에 저장하고 CloudFront로 제공합니다. 실시간 채팅은 Socket.IO를 사용하며, 초기에는 단일 backend task로 안정성을 우선하고, 수평 확장 시 Redis adapter를 추가하는 구조로 설계했습니다.

일본어:

> このプロジェクトでは、単純なEC2デプロイではなく、フロントエンド、バックエンド、DB、ファイルストレージを分離したAWS構成にしました。Next.jsとNestJSはECS Fargate上のコンテナとして動かし、DBはprivate subnet上のRDS MySQLを利用します。アップロードファイルはS3に保存し、CloudFront経由で配信します。リアルタイムチャットはSocket.IOを使っており、初期構成ではbackend taskを1台にして安定性を優先し、スケールアウト時にはRedis adapterを導入する想定です。

## 13. 하지 않아도 되는 것

처음부터 아래까지 전부 할 필요는 없다.

- EKS
- Terraform 전체 자동화
- Blue/Green 배포
- Multi-region
- Aurora
- Redis 기반 Socket.IO 수평 확장
- Lambda 이미지 리사이징
- WAF 상세 룰 튜닝

다만 "확장 시에는 이렇게 바꾼다" 정도로 문서에 적어두면, 깊이가 아주 깊지 않아도 운영 방향성을 이해하고 있다는 인상을 줄 수 있다.

## 14. 최종 추천

Study-Board 포트폴리오의 AWS 목표는 다음 한 줄로 정리한다.

> Next.js + NestJS 풀스택 서비스를 ECS Fargate, RDS, S3, CloudFront, ALB, Route 53으로 운영형 배포하고, Socket.IO와 파일 업로드의 확장 포인트까지 설명 가능한 구조.

이 정도면 일본 서비스 회사와 대형 SI 면접에서 "혼자 만든 프로젝트를 클라우드 운영 관점까지 생각해서 올려봤다"는 메시지를 충분히 줄 수 있다.
