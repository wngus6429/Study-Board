# AWS 아키텍처 다이어그램

## 전체 아키텍처 구성도

```
┌─────────────────────────────────────────────────────────────────┐
│                           Internet                              │
└─────────────────────────┬───────────────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────────────┐
│                     Route 53                                   │
│                  (DNS Service)                                 │
│              your-domain.com → ALB                             │
└─────────────────────────┬───────────────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────────────┐
│                Application Load Balancer                       │
│                      (ALB)                                     │
│    ┌─────────────────────────────────────────────────────────┐  │
│    │  Listener Rules:                                        │  │
│    │  • /api/* → Backend Target Group                       │  │
│    │  • /*     → Frontend Target Group                      │  │
│    └─────────────────────────────────────────────────────────┘  │
└─────────────────┬───────────────────┬───────────────────────────┘
                  │                   │
                  │                   │
┌─────────────────▼───────────────────▼───────────────────────────┐
│                        VPC                                     │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                   Public Subnet                            │ │
│  │                                                             │ │
│  │  ┌─────────────────┐         ┌─────────────────┐            │ │
│  │  │    Frontend     │         │    Backend      │            │ │
│  │  │     EC2         │         │     EC2         │            │ │
│  │  │                 │         │                 │            │ │
│  │  │  - Next.js App  │         │  - NestJS API   │            │ │
│  │  │  - Port 3000    │         │  - Port 9999    │            │ │
│  │  │  - Nginx        │         │  - PM2          │            │ │
│  │  └─────────────────┘         └─────────────────┘            │ │
│  │           │                           │                     │ │
│  │           └─────────────┬─────────────┘                     │ │
│  │                         │                                   │ │
│  │  ┌─────────────────────▼─────────────────────┐              │ │
│  │  │              Database                     │              │ │
│  │  │            (RDS MySQL)                    │              │ │
│  │  │         Private Subnet                    │              │ │
│  │  └───────────────────────────────────────────┘              │ │
│  └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                          │
                          │ (Static Files)
┌─────────────────────────▼───────────────────────────────────────┐
│                        S3 Bucket                               │
│                                                                 │
│  • User uploaded images                                        │
│  • Story images/videos                                         │
│  • Profile pictures                                            │
│  • Static assets                                               │
│                                                                 │
│  Public Read Access for images                                 │
└─────────────────────────────────────────────────────────────────┘
```

## 상세 구성 설명

### 1. Route 53 (DNS 서비스)

```
- Domain: your-domain.com
- A Record: your-domain.com → ALB Public IP
- Health Check: ALB 상태 모니터링
- SSL 인증서: AWS Certificate Manager 연동
```

### 2. Application Load Balancer (ALB)

#### Target Groups 구성

```
┌─────────────────────────────────────┐
│ Frontend Target Group               │
│ - Port: 3000                       │
│ - Health Check: /                  │
│ - Protocol: HTTP                   │
│ - Target: Frontend EC2 Instance    │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ Backend Target Group                │
│ - Port: 9999                       │
│ - Health Check: /api/health        │
│ - Protocol: HTTP                   │
│ - Target: Backend EC2 Instance     │
└─────────────────────────────────────┘
```

#### Listener Rules

- **Port 80**: HTTP → HTTPS 리디렉션
- **Port 443**: HTTPS 요청 처리
  - `/api/*` → Backend Target Group
  - `/*` → Frontend Target Group

### 3. EC2 인스턴스 구성

#### Frontend EC2 (Next.js)

```bash
# 서버 설정
- OS: Amazon Linux 2
- Instance Type: t3.medium
- Node.js: 18.x LTS
- Package Manager: npm/yarn
- Port: 3000

# 배포 설정
- Next.js 프로덕션 빌드
- PM2 프로세스 매니저
- Nginx 리버스 프록시 (선택사항)

# 주요 명령어
npm run build
pm2 start ecosystem.config.js
```

#### Backend EC2 (NestJS)

```bash
# 서버 설정
- OS: Amazon Linux 2
- Instance Type: t3.medium
- Node.js: 18.x LTS
- Package Manager: npm/yarn
- Port: 9999

# 배포 설정
- NestJS 프로덕션 빌드
- PM2 프로세스 매니저
- 환경변수 설정

# 주요 명령어
npm run build
pm2 start dist/main.js --name "nestjs-api"
```

### 4. RDS Database (MySQL)

