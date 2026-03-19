# 🚀 AWS 배포 가이드

## 📋 배포 개요

**Story Board** 애플리케이션을 AWS 클라우드 환경에 배포하기 위한 완전한 가이드입니다.

- **프론트엔드**: Next.js 14 (Docker 컨테이너)
- **백엔드**: NestJS 10 (Docker 컨테이너)
- **데이터베이스**: Amazon RDS MySQL 8.0
- **파일 저장소**: Amazon S3
- **로드 밸런서**: Application Load Balancer (ALB)
- **도메인 관리**: Route53
- **CDN**: CloudFront (선택사항)

---

## 📦 생성된 파일들

### 🔧 환경 변수 설정

- `back/env.example` - 백엔드 환경 변수 템플릿
- `front/env.example` - 프론트엔드 환경 변수 템플릿

### 🐳 Docker 설정

- `back/Dockerfile` - 백엔드 컨테이너 설정
- `front/Dockerfile` - 프론트엔드 컨테이너 설정
- `docker-compose.yml` - 로컬 테스트용 전체 스택

### ☁️ AWS 대응 코드

- `back/src/common/services/s3.service.ts` - S3 파일 업로드 서비스
- `back/src/common/common.module.ts` - 공통 모듈

### 📜 배포 스크립트

- `scripts/setup.sh` - 초기 설정 스크립트
- `scripts/deploy-backend.sh` - 백엔드 배포 스크립트
- `scripts/deploy-frontend.sh` - 프론트엔드 배포 스크립트

### 📚 문서

- `AWS_DEPLOYMENT_GUIDE.md` - 상세한 AWS 배포 가이드
- `AWS_CHANGES_SUMMARY.md` - 변경사항 요약

---

## ✨ 주요 변경사항

### 🔐 보안 강화

- ✅ **환경 변수로 설정 관리** - DB 정보, AWS 키, 도메인 등 민감 정보 분리
- ✅ **컨테이너 보안** - Docker를 통한 격리된 실행 환경
- ✅ **AWS IAM 권한** - 최소 권한 원칙 적용

### 📁 파일 저장소 개선

- ✅ **S3 파일 업로드** - 기존 로컬 파일 저장을 S3로 변경 가능
- ✅ **CDN 연동** - CloudFront를 통한 빠른 파일 전송

### 🐳 컨테이너화

- ✅ **Docker 컨테이너화** - 배포 일관성 확보
- ✅ **멀티 스테이지 빌드** - 이미지 크기 최적화

### ☁️ AWS 인프라 지원

- ✅ **RDS 연동** - 관리형 MySQL 데이터베이스
- ✅ **S3 연동** - 확장 가능한 파일 저장소
- ✅ **ALB 연동** - 고가용성 로드 밸런싱
- ✅ **Route53 연동** - 도메인 관리 및 DNS

---

## 🚀 빠른 시작

### 1️⃣ 패키지 설치

```bash
# 백엔드 의존성 설치
cd back && npm install

# 프론트엔드 의존성 설치
cd ../front && npm install
```

### 2️⃣ 환경 변수 설정

```bash
# .env 파일들을 실제 값으로 수정
cp back/env.example back/.env
cp front/env.example front/.env
```

### 3️⃣ AWS 리소스 생성

- AWS 콘솔에서 필요한 리소스 생성 (아래 상세 가이드 참조)

### 4️⃣ 배포 실행

```bash
# EC2에서 배포 스크립트 실행
./scripts/deploy-backend.sh
./scripts/deploy-frontend.sh
```

---

## 💰 예상 비용

**월 예상 비용**: 약 **$68-73**

| 서비스  | 인스턴스/설정  | 월 비용 |
| ------- | -------------- | ------- | --- |
| EC2     | t3.micro × 2   | ~$17    |
| RDS     | db.t3.micro    | ~$13    |
| ALB     | 1개            | ~$22    |
| S3      | 저장소 + 전송  | ~$5-10  |
| Route53 | 호스팅 영역    | ~$1     |
| 기타    | NAT Gateway 등 | ~$10-20 | ㅕ  |

