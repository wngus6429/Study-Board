# 🚀 AWS 배포 가이드 (도커 없이)

## 📋 배포 개요

**Study Board** 애플리케이션을 도커 없이 AWS 클라우드 환경에 배포하기 위한 완전한 가이드입니다.

- **프론트엔드**: Next.js 14 (Node.js 직접 실행)
- **백엔드**: NestJS 10 (Node.js 직접 실행)
- **데이터베이스**: Amazon RDS MySQL 8.0
- **파일 저장소**: Amazon S3
- **로드 밸런서**: Application Load Balancer (ALB)
- **도메인 관리**: Route53
- **프로세스 관리**: PM2
- **웹 서버**: Nginx (리버스 프록시)

---

## 🏗️ AWS 아키텍처

```
[사용자] → [Route53] → [ALB] → [Nginx] → [EC2 Frontend (Next.js)]
                                      ↓
                              [EC2 Backend (NestJS)] → [RDS MySQL]
                                      ↓
                                [S3 Bucket]
```

---

## 💰 예상 비용

**월 예상 비용**: 약 **$55-65**

| 서비스  | 인스턴스/설정  | 월 비용 |
| ------- | -------------- | ------- |
| EC2     | t3.micro × 2   | ~$17    |
| RDS     | db.t3.micro    | ~$13    |
| ALB     | 1개            | ~$22    |
| S3      | 저장소 + 전송  | ~$5-10  |
| Route53 | 호스팅 영역    | ~$1     |
| 기타    | 데이터 전송 등 | ~$7-12  |

> 💡 **절약 팁**: Reserved Instance 사용 시 약 30-40% 절약 가능

---

## 🚀 1단계: AWS 인프라 설정

### 1.1 VPC 및 네트워킹 설정

```bash
# VPC 생성
- VPC CIDR: 10.0.0.0/16
- DNS 호스트명 활성화
- DNS 해석 활성화

# 서브넷 생성
퍼블릭 서브넷 1: 10.0.1.0/24 (ap-northeast-2a)
퍼블릭 서브넷 2: 10.0.2.0/24 (ap-northeast-2c)
프라이빗 서브넷 1: 10.0.11.0/24 (ap-northeast-2a)
프라이빗 서브넷 2: 10.0.12.0/24 (ap-northeast-2c)

# 인터넷 게이트웨이
- VPC에 연결

# 라우팅 테이블
퍼블릭: 0.0.0.0/0 → 인터넷 게이트웨이
프라이빗: 기본 라우팅만
```

### 1.2 보안 그룹 설정

#### ALB 보안 그룹 (sg-alb)

```bash
인바운드:
- HTTP (80) from 0.0.0.0/0
- HTTPS (443) from 0.0.0.0/0

아웃바운드:
- All traffic to 0.0.0.0/0
```

#### 프론트엔드 EC2 보안 그룹 (sg-frontend)

```bash
인바운드:
- HTTP (3000) from sg-alb
- SSH (22) from 관리자 IP
- HTTP (80) from sg-alb (Nginx용)

아웃바운드:
- All traffic to 0.0.0.0/0
```

#### 백엔드 EC2 보안 그룹 (sg-backend)

```bash
인바운드:
- HTTP (8888) from sg-frontend
- SSH (22) from 관리자 IP

아웃바운드:
- All traffic to 0.0.0.0/0
```

#### RDS 보안 그룹 (sg-rds)

```bash
인바운드:
- MySQL (3306) from sg-backend

아웃바운드:
- All traffic to 0.0.0.0/0
```

---

## 🗄️ 2단계: RDS MySQL 설정

### 2.1 RDS 인스턴스 생성

```bash
# RDS 생성 설정
엔진: MySQL 8.0.35
인스턴스 클래스: db.t3.micro
할당된 스토리지: 20GB
스토리지 자동 조정: 활성화
Multi-AZ: 비활성화 (비용 절약, 운영환경에서는 활성화 권장)

# 연결 설정
VPC: 생성한 VPC
서브넷 그룹: 프라이빗 서브넷들
보안 그룹: sg-rds
퍼블릭 액세스: 아니요

# 데이터베이스 설정
초기 데이터베이스 이름: studyboard
마스터 사용자명: admin
마스터 비밀번호: [강력한 비밀번호 설정]
```

