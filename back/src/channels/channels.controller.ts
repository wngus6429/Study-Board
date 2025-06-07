import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  UseGuards,
  Request,
  HttpStatus,
  HttpCode,
  Body,
  UsePipes,
  ValidationPipe,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ChannelsService } from './channels.service';
import { AuthGuard } from '@nestjs/passport';

@ApiTags('channels')
@Controller('api/channels')
export class ChannelsController {
  constructor(private readonly channelsService: ChannelsService) {}

  @Get()
  @ApiOperation({ summary: '모든 채널 조회' })
  @ApiResponse({ status: 200, description: '채널 목록 조회 성공' })
  async findAllChannels() {
    console.log('채널 목록 조회');
    return await this.channelsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: '특정 채널 조회' })
  @ApiResponse({ status: 200, description: '채널 조회 성공' })
  @ApiResponse({ status: 404, description: '채널을 찾을 수 없음' })
  async findOneChannel(@Param('id', ParseIntPipe) id: number) {
    console.log('채널 상세 조회:', id);
    return await this.channelsService.findOne(id);
  }

  @Get('slug/:slug')
  @ApiOperation({ summary: '슬러그로 채널 조회' })
  @ApiResponse({ status: 200, description: '채널 조회 성공' })
  @ApiResponse({ status: 404, description: '채널을 찾을 수 없음' })
  async findChannelBySlug(@Param('slug') slug: string) {
    console.log('채널 슬러그 조회:', slug);
    return await this.channelsService.findBySlug(slug);
  }

  @Post('/create')
  @UseGuards(AuthGuard())
  @ApiBearerAuth()
  @ApiOperation({ summary: '새 채널 생성' })
  @ApiResponse({ status: 201, description: '채널 생성 성공' })
  async createChannel(
    @Body('channelName') channelName: string,
    @Body('slug') slug: string,
    @Request() req,
  ) {
    console.log(
      '채널 생성 API 실행:',
      'channelName:',
      channelName,
      'slug:',
      slug,
      '생성자:',
      req.user.id,
    );

    if (!channelName || channelName.trim() === '') {
      throw new Error('채널 이름이 필요합니다.');
    }

    if (!slug || slug.trim() === '') {
      throw new Error('채널 슬러그가 필요합니다.');
    }

    // 슬러그 유효성 검사 (영어, 숫자, 하이픈만 허용)
    const slugPattern = /^[a-z0-9-]+$/;
    if (!slugPattern.test(slug.trim())) {
      throw new Error(
        '슬러그는 영어 소문자, 숫자, 하이픈(-)만 사용할 수 있습니다.',
      );
    }

    const channel = await this.channelsService.createChannel(
      channelName.trim(),
      slug.trim().toLowerCase(),
      req.user.id,
    );
    return {
      message: '새 채널이 생성되었습니다.',
      channel,
    };
  }

  @Post(':id/subscribe')
  @UseGuards(AuthGuard())
  @ApiBearerAuth()
  @ApiOperation({ summary: '채널 구독' })
  @ApiResponse({ status: 201, description: '구독 성공' })
  @ApiResponse({ status: 404, description: '채널 또는 유저를 찾을 수 없음' })
  @HttpCode(HttpStatus.OK)
  async subscribeChannel(
    @Param('id', ParseIntPipe) id: number,
    @Request() req,
  ) {
    console.log('채널 구독:', id, '사용자:', req.user.id);
    await this.channelsService.subscribe(id, req.user.id);
    return { message: '구독되었습니다.' };
  }

  @Delete(':id/subscribe')
  @UseGuards(AuthGuard())
  @ApiBearerAuth()
  @ApiOperation({ summary: '채널 구독 취소' })
  @ApiResponse({ status: 200, description: '구독 취소 성공' })
  @HttpCode(HttpStatus.OK)
  async unsubscribeChannel(
    @Param('id', ParseIntPipe) id: number,
    @Request() req,
  ) {
    console.log('채널 구독 취소:', id, '사용자:', req.user.id);
    await this.channelsService.unsubscribe(id, req.user.id);
    return { message: '구독이 취소되었습니다.' };
  }

  @Get('user/subscriptions')
  @UseGuards(AuthGuard())
  @ApiBearerAuth()
  @ApiOperation({ summary: '유저가 구독한 채널 목록' })
  @ApiResponse({ status: 200, description: '구독 채널 목록 조회 성공' })
  async getUserSubscriptions(@Request() req) {
    console.log('사용자 구독 채널 조회:', req.user.id);
    return await this.channelsService.getUserSubscriptions(req.user.id);
  }

  @Delete(':id')
  @UseGuards(AuthGuard())
  @ApiBearerAuth()
  @ApiOperation({ summary: '채널 삭제 (생성자만 가능)' })
  @ApiResponse({ status: 200, description: '채널 삭제 성공' })
  @ApiResponse({ status: 403, description: '삭제 권한 없음' })
  @ApiResponse({ status: 404, description: '채널을 찾을 수 없음' })
  @HttpCode(HttpStatus.OK)
  async deleteChannel(@Param('id', ParseIntPipe) id: number, @Request() req) {
    console.log('채널 삭제 API:', { channelId: id, userId: req.user.id });
    await this.channelsService.deleteChannel(id, req.user.id);
    return { message: '채널이 삭제되었습니다.' };
  }
}
