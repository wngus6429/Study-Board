import {
  Body,
  Controller,
  Delete,
  Get,
  InternalServerErrorException,
  NotFoundException,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
// import { CreateStoryDto } from './dto/create-story.dto';
import { SuggestionService } from './suggestion.service';
import { AuthGuard } from '@nestjs/passport';
import { GetUser } from 'src/common/decorators/get-user.decorator';
import { User } from 'src/entities/User.entity';
import { FilesInterceptor } from '@nestjs/platform-express';
import { Suggestion } from 'src/entities/Suggestion.entity';

@Controller('api/suggestion')
export class SuggestionController {
  logger: any;
  constructor(private readonly suggestionService: SuggestionService) {}
  // ㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡ
  // 게시글 목록 조회 (채널별 + 사용자별 필터링)
  @Get('/pageTableData')
  @UseGuards(AuthGuard())
  @UsePipes(ValidationPipe)
  async getPageSuggestion(
    @Query('offset') offset = 0,
    @Query('limit') limit = 10,
    @Query('channelId') channelId?: number,
    @Query('userId') userId?: string,
  ): Promise<{ results: Partial<Suggestion>[]; total: number }> {
    return await this.suggestionService.findSuggestion(
      offset,
      limit,
      channelId,
      userId,
    );
  }
  // ㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡ
  // 건의사항 작성
  @Post('/create')
  @UseGuards(AuthGuard())
  @UsePipes(ValidationPipe)
  @UseInterceptors(FilesInterceptor('images'))
  async createSuggestion(
    @Body() createSuggestionDto: any,
    @GetUser() user: User,
    @UploadedFiles() files: Express.Multer.File[],
  ): Promise<Suggestion> {
    const { channelId, ...suggestionData } = createSuggestionDto;
    return this.suggestionService.create(
      suggestionData,
      user,
      files,
      channelId,
    );
  }
  // ㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡ
  // 건의사항 상세 조회
  @Get('/detail/:id')
  @UseGuards(AuthGuard())
  @UsePipes(ValidationPipe)
  async getSuggestionDetail(
    @Param('id', ParseIntPipe) id: number,
    @GetUser() user: User,
  ): Promise<any> {
    return await this.suggestionService.findSuggestionOne(id);
  }
  // ㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡ
  // 건의하기 상세 페이지 수정시 데이터 받아옴
  @Get('/detail/edit/:id')
  @UseGuards(AuthGuard())
  async getStoryEditStory(
    @Param('id', ParseIntPipe) id: number,
    @Query('userId') userId: string,
  ): Promise<any> {
    const data = await this.suggestionService.findEditSuggestionOne(id, userId);
    return data;
  }
  // ㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡ
  // 건의사항 수정
  @Post('/update/:id')
  @UseGuards(AuthGuard())
  @UsePipes(ValidationPipe)
  @UseInterceptors(FilesInterceptor('images'))
  async updateSuggestion(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateSuggestionDto: any,
    @GetUser() user: User,
    @UploadedFiles() files: Express.Multer.File[],
  ): Promise<Suggestion> {
    return this.suggestionService.updateSuggestion(
      id,
      updateSuggestionDto,
      user,
      files,
    );
  }
  // ㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡ
  // 글 삭제
  @Delete('/:id')
  @UseGuards(AuthGuard())
  async deleteSuggestion(
    @Param('id', ParseIntPipe) id: number,
    @GetUser() user: User,
  ): Promise<void> {
    return this.suggestionService.deleteSuggestion(id, user);
  }
}
