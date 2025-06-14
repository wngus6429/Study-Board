import {
  Controller,
  Post,
  Delete,
  Get,
  Param,
  Query,
  Request,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  ValidationPipe,
  UsePipes,
} from '@nestjs/common';
import { BlindService } from './blind.service';
import { AuthGuard } from '@nestjs/passport';
import { CreateBlindDto } from './dto/create-blind.dto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBody,
} from '@nestjs/swagger';

@ApiTags('블라인드')
@Controller('api/blinds')
export class BlindController {
  constructor(private readonly blindService: BlindService) {}

  @Post()
  @ApiOperation({ summary: '사용자 블라인드' })
  @ApiBody({ type: CreateBlindDto })
  @ApiResponse({ status: 201, description: '블라인드 성공' })
  @ApiResponse({ status: 400, description: '잘못된 요청' })
  @ApiResponse({ status: 404, description: '대상 사용자를 찾을 수 없음' })
  @ApiResponse({ status: 409, description: '이미 블라인드한 사용자' })
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(AuthGuard())
  @UsePipes(ValidationPipe)
  async addBlind(@Body() createBlindDto: CreateBlindDto, @Request() req) {
    const userId = req.user.id;
    const blind = await this.blindService.addBlind(userId, createBlindDto);
    return {
      message: '사용자를 블라인드했습니다.',
      data: blind,
    };
  }

  @Get()
  @ApiOperation({ summary: '내 블라인드 목록 조회' })
  @ApiQuery({
    name: 'page',
    required: false,
    description: '페이지 번호',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: '페이지당 항목 수',
    example: 20,
  })
  @ApiResponse({ status: 200, description: '블라인드 목록 조회 성공' })
  @UseGuards(AuthGuard())
  @UsePipes(ValidationPipe)
  async getBlindUsers(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
    @Request() req,
  ) {
    const userId = req.user.id;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);

    const result = await this.blindService.getBlindUsers(
      userId,
      pageNum,
      limitNum,
    );
    return {
      message: '블라인드 목록을 조회했습니다.',
      ...result,
    };
  }

  @Delete('/:blindId')
  @ApiOperation({ summary: '블라인드 해제' })
  @ApiParam({ name: 'blindId', description: '블라인드 ID' })
  @ApiResponse({ status: 200, description: '블라인드 해제 성공' })
  @ApiResponse({ status: 404, description: '블라인드를 찾을 수 없음' })
  @ApiResponse({ status: 403, description: '권한 없음' })
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard())
  @UsePipes(ValidationPipe)
  async removeBlind(@Param('blindId') blindId: string, @Request() req) {
    const userId = req.user.id;
    await this.blindService.removeBlind(userId, parseInt(blindId));
    return {
      message: '블라인드를 해제했습니다.',
    };
  }

  @Get('/check/:targetUserId')
  @ApiOperation({ summary: '사용자 블라인드 여부 확인' })
  @ApiParam({ name: 'targetUserId', description: '대상 사용자 ID' })
  @ApiResponse({ status: 200, description: '블라인드 여부 확인 성공' })
  @UseGuards(AuthGuard())
  @UsePipes(ValidationPipe)
  async checkBlind(
    @Param('targetUserId') targetUserId: string,
    @Request() req,
  ) {
    const userId = req.user.id;
    const isBlinded = await this.blindService.isUserBlinded(
      userId,
      targetUserId,
    );
    return {
      isBlinded,
    };
  }

  @Get('/blinded-users')
  @ApiOperation({ summary: '블라인드된 사용자 ID 목록 조회 (빠른 조회용)' })
  @ApiResponse({
    status: 200,
    description: '블라인드된 사용자 ID 목록 조회 성공',
  })
  @UseGuards(AuthGuard())
  @UsePipes(ValidationPipe)
  async getBlindedUserIds(@Request() req) {
    const userId = req.user.id;
    const blindedUserIds =
      await this.blindService.getUserBlindedUserIds(userId);
    return {
      blindedUserIds,
    };
  }
}
