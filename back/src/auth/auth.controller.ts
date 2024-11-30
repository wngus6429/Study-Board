import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Req,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  ValidationPipe,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignupUserDto } from './dto/signup.user.dto';
import { Response } from 'express'; // Express Response 객체를 import
import { SigninUserDto } from './dto/signin.user.dto';
import { AuthGuard } from '@nestjs/passport';
import { JwtService } from '@nestjs/jwt';
import { GetUser } from 'src/common/decorators/get-user.decorator';
import { User } from 'src/entities/User.entity';
import { FileInterceptor } from '@nestjs/platform-express';
import { UserImage } from 'src/entities/UserImage.entity';

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
    await this.authUserService.signUp(userData);
    res.sendStatus(201);
  }

  // 로그인처리
  @Post('signin')
  async signin(
    @Body(ValidationPipe) userData: SigninUserDto,
    @Res() res: Response,
  ): Promise<void> {
    console.log('로그인 데이터', userData);
    const user = await this.authUserService.signIn(userData);
    // JWT 생성 로직
    const accessToken = this.jwtService.sign(user);
    // 쿠키에 JWT 토큰 설정
    res.cookie('access_token', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // 프로덕션 환경에서는 true
      sameSite: 'strict',
    });
    // 로그인 성공 시 사용자 정보와 함께 응답
    res.status(200).json({ accessToken });
  }

  @Post('signinSession')
  async signinSession(
    @Body(ValidationPipe) userData: SigninUserDto,
    @Res() res: Response,
  ): Promise<void> {
    const user = await this.authUserService.signIn(userData);
    res.status(200).json(user);
    //! 아래는 일부러 에러 내는 코드
    // return res
    //   .status(401)
    //   .json({ message: '아이디 또는 비밀번호가 올바르지 않습니다.' });
  }

  @Post('logout')
  @UseGuards(AuthGuard())
  async logout(@Req() req: Request, @Res() res: Response) {
    console.log('로그아웃 요청');
    res.clearCookie('access_token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    });
    res.sendStatus(200);
  }

  // 유저 프로필 정보 가져오기
  @Get('/:id')
  @UseGuards(AuthGuard())
  async userGet(
    @Param('id') id: string,
  ): Promise<{ image: UserImage; nickname: string }> {
    console.log('프로필 정보 아이디', id);
    return await this.authUserService.userGet(id);
  }

  // 프로필 업데이트
  @Post('update')
  @UseGuards(AuthGuard())
  @UseInterceptors(FileInterceptor('profileImage')) // 'profileImage'는 프론트엔드의 FormData 필드 이름
  async userUpdate(
    @Body() userData: any,
    @UploadedFile() profileImage: Express.Multer.File,
  ): Promise<any> {
    console.log('업데이트 데이터:', userData, '업로드된 파일:', profileImage);
    await this.authUserService.userUpdate(userData, profileImage);
    // Post가 성공적으로 완료되면 201 상태코드를 반환
  }

  @Delete('delete')
  @UseGuards(AuthGuard())
  async deleteProfilePicture(@Body() userData: any): Promise<void> {
    console.log('프로필 이미지 삭제 요청', userData);
    await this.authUserService.deleteProfilePicture(userData.id);
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
