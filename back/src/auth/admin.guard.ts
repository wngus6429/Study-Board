import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/User.entity';

export enum AdminLevel {
  SUPER_ADMIN = 'super_admin',
  CHANNEL_ADMIN = 'channel_admin',
}

/**
 * 관리자 권한 체크 가드
 *
 * @description
 * - 사용자의 관리자 권한을 확인하는 가드
 * - 총 관리자와 채널 관리자 권한을 구분하여 체크
 * - @AdminRequired 데코레이터와 함께 사용
 *
 * @usage
 * ```typescript
 * @UseGuards(JwtAuthGuard, AdminGuard)
 * @AdminRequired(AdminLevel.SUPER_ADMIN)
 * async deletePost(@Param('id') id: string) {
 *   // 총 관리자만 접근 가능
 * }
 * ```
 */
@Injectable()
export class AdminGuard extends AuthGuard('jwt') implements CanActivate {
  constructor(
    private reflector: Reflector,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // 먼저 JWT 인증 확인
    const jwtAuthResult = await super.canActivate(context);
    if (!jwtAuthResult) {
      throw new UnauthorizedException('로그인이 필요합니다.');
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new UnauthorizedException('사용자 정보를 찾을 수 없습니다.');
    }

    // 필요한 관리자 권한 레벨 확인
    const requiredAdminLevel = this.reflector.get<AdminLevel>(
      'adminLevel',
      context.getHandler(),
    );

    if (!requiredAdminLevel) {
      return true; // 관리자 권한이 명시되지 않은 경우 통과
    }

    // 사용자 정보 조회 (관리자 권한 포함)
    const userInfo = await this.userRepository.findOne({
      where: { id: user.id },
      select: ['id', 'user_email', 'nickname', 'is_super_admin'],
    });
    if (!userInfo) {
      throw new UnauthorizedException('사용자 정보를 찾을 수 없습니다.');
    }

    switch (requiredAdminLevel) {
      case AdminLevel.SUPER_ADMIN:
        // 총 관리자 권한 확인
        if (!userInfo.is_super_admin) {
          throw new ForbiddenException(
            '이 작업을 수행할 권한이 없습니다. 총 관리자 권한이 필요합니다.',
          );
        }
        break;

      case AdminLevel.CHANNEL_ADMIN:
        // 채널 관리자 권한 확인
        if (
          !userInfo.is_super_admin &&
          !this.isChannelAdmin(request, userInfo)
        ) {
          throw new ForbiddenException(
            '이 작업을 수행할 권한이 없습니다. 채널 관리자 권한이 필요합니다.',
          );
        }
        break;

      default:
        throw new ForbiddenException('유효하지 않은 관리자 권한 레벨입니다.');
    }

    return true;
  }

  /**
   * 채널 관리자 권한 확인
   *
   * @description
   * - 사용자가 특정 채널의 관리자인지 확인
   * - 채널 생성자인 경우 관리자 권한 보유
   * - 총 관리자는 모든 채널에 대한 권한 보유
   *
   * @param request HTTP 요청 객체
   * @param user 사용자 정보
   * @returns 채널 관리자 여부
   */
  private isChannelAdmin(request: any, user: any): boolean {
    // 총 관리자는 모든 채널에 대한 권한 보유
    if (user.is_super_admin) {
      return true;
    }

    // 채널 ID나 슬러그를 통해 채널 관리자 권한 확인
    const channelId = request.params.channelId;
    const channelSlug = request.params.slug;

    if (channelId || channelSlug) {
      // 실제 구현에서는 채널 정보를 조회하여
      // 현재 사용자가 해당 채널의 생성자인지 확인해야 함
      // 여기서는 간단히 true 반환 (추후 채널 서비스에서 구현)
      return true;
    }

    return false;
  }
}
