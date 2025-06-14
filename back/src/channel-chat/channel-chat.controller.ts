import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  Request,
  HttpStatus,
  HttpCode,
  ParseIntPipe,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { ChannelChatService } from './channel-chat.service';

@ApiTags('channel-chat')
@Controller('api/channel-chat')
export class ChannelChatController {
  constructor(private readonly channelChatService: ChannelChatService) {}

  @Get('/:channelId/messages')
  @ApiOperation({ summary: '채널 채팅 메시지 목록 조회' })
  @ApiResponse({ status: 200, description: '메시지 목록 조회 성공' })
  @ApiResponse({ status: 404, description: '채널을 찾을 수 없음' })
  @ApiQuery({
    name: 'page',
    required: false,
    description: '페이지 번호 (기본값: 1)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: '페이지 크기 (기본값: 50)',
  })
  async getChannelChatMessages(
    @Param('channelId', ParseIntPipe) channelId: number,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '50',
  ) {
    console.log('채널 채팅 메시지 조회:', { channelId, page, limit });

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 50;

    return await this.channelChatService.getChannelChatMessages(
      channelId,
      pageNum,
      limitNum,
    );
  }

  @Post('/:channelId/send')
  @UseGuards(AuthGuard())
  @UsePipes(ValidationPipe)
  @ApiBearerAuth()
  @ApiOperation({ summary: '채널 채팅 메시지 전송' })
  @ApiResponse({ status: 201, description: '메시지 전송 성공' })
  @ApiResponse({ status: 404, description: '채널 또는 사용자를 찾을 수 없음' })
  @ApiResponse({ status: 403, description: '메시지가 너무 길거나 권한 없음' })
  @HttpCode(HttpStatus.CREATED)
  async sendChannelChatMessage(
    @Param('channelId', ParseIntPipe) channelId: number,
    @Body('message') message: string,
    @Request() req,
  ) {
    console.log('채널 채팅 메시지 전송:', {
      channelId,
      userId: req.user.id,
      messageLength: message?.length,
    });

    if (!message || message.trim() === '') {
      throw new Error('메시지 내용이 필요합니다.');
    }

    return await this.channelChatService.sendChannelChatMessage(
      channelId,
      req.user.id,
      message,
    );
  }

  @Delete('/:channelId/messages/:messageId')
  @UseGuards(AuthGuard())
  @UsePipes(ValidationPipe)
  @ApiBearerAuth()
  @ApiOperation({ summary: '채널 채팅 메시지 삭제 (본인 메시지만)' })
  @ApiResponse({ status: 200, description: '메시지 삭제 성공' })
  @ApiResponse({
    status: 404,
    description: '메시지를 찾을 수 없거나 삭제 권한 없음',
  })
  @HttpCode(HttpStatus.OK)
  async deleteChannelChatMessage(
    @Param('channelId', ParseIntPipe) channelId: number,
    @Param('messageId', ParseIntPipe) messageId: number,
    @Request() req,
  ) {
    console.log('채널 채팅 메시지 삭제:', {
      channelId,
      messageId,
      userId: req.user.id,
    });

    return await this.channelChatService.deleteChannelChatMessage(
      channelId,
      messageId,
      req.user.id,
    );
  }

  @Post('/:channelId/join')
  @UseGuards(AuthGuard())
  @UsePipes(ValidationPipe)
  @ApiBearerAuth()
  @ApiOperation({ summary: '채널 채팅 입장' })
  @ApiResponse({ status: 200, description: '채널 입장 성공' })
  @ApiResponse({ status: 404, description: '채널 또는 사용자를 찾을 수 없음' })
  @HttpCode(HttpStatus.OK)
  async joinChannelChat(
    @Param('channelId', ParseIntPipe) channelId: number,
    @Request() req,
  ) {
    console.log('채널 채팅 입장:', { channelId, userId: req.user.id });

    return await this.channelChatService.joinChannelChat(
      channelId,
      req.user.id,
    );
  }

  @Post('/:channelId/leave')
  @UseGuards(AuthGuard())
  @UsePipes(ValidationPipe)
  @ApiOperation({ summary: '채널 채팅 나가기' })
  @ApiResponse({ status: 200, description: '채널 나가기 성공' })
  @HttpCode(HttpStatus.OK)
  async leaveChannelChat(
    @Param('channelId', ParseIntPipe) channelId: number,
    @Request() req,
  ) {
    console.log('채널 채팅 나가기:', { channelId, userId: req.user.id });

    return await this.channelChatService.leaveChannelChat(
      channelId,
      req.user.id,
    );
  }

  @Get('/:channelId/participants')
  @ApiOperation({ summary: '채널 채팅 참여자 목록 조회' })
  @ApiResponse({ status: 200, description: '참여자 목록 조회 성공' })
  @ApiResponse({ status: 404, description: '채널을 찾을 수 없음' })
  async getChannelChatParticipants(
    @Param('channelId', ParseIntPipe) channelId: number,
  ) {
    console.log('채널 채팅 참여자 조회:', { channelId });

    return await this.channelChatService.getChannelChatParticipants(channelId);
  }
}
