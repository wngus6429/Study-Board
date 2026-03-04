import {
  Body,
  Controller,
  Delete,
  Get,
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
  UnauthorizedException,
} from '@nestjs/common';
import { CreateStoryDto } from './dto/create-story.dto';
import { CreateReportDto } from './dto/create-report.dto';
import { ReviewReportDto } from './dto/review-report.dto';
import { StoryService } from './story.service';
import { AuthGuard } from '@nestjs/passport';
import { GetUser } from 'src/common/decorators/get-user.decorator';
import { User } from 'src/entities/User.entity';
import { FilesInterceptor } from '@nestjs/platform-express';
import { Story } from 'src/entities/Story.entity';
import { Report, ReportStatus } from 'src/entities/Report.entity';
import { AdminGuard } from '../auth/admin.guard';
import {
  SuperAdminRequired,
  ChannelAdminRequired,
} from '../common/decorators/admin.decorator';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBody,
} from '@nestjs/swagger';

/**
 * Story 컨트롤러
 * 게시글 관련 API 엔드포인트를 처리합니다.
 *
 * @description 게시글 생성, 조회, 수정, 삭제 및 추천/비추천 기능을 제공합니다.
 * @author StudyBoard Team
 */
@ApiTags('Story')
@Controller('api/story')
export class StoryController {
  logger: any;
  constructor(private readonly storyService: StoryService) {}

