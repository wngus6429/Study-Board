import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as cookieParser from 'cookie-parser';

// 시작 파일(entry file). 핵심 함수인 NestFactory를 사용하여 Nest 어플리케이션 인스턴스를 만듭니다.
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
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
  app.use((req, res, next) => {
    console.log('Cookies: ', req.cookies);
    next();
  });
  await app.listen(9000);
}
bootstrap();
