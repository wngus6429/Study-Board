import {
  Body,
  Controller,
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
  // ㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡ
  // 댓글 삭제
  @Put('/comment/:id')
  @UseGuards(AuthGuard())
  async deleteComment(
    @Param('id', ParseIntPipe) commentId: number,
    @Body() commentData: { storyId: string },
  ): Promise<void> {
    return this.commentsService.deleteComment(commentId, commentData);
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
    return await this.commentsService.editComment(commentId, content);
  }
}
