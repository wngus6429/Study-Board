# AWS 배포를 위한 코드 변경사항 요약

## 개요

기존 로컬 개발 환경용 코드를 AWS 배포가 가능하도록 수정했습니다.

## 주요 변경사항

### 1. 환경 변수 관리

- **백엔드**: `back/env.example` 파일 생성
- **프론트엔드**: `front/env.example` 파일 생성
- 민감한 정보(DB 비밀번호, API 키 등)를 환경 변수로 분리

### 2. 백엔드 (NestJS) 변경사항

#### 2.1 패키지 추가

```json
{
  "@nestjs/config": "^3.2.3",
  "@aws-sdk/client-s3": "^3.700.0",
  "@aws-sdk/s3-request-presigner": "^3.700.0",
  "aws-sdk": "^2.1691.0",
  "dotenv": "^16.4.5",
  "multer-s3": "^3.0.1"
}
```

#### 2.2 설정 파일 수정

- `src/main.ts`: 환경 변수 기반 설정 적용
- `src/app.module.ts`: ConfigModule 추가, 동적 데이터베이스 설정
- CORS 설정을 환경 변수 기반으로 변경

#### 2.3 S3 서비스 추가

- `src/common/services/s3.service.ts`: S3 파일 업로드 서비스
- `src/common/common.module.ts`: 공통 모듈 생성
- 기존 로컬 파일 업로드 대신 S3 업로드 지원

#### 2.4 Docker 지원

- `back/Dockerfile`: 멀티 스테이지 빌드로 최적화
- 보안 강화 (non-root 사용자)
- 헬스체크 추가

### 3. 프론트엔드 (Next.js) 변경사항

#### 3.1 Next.js 설정 수정

- `front/next.config.mjs`:
  - 이미지 도메인 설정 (S3, CloudFront 지원)
  - 다중 경로 rewrite 설정
  - 환경 변수 기반 설정

#### 3.2 Docker 지원

- `front/Dockerfile`: 최적화된 프로덕션 빌드
- 보안 강화 (non-root 사용자)
- 헬스체크 추가

### 4. 인프라스트럭처 코드

#### 4.1 Docker Compose

- `docker-compose.yml`: 개발/테스트용 전체 스택 구성
- MySQL, 백엔드, 프론트엔드 통합 설정
- 환경 변수 기반 설정

#### 4.2 환경 변수 예제 파일

**백엔드 (`back/env.example`)**:

```bash
DB_HOST=your-rds-endpoint.region.rds.amazonaws.com
DB_PORT=3306
DB_USERNAME=your-db-username
DB_PASSWORD=your-db-password
DB_DATABASE=board-study
PORT=9999
NODE_ENV=production
AWS_REGION=ap-northeast-2
AWS_ACCESS_KEY_ID=your-access-key-id
AWS_SECRET_ACCESS_KEY=your-secret-access-key
S3_BUCKET_NAME=your-s3-bucket-name
JWT_SECRET=your-jwt-secret-key
FRONTEND_URL=https://your-domain.com
```

**프론트엔드 (`front/env.example`)**:

```bash
NEXT_PUBLIC_BASE_URL=https://your-api-domain.com
NEXTAUTH_SECRET=your-nextauth-secret-key
NEXTAUTH_URL=https://your-domain.com
NEXT_PUBLIC_SITE_PASSWORD=your-site-password
NEXT_PUBLIC_MODE=production
NEXT_PUBLIC_CDN_URL=https://your-cloudfront-domain.com
NEXT_PUBLIC_S3_URL=https://your-s3-bucket.s3.ap-northeast-2.amazonaws.com
```

## 배포 전 준비사항

### 1. 패키지 설치

```bash
# 백엔드
cd back
npm install

# 프론트엔드
cd front
npm install
```

### 2. 환경 변수 설정

```bash
# 백엔드 환경 변수 복사 및 수정
cp back/env.example back/.env
# back/.env 파일의 값들을 실제 AWS 리소스 정보로 수정

# 프론트엔드 환경 변수 복사 및 수정
cp front/env.example front/.env
# front/.env 파일의 값들을 실제 값으로 수정
```

### 3. AWS 리소스 생성

1. **RDS MySQL 인스턴스** 생성
2. **S3 버킷** 생성 및 정책 설정
3. **EC2 인스턴스** 2개 생성 (프론트엔드, 백엔드)
4. **Application Load Balancer** 설정
5. **Route53** 도메인 설정
6. **ACM SSL 인증서** 발급

## 주요 개선사항

### 1. 보안 강화

- 환경 변수로 민감 정보 분리
- Docker 컨테이너 non-root 사용자 실행
- CORS 설정 환경별 분리

### 2. 확장성 개선

- S3를 통한 파일 저장으로 다중 서버 지원
- 환경별 설정 분리 (개발/운영)
- Docker 컨테이너화로 배포 일관성 확보

### 3. 운영 편의성

- 헬스체크 엔드포인트 추가
- 로그 및 모니터링 설정
- 자동 배포 스크립트 제공

## 로컬 테스트 방법

```bash
# Docker Compose로 전체 스택 실행
docker-compose up -d

# 개별 서비스 확인
docker-compose logs -f backend
docker-compose logs -f frontend

# 서비스 접속
- 프론트엔드: http://localhost:3000
- 백엔드 API: http://localhost:9999
- MySQL: localhost:3306
```

## 다음 단계

1. AWS 리소스 생성 (`AWS_DEPLOYMENT_GUIDE.md` 참조)
2. 환경 변수 실제 값으로 설정
3. 패키지 설치 및 빌드 테스트
4. AWS에 배포
5. 도메인 및 SSL 설정
6. 모니터링 및 알람 설정

## 주의사항

- `.env` 파일은 절대 Git에 커밋하지 마세요
- AWS 액세스 키는 최소 권한 원칙을 따라 설정하세요
- 프로덕션 환경에서는 RDS의 synchronize를 false로 설정하세요
- 정기적으로 보안 업데이트를 적용하세요

---

이제 코드가 AWS 배포 준비가 완료되었습니다. `AWS_DEPLOYMENT_GUIDE.md`를 참조하여 실제 AWS 리소스를 생성하고 배포를 진행하세요.