> 💡 **절약 팁**: Reserved Instance 사용 시 약 30-40% 절약 가능

---

## 🏗️ AWS 아키텍처

```
[사용자] → [Route53] → [CloudFront] → [ALB] → [EC2 Frontend]
                                              ↓
                                     [EC2 Backend] → [RDS MySQL]
                                              ↓
                                        [S3 Bucket]
```

## 1. AWS 리소스 준비

### 1.1 VPC 및 네트워킹

- VPC 생성 (예: 10.0.0.0/16)
- 퍼블릭 서브넷 2개 (가용영역별)
- 프라이빗 서브넷 2개 (가용영역별)
- 인터넷 게이트웨이
- NAT 게이트웨이 (프라이빗 서브넷용)

### 1.2 보안 그룹 설정

#### 프론트엔드 보안 그룹

```
- HTTP (80) from ALB
- HTTPS (443) from ALB
- SSH (22) from 관리자 IP
```

#### 백엔드 보안 그룹

```
- HTTP (8888) from Frontend SG
- SSH (22) from 관리자 IP
```

#### RDS 보안 그룹

```
- MySQL (3306) from Backend SG
```

#### ALB 보안 그룹

```
- HTTP (80) from 0.0.0.0/0
- HTTPS (443) from 0.0.0.0/0
```

### 1.3 RDS MySQL 설정

```bash
# RDS 인스턴스 생성
- 엔진: MySQL 8.0
- 인스턴스 클래스: db.t3.micro (또는 더 큰 사이즈)
- 스토리지: 20GB (필요에 따라 조정)
- Multi-AZ: 활성화 (운영환경)
- 데이터베이스 이름: board-study
- 마스터 사용자명: admin
- 비밀번호: 강력한 비밀번호 설정
```

### 1.4 S3 버킷 설정

```bash
# S3 버킷 생성
aws s3 mb s3://your-story-board-bucket

# 버킷 정책 설정 (공개 읽기 허용)
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "PublicReadGetObject",
            "Effect": "Allow",
            "Principal": "*",
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::your-story-board-bucket/*"
        }
    ]
}

# CORS 설정
[
    {
        "AllowedHeaders": ["*"],
        "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
        "AllowedOrigins": ["*"],
        "ExposeHeaders": []
    }
]
```

## 2. EC2 인스턴스 설정

### 2.1 EC2 인스턴스 생성

- AMI: Amazon Linux 2023
- 인스턴스 타입: t3.micro (또는 더 큰 사이즈)
- 키 페어: 새로 생성하거나 기존 키 사용
- 스토리지: 8GB 이상

### 2.2 Docker 설치 (두 인스턴스 모두)

```bash
# Docker 설치
sudo yum update -y
sudo yum install -y docker
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -a -G docker ec2-user

# Docker Compose 설치
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

## 3. 애플리케이션 배포

### 3.1 백엔드 배포

#### 환경 변수 설정 (.env 파일 생성)

```bash
# /home/ec2-user/story-board-backend/.env
DB_HOST=your-rds-endpoint.region.rds.amazonaws.com
DB_PORT=3306
DB_USERNAME=admin
DB_PASSWORD=your-db-password
DB_DATABASE=board-study

PORT=8888
NODE_ENV=production

AWS_REGION=ap-northeast-2
AWS_ACCESS_KEY_ID=your-access-key-id
AWS_SECRET_ACCESS_KEY=your-secret-access-key
S3_BUCKET_NAME=your-story-board-bucket

JWT_SECRET=your-very-secure-jwt-secret
FRONTEND_URL=https://your-domain.com
```

#### 배포 스크립트

```bash
#!/bin/bash
# deploy-backend.sh

cd /home/ec2-user/story-board-backend

