import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as cookieParser from 'cookie-parser';
import { ValidationPipe } from '@nestjs/common';
import { HttpExceptionFilter } from './httpException.FIlter';
import { join } from 'path';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { ServerOptions } from 'socket.io';

/**
 * 🔌 커스텀 Socket.IO 어댑터
 *
 * 실시간 채팅 기능을 위한 WebSocket 연결을 관리합니다.
 * CORS 설정과 전송 방식을 커스터마이징하여 프론트엔드와의 안정적인 연결을 보장합니다.
 *
 * @features
 * - CORS 허용 도메인: localhost:3000, 127.0.0.1:3000
 * - 전송 방식: polling(HTTP 기반), websocket(실시간)
 * - 하위 호환성: EIO3 지원으로 다양한 클라이언트 환경 대응
 */
class CustomSocketIOAdapter extends IoAdapter {
  createIOServer(port: number, options?: ServerOptions): any {
    const server = super.createIOServer(port, {
      ...options,
      cors: {
        origin: ['http://park-aws-study.com', 'https://park-aws-study.com'],
        methods: ['GET', 'POST'],
        credentials: true, // 쿠키 기반 인증 허용
      },
      transports: ['polling', 'websocket'], // 연결 방식: HTTP 폴링 → WebSocket 업그레이드
      allowEIO3: true, // Engine.IO v3 클라이언트 지원 (하위 호환성)
    });
    return server;
  }
}

/**
 * 🚀 애플리케이션 부트스트랩 함수
 *
 * NestJS 애플리케이션의 진입점입니다.
 * 서버 설정, 미들웨어 등록, API 문서화, 정적 파일 서빙 등 모든 초기 설정을 담당합니다.
 *
 * @architecture
 * 1. 애플리케이션 인스턴스 생성
 * 2. WebSocket 어댑터 등록 (실시간 채팅용)
 * 3. 전역 파이프라인 설정 (검증, 예외 처리)
 * 4. CORS 및 보안 설정
 * 5. 정적 파일 서빙 설정 (이미지 업로드)
 * 6. API 문서화 (Swagger)
 * 7. 서버 시작 (포트 9999)
 */
async function bootstrap() {
  // 📦 NestJS Express 애플리케이션 인스턴스 생성
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // 🔌 실시간 채팅을 위한 커스텀 Socket.IO 어댑터 등록
  app.useWebSocketAdapter(new CustomSocketIOAdapter(app));

  // 🛡️ 전역 파이프라인 설정
  app.useGlobalPipes(new ValidationPipe()); // DTO 자동 검증 및 변환
  app.useGlobalFilters(new HttpExceptionFilter()); // 통일된 에러 응답 형식

  // 🌐 CORS(Cross-Origin Resource Sharing) 설정
  // 프론트엔드(React)에서 백엔드 API 호출을 허용하기 위한 설정
  app.enableCors({
    origin: ['http://park-aws-study.com', 'https://park-aws-study.com'], // 허용할 도메인
    credentials: true, // 쿠키 기반 세션 인증 허용
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'], // 허용할 HTTP 메서드
    allowedHeaders:
      'Origin, X-Requested-With, Content-Type, Accept, Authorization', // 허용할 헤더
  });

  // 🍪 쿠키 파서 미들웨어 등록 (세션 관리용)
  app.use(cookieParser());

  // 📁 정적 파일 서빙 설정
  // 업로드된 이미지들을 HTTP 경로로 접근 가능하게 설정
  app.useStaticAssets(join(__dirname, '..', 'upload'), {
    prefix: '/upload/', // 스토리(게시글) 첨부 이미지
  });
  app.useStaticAssets(join(__dirname, '..', 'userUpload'), {
    prefix: '/userUpload/', // 사용자 프로필 이미지
  });
  app.useStaticAssets(join(__dirname, '..', 'channelUpload'), {
    prefix: '/channelUpload/', // 채널 대표 이미지
  });
  app.useStaticAssets(join(__dirname, '..', 'suggestionUpload'), {
    prefix: '/suggestionUpload/', // 건의사항 첨부 이미지
  });
  app.useStaticAssets(join(__dirname, '..', 'videoUpload'), {
    prefix: '/videoUpload/', // 스토리(게시글) 첨부 동영상
  });

  // 📚 Swagger API 문서화 설정
  // 개발자들이 API 스펙을 쉽게 확인하고 테스트할 수 있도록 자동 문서 생성
  const config = new DocumentBuilder()
    .setTitle('Study Board API 문서') // API 문서 제목
    .setDescription('스터디 보드 백엔드 API 명세서') // API 설명
    .setVersion('1.0') // API 버전
    .addCookieAuth('connect.sid') // 세션 쿠키 인증 방식 문서화
    .addTag('Auth', '사용자 인증 관련 API') // API 그룹 태그
    .addTag('Story', '게시글 관련 API')
    .addTag('Channel', '채널 관련 API')
    .addTag('Comment', '댓글 관련 API')
    .addTag('Notification', '알림 관련 API')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document); // http://localhost:9999/api 에서 문서 확인 가능

  // 🚀 서버 시작
  await app.listen(9999, '0.0.0.0');

  // 📊 서버 시작 로그
  // console.log('🚀 Study Board 서버가 포트 9999에서 실행 중입니다.');
  // console.log('📡 Socket.IO 실시간 채팅 서버가 활성화되었습니다.');
  // console.log('🔗 Socket.IO 엔드포인트: http://localhost:9999/socket.io/');
  // console.log('📚 API 문서: http://localhost:9999/api');
  // console.log('🌐 프론트엔드 연결: http://localhost:3000');
}

// 애플리케이션 시작
bootstrap();

/**
 * 🛠️ 개발 도구 명령어
 *
 * # 코드 린팅 및 자동 수정
 * npm run lint
 *
 * # 코드 포맷팅 (Prettier)
 * npm run format
 *
 * # CRUD 컨트롤러 자동 생성 (검증 포함)
 * nest g resource [name]
 *
 * @example
 * nest g resource posts  // PostsModule, PostsController, PostsService 자동 생성
 */