### 2.2 데이터베이스 초기화

```sql
-- RDS에 연결 후 실행
CREATE DATABASE IF NOT EXISTS studyboard;
USE studyboard;

-- 필요한 초기 설정이 있다면 여기에 추가
```

---

## 📦 3단계: S3 버킷 설정

### 3.1 S3 버킷 생성

```bash
# AWS CLI로 버킷 생성
aws s3 mb s3://study-board-uploads-[random-string]

# 또는 콘솔에서 생성
버킷 이름: study-board-uploads-[unique-suffix]
리전: ap-northeast-2 (서울)
퍼블릭 액세스 차단: 일부 허용 (정책으로 제어)
```

### 3.2 버킷 정책 설정

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::study-board-uploads-[your-suffix]/*"
    }
  ]
}
```

### 3.3 CORS 설정

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
    "AllowedOrigins": ["*"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3000
  }
]
```

---

## 🖥️ 4단계: EC2 인스턴스 설정

### 4.1 EC2 인스턴스 생성 (2개)

```bash
# 프론트엔드 인스턴스
AMI: Amazon Linux 2023
인스턴스 타입: t3.micro
키 페어: 새로 생성 또는 기존 키 사용
네트워크: 퍼블릭 서브넷
보안 그룹: sg-frontend
스토리지: 8GB gp3

# 백엔드 인스턴스
AMI: Amazon Linux 2023
인스턴스 타입: t3.micro
키 페어: 동일한 키 페어
네트워크: 퍼블릭 서브넷 (또는 프라이빗)
보안 그룹: sg-backend
스토리지: 8GB gp3
```

### 4.2 IAM 역할 생성 및 연결

```bash
# EC2용 IAM 역할 생성
역할 이름: StudyBoard-EC2-Role

# 정책 연결
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "s3:PutObject",
                "s3:GetObject",
                "s3:DeleteObject",
                "s3:ListBucket"
            ],
            "Resource": [
                "arn:aws:s3:::study-board-uploads-*",
                "arn:aws:s3:::study-board-uploads-*/*"
            ]
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

# EC2 인스턴스에 역할 연결
```

---

## 🔧 5단계: 서버 환경 설정

### 5.1 백엔드 서버 설정

```bash
# EC2 백엔드 인스턴스에 SSH 접속
ssh -i your-key.pem ec2-user@[backend-public-ip]

# 시스템 업데이트
sudo yum update -y

# Node.js 18 설치
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo yum install -y nodejs

# Git 설치
sudo yum install -y git

# PM2 전역 설치
sudo npm install -g pm2

# 프로젝트 클론
cd /home/ec2-user
git clone https://github.com/[your-username]/Study-Board.git
cd Study-Board/back

# 의존성 설치
npm install

# 환경 변수 파일 생성
nano .env
```

#### 백엔드 환경 변수 (.env)

```bash
# 데이터베이스 설정
DB_HOST=[RDS-엔드포인트]
DB_PORT=3306
DB_USERNAME=admin
DB_PASSWORD=[RDS-비밀번호]
DB_DATABASE=studyboard

# 서버 설정
PORT=8888
NODE_ENV=production

# AWS 설정
AWS_REGION=ap-northeast-2
S3_BUCKET_NAME=study-board-uploads-[your-suffix]

# JWT 설정
JWT_SECRET=[매우-강력한-JWT-시크릿]

# CORS 설정
FRONTEND_URL=https://[your-domain.com]
ALLOWED_ORIGINS=https://[your-domain.com]

# 기타 설정
SITE_PASSWORD=[사이트-패스워드]
```

#### 백엔드 빌드 및 실행

```bash
# TypeScript 빌드
npm run build

