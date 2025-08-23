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
  UseInterceptors,
  UploadedFile,
  Patch,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
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

  // 채널 삭제 기능은 비활성화되었습니다.

  @Patch('/:id/hide')
  @UseGuards(AuthGuard())
  @UsePipes(ValidationPipe)
  @ApiOperation({
    summary: '채널 숨김 처리 (총관리자 또는 채널 생성자만 가능)',
  })
  @ApiResponse({ status: 200, description: '채널 숨김 처리 성공' })
  @ApiResponse({ status: 403, description: '숨김 권한 없음' })
  @ApiResponse({ status: 404, description: '채널을 찾을 수 없음' })
  async hideChannel(@Param('id', ParseIntPipe) id: number, @Request() req) {
    await this.channelsService.hideChannel(id, req.user.id);
    return { message: '채널이 숨김 처리되었습니다.' };
  }

  @Patch('/:id/show')
  @UseGuards(AuthGuard())
  @UsePipes(ValidationPipe)
  @ApiBearerAuth()
  @ApiOperation({ summary: '채널 표시 처리 (총관리자만 가능)' })
  @ApiResponse({ status: 200, description: '채널 표시 처리 성공' })
  @ApiResponse({ status: 403, description: '표시 권한 없음' })
  @ApiResponse({ status: 404, description: '채널을 찾을 수 없음' })
  @HttpCode(HttpStatus.OK)
  async showChannel(@Param('id', ParseIntPipe) id: number, @Request() req) {
    await this.channelsService.showChannel(id, req.user.id);
    return { message: '채널이 표시되었습니다.' };
  }

  // 채널 이미지 업로드 API
  @Post(':id/upload-image')
  @UseGuards(AuthGuard())
  @ApiBearerAuth()
  @UseInterceptors(FileInterceptor('channelImage')) // 'channelImage'는 프론트엔드에서 보낼 필드명
  @ApiOperation({ summary: '채널 대표 이미지 업로드 (채널 생성자만 가능)' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 201, description: '이미지 업로드 성공' })
  @ApiResponse({ status: 403, description: '업로드 권한 없음' })
  @ApiResponse({ status: 404, description: '채널을 찾을 수 없음' })
  @HttpCode(HttpStatus.CREATED)
  async uploadChannelImage(
    @Param('id', ParseIntPipe) channelId: number,
    @UploadedFile() imageFile: Express.Multer.File,
    @Request() req,
  ) {
    console.log('채널 이미지 업로드 API:', {
      channelId,
      userId: req.user.id,
      fileName: imageFile?.filename,
    });

    if (!imageFile) {
      throw new Error('이미지 파일이 필요합니다.');
    }

    // 이미지 파일 타입 검증
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(imageFile.mimetype)) {
      throw new Error(
        '지원하지 않는 이미지 형식입니다. (JPG, PNG, GIF, WEBP만 지원)',
      );
    }

    // 파일 크기 검증 (20MB 제한)
    const maxSize = 20 * 1024 * 1024; // 20MB
    if (imageFile.size > maxSize) {
      throw new Error('이미지 파일 크기는 20MB를 초과할 수 없습니다.');
    }

    const savedImage = await this.channelsService.uploadChannelImage(
      channelId,
      req.user.id,
      imageFile,
    );

    return {
      message: '채널 이미지가 업로드되었습니다.',
      image: {
        id: savedImage.id,
        link: savedImage.link,
        imageName: savedImage.image_name,
        uploadedAt: savedImage.created_at,
      },
    };
  }

  // 채널 이미지 삭제 API
  @Delete(':id/image')
  @UseGuards(AuthGuard())
  @ApiBearerAuth()
  @ApiOperation({ summary: '채널 대표 이미지 삭제 (채널 생성자만 가능)' })
  @ApiResponse({ status: 200, description: '이미지 삭제 성공' })
  @ApiResponse({ status: 403, description: '삭제 권한 없음' })
  @ApiResponse({ status: 404, description: '채널을 찾을 수 없음' })
  @HttpCode(HttpStatus.OK)
  async deleteChannelImage(
    @Param('id', ParseIntPipe) channelId: number,
    @Request() req,
  ) {
    console.log('채널 이미지 삭제 API:', {
      channelId,
      userId: req.user.id,
    });

    await this.channelsService.deleteChannelImage(channelId, req.user.id);

    return {
      message: '채널 이미지가 삭제되었습니다.',
    };
  }
}
