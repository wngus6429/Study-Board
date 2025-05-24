import {
  Controller,
  Get,
  Patch,
  Param,
  UseGuards,
  Req,
  Query,
  Delete,
} from '@nestjs/common';
import { NotificationService } from './notification.service';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('notifications')
@Controller('api/notifications')
@UseGuards(AuthGuard('jwt'))
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}
  //! ㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡ
  // 사용자의 읽지 않은 알림 조회
  @Get()
  @ApiOperation({ summary: '읽지 않은 알림 조회' })
  @ApiResponse({ status: 200, description: '알림 목록 반환' })
  async getUnreadNotifications(@Req() req: any) {
    const userId = req.user.id;
    return this.notificationService.findUnread(userId);
  }
  //! ㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡ
  // 사용자의 모든 알림 조회 (페이지네이션 포함)
  @Get('all')
  @ApiOperation({ summary: '모든 알림 조회' })
  @ApiResponse({ status: 200, description: '전체 알림 목록 반환' })
  async getAllNotifications(
    @Req() req: any,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ) {
    const userId = req.user.id;
    return this.notificationService.findAll(userId, page, limit);
  }
  //! ㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡ
  // 알림을 읽음으로 표시
  @Patch(':id/read')
  @ApiOperation({ summary: '알림 읽음 처리' })
  @ApiResponse({ status: 200, description: '알림이 읽음으로 표시됨' })
  async markAsRead(@Param('id') id: number, @Req() req: any) {
    const userId = req.user.id;
    return this.notificationService.markAsRead(id, userId);
  }
  //! ㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡ
  // 모든 알림을 읽음으로 표시
  @Patch('read-all')
  @ApiOperation({ summary: '모든 알림 읽음 처리' })
  @ApiResponse({ status: 200, description: '모든 알림이 읽음으로 표시됨' })
  async markAllAsRead(@Req() req: any) {
    const userId = req.user.id;
    return this.notificationService.markAllAsRead(userId);
  }
  //! ㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡ
  // 알림 삭제
  @Delete(':id')
  @ApiOperation({ summary: '알림 삭제' })
  @ApiResponse({ status: 200, description: '알림이 삭제됨' })
  async deleteNotification(@Param('id') id: number, @Req() req: any) {
    const userId = req.user.id;
    return this.notificationService.deleteNotification(id, userId);
  }
}