```
- Engine: MySQL 8.0
- Instance Class: db.t3.micro (개발용) / db.t3.small (운영용)
- Storage: 20GB SSD (확장 가능)
- Multi-AZ: 고가용성을 위해 활성화
- Automated Backups: 7일 보관
- Subnet Group: Private Subnet
- Security Group: Backend EC2에서만 접근 허용
```

### 5. S3 Bucket (파일 저장소)

```
- Bucket Name: your-app-uploads
- Region: ap-northeast-2 (Seoul)
- Storage Class: Standard
- Public Access: 읽기 전용
- CORS 설정: 프론트엔드 도메인 허용

# 파일 구조
/uploads/
  ├── users/          # 사용자 프로필 이미지
  ├── stories/        # 스토리 이미지/비디오
  ├── channels/       # 채널 대표 이미지
  └── temp/          # 임시 파일
```

## 보안 그룹 설정

### ALB Security Group

```
Inbound Rules:
- HTTP (80): 0.0.0.0/0
- HTTPS (443): 0.0.0.0/0

Outbound Rules:
- All Traffic: 0.0.0.0/0
```

### Frontend EC2 Security Group

```
Inbound Rules:
- HTTP (3000): ALB Security Group
- SSH (22): Your IP Address

Outbound Rules:
- All Traffic: 0.0.0.0/0
```

### Backend EC2 Security Group

```
Inbound Rules:
- HTTP (9999): ALB Security Group
- SSH (22): Your IP Address

Outbound Rules:
- All Traffic: 0.0.0.0/0
```

### RDS Security Group

```
Inbound Rules:
- MySQL (3306): Backend EC2 Security Group

Outbound Rules:
- None (기본값)
```

## 네트워크 구성

### VPC 설정

```
- CIDR: 10.0.0.0/16
- 가용영역: 2개 (ap-northeast-2a, ap-northeast-2c)
```

### Subnet 구성

```
Public Subnet A (10.0.1.0/24):
- Frontend EC2
- NAT Gateway

Public Subnet C (10.0.2.0/24):
- Backend EC2
- ALB

Private Subnet A (10.0.3.0/24):
- RDS Primary

Private Subnet C (10.0.4.0/24):
- RDS Standby (Multi-AZ)
```

## 배포 프로세스

### 1. 인프라 구축 순서

1. VPC 및 서브넷 생성
2. 보안 그룹 설정
3. RDS 인스턴스 생성
4. EC2 인스턴스 시작
5. ALB 생성 및 Target Group 설정
6. Route 53 도메인 연결
7. SSL 인증서 적용

### 2. 애플리케이션 배포

```bash
# Frontend 배포
git clone <repository>
cd front
npm install
npm run build
pm2 start ecosystem.config.js

# Backend 배포
cd ../back
npm install
npm run build
pm2 start dist/main.js --name "api-server"
```

### 3. 환경 변수 설정

```bash
# Backend 환경변수
export DB_HOST=<rds-endpoint>
export DB_PASSWORD=<db-password>
export S3_BUCKET=<bucket-name>
export JWT_SECRET=<jwt-secret>

# Frontend 환경변수
export NEXT_PUBLIC_BASE_URL=https://your-domain.com
export NEXT_PUBLIC_S3_URL=https://your-bucket.s3.amazonaws.com
```

## 모니터링 및 관리

### CloudWatch 메트릭

- EC2 인스턴스 CPU/메모리 사용률
- ALB 요청 수 및 응답 시간
- RDS 연결 수 및 쿼리 성능
- S3 요청 수 및 대역폭

### 로그 관리

- EC2: CloudWatch Logs Agent 설치
- ALB: 액세스 로그 S3 저장
- RDS: 슬로우 쿼리 로그 활성화

## 비용 최적화

### 개발 환경

- EC2: t3.micro (프리 티어)
- RDS: db.t3.micro (프리 티어)
- ALB: 사용량 기반 과금

### 운영 환경

- EC2: t3.small ~ t3.medium
- RDS: db.t3.small (Multi-AZ)
- Auto Scaling 그룹 적용 고려

## 백업 및 재해 복구

### 백업 전략

- RDS: 자동 백업 7일 보관
- EC2: AMI 스냅샷 주기적 생성
- S3: 버전 관리 및 Cross-Region 복제

### 재해 복구

- Multi-AZ RDS로 데이터베이스 가용성 확보
- ALB Health Check로 장애 인스턴스 자동 제외
- Route 53 Health Check로 전체 서비스 모니터링

---

**작성일**: 2024년 12월
**버전**: 1.0
**작성자**: AWS 아키텍처 설계
