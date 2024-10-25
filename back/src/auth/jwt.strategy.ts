import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { InjectRepository } from '@nestjs/typeorm';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Repository } from 'typeorm';
import { User } from './user.entity';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    @InjectRepository(User) private userRepository: Repository<User>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: any) => {
          // 'next-auth.session-token' 쿠키에서 토큰 추출
          console.log('야이 씨발', req.cookies?.['next-auth.session-token']);
          return req.cookies?.['next-auth.session-token'];
        },
      ]),
      secretOrKey: 'park',
    });
  }

  async validate(payload) {
    console.log('JWT 페이로드:', payload); // 이 로그가 출력되는지 확인
    const { user_email } = payload;
    const user = await this.userRepository.findOne({ where: { user_email } });

    if (!user) {
      console.error('사용자를 찾을 수 없습니다.');
      throw new UnauthorizedException();
    }

    console.log('인증된 사용자:', user);
    return user;
  }
}