# Git에서 최신 코드 가져오기
git pull origin main

# Docker 이미지 빌드
docker build -t story-board-backend .

# 기존 컨테이너 정지 및 제거
docker stop story-board-backend || true
docker rm story-board-backend || true

# 새 컨테이너 실행
docker run -d \
  --name story-board-backend \
  -p 8888:8888 \
  --env-file .env \
  --restart unless-stopped \
  story-board-backend

echo "백엔드 배포 완료"
```

### 3.2 프론트엔드 배포

#### 환경 변수 설정 (.env 파일 생성)

```bash
# /home/ec2-user/story-board-frontend/.env
NEXT_PUBLIC_BASE_URL=https://api.your-domain.com
NEXTAUTH_SECRET=your-nextauth-secret-key
NEXTAUTH_URL=https://your-domain.com
NEXT_PUBLIC_SITE_PASSWORD=your-site-password
NEXT_PUBLIC_MODE=production
NEXT_PUBLIC_CDN_URL=https://your-cloudfront-domain.com
NEXT_PUBLIC_S3_URL=https://your-story-board-bucket.s3.ap-northeast-2.amazonaws.com
```

#### 배포 스크립트

```bash
#!/bin/bash
# deploy-frontend.sh

cd /home/ec2-user/story-board-frontend

# Git에서 최신 코드 가져오기
git pull origin main

# Docker 이미지 빌드
docker build -t story-board-frontend .

# 기존 컨테이너 정지 및 제거
docker stop story-board-frontend || true
docker rm story-board-frontend || true

# 새 컨테이너 실행
docker run -d \
  --name story-board-frontend \
  -p 3000:3000 \
  --env-file .env \
  --restart unless-stopped \
  story-board-frontend

echo "프론트엔드 배포 완료"
```

## 4. Application Load Balancer (ALB) 설정

### 4.1 타겟 그룹 생성

```bash
# 프론트엔드 타겟 그룹
- 타겟 타입: Instances
- 프로토콜: HTTP
- 포트: 3000
- 헬스 체크 경로: /

# 백엔드 타겟 그룹
- 타겟 타입: Instances
- 프로토콜: HTTP
- 포트: 8888
- 헬스 체크 경로: /api
```

### 4.2 ALB 생성 및 리스너 규칙

```bash
# 기본 리스너 (HTTPS:443)
- 기본 액션: 프론트엔드 타겟 그룹으로 전달