  @Get('/health')
  healthCheck() {
    return { status: `ok씨발 ${process.env.CHECK}` };
  }
  //! ㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡ
  // 게시글 가져오기 API - 카테고리별 글 가져오기
  /**
   * 테이블 형태의 게시글 목록 조회
   *
   * @description 페이지네이션과 필터링을 통해 게시글 목록을 테이블 형태로 반환합니다.
   * @param offset 시작 위치
   * @param limit 조회할 게시글 수
   * @param category 카테고리 필터 (선택사항)
   * @param channelId 채널 ID 필터 (선택사항)
   * @param minRecommend 최소 추천 수 필터 (추천 랭킹 모드)
   * @returns 게시글 목록과 총 개수
   */
  @Get('/pageTableData')
  @ApiOperation({ summary: '테이블 형태의 게시글 목록 조회' })
  @ApiQuery({ name: 'offset', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'category', required: false, type: String })
  @ApiQuery({ name: 'channelId', required: false, type: Number })
  @ApiQuery({ name: 'minRecommend', required: false, type: Number })
  @ApiResponse({ status: 200, description: '게시글 목록 및 총 개수 반환' })
  async getPageStory(
    @Query('offset') offset = 0,
    @Query('limit') limit = 10,
    @Query('category') category?: string,
    @Query('channelId') channelId?: number,
    @Query('minRecommend') minRecommend?: number,
  ): Promise<{ results: Partial<Story>[]; total: number }> {
    console.log('🔍 테이블 데이터 API 호출:', {
      offset,
      limit,
      category,
      channelId: channelId ? Number(channelId) : null,
      minRecommend,
      typeof_channelId: typeof channelId,
    });

    // 추천 랭킹 모드가 활성화되면 minRecommend 값으로 필터링된 결과를 반환
    if (minRecommend) {
      return await this.storyService.findStoryWithMinRecommend(
        offset,
        limit,
        category,
        minRecommend,
        channelId,
      );
    }

    // 기본 페이지 데이터 조회
    return await this.storyService.findStory(
      offset,
      limit,
      category,
      channelId,
    );
  }
  //! ㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡ
  // 카드 게시글 가져오기 API - 카테고리별 글 가져오기
  /**
   * 카드 형태의 게시글 목록 조회
   *
   * @description 페이지네이션과 필터링을 통해 게시글 목록을 카드 형태로 반환합니다.
   * @param offset 시작 위치
   * @param limit 조회할 게시글 수
   * @param category 카테고리 필터 (선택사항)
   * @param channelId 채널 ID 필터 (선택사항)
   * @param minRecommend 최소 추천 수 필터 (추천 랭킹 모드)
   * @returns 게시글 목록과 총 개수
   */
  @Get('/cardPageTableData')
  async getCardPageStory(
    @Query('offset') offset = 0,
    @Query('limit') limit = 10,
    @Query('category') category?: string,
    @Query('channelId') channelId?: number,
    @Query('minRecommend') minRecommend?: number,
  ): Promise<{ results: Partial<Story>[]; total: number }> {
    console.log('🔍 카드 데이터 API 호출:', {
      offset,
      limit,
      category,
      channelId: channelId ? Number(channelId) : null,
      minRecommend,
      typeof_channelId: typeof channelId,
    });

    // 추천 랭킹 모드가 활성화되면 minRecommend 값으로 필터링된 결과를 반환
    if (minRecommend) {
      return await this.storyService.findCardStoryWithMinRecommend(
        offset,
        limit,
        category,
        minRecommend,
        channelId,
      );
    }

    // 기본 페이지 데이터 조회
    return await this.storyService.findCardStory(
      offset,
      limit,
      category,
      channelId,
    );
  }
  //! ㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡ
  // 검색 기능 API
  /**
   * 게시글 검색 (테이블 형태)
   *
   * @description 검색어와 검색 타입에 따라 게시글을 검색합니다.
   * @param offset 시작 위치
   * @param limit 조회할 게시글 수
   * @param type 검색 타입 (title, content, author, comment)
   * @param query 검색어
   * @param category 카테고리 필터 (선택사항)
   * @param channelId 채널 ID 필터 (선택사항)
   * @returns 검색된 게시글 목록과 총 개수
   */
  @Get('/search')
  async searchStories(
    @Query('offset') offset = 0,
    @Query('limit') limit = 10,
    @Query('type') type: string = 'title',
    @Query('query') query: string,
    @Query('category') category?: string,
    @Query('channelId') channelId?: number,
  ): Promise<{
    results: (Partial<Story> & {
      nickname: string;
      recommend_Count: number;
      imageFlag: boolean;
      videoFlag: boolean;
    })[];
    total: number;
  }> {
    return await this.storyService.searchStory(
      offset,
      limit,
      type,
      query,
      category,
      channelId,
    );
  }
  //! ㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡ
  // 검색 기능 API
  /**
   * 게시글 검색 (카드 형태)
   *
   * @description 검색어와 검색 타입에 따라 게시글을 카드 형태로 검색합니다.
   * @param offset 시작 위치
   * @param limit 조회할 게시글 수
   * @param type 검색 타입 (title, content, author, comment)
   * @param query 검색어
   * @param category 카테고리 필터 (선택사항)
   * @param channelId 채널 ID 필터 (선택사항)
   * @returns 검색된 게시글 목록과 총 개수
   */
  @Get('/cardSearch')
  async cardSearchStories(
    @Query('offset') offset = 0,
    @Query('limit') limit = 10,
    @Query('type') type: string = 'title',
    @Query('query') query: string,
    @Query('category') category?: string,
    @Query('channelId') channelId?: number,
  ): Promise<{
    results: (Partial<Story> & {
      nickname: string;
      recommend_Count: number;
      imageFlag: boolean;
      videoFlag: boolean;
    })[];
    total: number;
  }> {
    return await this.storyService.cardSearchStory(
      offset,
      limit,
      type,
      query,
      category,
      channelId,
    );
  }
  //! ㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡ
  // 상세페이지
  /**
   * 게시글 상세 페이지 조회
   *
   * @description 게시글 ID로 특정 게시글의 상세 정보를 조회합니다.
   * @param id 게시글 ID
   * @returns 게시글 상세 정보 (작성자 정보 포함)
   */
  @Get('/detail/:id')
  @ApiOperation({ summary: '게시글 상세 조회' })
  @ApiParam({ name: 'id', description: '게시글 ID' })
  @ApiResponse({ status: 200, description: '게시글 상세 정보 반환' })
  async getStoryDetail(@Param('id', ParseIntPipe) id: number): Promise<any> {
    const data = await this.storyService.findStoryOne(id);
    console.log('상세페이지 데이터:', data);

    // 응답에 필요한 사용자 정보만 추출
    const { User, ...rest } = data;
    const writeUserInfo = {
      nickname: User.nickname,
      id: User.id,
      avatar: User.UserImage?.link || null,
      level: User.level,
      experience_points: User.experience_points,
    };

    return { ...rest, User: writeUserInfo };
  }
  // 공지 상세페이지
  /**
   * 공지사항 상세 페이지 조회
   *
   * @description 공지사항 ID로 특정 공지사항의 상세 정보를 조회합니다.
   * @param id 공지사항 ID
   * @param userData 사용자 데이터 (선택사항)
   * @returns 공지사항 상세 정보 (작성자 정보 포함)
   */
  @Get('/notice/:id')
  async getNoticeDetail(
    @Param('id', ParseIntPipe) id: number,
    @Body() userData?: any,
  ): Promise<any> {
    const data = await this.storyService.findNoticeOne(id, userData?.userId);
    console.log('상세페이지 데이터:', data);

    // 응답에 필요한 사용자 정보만 추출
    const { User, ...rest } = data;
    const writeUserInfo = {
      nickname: User.nickname,
      id: User.id,
      avatar: User.UserImage?.link || null,
    };

    return { ...rest, User: writeUserInfo };
  }
  //! ㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡ
  // 상세 페이지 수정시 데이터 받아옴
  /**
   * 게시글 수정용 데이터 조회
   *
   * @description 게시글 수정 시 필요한 기존 데이터를 조회합니다.
   * @param id 게시글 ID
   * @param userId 사용자 ID (수정 권한 확인용)
   * @returns 수정할 게시글 데이터
   */
  @Get('/detail/edit/:id')
  @UseGuards(AuthGuard())
  @UsePipes(ValidationPipe)
  async getStoryEditStory(
    @Param('id', ParseIntPipe) id: number,
    @Query('userId') userId: string,
  ): Promise<any> {
    const data = await this.storyService.findEditStoryOne(id, userId);
    return data;
  }
  //! ㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡ
  // 글 작성
  /**
   * 새 게시글 작성
   *
   * @description 새로운 게시글을 작성합니다. 이미지 첨부 지원.
   * @param createStoryDto 게시글 생성 데이터
   * @param userData 인증된 사용자 정보
   * @param files 첨부 이미지 파일 목록
   * @returns 생성된 게시글 정보
   */
  @Post('/create')
  @UseGuards(AuthGuard())
  @UsePipes(ValidationPipe)
  @UseInterceptors(FilesInterceptor('images'))
  @ApiOperation({ summary: '새 게시글 작성' })
  @ApiBody({ description: '게시글 생성 데이터', type: CreateStoryDto })
  @ApiResponse({ status: 201, description: '게시글 생성 성공' })
  async createStory(
    @Body() createStoryDto: CreateStoryDto,
    @GetUser() userData: User,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    console.log('글 작성', createStoryDto, userData, files);

    // 테스트용 예외 처리 코드 (현재 주석 처리)
    // if (createStoryDto.title === 'error') {
    //   throw new InternalServerErrorException('의도한 실패');
    // }

    return this.storyService.create(createStoryDto, userData, files);
  }
  //! ㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡ
  // 공지사항 작성
  /**
   * 새 공지사항 작성
   *
   * @description 새로운 공지사항을 작성합니다. 이미지 첨부 지원.
   * @param createStoryDto 공지사항 생성 데이터
   * @param userData 인증된 사용자 정보
   * @param files 첨부 이미지 파일 목록
   * @returns 생성된 공지사항 정보
   */
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
  /**
   * 게시글 수정
   *
   * @description 기존 게시글을 수정합니다. 이미지와 동영상 변경 지원.
   * @param storyId 수정할 게시글 ID
   * @param updateStoryDto 수정할 데이터
   * @param user 인증된 사용자 정보
   * @param files 새로 첨부할 파일 목록 (이미지/동영상)
   * @returns 수정된 게시글 정보
   */
  @Post('/update/:id')
  @UseGuards(AuthGuard())
  @UsePipes(ValidationPipe)
  @UseInterceptors(FilesInterceptor('files'))
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
  /**
   * 게시글 삭제
   *
   * @description 게시글 ID로 특정 게시글을 삭제합니다. 작성자만 삭제 가능.
   * @param storyId 삭제할 게시글 ID
   * @param userData 인증된 사용자 정보
   * @returns 성공 시 void
   */
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
  /**
   * 게시글 추천/비추천 기능
   *
   * @description 게시글에 좋아요 또는 싫어요를 추가/제거/변경합니다.
   * @param storyId 대상 게시글 ID
   * @param body 추천 데이터 (userId, vote, minRecommend)
   * @returns 수행된 작업 정보 (add/remove/change)
   */
  @Put('/likeOrUnlike/:id')
  @UseGuards(AuthGuard())
  async storyLikeOrNot(
    @Param('id') storyId: number,
    @Body()
    body: { userId: string; vote: 'like' | 'dislike'; minRecommend: number },
  ): Promise<{
    action: 'add' | 'remove' | 'change';
    vote: 'like' | 'dislike';
  }> {
    console.log('좋아요/싫어요:', storyId, body);
    return await this.storyService.storyLikeUnLike(
      storyId,
      body.userId,
      body.vote,
      body.minRecommend,
    );
  }
  //! ㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡ
  //! 관리자 전용: 기존 데이터를 RecommendRanking 테이블로 마이그레이션
  /**
   * 추천 랭킹 테이블 마이그레이션 (관리자 전용)
   *
   * @description 기존 게시글 데이터를 추천 랭킹 테이블로 마이그레이션합니다.
   * @param user 인증된 사용자 정보 (관리자 권한 확인용)
   * @param body 마이그레이션 설정 (최소 추천 수)
   * @returns 마이그레이션 결과 정보
   */
  @Post('/migrateToRecommendRanking')
  @UseGuards(AuthGuard())
  async migrateToRecommendRanking(
    @GetUser() user: User,
    @Body() body: { minRecommend: number },
  ): Promise<{ success: boolean; migrated: number }> {
    // 관리자 권한 확인 (실제 관리자 이메일로 변경하세요)
    if (!user || user.user_email !== 'admin@example.com') {
      throw new UnauthorizedException('관리자만 실행할 수 있는 기능입니다.');
    }

    // 데이터 마이그레이션 서비스 호출
    const migrated = await this.storyService.migrateToRecommendRanking(
      body.minRecommend || 1,
    );
    return { success: true, migrated };
  }
  //! ㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡ
  // 공지사항 목록 가져오기
  /**
   * 공지사항 목록 조회
   *
   * @description 등록된 공지사항 목록을 조회합니다. 채널별 공지사항 필터링 지원.
   * @param limit 조회할 공지사항 수 (기본값: 10)
   * @param channel 채널 ID (선택사항) - 특정 채널의 공지사항만 조회
   * @returns 공지사항 목록과 총 개수
   */
  @Get('/notices')
  async getNotices(
    @Query('limit') limit = 10,
    @Query('channel') channel?: number,
  ): Promise<{ results: Partial<Story>[]; total: number }> {
    console.log('공지사항 목록 가져오기 - channel:', channel, 'limit:', limit);
    return await this.storyService.findNotices(limit, channel);
  }

