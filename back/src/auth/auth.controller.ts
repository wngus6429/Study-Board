import { Body, Controller, Post, Res, ValidationPipe } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignupUserDto } from './dto/signup.user.dto';
import { Response } from 'express'; // Express Response 객체를 import
import { SigninUserDto } from './dto/signin.user.dto';

@Controller('auth')
export class AuthController {
  constructor(private authUserService: AuthService) {}

  @Post('signup')
  async signup(@Body(ValidationPipe) userData: SignupUserDto): Promise<void> {
    console.log('userData:', userData);
    return await this.authUserService.signUp(userData);
  }

  @Post('signin')
  async signin(
    @Body(ValidationPipe) userData: SigninUserDto,
    @Res() res: Response,
  ): Promise<void> {
    console.log('백엔드userData:', userData);
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
}