# 추가 규칙
- Path가 /api/* 인 경우: 백엔드 타겟 그룹으로 전달
- Path가 /upload/* 인 경우: 백엔드 타겟 그룹으로 전달
- Path가 /userUpload/* 인 경우: 백엔드 타겟 그룹으로 전달
- Path가 /channelUpload/* 인 경우: 백엔드 타겟 그룹으로 전달
- Path가 /suggestionUpload/* 인 경우: 백엔드 타겟 그룹으로 전달
```

## 5. Route53 및 SSL 인증서

### 5.1 ACM 인증서 발급

```bash
# AWS Certificate Manager에서 SSL 인증서 요청
- 도메인: your-domain.com
- 추가 도메인: *.your-domain.com
- 검증 방법: DNS 검증
```

### 5.2 Route53 레코드 설정

```bash
# A 레코드 (또는 ALIAS)
your-domain.com → ALB DNS 이름
api.your-domain.com → ALB DNS 이름 (선택사항)
```

## 6. 모니터링 및 로그

### 6.1 CloudWatch 설정

```bash
# 로그 그룹 생성
/aws/ec2/story-board-frontend
/aws/ec2/story-board-backend

# 알람 설정
- CPU 사용률 > 80%
- 메모리 사용률 > 80%
- 디스크 사용률 > 80%
```

### 6.2 로그 수집 설정

```bash
# CloudWatch 에이전트 설치 (각 EC2 인스턴스)
sudo yum install -y amazon-cloudwatch-agent

# 에이전트 설정 파일 생성
{
    "logs": {
        "logs_collected": {
            "files": {
                "collect_list": [
                    {
                        "file_path": "/var/log/docker-logs/*.log",
                        "log_group_name": "/aws/ec2/story-board",
                        "log_stream_name": "{instance_id}"
                    }
                ]
            }
        }
    }
}
```

## 7. 보안 강화

### 7.1 IAM 역할 설정

```bash
# EC2 인스턴스용 IAM 역할
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "s3:PutObject",
                "s3:GetObject",
                "s3:DeleteObject"
            ],
            "Resource": "arn:aws:s3:::your-story-board-bucket/*"
        },
        {
            "Effect": "Allow",
            "Action": [
                "logs:CreateLogGroup",
                "logs:CreateLogStream",
                "logs:PutLogEvents"
            ],
            "Resource": "*"
        }
    ]
}
```

### 7.2 백업 설정

```bash
# RDS 자동 백업 활성화
- 백업 보존 기간: 7일
- 백업 윈도우: 새벽 시간대

# S3 버킷 버전 관리 활성화
aws s3api put-bucket-versioning \
    --bucket your-story-board-bucket \
    --versioning-configuration Status=Enabled
```

## 8. 배포 자동화 (선택사항)

### 8.1 GitHub Actions 설정

```yaml
# .github/workflows/deploy.yml
name: Deploy to AWS

on:
  push:
    branches: [main]

jobs:
  deploy-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Deploy to backend server
        uses: appleboy/ssh-action@v0.1.5
        with:
          host: ${{ secrets.BACKEND_HOST }}
          username: ec2-user
          key: ${{ secrets.SSH_PRIVATE_KEY }}
          script: |
            cd /home/ec2-user/story-board-backend
            ./deploy-backend.sh

  deploy-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Deploy to frontend server
        uses: appleboy/ssh-action@v0.1.5
        with:
          host: ${{ secrets.FRONTEND_HOST }}
          username: ec2-user
          key: ${{ secrets.SSH_PRIVATE_KEY }}
          script: |
            cd /home/ec2-user/story-board-frontend
            ./deploy-frontend.sh
```

## 9. 비용 최적화

### 9.1 예상 월 비용 (서울 리전 기준)

```
- EC2 t3.micro (2대): ~$20
- RDS db.t3.micro: ~$20
- ALB: ~$20
- S3 스토리지 (10GB): ~$1
- CloudFront: ~$1
- Route53: ~$1
- 데이터 전송: ~$5-10

총 예상 비용: ~$68-73/월
```

### 9.2 비용 절약 팁

- Reserved Instances 사용 (1년 약정시 ~40% 절약)
- Spot Instances 사용 (개발 환경)
- CloudWatch 로그 보존 기간 단축
- S3 Lifecycle 정책 설정

## 10. 트러블슈팅

### 10.1 일반적인 문제들

```bash
# Docker 컨테이너가 시작되지 않는 경우
docker logs story-board-backend
docker logs story-board-frontend

# 데이터베이스 연결 실패
- RDS 보안 그룹 확인
- 환경 변수 확인
- 네트워크 연결 확인

# 파일 업로드 실패
- S3 버킷 정책 확인
- IAM 권한 확인
- CORS 설정 확인
```

### 10.2 성능 모니터링

```bash
# CPU/메모리 사용률 확인
htop
docker stats

# 네트워크 확인
netstat -tulpn
```

## 11. 유지보수

### 11.1 정기 작업

- 보안 업데이트 적용
- 백업 상태 확인
- 로그 정리
- 성능 모니터링

### 11.2 업데이트 절차

1. 코드 변경사항 커밋
2. 테스트 환경에서 검증
3. 배포 스크립트 실행
4. 헬스 체크 확인
5. 모니터링 확인

---

이 가이드를 따라 AWS에 Story Board 애플리케이션을 성공적으로 배포할 수 있습니다.