# PM2로 실행
pm2 start dist/main.js --name "study-board-backend"

# PM2 설정 저장
pm2 save
pm2 startup

# 위 명령어 결과로 나오는 명령어 실행 (systemd 등록)
```

### 5.2 프론트엔드 서버 설정

```bash
# EC2 프론트엔드 인스턴스에 SSH 접속
ssh -i your-key.pem ec2-user@[frontend-public-ip]

# 시스템 업데이트
sudo yum update -y

# Node.js 18 설치
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo yum install -y nodejs git

# Nginx 설치
sudo yum install -y nginx

# PM2 전역 설치
sudo npm install -g pm2

# 프로젝트 클론
cd /home/ec2-user
git clone https://github.com/[your-username]/Study-Board.git
cd Study-Board/front

# 의존성 설치
npm install

# 환경 변수 파일 생성
nano .env.local
```

#### 프론트엔드 환경 변수 (.env.local)

```bash
# API 설정
NEXT_PUBLIC_BASE_URL=https://api.[your-domain.com]

# NextAuth 설정
NEXTAUTH_SECRET=[매우-강력한-NextAuth-시크릿]
NEXTAUTH_URL=https://[your-domain.com]

# 사이트 설정
NEXT_PUBLIC_SITE_PASSWORD=[사이트-패스워드]
NEXT_PUBLIC_MODE=production

# S3 설정
NEXT_PUBLIC_S3_URL=https://study-board-uploads-[your-suffix].s3.ap-northeast-2.amazonaws.com
```

#### 프론트엔드 빌드 및 실행

```bash
# Next.js 빌드
npm run build

# PM2로 실행
pm2 start npm --name "study-board-frontend" -- start

# PM2 설정 저장
pm2 save
pm2 startup

# 위 명령어 결과로 나오는 명령어 실행
```

### 5.3 Nginx 설정 (프론트엔드 서버)

```bash
# Nginx 설정 파일 편집
sudo nano /etc/nginx/nginx.conf
```

```nginx
# /etc/nginx/nginx.conf
user nginx;
worker_processes auto;
error_log /var/log/nginx/error.log;
pid /run/nginx.pid;

events {
    worker_connections 1024;
}

