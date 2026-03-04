import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { CommentService } from './comment.service';
import { AuthGuard } from '@nestjs/passport';
import { AdminGuard } from '../auth/admin.guard';
import {
  SuperAdminRequired,
  ChannelAdminRequired,
} from '../common/decorators/admin.decorator';
import { GetUser } from '../common/decorators/get-user.decorator';
import { User } from '../entities/User.entity';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
  ApiQuery,
} from '@nestjs/swagger';

@ApiTags('Comment')
@Controller('api/story')
export class CommentController {
  constructor(private readonly commentsService: CommentService) {}

  //!ㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡ
  // 상세페이지 댓글 가져오기
  @ApiOperation({ summary: '게시글 댓글 목록 조회 (페이지네이션)' })
  @ApiParam({ name: 'id', description: '게시글 ID' })
  @ApiBody({
    description: '페이지네이션 파라미터',
    schema: {
      properties: {
        page: { type: 'number', example: 1 },
        limit: { type: 'number', example: 10 },
      },
    },
  })
  @ApiResponse({ status: 200, description: '댓글 목록 및 총 개수 반환' })
  @Post('/detail/comment/:id')
  async getStoryDetailComment(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { page?: number; limit?: number },
  ): Promise<any> {
    const { page = 1, limit = 10 } = body; // 페이지네이션 파라미터 추출 (기본값 설정)
    const { processedComments, totalCount } =
      await this.commentsService.findStoryOneComment(id, page, limit);
    return { processedComments, totalCount };
  }
  //!ㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡ
  // 댓글 작성
  @ApiOperation({ summary: '댓글 작성' })
  @ApiParam({ name: 'id', description: '게시글 ID' })
  @ApiBody({
    description: '댓글 내용',
    schema: {
      properties: {
        storyId: { type: 'string' },
        content: { type: 'string' },
        parentId: { type: 'number', nullable: true },
        authorId: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 201, description: '댓글 작성 성공' })
  @Post('/comment/:id')
  @UseGuards(AuthGuard())
  @UsePipes(ValidationPipe)
  async createComment(
    @Body()
    commentData: {
      storyId: string;
      content: string;
      parentId?: number | null;
      authorId: string;
    },
  ): Promise<{ commentId: number }> {
    return await this.commentsService.createComment(commentData);
  }
  //!ㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡ
  // 댓글 삭제
  @ApiOperation({ summary: '댓글 삭제 (소프트 삭제)' })
  @ApiParam({ name: 'id', description: '댓글 ID' })
  @ApiResponse({ status: 200, description: '댓글 삭제 성공' })
  @Put('/comment/:id')
  @UseGuards(AuthGuard())
  async deleteComment(
    @Param('id', ParseIntPipe) commentId: number,
    @Body() commentData: { storyId: string },
    @GetUser() user: User,
  ): Promise<void> {
    return this.commentsService.deleteComment(commentId, commentData, user);
  }
  //!ㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡ
  // 프로필 페이지용 댓글 삭제
  @ApiOperation({ summary: '프로필 페이지에서 댓글 삭제' })
  @ApiParam({ name: 'id', description: '댓글 ID' })
  @ApiResponse({ status: 200, description: '댓글 삭제 성공' })
  @Put('/profile/comment/:id')
  @UseGuards(AuthGuard())
  async deleteCommentFromProfile(
    @Param('id', ParseIntPipe) commentId: number,
    @Body('userId') userId: string,
  ): Promise<void> {
    return this.commentsService.deleteCommentFromProfile(commentId, userId);
  }

  //!ㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡ
  // 댓글 수정
  @ApiOperation({ summary: '댓글 내용 수정' })
  @ApiParam({ name: 'id', description: '댓글 ID' })
  @ApiBody({
    description: '수정할 댓글 내용',
    schema: { properties: { content: { type: 'string' } } },
  })
  @ApiResponse({ status: 200, description: '댓글 수정 성공' })
  @Patch('/comment/:id')
  @UseGuards(AuthGuard())
  async editComment(
    @Param('id') commentId: number,
    @Body('content') content: string, //! body에서 content 필드만 추출
  ): Promise<void> {
    console.log('수정할 댓글 ID:', commentId, content);
    return await this.commentsService.editComment(commentId, content);
  }

  //!ㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡ
  // 특정 댓글이 포함된 페이지 번호 찾기
  @ApiOperation({ summary: '특정 댓글이 위치한 페이지 번호 조회' })
  @ApiParam({ name: 'storyId', description: '게시글 ID' })
  @ApiParam({ name: 'commentId', description: '찾을 댓글 ID' })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: '페이지당 댓글 수 (기본값: 10)',
  })
  @ApiResponse({ status: 200, description: '페이지 번호 및 총 페이지 수 반환' })
  @Get('/comment/:storyId/page/:commentId')
  async findCommentPage(
    @Param('storyId', ParseIntPipe) storyId: number,
    @Param('commentId', ParseIntPipe) commentId: number,
    @Query('limit', ParseIntPipe) limit: number = 10,
  ): Promise<{ page: number; totalPages: number }> {
    return await this.commentsService.findCommentPage(
      storyId,
      commentId,
      limit,
    );
  }
}
