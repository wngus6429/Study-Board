// auth/jwt.strategy.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/User.entity';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    @InjectRepository(User) private userRepository: Repository<User>,
  ) {
    super({
      // 쿠키에서 JWT를 추출하는 함수 설정
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: Request) => {
          const token = req.cookies?.access_token;
          if (!token) {
            return null;
          }
          return token;
        },
      ]),
      secretOrKey: 'park', // 시크릿 키 설정
    });
  }

  // JWT가 유효한 경우, payload를 이용해 사용자 정보를 검증
  async validate(payload: any) {
    console.log('JWT payload:', payload);
    let user: User | null = null;

    if (payload.user_email) {
      user = await this.userRepository.findOne({ where: { user_email: payload.user_email } });
    } else if (payload.id) {
      user = await this.userRepository.findOne({ where: { id: payload.id } });
    }

    if (!user) {
      throw new UnauthorizedException('로그인 만료, 다시 로그인해주세요.');
    }

    return user; // 리턴된 값은 Request 객체에 추가됨
  }
}
