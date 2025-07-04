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

@Controller('api/story')
export class CommentController {
  constructor(private readonly commentsService: CommentService) {}

  //!ㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡ
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
  //!ㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡ
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
  //!ㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡ
  // 댓글 삭제
  @Put('/comment/:id')
  @UseGuards(AuthGuard())
  async deleteComment(
    @Param('id', ParseIntPipe) commentId: number,
    @Body() commentData: { storyId: string },
  ): Promise<void> {
    return this.commentsService.deleteComment(commentId, commentData);
  }
  //!ㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡ
  // 프로필 페이지용 댓글 삭제
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

  // ========== 관리자 전용 댓글 관리 기능들 ==========

  /**
   * 관리자 권한으로 댓글 강제 삭제 (총 관리자 전용)
   *
   * @description 총 관리자가 모든 댓글을 강제 삭제할 수 있습니다.
   * @param commentId 삭제할 댓글 ID
   * @param userData 인증된 사용자 정보 (총 관리자 권한 확인)
   * @returns 성공 시 void
   */
  @Delete('/admin/comment/:id/force-delete')
  @UseGuards(AdminGuard)
  @SuperAdminRequired()
  async forceDeleteComment(
    @Param('id', ParseIntPipe) commentId: number,
    @GetUser() userData: User,
  ): Promise<void> {
    console.log(
      '관리자 강제 삭제 - 댓글 ID:',
      commentId,
      '관리자:',
      userData.user_email,
    );
    return await this.commentsService.forceDeleteComment(
      commentId,
      userData.id,
    );
  }

  /**
   * 채널 관리자 권한으로 댓글 삭제 (채널 관리자 전용)
   *
   * @description 채널 관리자가 본인 채널의 댓글을 삭제할 수 있습니다.
   * @param commentId 삭제할 댓글 ID
   * @param userData 인증된 사용자 정보 (채널 관리자 권한 확인)
   * @returns 성공 시 void
   */
  @Delete('/admin/comment/:id/channel-delete')
  @UseGuards(AdminGuard)
  @ChannelAdminRequired()
  async channelAdminDeleteComment(
    @Param('id', ParseIntPipe) commentId: number,
    @GetUser() userData: User,
  ): Promise<void> {
    console.log(
      '채널 관리자 삭제 - 댓글 ID:',
      commentId,
      '관리자:',
      userData.user_email,
    );
    return await this.commentsService.channelAdminDeleteComment(
      commentId,
      userData.id,
    );
  }

  /**
   * 관리자 권한으로 여러 댓글 일괄 삭제 (총 관리자 전용)
   *
   * @description 총 관리자가 여러 댓글을 한 번에 삭제할 수 있습니다.
   * @param body 삭제할 댓글 ID 목록
   * @param userData 인증된 사용자 정보 (총 관리자 권한 확인)
   * @returns 삭제된 댓글 개수
   */
  @Delete('/admin/comment/batch-delete')
  @UseGuards(AdminGuard)
  @SuperAdminRequired()
  async batchDeleteComments(
    @Body() body: { commentIds: number[] },
    @GetUser() userData: User,
  ): Promise<{ deletedCount: number }> {
    console.log(
      '관리자 일괄 삭제 - 댓글 개수:',
      body.commentIds.length,
      '관리자:',
      userData.user_email,
    );
    const deletedCount = await this.commentsService.batchDeleteComments(
      body.commentIds,
      userData.id,
    );
    return { deletedCount };
  }
}
