import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { CommentService } from './comment.service';
import { AuthGuard } from '@nestjs/passport';
import { GetUser } from 'src/common/decorators/get-user.decorator';
import { User } from 'src/entities/User.entity';

@Controller('api/story')
export class CommentController {
  constructor(private readonly commentsService: CommentService) {}

  // ㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡ
  // 상세페이지 댓글 가져오기
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

  // 댓글 작성
  @Post('/')
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
  ): Promise<void> {
    await this.commentsService.createComment(commentData);
  }

  // 댓글 삭제
  @Delete('/:id')
  @UseGuards(AuthGuard())
  async deleteComment(
    @Param('id', ParseIntPipe) commentId: number,
    @Body() commentData: { storyId: string },
  ): Promise<void> {
    return this.commentsService.deleteComment(commentId, commentData);
  }

  // 댓글 수정
  @Patch('/:id')
  @UseGuards(AuthGuard())
  async editComment(
    @Param('id', ParseIntPipe) commentId: number,
    @Body() body: { content: string },
  ): Promise<void> {
    return this.commentsService.editComment(commentId, body.content);
  }
}
