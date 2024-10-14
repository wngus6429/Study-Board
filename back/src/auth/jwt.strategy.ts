import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { InjectRepository } from '@nestjs/typeorm';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Repository } from 'typeorm';
import { User } from './user.entity';
// import * as config from 'config';

@Injectable() // 다른곳에서 사용할 수 있게 해줌
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    @InjectRepository(User) private userRepository: Repository<User>,
  ) {
    super({
      //   secretOrKey: process.env.JWT_SECRET || config.get('jwt.secret'),
      secretOrKey: 'park',
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    });
  }

  // 위에서 토큰이 유효한지 체크가 되면 validate 메소드에서 payload에 있는 유저 이름이
  // DB에 있는 유저인지 확인후 유저 객체를 리턴
  // return 값은 @UseGuards(AuthGuard())를 이용한 모든 요청의 Request 객체에 들어감.
  async validate(payload) {
    const { user_email } = payload;
    const user: User = await this.userRepository.findOne({
      where: { user_email },
    });

    if (!user) {
      throw new UnauthorizedException();
    }

    return user;
  }
}
