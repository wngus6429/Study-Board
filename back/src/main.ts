import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as cookieParser from 'cookie-parser';
import { ValidationPipe } from '@nestjs/common';
import { HttpExceptionFilter } from './httpException.FIlter';
import { join } from 'path';

// 시작 파일(entry file). 핵심 함수인 NestFactory를 사용하여 Nest 어플리케이션 인스턴스를 만듭니다.
async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.useGlobalPipes(new ValidationPipe()); // DTO 유효성 검사
  app.useGlobalFilters(new HttpExceptionFilter()); // 예외 필터
  app.enableCors({
    origin: true,
    credentials: true,
  });
  app.use(cookieParser());

  // 정적 파일 서빙 설정 (업로드된 이미지들에 접근 가능하도록)
  app.useStaticAssets(join(__dirname, '..', 'upload'), {
    prefix: '/upload/', // 스토리 이미지
  });
  app.useStaticAssets(join(__dirname, '..', 'userUpload'), {
    prefix: '/userUpload/', // 유저 프로필 이미지
  });
  app.useStaticAssets(join(__dirname, '..', 'channelUpload'), {
    prefix: '/channelUpload/', // 채널 대표 이미지
  });
  app.useStaticAssets(join(__dirname, '..', 'suggestionUpload'), {
    prefix: '/suggestionUpload/', // 건의사항 이미지
  });

  const config = new DocumentBuilder()
    .setTitle('API 개발 문서')
    .setVersion('1.0')
    .addCookieAuth('connect.sid')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  await app.listen(9999);
}
bootstrap();

// # Lint and autofix with eslint
// npm run lint

// # Format with prettier
// npm run format

// For quickly creating a CRUD controller with the validation built-in,
// you may use the CLI's CRUD generator: nest g resource [name].