  // ========== 신고 관련 엔드포인트들 ==========

  /**
   * 게시글 신고
   *
   * @description 특정 게시글을 신고합니다. 로그인된 사용자만 신고 가능.
   * @param storyId 신고할 게시글 ID
   * @param createReportDto 신고 정보 (사유, 기타 내용)
   * @param userData 인증된 사용자 정보
   * @returns 생성된 신고 정보
   */
  @Post('/report/:id')
  @UseGuards(AuthGuard())
  @UsePipes(ValidationPipe)
  async reportStory(
    @Param('id', ParseIntPipe) storyId: number,
    @Body() createReportDto: CreateReportDto,
    @GetUser() userData: User,
  ): Promise<Report> {
    console.log('게시글 신고:', storyId, createReportDto, userData.id);
    return await this.storyService.reportStory(
      storyId,
      userData.id,
      createReportDto,
    );
  }

  /**
   * 신고 목록 조회 (관리자용)
   *
   * @description 관리자가 신고 목록을 조회합니다.
   * @param userData 인증된 사용자 정보 (관리자 권한 확인용)
   * @param offset 시작 위치 (기본값: 0)
   * @param limit 조회할 신고 수 (기본값: 20)
   * @param status 처리 상태 필터 (선택사항)
   * @returns 신고 목록과 총 개수
   */
  @Get('/admin/reports')
  @UseGuards(AuthGuard())
  async getReports(
    @GetUser() userData: User,
    @Query('offset') offset = 0,
    @Query('limit') limit = 20,
    @Query('status') status?: ReportStatus,
  ): Promise<{ reports: any[]; total: number }> {
    // 관리자 권한 확인 (관리자 이메일로 확인)
    // if (userData.user_email !== 'admin@example.com') {
    //   throw new UnauthorizedException('관리자 권한이 필요합니다.');
    // }

    console.log('신고 목록 조회 - 관리자:', userData.id, 'status:', status);
    return await this.storyService.getReports(offset, limit, status);
  }

