import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { UsersService } from './users.service';

@ApiTags('users')
@Controller('api/users')
@UseGuards(AuthGuard('jwt'))
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  //! ㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡ
  // 사용자 닉네임으로 검색
  @Get('search')
  @ApiOperation({ summary: '사용자 닉네임으로 검색' })
  @ApiResponse({ status: 200, description: '검색된 사용자 목록 반환' })
  @ApiQuery({ name: 'nickname', required: true, type: String })
  async searchUsers(@Query('nickname') nickname: string) {
    return this.usersService.searchUserByNickname(nickname);
  }
}
