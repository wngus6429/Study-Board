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

@Controller('api/comments')
export class CommentController {
  constructor(private readonly commentsService: CommentService) {}

  // 댓글 조회
  @Get('/:storyId')
  async getComments(
    @Param('storyId', ParseIntPipe) storyId: number,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('userId') userId?: string,
  ) {
    console.log('호출됨',storyId, userId, page, limit);
    return await this.commentsService.findStoryComments(storyId, userId, page, limit);
  }

  // 댓글 작성
  @Post('/')
  @UseGuards(AuthGuard())
  @UsePipes(ValidationPipe)
  async createComment(
    @Body() commentData: {
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