import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { User } from '../entities/User.entity';

export interface SocketIdentity {
  id: string;
  nickname: string;
  expiresAt: number;
}

@Injectable()
export class SocketAuthService {
  constructor(
    private readonly jwtService: JwtService,
    @InjectRepository(User) private readonly userRepository: Repository<User>,
  ) {}

  async authenticate(cookieHeader?: string): Promise<SocketIdentity> {
    try {
      // Engine.IO handshakes do not pass through Express cookie-parser.
      const cookies = (cookieHeader ?? '')
        .split(';')
        .map((cookie) => cookie.trim())
        .filter((cookie) => cookie.startsWith('access_token='));
      if (cookies.length !== 1) throw new UnauthorizedException();

      const token = decodeURIComponent(
        cookies[0].slice('access_token='.length),
      );
      const payload = await this.jwtService.verifyAsync(token, {
        algorithms: ['HS256'],
      });

      // Existing access tokens contain id + user_email. Refresh tokens contain
      // only id and must never authenticate a socket.
      if (
        typeof payload.id !== 'string' ||
        !payload.id ||
        typeof payload.user_email !== 'string' ||
        !payload.user_email ||
        !Number.isFinite(payload.exp) ||
        payload.exp * 1000 <= Date.now()
      ) {
        throw new UnauthorizedException();
      }

      const user = await this.userRepository.findOne({
        where: {
          id: payload.id,
          user_email: payload.user_email,
          deleted_at: IsNull(),
        },
        select: ['id', 'nickname'],
      });
      if (!user) throw new UnauthorizedException();

      return {
        id: user.id,
        nickname: user.nickname,
        expiresAt: payload.exp * 1000,
      };
    } catch {
      throw new UnauthorizedException('채팅을 사용하려면 다시 로그인해주세요.');
    }
  }
}
