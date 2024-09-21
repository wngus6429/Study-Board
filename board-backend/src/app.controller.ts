import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { Story } from './entities/Story.entity';

// 라우트 하나만 있는 기본적인 컨트롤러가 있는 파일
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  // @Get()
  // getAll(): Story {
  //   return this.appService.getAllStory();
  // }
}