  /**
   * 신고 검토 및 처리 (관리자용)
   *
   * @description 관리자가 신고를 검토하고 처리합니다.
   * @param reportId 신고 ID
   * @param reviewReportDto 검토 정보 (상태, 관리자 의견)
   * @param userData 인증된 사용자 정보 (관리자 권한 확인용)
   * @returns 업데이트된 신고 정보
   */
  @Put('/admin/reports/:id/review')
  @UseGuards(AuthGuard())
  @UsePipes(ValidationPipe)
  async reviewReport(
    @Param('id', ParseIntPipe) reportId: number,
    @Body() reviewReportDto: ReviewReportDto,
    @GetUser() userData: User,
  ): Promise<Report> {
    // 관리자 권한 확인 (관리자 이메일로 확인)
    if (userData.user_email !== 'admin@example.com') {
      throw new UnauthorizedException('관리자 권한이 필요합니다.');
    }

    console.log('신고 검토:', reportId, reviewReportDto, userData.id);
    return await this.storyService.reviewReport(
      reportId,
      userData.id,
      reviewReportDto,
    );
  }

  /**
   * 특정 게시글의 신고 현황 조회 (관리자용)
   *
   * @description 특정 게시글에 대한 신고 현황을 조회합니다.
   * @param storyId 게시글 ID
   * @param userData 인증된 사용자 정보 (관리자 권한 확인용)
   * @returns 신고 현황 정보
   */
  @Get('/admin/story/:id/reports')
  @UseGuards(AuthGuard())
  async getStoryReports(
    @Param('id', ParseIntPipe) storyId: number,
    @GetUser() userData: User,
  ): Promise<{
    total: number;
    pending: number;
    approved: number;
    rejected: number;
    reports: any[];
  }> {
    // 관리자 권한 확인 (관리자 이메일로 확인)
    if (userData.user_email !== 'admin@example.com') {
      throw new UnauthorizedException('관리자 권한이 필요합니다.');
    }

    console.log('게시글 신고 현황 조회:', storyId, userData.id);
    return await this.storyService.getStoryReports(storyId);
  }

