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
  UnauthorizedException,
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
  //! ㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡ
  // 게시글 가져오기 API - 카테고리별 글 가져오기
  @Get('/pageTableData')
  async getPageStory(
    @Query('offset') offset = 0,
    @Query('limit') limit = 10,
    @Query('category') category?: string, // ✅ category 추가
    @Query('minRecommend') minRecommend?: number, // ✅ 추천 랭킹 모드: 최소 추천 수 필터
  ): Promise<{ results: Partial<Story>[]; total: number }> {
    console.log('테이블 데이터 가져옴');
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
  //! ㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡ
  // 카드 게시글 가져오기 API - 카테고리별 글 가져오기
  @Get('/cardPageTableData')
  async getCardPageStory(
    @Query('offset') offset = 0,
    @Query('limit') limit = 10,
    @Query('category') category?: string, // ✅ category 추가
    @Query('minRecommend') minRecommend?: number, // ✅ 추천 랭킹 모드: 최소 추천 수 필터
  ): Promise<{ results: Partial<Story>[]; total: number }> {
    console.log('카드 테이블 데이터 가져옴');
    // 추천 랭킹 모드가 활성화되면 minRecommend 값으로 필터링된 결과를 반환
    if (minRecommend) {
      return await this.storyService.findCardStoryWithMinRecommend(
        offset,
        limit,
        category,
        minRecommend,
      );
    }
    // 기본 페이지 데이터 조회
    return await this.storyService.findCardStory(offset, limit, category);
  }
  //! ㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡ
  // 검색 기능 API
  @Get('/search')
  async searchStories(
    @Query('offset') offset = 0,
    @Query('limit') limit = 10,
    @Query('type') type: string = 'all', // 검색 타입: all, title_content, title, content, author, comment 등
    @Query('query') query: string, // 실제 검색어
    @Query('category') category?: string, // 카테고리 필터 추가
  ): Promise<{
    results: (Partial<Story> & {
      nickname: string;
      recommend_Count: number;
      imageFlag: boolean;
    })[];
    total: number;
  }> {
    return await this.storyService.searchStory(
      offset,
      limit,
      type,
      query,
      category,
    );
  }
  //! ㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡ
  // 검색 기능 API
  @Get('/cardSearch')
  async cardSearchStories(
    @Query('offset') offset = 0,
    @Query('limit') limit = 10,
    @Query('type') type: string = 'all', // 검색 타입: all, title_content, title, content, author, comment 등
    @Query('query') query: string, // 실제 검색어
    @Query('category') category?: string, // 카테고리 필터 추가
  ): Promise<{
    results: (Partial<Story> & {
      nickname: string;
      recommend_Count: number;
      imageFlag: boolean;
    })[];
    total: number;
  }> {
    return await this.storyService.cardSearchStory(
      offset,
      limit,
      type,
      query,
      category,
    );
  }
  //! ㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡ
  // 상세페이지
  @Get('/detail/:id')
  async getStoryDetail(@Param('id', ParseIntPipe) id: number): Promise<any> {
    const data = await this.storyService.findStoryOne(id);
    // User의 필요한 필드만 남김
    console.log('q상세페이지 데이터:', data);
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
  //! ㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡ
  // 상세 페이지 수정시 데이터 받아옴
  @Get('/detail/edit/:id')
  @UseGuards(AuthGuard())
  async getStoryEditStory(
    @Param('id', ParseIntPipe) id: number,
    @Query('userId') userId: string,
  ): Promise<any> {
    const data = await this.storyService.findEditStoryOne(id, userId);
    return data;
  }
  //! ㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡ
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
  //! ㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡ
  // 공지사항 작성
  @Post('/notice/create')
  @UseGuards(AuthGuard())
  @UsePipes(ValidationPipe)
  @UseInterceptors(FilesInterceptor('images'))
  async createNotice(
    @Body() createStoryDto: CreateStoryDto,
    @GetUser() userData: User,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    console.log('공지사항 작성', createStoryDto, userData, files);
    return this.storyService.createNotice(createStoryDto, userData, files);
  }
  //! ㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡ
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
  //! ㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡ
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
  //! ㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡ
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
  //! ㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡ
  //! 관리자 전용: 기존 데이터를 RecommendRanking 테이블로 마이그레이션
  @Post('/migrateToRecommendRanking')
  @UseGuards(AuthGuard())
  async migrateToRecommendRanking(
    @GetUser() user: User,
  ): Promise<{ success: boolean; migrated: number }> {
    // 관리자 권한 확인 (실제 프로덕션에서는 더 엄격한 권한 체크가 필요)
    if (!user || user.user_email !== 'admin@example.com') {
      throw new UnauthorizedException('관리자만 실행할 수 있는 기능입니다.');
    }

    // 데이터 마이그레이션 서비스 호출
    const migrated = await this.storyService.migrateToRecommendRanking();
    return { success: true, migrated };
  }
  //! ㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡ
  // 공지사항 목록 가져오기
  @Get('/notices')
  async getNotices(
    @Query('limit') limit = 10,
  ): Promise<{ results: Partial<Story>[]; total: number }> {
    console.log('공지사항 목록 가져오기');
    return await this.storyService.findNotices(limit);
  }
}
