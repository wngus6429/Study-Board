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

@Controller('api/auth')
export class AuthController {
  constructor(private authUserService: AuthService) {}

  @Post('signup')
  async signup(
    @Body(ValidationPipe) userData: SignupUserDto,
    @Res() res: Response,
  ): Promise<void> {
    console.log('회원가입 데이터', userData);
    const { accessToken } = await this.authUserService.signUp(userData);
    // JWT를 HTTP-only 쿠키에 설정
    res.cookie('access_token', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    });

    // 응답 전송
    res.sendStatus(201);
  }

  @Post('signin')
  async signin(
    @Body(ValidationPipe) userData: SigninUserDto,
    @Res() res: Response,
  ): Promise<void> {
    console.log('로그인 데이터', userData);
    const { accessToken } = await this.authUserService.signIn(userData);

    // JWT를 HTTP-only 쿠키에 설정
    res.cookie('access_token', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    });

    // 응답 전송
    res.sendStatus(200);
  }

  @Post('logout')
  @UseGuards(AuthGuard())
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
