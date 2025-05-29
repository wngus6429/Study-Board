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
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ChannelsService } from './channels.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('channels')
@Controller('channels')
export class ChannelsController {
  constructor(private readonly channelsService: ChannelsService) {}

  @Get()
  @ApiOperation({ summary: '모든 채널 조회' })
  @ApiResponse({ status: 200, description: '채널 목록 조회 성공' })
  async findAll() {
    return this.channelsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: '특정 채널 조회' })
  @ApiResponse({ status: 200, description: '채널 조회 성공' })
  @ApiResponse({ status: 404, description: '채널을 찾을 수 없음' })
  async findOne(@Param('id') id: string) {
    return this.channelsService.findOne(+id);
  }

  @Post(':id/subscribe')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '채널 구독' })
  @ApiResponse({ status: 201, description: '구독 성공' })
  @ApiResponse({ status: 404, description: '채널 또는 유저를 찾을 수 없음' })
  @HttpCode(HttpStatus.OK)
  async subscribe(@Param('id') id: string, @Request() req) {
    await this.channelsService.subscribe(+id, req.user.id);
    return { message: '구독되었습니다.' };
  }

  @Delete(':id/subscribe')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '채널 구독 취소' })
  @ApiResponse({ status: 200, description: '구독 취소 성공' })
  @HttpCode(HttpStatus.OK)
  async unsubscribe(@Param('id') id: string, @Request() req) {
    await this.channelsService.unsubscribe(+id, req.user.id);
    return { message: '구독이 취소되었습니다.' };
  }

  @Get('user/subscriptions')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '유저가 구독한 채널 목록' })
  @ApiResponse({ status: 200, description: '구독 채널 목록 조회 성공' })
  async getUserSubscriptions(@Request() req) {
    return this.channelsService.getUserSubscriptions(req.user.id);
  }

  @Post('initialize')
  @ApiOperation({ summary: '초기 채널 데이터 생성' })
  @ApiResponse({ status: 201, description: '초기 데이터 생성 성공' })
  @HttpCode(HttpStatus.OK)
  async initializeChannels() {
    await this.channelsService.createInitialChannels();
    return { message: '초기 채널 데이터가 생성되었습니다.' };
  }
}
