import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { CreateStoryDto } from './dto/create-story.dto';
import { StoryService } from './story.service';
import { AuthGuard } from '@nestjs/passport';
import { GetUser } from 'src/common/decorators/get-user.decorator';
import { User } from 'src/entities/user.entity';
import { FilesInterceptor } from '@nestjs/platform-express';

@Controller('api/story')
export class StoryController {
  logger: any;
  constructor(private readonly storyService: StoryService) {}

  @Get('/getall')
  async getAllStory(): Promise<any> {
    console.log('모든 글 가져오기');
    return this.storyService.findStoryAll();
  }

  @Get('/detail/:id')
  async getStoryDetail(@Param('id', ParseIntPipe) id: number): Promise<any> {
    console.log('상세 페이지 글 ID:', id);
    const data = await this.storyService.findStoryOne(id);
    // 구조 분해 할당을 통해 id와 creator를 제외
    const { creator_email, ...rest } = data;
    return rest;
  }

  @Post('/create')
  @UseGuards(AuthGuard())
  @UsePipes(ValidationPipe)
  @UseInterceptors(FilesInterceptor('images'))
  async createStory(
    @Body() createStoryDto: CreateStoryDto,
    @GetUser() userData: User,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    console.log(
      '데이터:',
      createStoryDto,
      '사용자정보',
      userData,
      '업로드된 파일:',
      files,
    );
    return this.storyService.create(createStoryDto, userData, files);
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
