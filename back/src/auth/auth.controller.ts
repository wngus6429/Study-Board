import {
  Body,
  Controller,
  Delete,
  Get,
  InternalServerErrorException,
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
import { Response, Request } from 'express'; // Express Response 객체를 import
import { SigninUserDto } from './dto/signin.user.dto';
import { AuthGuard } from '@nestjs/passport';
import { JwtService } from '@nestjs/jwt';
import { GetUser } from 'src/common/decorators/get-user.decorator';
import { User } from 'src/entities/User.entity';
import { FileInterceptor } from '@nestjs/platform-express';
import { UserImage } from 'src/entities/UserImage.entity';
import { Story } from 'src/entities/Story.entity';
import { TOKEN_EXPIRATION_TIME } from '../constants/tokenTime';

@Controller('api/auth')
export class AuthController {
  constructor(
    private authUserService: AuthService,
    private jwtService: JwtService, // JwtService를 의존성 주입
  ) {}
  // ㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡ
  // 회원가입 로직 수정
  @Post('signup')
  async signup(
    @Body(ValidationPipe) userData: SignupUserDto,
    @Res() res: Response,
  ): Promise<void> {
    await this.authUserService.signUp(userData);
    res.sendStatus(201);
  }
  // ㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡ
  // 로그인처리
  @Post('signin')
  async signin(
    @Body(ValidationPipe) userData: SigninUserDto,
    @Res() res: Response,
  ): Promise<void> {
    console.log('로그인 데이터', userData);
    const user = await this.authUserService.signIn(userData);
    // JWT 생성 로직
    const accessToken = this.jwtService.sign(
      { id: user.id, user_email: user.user_email },
      { expiresIn: TOKEN_EXPIRATION_TIME }
    );
    
    // 리프레시 토큰 생성
    const refreshToken = this.jwtService.sign(
      { id: user.id },
      { expiresIn: '7d' }
    );

    // 쿠키에 JWT 토큰 설정
    res.cookie('access_token', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    });

    // 리프레시 토큰 쿠키 설정
    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7일
    });

    // 로그인 성공 시 사용자 정보와 함께 응답
    res.status(200).json({ accessToken });
  }
  // ㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡ
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
  // ㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡ
  @Post('logout')
  async logout(@Req() req: Request, @Res() res: Response) {
    console.log('로그아웃 요청');
    res.clearCookie('access_token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    });
    res.clearCookie('refresh_token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    });
    res.sendStatus(200);
  }
  // ㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡ
  // 로그인 한 내 자신 프로필 정보 가져오기
  @Get('/:id')
  @UseGuards(AuthGuard())
  async userGet(
    @Param('id') id: string,
  ): Promise<{ image: UserImage; nickname: string }> {
    console.log('프로필 정보 아이디', id);
    return await this.authUserService.userGet(id);
  }
  // ㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡ
  @Post('/userStoryTableData')
  @UseGuards(AuthGuard())
  async getUserPageStory(
    @Body('offset') offset = 0,
    @Body('limit') limit = 10,
    @Body('userId') userId: string,
  ): Promise<{ StoryResults: Partial<Story>[]; StoryTotal: number }> {
    console.log('요청 데이터:', { offset, limit, userId });
    return await this.authUserService.userFindStory(offset, limit, userId);
  }
  // ㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡ
  @Post('/userCommentsTableData')
  @UseGuards(AuthGuard())
  async getUserPageComments(
    @Body('offset') offset = 0,
    @Body('limit') limit = 10,
    @Body('userId') userId: string,
  ): Promise<{ CommentsResults: Partial<any>[]; CommentsTotal: number }> {
    console.log('요청 데이터:', { offset, limit, userId });
    return await this.authUserService.userFindComments(offset, limit, userId);
  }
  // ㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡ
  // 다른 유저 프로필 정보, 작성 글, 댓글까지 가져오기
  @Get('/profile/:username')
  async anotherUserGet(@Param('username') username: string): Promise<any> {
    console.log('다른 유저 정보 닉네임', username);
    return await this.authUserService.anotherUserGet(username);
  }
  // ㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡ
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
  // ㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡ
  // 내 프로필 사진 삭제
  @Delete('delete')
  @UseGuards(AuthGuard())
  async deleteProfilePicture(@Body() userData: any): Promise<void> {
    console.log('프로필 이미지 삭제 요청', userData);
    // throw new InternalServerErrorException('의도한 실패');
    await this.authUserService.deleteProfilePicture(userData.id);
  }
  // ㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡ
  // 내 비밀번호 변경
  @Post('password')
  @UseGuards(AuthGuard())
  async changePassword(@Body() userData: any): Promise<void> {
    console.log('비밀번호 변경 요청', userData);
    await this.authUserService.changePassword(userData);
  }
  // ㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡ
  // 비밀번호 변경전 확인
  @Post('verifyPassword')
  @UseGuards(AuthGuard())
  async verifyUser(
    @Body(ValidationPipe) userData: { id: string; currentPassword: string },
  ): Promise<boolean> {
    console.log('로그인 데이터', userData);
    return await this.authUserService.verifyUser(userData);
  }
  // 리프레시 토큰을 사용하여 새로운 액세스 토큰을 발급받는 엔드포인트
  @Post('refresh')
  async refreshToken(@Req() req: Request, @Res() res: Response) {
    console.log('리프레시 토큰 요청 시작');
    
    // 쿠키에서 리프레시 토큰 추출
    const refreshToken = req.cookies?.refresh_token;
    if (!refreshToken) {
      console.log('리프레시 토큰이 없음');
      return res.status(401).json({ message: '리프레시 토큰이 없습니다.' });
    }

    try {
      console.log('리프레시 토큰 검증 시작');
      // 리프레시 토큰 검증 및 payload 추출
      const payload = this.jwtService.verify(refreshToken, { secret: 'park' });
      console.log('리프레시 토큰 payload:', payload);
      
      // payload에서 추출한 id로 사용자 조회
      const user = await this.authUserService.findUserById(payload.id);
      
      if (!user) {
        console.log('사용자를 찾을 수 없음');
        return res.status(401).json({ message: '사용자를 찾을 수 없습니다.' });
      }

      console.log('새로운 액세스 토큰 발급');
      // 새로운 액세스 토큰 생성 (id와 user_email 포함)
      const accessToken = this.jwtService.sign(
        { id: user.id, user_email: user.user_email },
        { expiresIn: TOKEN_EXPIRATION_TIME }
      );

      // 새로운 리프레시 토큰 생성 (id만 포함)
      const newRefreshToken = this.jwtService.sign(
        { id: user.id },
        { expiresIn: '7d' }
      );

      // 새로운 액세스 토큰을 쿠키에 설정
      res.cookie('access_token', accessToken, {
        httpOnly: true, // JavaScript에서 접근 불가
        secure: process.env.NODE_ENV === 'production', // HTTPS에서만 전송
        sameSite: 'strict', // CSRF 방지
      });

      // 새로운 리프레시 토큰을 쿠키에 설정 (7일 유효)
      res.cookie('refresh_token', newRefreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7일
      });

      console.log('토큰 갱신 완료');
      return res.status(200).json({ message: '토큰이 갱신되었습니다.' });
    } catch (error) {
      // 리프레시 토큰 검증 실패 (만료되었거나 유효하지 않은 경우)
      console.log('리프레시 토큰 검증 실패:', error);
      return res.status(401).json({ message: '유효하지 않은 리프레시 토큰입니다.' });
    }
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


