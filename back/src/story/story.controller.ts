import {
  Body,
  Controller,
  Delete,
  Get,
  InternalServerErrorException,
  NotFoundException,
  Param,
  ParseIntPipe,
  Patch,
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
import { Story } from 'src/entities/Story.entity';

@Controller('api/story')
export class StoryController {
  logger: any;
  constructor(private readonly storyService: StoryService) {}
  // ㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡ
  // 게시글 가져오기 API - 카테고리별 글 가져오기
  @Get('/pageTableData')
  async getPageStory(
    @Query('offset') offset = 0,
    @Query('limit') limit = 10,
    @Query('category') category?: string, // ✅ category 추가
    @Query('minRecommend') minRecommend?: number, // ✅ 추천 랭킹 모드: 최소 추천 수 필터
  ): Promise<{ results: Partial<Story>[]; total: number }> {
    console.log('반응');
    // 추천 랭킹 모드가 활성화되면 minRecommend 값으로 필터링된 결과를 반환
    if (minRecommend) {
      return await this.storyService.findStoryWithMinRecommend(
        offset,
        limit,
        category,
        minRecommend,
      );
    }
    // 기본 페이지 데이터 조회
    return await this.storyService.findStory(offset, limit, category);
  }

  // ㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡ
  // 검색 기능 API
  @Get('/search')
  async searchStories(
    @Query('offset') offset = 0,
    @Query('limit') limit = 10,
    @Query('type') type: string = 'all', // 검색 타입: all, title_content, title, content, author, comment 등
    @Query('query') query: string, // 실제 검색어
  ): Promise<{
    results: (Partial<Story> & {
      nickname: string;
      recommend_Count: number;
      imageFlag: boolean;
    })[];
    total: number;
  }> {
    return await this.storyService.searchStory(offset, limit, type, query);
  }
  // ㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡ
  // 상세페이지
  @Get('/detail/:id')
  async getStoryDetail(
    @Param('id', ParseIntPipe) id: number,
    @Body() userData?: any,
  ): Promise<any> {
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
  // 공지 상세페이지
  @Get('/notice/:id')
  async getNoticeDetail(
    @Param('id', ParseIntPipe) id: number,
    @Body() userData?: any,
  ): Promise<any> {
    const data = await this.storyService.findNoticeOne(id, userData?.userId);
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
  // ㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡ
  // 상세 페이지 수정시 데이터 받아옴
  @Get('/detail/edit/:id')
  async getStoryEditStory(
    @Param('id', ParseIntPipe) id: number,
    @Query('userId') userId: string,
  ): Promise<any> {
    const data = await this.storyService.findEditStoryOne(id, userId);
    return data;
  }
  // ㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡ
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
  // ㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡ
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
    // 테스트를 위해 title이 "error"이면 의도적으로 예외 발생
    // if (createStoryDto.title === 'error') {
    //   throw new InternalServerErrorException('의도한 실패');
    // }
    return this.storyService.create(createStoryDto, userData, files);
  }
  // ㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡ
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
  // ㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡ
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
  // ㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡ
  // 댓글 작성
  @Post('/comment/:id')
  @UseGuards(AuthGuard())
  async createComment(@Body() commentData: any): Promise<void> {
    await this.storyService.createComment(commentData);
  }
  // ㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡ
  // 댓글 삭제
  @Put('/comment/:id')
  @UseGuards(AuthGuard())
  async deleteComment(
    @Param('id') commentId: number,
    @Body() commentData: { storyId: string },
  ): Promise<void> {
    console.log('삭제할 댓글 ID:', commentId);
    return await this.storyService.deleteComment(commentId, commentData);
  }
  // ㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡ
  // 댓글 수정
  @Patch('/comment/:id')
  @UseGuards(AuthGuard())
  async editComment(
    @Param('id') commentId: number,
    @Body('content') content: string, //! body에서 content 필드만 추출
  ): Promise<void> {
    console.log('수정할 댓글 ID:', commentId, content);
    return await this.storyService.editComment(commentId, content);
  }
  // ㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡ
  // 좋아요, 싫어요.
  @Put('/likeOrUnlike/:id')
  @UseGuards(AuthGuard())
  async storyLikeOrNot(
    @Param('id') storyId: number,
    @Body() body: { userId: string; vote: 'like' | 'dislike' },
  ): Promise<{
    action: 'add' | 'remove' | 'change';
    vote: 'like' | 'dislike';
  }> {
    console.log('좋아요/싫어요:', storyId, body);
    return await this.storyService.storyLikeUnLike(
      storyId,
      body.userId,
      body.vote,
    );
  }
}