  /**
   * 신고된 게시글 삭제 (관리자용)
   *
   * @description 관리자가 신고를 검토한 후 해당 게시글을 삭제합니다.
   * @param storyId 삭제할 게시글 ID
   * @param userData 인증된 사용자 정보 (관리자 권한 확인용)
   * @returns 성공 시 void
   */
  @Delete('/admin/story/:id/delete')
  @UseGuards(AuthGuard())
  async deleteReportedStory(
    @Param('id', ParseIntPipe) storyId: number,
    @GetUser() userData: User,
  ): Promise<void> {
    // 관리자 권한 확인 (관리자 이메일로 확인)
    if (userData.user_email !== 'admin@example.com') {
      throw new UnauthorizedException('관리자 권한이 필요합니다.');
    }

    console.log('신고된 게시글 삭제:', storyId, userData.id);
    return await this.storyService.deleteReportedStory(storyId, userData.id);
  }

  // ========== 관리자 전용 기능들 ==========

  /**
   * 관리자 권한으로 게시글 강제 삭제 (총 관리자 전용)
   *
   * @description 총 관리자가 모든 게시글을 삭제할 수 있습니다.
   * @param storyId 삭제할 게시글 ID
   * @param userData 인증된 사용자 정보 (총 관리자 권한 확인)
   * @returns 성공 시 void
   */
  @Delete('/admin/force-delete/:id')
  @UseGuards(AdminGuard)
  @SuperAdminRequired()
  async forceDeleteStory(
    @Param('id', ParseIntPipe) storyId: number,
    @GetUser() userData: User,
  ): Promise<void> {
    console.log(
      '관리자 강제 삭제 - 게시글 ID:',
      storyId,
      '관리자:',
      userData.user_email,
    );
    return await this.storyService.forceDeleteStory(storyId, userData.id);
  }

