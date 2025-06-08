import {
  Controller,
  Get,
  Post,
  Delete,
  Patch,
  Body,
  Param,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { MessagesService } from './messages.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { UpdateMessageDto } from './dto/update-message.dto';

@ApiTags('messages')
@Controller('api/messages')
@UseGuards(AuthGuard('jwt'))
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  //! ㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡ
  // 쪽지 보내기
  @Post()
  @ApiOperation({ summary: '쪽지 보내기' })
  @ApiResponse({ status: 201, description: '쪽지 전송 성공' })
  async sendMessage(
    @Body() createMessageDto: CreateMessageDto,
    @Req() req: any,
  ) {
    const senderId = req.user.id;
    return this.messagesService.sendMessage(createMessageDto, senderId);
  }

  //! ㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡ
  // 쪽지 보내기 (대체 엔드포인트)
  @Post('send')
  @ApiOperation({ summary: '쪽지 보내기' })
  @ApiResponse({ status: 201, description: '쪽지 전송 성공' })
  async sendMessageAlt(
    @Body() createMessageDto: CreateMessageDto,
    @Req() req: any,
  ) {
    const senderId = req.user.id;
    return this.messagesService.sendMessage(createMessageDto, senderId);
  }

  //! ㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡ
  // 받은 쪽지 목록 조회
  @Get('received')
  @ApiOperation({ summary: '받은 쪽지 목록 조회' })
  @ApiResponse({ status: 200, description: '받은 쪽지 목록 반환' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getReceivedMessages(
    @Req() req: any,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    const userId = req.user.id;
    return this.messagesService.getReceivedMessages(userId, page, limit);
  }

  //! ㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡ
  // 보낸 쪽지 목록 조회
  @Get('sent')
  @ApiOperation({ summary: '보낸 쪽지 목록 조회' })
  @ApiResponse({ status: 200, description: '보낸 쪽지 목록 반환' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getSentMessages(
    @Req() req: any,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    const userId = req.user.id;
    return this.messagesService.getSentMessages(userId, page, limit);
  }

  //! ㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡ
  // 쪽지 읽음 처리
  @Patch(':id/read')
  @ApiOperation({ summary: '쪽지 읽음 처리' })
  @ApiResponse({ status: 200, description: '쪽지가 읽음으로 표시됨' })
  async markAsRead(@Param('id') id: number, @Req() req: any) {
    const userId = req.user.id;
    return this.messagesService.markAsRead(id, userId);
  }

  //! ㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡ
  // 쪽지 수정
  @Patch(':id')
  @ApiOperation({ summary: '쪽지 수정' })
  @ApiResponse({ status: 200, description: '쪽지가 수정됨' })
  async updateMessage(
    @Param('id') id: number,
    @Body() updateMessageDto: UpdateMessageDto,
    @Req() req: any,
  ) {
    const userId = req.user.id;
    return this.messagesService.updateMessage(id, updateMessageDto, userId);
  }

  //! ㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡ
  // 쪽지 삭제
  @Delete(':id')
  @ApiOperation({ summary: '쪽지 삭제' })
  @ApiResponse({ status: 200, description: '쪽지가 삭제됨' })
  async deleteMessage(@Param('id') id: number, @Req() req: any) {
    const userId = req.user.id;
    return this.messagesService.deleteMessage(id, userId);
  }

  //! ㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡ
  // 사용자 닉네임으로 검색
  @Get('search-users')
  @ApiOperation({ summary: '사용자 닉네임으로 검색' })
  @ApiResponse({ status: 200, description: '검색된 사용자 목록 반환' })
  @ApiQuery({ name: 'q', required: true, type: String })
  async searchUsers(@Query('q') query: string) {
    return this.messagesService.searchUserByNickname(query);
  }

  //! ㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡ
  // 읽지 않은 쪽지 개수 조회
  @Get('unread-count')
  @ApiOperation({ summary: '읽지 않은 쪽지 개수 조회' })
  @ApiResponse({ status: 200, description: '읽지 않은 쪽지 개수 반환' })
  async getUnreadCount(@Req() req: any) {
    const userId = req.user.id;
    return { count: await this.messagesService.getUnreadCount(userId) };
  }
}
