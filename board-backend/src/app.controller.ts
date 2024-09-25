import { Body, Controller, Get, Post } from '@nestjs/common';
import { AppService } from './app.service';
import { Story } from './entities/Story.entity';
import { CreateStoryDto } from './dto/create-story.dto';

// 라우트 하나만 있는 기본적인 컨트롤러가 있는 파일
@Controller('/story')
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('/getall')
  async getAllStory(): Promise<any> {
    console.log('움직임2');
    return this.appService.findAll();
  }

  @Post('/create')
  async createStory(@Body() createStoryDto: CreateStoryDto) {
    // 클라이언트에서 받은 데이터를 console.log로 출력
    console.log('Received Data:', createStoryDto);
    // 서비스로 전달하여 데이터베이스에 저장할 수 있습니다.
    return this.appService.create(createStoryDto);
  }
  // @Get()
  // getAll(): Story {
  //   return this.appService.getAllStory();
  // }
}