  /**
   * 채널 관리자 권한으로 게시글 삭제 (채널 관리자 전용)
   *
   * @description 채널 관리자가 본인 채널의 게시글을 삭제할 수 있습니다.
   * @param storyId 삭제할 게시글 ID
   * @param userData 인증된 사용자 정보 (채널 관리자 권한 확인)
   * @returns 성공 시 void
   */
  @Delete('/admin/channel-delete/:id')
  @UseGuards(AdminGuard)
  @ChannelAdminRequired()
  async channelAdminDeleteStory(
    @Param('id', ParseIntPipe) storyId: number,
    @GetUser() userData: User,
  ): Promise<void> {
    console.log(
      '채널 관리자 삭제 - 게시글 ID:',
      storyId,
      '관리자:',
      userData.user_email,
    );
    return await this.storyService.channelAdminDeleteStory(
      storyId,
      userData.id,
    );
  }

  /**
   * 관리자 권한으로 여러 게시글 일괄 삭제 (총 관리자 전용)
   *
   * @description 총 관리자가 여러 게시글을 한 번에 삭제할 수 있습니다.
   * @param body 삭제할 게시글 ID 목록
   * @param userData 인증된 사용자 정보 (총 관리자 권한 확인)
   * @returns 삭제된 게시글 개수
   */
  @Delete('/admin/batch-delete')
  @UseGuards(AdminGuard)
  @SuperAdminRequired()
  async batchDeleteStories(
    @Body() body: { storyIds: number[] },
    @GetUser() userData: User,
  ): Promise<{ deletedCount: number }> {
    console.log(
      '관리자 일괄 삭제 - 게시글 개수:',
      body.storyIds.length,
      '관리자:',
      userData.user_email,
    );
    const deletedCount = await this.storyService.batchDeleteStories(
      body.storyIds,
      userData.id,
    );
    return { deletedCount };
  }
}
