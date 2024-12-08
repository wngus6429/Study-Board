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

  @Get('/detail/edit/:id')
  async getStoryEditStory(
    @Param('id', ParseIntPipe) id: number,
    @Body() userData?: any,
  ): Promise<any> {
    const data = await this.storyService.findEditStoryOne(id, userData?.userId);
    return data;
  }

  @Post('/detail/:id')
  async getStoryDetail(
    @Param('id', ParseIntPipe) id: number,
    @Body() userData?: any,
  ): Promise<any> {
    console.log('상세페이지부름');
    const data = await this.storyService.findStoryOne(id, userData?.userId);
    // User의 필요한 필드만 남김
    const { User, loginUser, ...rest } = data;
    const filteredUser = { nickname: User.nickname, id: User.id };
    let filteredLoginUser;
    if (loginUser != null) {
      filteredLoginUser = {
        nickname: loginUser?.nickname || null,
        image: loginUser?.image?.link || null,
      };
    } else {
      filteredLoginUser = null;
    }
    // User는 글 작성자임
    return { ...rest, User: filteredUser, loginUser: filteredLoginUser };
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

  @Post('/comment/:id')
  @UseGuards(AuthGuard())
  async createComment(
    // @Param('id', ParseIntPipe) storyId: number,
    @Body() commentData: any,
  ): Promise<void> {
    await this.storyService.createComment(commentData);
  }
}
