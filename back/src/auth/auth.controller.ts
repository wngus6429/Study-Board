import {
  Body,
  Controller,
  Post,
  Req,
  Res,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignupUserDto } from './dto/signup.user.dto';
import { Response } from 'express'; // Express Response 객체를 import
import { SigninUserDto } from './dto/signin.user.dto';
import { AuthGuard } from '@nestjs/passport';
import { JwtService } from '@nestjs/jwt';

@Controller('api/auth')
export class AuthController {
  constructor(
    private authUserService: AuthService,
    private jwtService: JwtService, // JwtService를 의존성 주입
  ) {}

  // 회원가입 로직 수정
  @Post('signup')
  async signup(
    @Body(ValidationPipe) userData: SignupUserDto,
    @Res() res: Response,
  ): Promise<void> {
    console.log('회원가입 데이터', userData);
    await this.authUserService.signUp(userData);
    res.sendStatus(201);
  }

  @Post('signin')
  async signin(
    @Body(ValidationPipe) userData: SigninUserDto,
    @Res() res: Response,
  ): Promise<void> {
    console.log('로그인 데이터', userData);
    const user = await this.authUserService.signIn(userData);
    if (!user) {
      res
        .status(401)
        .json({ message: '이메일 또는 비밀번호가 올바르지 않습니다.' });
      return;
    }
    // JWT 생성 로직
    const payload = { user_email: user.user_email, sub: user.id };
    const accessToken = this.jwtService.sign(payload);
    // 쿠키에 JWT 토큰 설정
    res.cookie('access_token', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // 프로덕션 환경에서는 true
      sameSite: 'strict',
    });

    // 로그인 성공 시 사용자 정보와 함께 응답
    res.status(200).json({ user, accessToken });
  }

  @Post('signinBack')
  async signinBack(
    @Body(ValidationPipe) userData: SigninUserDto,
    @Res() res: Response,
  ): Promise<void> {
    const user = await this.authUserService.signIn(userData);
    if (!user) {
      res
        .status(401)
        .json({ message: '이메일 또는 비밀번호가 올바르지 않습니다.' });
      return;
    }
    // 로그인 성공 시 사용자 정보와 함께 응답
    res.status(200).json(user);
  }

  @Post('logout')
  @UseGuards(AuthGuard('local'))
  async logout(@Res() res: Response): Promise<void> {
    // JWT가 저장된 쿠키를 클리어
    res.clearCookie('access_token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    });
    // 로그아웃 성공 응답 전송
    res.sendStatus(200);
  }
}

// JWT를 활용해서, 회원가입하고 바로 로그인 시키는 코드 로직
// @Post('signup')
// async signup(
//   @Body(ValidationPipe) userData: SignupUserDto,
//   @Res() res: Response,
// ): Promise<void> {
//   console.log('회원가입 데이터', userData);
//   const { accessToken } = await this.authUserService.signUp(userData);
//   // JWT를 HTTP-only 쿠키에 설정
//   res.cookie('access_token', accessToken, {
//     httpOnly: true,
//     secure: process.env.NODE_ENV === 'production',
//     sameSite: 'strict',
//   });

//   // 응답 전송
//   res.sendStatus(201);
// }

// @Post('signin')
// async signin(
//   @Body(ValidationPipe) userData: SigninUserDto,
//   @Res() res: Response,
// ): Promise<void> {
//   console.log('로그인 데이터', userData);
//   const { accessToken } = await this.authUserService.signIn(userData);

//   // JWT를 HTTP-only 쿠키에 설정
//   res.cookie('access_token', accessToken, {
//     httpOnly: true,
//     secure: process.env.NODE_ENV === 'production',
//     sameSite: 'strict',
//   });

//   // 응답 전송
//   res.sendStatus(200);
// }