http {
    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';

    access_log /var/log/nginx/access.log main;

    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 4096;

    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    # Gzip 압축
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/json
        application/javascript
        application/xml+rss
        application/atom+xml
        image/svg+xml;

    # 메인 서버 설정
    server {
        listen 80;
        server_name _;

        # 프론트엔드 프록시
        location / {
            proxy_pass http://127.0.0.1:3000;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;
        }

        # 백엔드 API 프록시
        location /api {
            proxy_pass http://[백엔드-서버-IP]:8888;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;
        }

        # 파일 업로드 경로들
        location ~ ^/(upload|userUpload|channelUpload|suggestionUpload) {
            proxy_pass http://[백엔드-서버-IP]:8888;
            proxy_http_version 1.1;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
    }
}
```

```bash
# Nginx 시작 및 활성화
sudo systemctl start nginx
sudo systemctl enable nginx

# 설정 테스트
sudo nginx -t

# Nginx 재시작
sudo systemctl restart nginx
```

---

## ⚖️ 6단계: Application Load Balancer 설정

### 6.1 타겟 그룹 생성

```bash
# 프론트엔드 타겟 그룹
이름: study-board-frontend-tg
타겟 타입: Instances
프로토콜: HTTP
포트: 80
VPC: 생성한 VPC
헬스 체크 경로: /
헬스 체크 포트: 80

# 타겟 등록: 프론트엔드 EC2 인스턴스
```

### 6.2 ALB 생성

```bash
# Application Load Balancer 생성
이름: study-board-alb
체계: Internet-facing
IP 주소 유형: IPv4
VPC: 생성한 VPC
매핑: 퍼블릭 서브넷 2개 선택
보안 그룹: sg-alb

# 리스너 설정
프로토콜: HTTP
포트: 80
기본 액션: study-board-frontend-tg로 전달

# HTTPS 리스너는 SSL 인증서 생성 후 추가
```

---

## 🌐 7단계: Route53 및 SSL 설정

### 7.1 호스팅 영역 생성

```bash
# Route53 호스팅 영역 생성
도메인 이름: your-domain.com
유형: 퍼블릭 호스팅 영역

# 네임서버를 도메인 등록업체에 설정
```

### 7.2 SSL 인증서 발급

```bash
# AWS Certificate Manager에서 인증서 요청
도메인 이름: your-domain.com
추가 도메인: *.your-domain.com
검증 방법: DNS 검증

# Route53에 검증 레코드 자동 생성
```

### 7.3 HTTPS 리스너 추가

```bash
# ALB에 HTTPS 리스너 추가
프로토콜: HTTPS
포트: 443
SSL 인증서: 발급받은 ACM 인증서
기본 액션: study-board-frontend-tg로 전달

# HTTP → HTTPS 리디렉션 설정
HTTP 리스너 액션을 HTTPS로 리디렉션으로 변경
```

### 7.4 DNS 레코드 생성

```bash
# A 레코드 생성
이름: your-domain.com
타입: A
별칭: 예
라우팅 대상: Application Load Balancer → study-board-alb

# www 레코드 (선택사항)
이름: www.your-domain.com
타입: CNAME
값: your-domain.com
```

---

## 📜 8단계: 배포 자동화 스크립트

### 8.1 백엔드 배포 스크립트

```bash
# /home/ec2-user/deploy-backend.sh
#!/bin/bash

echo "🚀 백엔드 배포 시작..."

# 프로젝트 디렉토리로 이동
cd /home/ec2-user/Study-Board/back

# Git에서 최신 코드 가져오기
echo "📥 최신 코드 가져오는 중..."
git pull origin main

# 의존성 설치
echo "📦 의존성 설치 중..."
npm install --production

# TypeScript 빌드
echo "🔨 빌드 중..."
npm run build

# PM2로 애플리케이션 재시작
echo "🔄 애플리케이션 재시작 중..."
pm2 restart study-board-backend

# 헬스 체크
echo "🏥 헬스 체크 중..."
sleep 5
curl -f http://localhost:8888/api || echo "⚠️  헬스 체크 실패"

echo "✅ 백엔드 배포 완료!"
```

### 8.2 프론트엔드 배포 스크립트

```bash
# /home/ec2-user/deploy-frontend.sh
#!/bin/bash

echo "🚀 프론트엔드 배포 시작..."

# 프로젝트 디렉토리로 이동
cd /home/ec2-user/Study-Board/front

# Git에서 최신 코드 가져오기
echo "📥 최신 코드 가져오는 중..."
git pull origin main

# 의존성 설치
echo "📦 의존성 설치 중..."
npm install --production

# Next.js 빌드
echo "🔨 빌드 중..."
npm run build

# PM2로 애플리케이션 재시작
echo "🔄 애플리케이션 재시작 중..."
pm2 restart study-board-frontend

# Nginx 설정 테스트 및 재시작
echo "🌐 Nginx 재시작 중..."
sudo nginx -t && sudo systemctl reload nginx

# 헬스 체크
echo "🏥 헬스 체크 중..."
sleep 5
curl -f http://localhost:3000 || echo "⚠️  헬스 체크 실패"

echo "✅ 프론트엔드 배포 완료!"
```

### 8.3 스크립트 실행 권한 부여

```bash
# 두 서버 모두에서 실행
chmod +x /home/ec2-user/deploy-*.sh
```

---

## 📊 9단계: 모니터링 및 로그

### 9.1 CloudWatch 에이전트 설치

```bash
# 두 EC2 인스턴스에서 실행
sudo yum install -y amazon-cloudwatch-agent

# 설정 파일 생성
sudo nano /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json
```

```json
{
  "agent": {
    "metrics_collection_interval": 60,
    "run_as_user": "ec2-user"
  },
  "logs": {
    "logs_collected": {
      "files": {
        "collect_list": [
          {
            "file_path": "/home/ec2-user/.pm2/logs/*.log",
            "log_group_name": "/aws/ec2/study-board",
            "log_stream_name": "{instance_id}-pm2"
          },
          {
            "file_path": "/var/log/nginx/access.log",
            "log_group_name": "/aws/ec2/study-board",
            "log_stream_name": "{instance_id}-nginx-access"
          },
          {
            "file_path": "/var/log/nginx/error.log",
            "log_group_name": "/aws/ec2/study-board",
            "log_stream_name": "{instance_id}-nginx-error"
          }
        ]
      }
    }
  },
  "metrics": {
    "namespace": "StudyBoard/EC2",
    "metrics_collected": {
      "cpu": {
        "measurement": ["cpu_usage_idle", "cpu_usage_iowait", "cpu_usage_user", "cpu_usage_system"],
        "metrics_collection_interval": 60
      },
      "disk": {
        "measurement": ["used_percent"],
        "metrics_collection_interval": 60,
        "resources": ["*"]
      },
      "mem": {
        "measurement": ["mem_used_percent"],
        "metrics_collection_interval": 60
      }
    }
  }
}
```

```bash
# CloudWatch 에이전트 시작
sudo systemctl start amazon-cloudwatch-agent
sudo systemctl enable amazon-cloudwatch-agent
```

### 9.2 PM2 모니터링 설정

```bash
# PM2 모니터링 명령어들
pm2 status              # 프로세스 상태 확인
pm2 logs                # 로그 확인
pm2 monit              # 실시간 모니터링
pm2 info [app-name]    # 상세 정보

# 로그 로테이션 설정
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 30
pm2 set pm2-logrotate:compress true
```

---

## 🛡️ 10단계: 보안 및 백업

### 10.1 보안 강화

```bash
# SSH 보안 강화
sudo nano /etc/ssh/sshd_config

# 다음 설정 추가/수정
PermitRootLogin no
PasswordAuthentication no
PubkeyAuthentication yes
Port 22 (또는 다른 포트)

# SSH 재시작
sudo systemctl restart sshd

# 방화벽 설정 (선택사항)
sudo yum install -y firewalld
sudo systemctl start firewalld
sudo systemctl enable firewalld

# 필요한 포트만 열기
sudo firewall-cmd --permanent --add-port=22/tcp
sudo firewall-cmd --permanent --add-port=80/tcp
sudo firewall-cmd --permanent --add-port=3000/tcp  # 프론트엔드
sudo firewall-cmd --permanent --add-port=8888/tcp  # 백엔드
sudo firewall-cmd --reload
```

### 10.2 자동 백업 설정

```bash
# 데이터베이스 백업 스크립트
nano /home/ec2-user/backup-db.sh
```

```bash
#!/bin/bash
# backup-db.sh

BACKUP_DIR="/home/ec2-user/backups"
DATE=$(date +%Y%m%d_%H%M%S)
DB_HOST="[RDS-엔드포인트]"
DB_USER="admin"
DB_PASS="[RDS-비밀번호]"
DB_NAME="studyboard"

# 백업 디렉토리 생성
mkdir -p $BACKUP_DIR

# MySQL 덤프
mysqldump -h $DB_HOST -u $DB_USER -p$DB_PASS $DB_NAME > $BACKUP_DIR/backup_$DATE.sql

# 30일 이전 백업 삭제
find $BACKUP_DIR -name "backup_*.sql" -mtime +30 -delete

echo "데이터베이스 백업 완료: backup_$DATE.sql"
```

```bash
# 실행 권한 부여
chmod +x /home/ec2-user/backup-db.sh

# 크론탭 설정 (매일 새벽 2시)
crontab -e

# 다음 줄 추가
0 2 * * * /home/ec2-user/backup-db.sh
```

---

## 🔧 11단계: 트러블슈팅

### 11.1 일반적인 문제 해결

```bash
# 1. 애플리케이션이 시작되지 않는 경우
pm2 logs [app-name]        # 로그 확인
pm2 describe [app-name]    # 상세 정보 확인

# 2. 데이터베이스 연결 실패
telnet [RDS-엔드포인트] 3306  # 네트워크 연결 확인
mysql -h [RDS-엔드포인트] -u admin -p  # 직접 연결 테스트

# 3. Nginx 설정 문제
sudo nginx -t              # 설정 파일 문법 체크
sudo tail -f /var/log/nginx/error.log  # 에러 로그 확인

# 4. ALB 헬스 체크 실패
curl -I http://localhost:80/  # 로컬 헬스 체크
# 보안 그룹과 타겟 그룹 설정 확인

# 5. S3 업로드 실패
aws s3 ls s3://your-bucket-name/  # S3 접근 권한 확인
# IAM 역할과 정책 확인
```

### 11.2 성능 모니터링

```bash
# 시스템 리소스 확인
htop                       # CPU, 메모리 사용률
df -h                      # 디스크 사용률
netstat -tulpn            # 포트 사용 현황

# 애플리케이션 성능
pm2 monit                 # PM2 모니터링
curl -w "@curl-format.txt" http://localhost:3000/

# curl-format.txt 파일 내용
time_namelookup:  %{time_namelookup}\n
time_connect:     %{time_connect}\n
time_appconnect:  %{time_appconnect}\n
time_pretransfer: %{time_pretransfer}\n
time_redirect:    %{time_redirect}\n
time_starttransfer: %{time_starttransfer}\n
----------\n
time_total:       %{time_total}\n
```

---

## 🚀 12단계: 배포 체크리스트

### ✅ 배포 전 확인사항

- [ ] AWS 리소스 생성 완료 (VPC, EC2, RDS, S3, ALB, Route53)
- [ ] 보안 그룹 설정 완료
- [ ] IAM 역할 및 정책 설정 완료
- [ ] 도메인 및 SSL 인증서 설정 완료
- [ ] 환경 변수 파일 작성 완료
- [ ] 데이터베이스 연결 테스트 완료

### ✅ 배포 후 확인사항

- [ ] 프론트엔드 애플리케이션 정상 실행
- [ ] 백엔드 API 정상 작동
- [ ] 데이터베이스 연결 정상
- [ ] S3 파일 업로드 정상
- [ ] ALB 헬스 체크 통과
- [ ] HTTPS 접속 정상
- [ ] 도메인 연결 정상
- [ ] PM2 프로세스 안정성 확인
- [ ] 로그 모니터링 설정 완료

---

## 📚 추가 자료

### 유용한 명령어 모음

```bash
# PM2 관리
pm2 start ecosystem.config.js  # 설정 파일로 시작
pm2 reload all                 # 무중단 재시작
pm2 stop all                   # 모든 프로세스 중지
pm2 delete all                 # 모든 프로세스 삭제

# Nginx 관리
sudo systemctl status nginx    # 상태 확인
sudo systemctl reload nginx    # 설정 다시 로드
sudo tail -f /var/log/nginx/access.log  # 액세스 로그

# 시스템 관리
sudo systemctl list-units --type=service  # 서비스 목록
journalctl -u nginx -f        # systemd 로그
```

### ecosystem.config.js 예제

```javascript
// /home/ec2-user/Study-Board/ecosystem.config.js
module.exports = {
  apps: [
    {
      name: "study-board-backend",
      cwd: "/home/ec2-user/Study-Board/back",
      script: "dist/main.js",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      env: {
        NODE_ENV: "production",
        PORT: 8888,
      },
    },
    {
      name: "study-board-frontend",
      cwd: "/home/ec2-user/Study-Board/front",
      script: "npm",
      args: "start",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },
    },
  ],
};
```

---

이 가이드를 따라 도커 없이도 AWS에 Study Board 애플리케이션을 성공적으로 배포할 수 있습니다. 문제가 발생하면 트러블슈팅 섹션을 참고하세요!
