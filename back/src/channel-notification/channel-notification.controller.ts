import {
  Controller,
  Post,
  Delete,
  Get,
  Param,
  UseGuards,
  Req,
  ValidationPipe,
  UsePipes,
} from '@nestjs/common';
import { ChannelNotificationService } from './channel-notification.service';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('channel-notifications')
@Controller('/api/channel-notifications')
@UseGuards(AuthGuard())
@UsePipes(ValidationPipe)
export class ChannelNotificationController {
  constructor(
    private readonly channelNotificationService: ChannelNotificationService,
  ) {}

  //! ㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡ
  // 채널 알림 구독
  @Post('/subscribe/:channelId')
  @ApiOperation({ summary: '채널 알림 구독' })
  @ApiResponse({ status: 201, description: '알림 구독 성공' })
  async subscribe(@Param('channelId') channelId: number, @Req() req: any) {
    console.log('와씨subscribe', channelId);
    const userId = req.user.id;
    return this.channelNotificationService.subscribe(userId, channelId);
  }

  //! ㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡ
  // 채널 알림 구독 해제
  @Delete('/unsubscribe/:channelId')
  @ApiOperation({ summary: '채널 알림 구독 해제' })
  @ApiResponse({ status: 200, description: '알림 구독 해제 성공' })
  async unsubscribe(@Param('channelId') channelId: number, @Req() req: any) {
    const userId = req.user.id;
    return this.channelNotificationService.unsubscribe(userId, channelId);
  }

  //! ㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡ
  // 사용자의 채널 알림 구독 목록 조회
  @Get('/my-subscriptions')
  @ApiOperation({ summary: '내 채널 알림 구독 목록 조회' })
  @ApiResponse({ status: 200, description: '구독 목록 반환' })
  async getMySubscriptions(@Req() req: any) {
    const userId = req.user.id;
    return this.channelNotificationService.getUserSubscriptions(userId);
  }

  //! ㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡ
  // 특정 채널의 알림 구독 상태 확인
  @Get('/status/:channelId')
  @ApiOperation({ summary: '채널 알림 구독 상태 확인' })
  @ApiResponse({ status: 200, description: '구독 상태 반환' })
  async getSubscriptionStatus(
    @Param('channelId') channelId: number,
    @Req() req: any,
  ) {
    const userId = req.user.id;
    const isSubscribed = await this.channelNotificationService.isSubscribed(
      userId,
      channelId,
    );
    return { isSubscribed };
  }
}
