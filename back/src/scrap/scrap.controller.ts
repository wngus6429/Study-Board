import {
  Controller,
  Post,
  Delete,
  Get,
  Param,
  Query,
  Request,
  UseGuards,
  HttpCode,
  HttpStatus,
  ValidationPipe,
  UsePipes,
} from '@nestjs/common';
import { ScrapService } from './scrap.service';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';

@ApiTags('스크랩')
@Controller('api/scrap')
export class ScrapController {
  constructor(private readonly scrapService: ScrapService) {}

  @Post('/:storyId')
  @ApiOperation({ summary: '게시물 스크랩' })
  @ApiParam({ name: 'storyId', description: '게시물 ID' })
  @ApiResponse({ status: 201, description: '스크랩 성공' })
  @ApiResponse({ status: 400, description: '잘못된 요청' })
  @ApiResponse({ status: 409, description: '이미 스크랩한 게시물' })
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(AuthGuard())
  @UsePipes(ValidationPipe)
  async addScrap(@Param('storyId') storyId: string, @Request() req) {
    console.log('스크랩 추가 요청 받음', storyId, req);
    const userId = req.user.id;
    const scrap = await this.scrapService.addScrap(userId, parseInt(storyId));
    return {
      message: '스크랩되었습니다.',
      data: scrap,
    };
  }

  @Delete('/:storyId')
  @ApiOperation({ summary: '게시물 스크랩 취소' })
  @ApiParam({ name: 'storyId', description: '게시물 ID' })
  @ApiResponse({ status: 200, description: '스크랩 취소 성공' })
  @ApiResponse({ status: 404, description: '스크랩을 찾을 수 없음' })
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard())
  @UsePipes(ValidationPipe)
  async removeScrap(@Param('storyId') storyId: string, @Request() req) {
    const userId = req.user.id;
    await this.scrapService.removeScrap(userId, parseInt(storyId));
    return {
      message: '스크랩이 취소되었습니다.',
    };
  }

  @Get()
  @ApiOperation({ summary: '내 스크랩 목록 조회' })
  @ApiQuery({
    name: 'page',
    required: false,
    description: '페이지 번호',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: '페이지당 항목 수',
    example: 20,
  })
  @ApiResponse({ status: 200, description: '스크랩 목록 조회 성공' })
  @UseGuards(AuthGuard())
  @UsePipes(ValidationPipe)
  async getUserScraps(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
    @Request() req,
  ) {
    const userId = req.user.id;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);

    const result = await this.scrapService.getUserScraps(
      userId,
      pageNum,
      limitNum,
    );
    return {
      message: '스크랩 목록을 조회했습니다.',
      ...result,
    };
  }

  @Get('/check/:storyId')
  @ApiOperation({ summary: '게시물 스크랩 여부 확인' })
  @ApiParam({ name: 'storyId', description: '게시물 ID' })
  @ApiResponse({ status: 200, description: '스크랩 여부 확인 성공' })
  @UseGuards(AuthGuard())
  @UsePipes(ValidationPipe)
  async checkScrap(@Param('storyId') storyId: string, @Request() req) {
    const userId = req.user.id;
    const isScraped = await this.scrapService.isScraped(
      userId,
      parseInt(storyId),
    );
    return {
      isScraped,
    };
  }

  @Delete('/item/:scrapId')
  @ApiOperation({ summary: '스크랩 ID로 스크랩 삭제' })
  @ApiParam({ name: 'scrapId', description: '스크랩 ID' })
  @ApiResponse({ status: 200, description: '스크랩 삭제 성공' })
  @ApiResponse({ status: 404, description: '스크랩을 찾을 수 없음' })
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard())
  @UsePipes(ValidationPipe)
  async removeScrapById(@Param('scrapId') scrapId: string, @Request() req) {
    const userId = req.user.id;
    await this.scrapService.removeScrapById(userId, parseInt(scrapId));
    return {
      message: '스크랩이 삭제되었습니다.',
    };
  }
}
