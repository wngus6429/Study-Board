import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './user.entity';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from './jwt.strategy';

@Module({
  imports: [
    // @UseGuards(AuthGuard())를 사용할 수 있음 아니면 @UseGuards(AuthGuard('jwt'))로 사용해야함
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: 'park',
      signOptions: {
        expiresIn: 3600, // 1시간 토큰 유용하게
      },
    }),
    TypeOrmModule.forFeature([User]),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  // JwtStrategy, PassportModule를 다른곳에서 사용할 수 있게 해줌
  exports: [JwtStrategy, PassportModule],
})
export class AuthModule {}
