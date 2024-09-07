import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

// 라우트 하나만 있는 기본적인 컨트롤러가 있는 파일
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }
}
