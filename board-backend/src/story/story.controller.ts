import { Body, Controller, Get, Post } from '@nestjs/common';
import { CreateStoryDto } from './dto/create-story.dto';
import { StoryService } from './story.service';

@Controller('story')
export class StoryController {
  constructor(private readonly storyService: StoryService) {}

  @Get('/getall')
  async getAllStory(): Promise<any> {
    return this.storyService.findAll();
  }

  @Post('/create')
  async createStory(@Body() createStoryDto: CreateStoryDto) {
    // 클라이언트에서 받은 데이터를 console.log로 출력
    console.log('Received Data:', createStoryDto);
    // 서비스로 전달하여 데이터베이스에 저장할 수 있습니다.
    return this.storyService.create(createStoryDto);
  }
}
