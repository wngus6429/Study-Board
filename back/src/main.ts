import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as cookieParser from 'cookie-parser';
import { ValidationPipe } from '@nestjs/common';
import { HttpExceptionFilter } from './httpException.FIlter';

// 시작 파일(entry file). 핵심 함수인 NestFactory를 사용하여 Nest 어플리케이션 인스턴스를 만듭니다.
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe()); // DTO 유효성 검사
  app.useGlobalFilters(new HttpExceptionFilter()); // 예외 필터
  app.enableCors({
    origin: true,
    credentials: true,
  });
  app.use(cookieParser());

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
