import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

// 시작 파일(entry file). 핵심 함수인 NestFactory를 사용하여 Nest 어플리케이션 인스턴스를 만듭니다.
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(3000);
}
bootstrap();
