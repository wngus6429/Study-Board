import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  ParseIntPipe,
  Post,
  Put,
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
import { User } from 'src/entities/User.entity';
import { FilesInterceptor } from '@nestjs/platform-express';
import { UpdateStoryDto } from './dto/update-story.dto';
import { Story } from 'src/entities/Story.entity';

@Controller('api/story')
export class StoryController {
  logger: any;
  constructor(private readonly storyService: StoryService) {}

  @Get('/getall')
  async getAllStory(): Promise<any> {
    console.log('모든 글 가져오기');
    const all = await this.storyService.findStoryAll();
    console.log('모든 글:', all);
    return all;
  }

  @Get('/detail/:id')
  async getStoryDetail(@Param('id', ParseIntPipe) id: number): Promise<any> {
    console.log('상세 페이지 글 ID:', id);
    const data = await this.storyService.findStoryOne(id);

    // User의 필요한 필드만 남김
    const { User, ...rest } = data;
    const filteredUser = { id: User.id, nickname: User.nickname };

    return { ...rest, User: filteredUser };
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

  @Post('/update/:id') // 수정 작업을 POST 요청으로 처리
  @UseGuards(AuthGuard())
  @UsePipes(ValidationPipe)
  @UseInterceptors(FilesInterceptor('images'))
  async updateStory(
    @Param('id') storyId: number,
    @Body() updateStoryDto: any,
    @GetUser() user: User,
    @UploadedFiles() files: Express.Multer.File[],
  ): Promise<Story> {
    console.log(
      '수정할 글 ID:',
      storyId,
      '업데이트 데이터:',
      updateStoryDto,
      '사용자정보:',
      user,
      '이미지에요',
      files,
    );

    return this.storyService.updateStory(storyId, updateStoryDto, user, files);
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
