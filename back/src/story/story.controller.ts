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
  Query,
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
  // 모든 글 가져오지
  @Get('/pageTableData')
  async getPageStory(
    @Query('offset') offset = 0,
    @Query('limit') limit = 10,
  ): Promise<{ results: Partial<Story>[]; total: number }> {
    return await this.storyService.findStory(offset, limit);
  }

  @Post('/userStoryTableData')
  @UseGuards(AuthGuard())
  async getUserPageStory(
    @Body('offset') offset = 0,
    @Body('limit') limit = 10,
    @Body('userId') userId: string,
  ): Promise<{ StoryResults: Partial<Story>[]; StoryTotal: number }> {
    console.log('요청 데이터:', { offset, limit, userId });
    return await this.storyService.userfindStory(offset, limit, userId);
  }

  @Post('/userCommentsTableData')
  @UseGuards(AuthGuard())
  async getUserPageComments(
    @Body('offset') offset = 0,
    @Body('limit') limit = 10,
    @Body('userId') userId: string,
  ): Promise<{ CommentsResults: Partial<any>[]; CommentsTotal: number }> {
    console.log('요청 데이터:', { offset, limit, userId });
    return await this.storyService.userfindComments(offset, limit, userId);
  }

  // 상세페이지
  @Get('/detail/:id')
  async getStoryDetail(
    @Param('id', ParseIntPipe) id: number,
    @Body() userData?: any,
  ): Promise<any> {
    console.log('다시 가져옴');
    const data = await this.storyService.findStoryOne(id, userData?.userId);
    // User의 필요한 필드만 남김
    console.log('상세페이지 데이터:', data);
    const { User, ...rest } = data;
    const writeUserInfo = {
      nickname: User.nickname,
      id: User.id,
      avatar: User.UserImage?.link || null,
    };
    // User는 글 작성자임
    return { ...rest, User: writeUserInfo };
  }
  // 상세 페이지 수정시 데이터 받아옴
  @Get('/detail/edit/:id')
  async getStoryEditStory(
    @Param('id', ParseIntPipe) id: number,
    @Body() userData?: any,
  ): Promise<any> {
    const data = await this.storyService.findEditStoryOne(id, userData?.userId);
    return data;
  }
  // 상세페이지 댓글 가져오기
  @Post('/detail/comment/:id')
  async getStoryDetailComment(
    @Param('id', ParseIntPipe) id: number,
    @Body() userId: string | null,
  ): Promise<any> {
    const { processedComments, loginUser } =
      await this.storyService.findStoryOneComment(id, userId);
    // 로그인유저 객체 만들기.
    let filteredLoginUser;
    if (loginUser != null) {
      filteredLoginUser = {
        nickname: loginUser?.nickname || null,
        image: loginUser?.UserImage?.link || null,
      };
    } else {
      filteredLoginUser = null;
    }
    console.log('완성체', processedComments);
    return { processedComments, loginUser: filteredLoginUser };
  }
  // 글 작성
  @Post('/create')
  @UseGuards(AuthGuard())
  @UsePipes(ValidationPipe)
  @UseInterceptors(FilesInterceptor('images'))
  async createStory(
    @Body() createStoryDto: CreateStoryDto,
    @GetUser() userData: User,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    console.log('글 작성', createStoryDto, userData, files);
    return this.storyService.create(createStoryDto, userData, files);
  }
  // 글 수정
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
    console.log('글 수정', storyId, updateStoryDto, user, files);
    return this.storyService.updateStory(storyId, updateStoryDto, user, files);
  }
  // 글 삭제
  @Delete('/:id')
  @UseGuards(AuthGuard())
  async deleteStory(
    @Param('id') storyId: number,
    @GetUser() userData: User,
  ): Promise<void> {
    console.log('삭제할 글 ID:', storyId, '사용자정보', userData.user_email);
    return this.storyService.deleteStory(storyId, userData);
  }
  // 댓글 작성
  @Post('/comment/:id')
  @UseGuards(AuthGuard())
  async createComment(@Body() commentData: any): Promise<void> {
    await this.storyService.createComment(commentData);
  }
  // 댓글 삭제
  @Put('/comment/:id')
  @UseGuards(AuthGuard())
  async deleteComment(@Param('id') commentId: number): Promise<void> {
    console.log('삭제할 댓글 ID:', commentId);
    return await this.storyService.deleteComment(commentId);
  }

  // 좋아요, 싫어요.
  @Put('/likeOrUnlike/:id')
  @UseGuards(AuthGuard())
  async storyLike(
    @Param('id') storyId: number,
    @Body() body: { userId: string; vote: 'like' | 'dislike' },
  ): Promise<void> {
    console.log('좋아요/싫어요:', storyId, body);
    return await this.storyService.storyLike(storyId, body.userId, body.vote);
  }
}
