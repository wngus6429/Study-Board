import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { CreateStoryDto } from './dto/create-story.dto';
import { StoryService } from './story.service';
import { AuthGuard } from '@nestjs/passport';
import { GetUser } from 'src/auth/get-user.decorator';
import { User } from 'src/auth/user.entity';

@Controller('api/story')
export class StoryController {
  logger: any;
  constructor(private readonly storyService: StoryService) {}

  @Get('/getall')
  async getAllStory(): Promise<any> {
    return this.storyService.findStoryAll();
  }

  @Get('/detail/:id')
  async getStory(id: number): Promise<any> {
    const data = await this.storyService.findStoryOne(id);
    // 구조 분해 할당을 통해 id와 creator를 제외
    const { id: _, creator, ...rest } = data;
    return rest;
  }

  @Post('/create')
  @UseGuards(AuthGuard())
  @UsePipes(ValidationPipe)
  async createStory(
    @Body() createStoryDto: CreateStoryDto,
    @GetUser() userData: User,
  ) {
    console.log('글 작성 정보:', createStoryDto, '사용자정보', userData);
    return this.storyService.create(createStoryDto, userData);
  }

  @Delete('/:id')
  @UseGuards(AuthGuard())
  async deleteStory(
    @Param('id') storyId: number,
    @GetUser() userData: User,
  ): Promise<void> {
    console.log('삭제할 글 ID:', storyId, '사용자정보', userData.user_email);
    return this.storyService.deleteStory(storyId, userData);
  }
}
