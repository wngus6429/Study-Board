/**
 * 🔐 인증 컨트롤러 (Authentication Controller)
 *
 * 사용자 인증과 관련된 모든 HTTP 엔드포인트를 관리합니다.
 *
 * 주요 기능:
 * - 회원가입/로그인/로그아웃 처리
 * - JWT 토큰 기반 인증 시스템
 * - 사용자 프로필 관리 (조회, 수정, 삭제)
 * - 프로필 이미지 업로드 및 관리
 * - 비밀번호 변경 및 검증
 * - 사용자 작성 글/댓글 조회
 * - 리프레시 토큰을 통한 토큰 갱신
 *
 * 보안 특징:
 * - HttpOnly 쿠키를 통한 토큰 저장
 * - CSRF 보호를 위한 SameSite 설정
 * - 프로덕션 환경에서 Secure 쿠키 사용
 * - JWT 가드를 통한 인증된 사용자만 접근 가능한 엔드포인트
 *
 * @author Study-Board Team
 * @version 1.0.0
 */
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
import { Response, Request } from 'express'; // Express Response 객체를 import
import { SigninUserDto } from './dto/signin.user.dto';
import { AuthGuard } from '@nestjs/passport';
import { JwtService } from '@nestjs/jwt';
import { FileInterceptor } from '@nestjs/platform-express';
import { UserImage } from 'src/entities/UserImage.entity';
import { Story } from 'src/entities/Story.entity';
import { TOKEN_EXPIRATION_TIME } from '../constants/tokenTime';

@Controller('api/auth')
export class AuthController {
  constructor(
    private authUserService: AuthService,
    private jwtService: JwtService, // JWT 토큰 생성 및 검증을 위한 서비스
  ) {}

  // ═══════════════════════════════════════════════════════════════════════════════════════
  // 🔐 회원가입 엔드포인트
  // ═══════════════════════════════════════════════════════════════════════════════════════

  /**
   * 닉네임 중복 확인을 처리합니다.
   *
   * @description
   * - 입력받은 닉네임이 이미 사용 중인지 확인
   * - 실시간 중복 확인 기능 지원
   * - 회원가입 전 사전 검증
   *
   * @param nickname - 확인할 닉네임
   * @returns 중복 여부와 메시지
   *
   * @example
   * GET /api/auth/check-nickname/사용자닉네임
   * Response: { "isAvailable": true, "message": "사용 가능한 닉네임입니다." }
   */
  @Get('check-nickname/:nickname')
  async checkNickname(
    @Param('nickname') nickname: string,
  ): Promise<{ isAvailable: boolean; message: string }> {
    return await this.authUserService.checkNicknameAvailability(nickname);
  }

  /**
   * 새로운 사용자 회원가입을 처리합니다.
   *
   * @description
   * - 이메일, 닉네임, 비밀번호 유효성 검증
   * - 중복 이메일/닉네임 체크
   * - 비밀번호 해싱 처리
   * - 기본 프로필 이미지 설정
   *
   * @param userData - 회원가입 정보 (이메일, 닉네임, 비밀번호)
   * @param res - HTTP 응답 객체
   * @returns 201 상태코드 (성공) 또는 에러 응답
   *
   * @example
   * POST /api/auth/signup
   * {
   *   "user_email": "user@example.com",
   *   "nickname": "사용자닉네임",
   *   "password": "password123"
   * }
   */
  @Post('signup')
  async signup(
    @Body(ValidationPipe) userData: SignupUserDto,
    @Res() res: Response,
  ): Promise<void> {
    await this.authUserService.signUp(userData);
    res.sendStatus(201);
  }

  // ═══════════════════════════════════════════════════════════════════════════════════════
  // 🔑 로그인 엔드포인트 (JWT 토큰 발급)
  // ═══════════════════════════════════════════════════════════════════════════════════════

  /**
   * 사용자 로그인을 처리하고 JWT 토큰을 발급합니다.
   *
   * @description
   * - 이메일/비밀번호 검증
   * - Access Token (1시간) 및 Refresh Token (7일) 생성
   * - HttpOnly 쿠키에 토큰 저장 (보안 강화)
   * - CSRF 보호를 위한 SameSite 설정
   *
   * @param userData - 로그인 정보 (이메일, 비밀번호)
   * @param res - HTTP 응답 객체
   * @returns 사용자 정보와 액세스 토큰
   *
   * @example
   * POST /api/auth/signin
   * {
   *   "user_email": "user@example.com",
   *   "password": "password123"
   * }
   */
  @Post('signin')
  async signin(
    @Body(ValidationPipe) userData: SigninUserDto,
    @Res() res: Response,
  ): Promise<void> {
    console.log('🔑 로그인 요청:', userData.user_email);
    const user = await this.authUserService.signIn(userData);

    // JWT Access Token 생성 (1시간 유효)
    const accessToken = this.jwtService.sign(
      { id: user.id, user_email: user.user_email },
      { expiresIn: TOKEN_EXPIRATION_TIME, secret: process.env.SECRET_KEY },
    );

    // Refresh Token 생성 (7일 유효)
    const refreshToken = this.jwtService.sign(
      { id: user.id },
      { expiresIn: '7d', secret: process.env.SECRET_KEY },
    );

    // Access Token을 HttpOnly 쿠키에 저장 (XSS 공격 방지)
    res.cookie('access_token', accessToken, {
      httpOnly: true, // JavaScript로 접근 불가
      secure: false, // HTTP 환경에서도 쿠키 전송 허용
      sameSite: 'lax', // SameSite 정책 완화
      // secure: process.env.NODE_ENV === 'production', // HTTPS에서만 전송
      // sameSite: 'strict', // CSRF 공격 방지
    });

    // Refresh Token을 HttpOnly 쿠키에 저장
    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      // secure: process.env.NODE_ENV === 'production',
      // sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7일 (밀리초)
    });

    // 로그인 성공 응답
    res.status(200).json({ accessToken });
  }

  // ═══════════════════════════════════════════════════════════════════════════════════════
  // 🔑 세션 기반 로그인 (테스트용)
  // ═══════════════════════════════════════════════════════════════════════════════════════

  /**
   * 세션 기반 로그인 처리 (개발/테스트 목적)
   *
   * @description
   * JWT 토큰 없이 사용자 정보만 반환하는 로그인 엔드포인트
   * 주로 개발 환경에서 테스트 용도로 사용
   *
   * @param userData - 로그인 정보
   * @param res - HTTP 응답 객체
   * @returns 사용자 정보
   */
  @Post('signinSession')
  async signinSession(
    @Body(ValidationPipe) userData: SigninUserDto,
    @Res() res: Response,
  ): Promise<void> {
    const user = await this.authUserService.signIn(userData);
    res.status(200).json(user);
    // 참고: 아래 주석은 에러 테스트용 코드입니다
    // return res
    //   .status(401)
    //   .json({ message: '아이디 또는 비밀번호가 올바르지 않습니다.' });
  }

  // ═══════════════════════════════════════════════════════════════════════════════════════
  // 🚪 로그아웃 엔드포인트
  // ═══════════════════════════════════════════════════════════════════════════════════════

  /**
   * 사용자 로그아웃을 처리합니다.
   *
   * @description
   * - Access Token 및 Refresh Token 쿠키 삭제
   * - 클라이언트에서 토큰 정보 완전 제거
   * - 보안을 위해 서버에서 토큰 무효화
   *
   * @param req - HTTP 요청 객체
   * @param res - HTTP 응답 객체
   * @returns 200 상태코드 (성공)
   */
  @Post('logout')
  async logout(@Req() req: Request, @Res() res: Response) {
    console.log('🚪 로그아웃 요청');

    // Access Token 쿠키 삭제
    res.clearCookie('access_token', {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      // secure: process.env.NODE_ENV === 'production',
      // sameSite: 'strict',
    });

    // Refresh Token 쿠키 삭제
    res.clearCookie('refresh_token', {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      // secure: process.env.NODE_ENV === 'production',
      // sameSite: 'strict',
    });

    res.sendStatus(200);
  }

  // ═══════════════════════════════════════════════════════════════════════════════════════
  // 👤 사용자 프로필 조회
  // ═══════════════════════════════════════════════════════════════════════════════════════

  /**
   * 인증된 사용자의 프로필 정보를 조회합니다.
   *
   * @description
   * - JWT 토큰 검증 필요 (AuthGuard 적용)
   * - 프로필 이미지 및 닉네임 정보 반환
   * - 본인의 프로필 정보만 조회 가능
   *
   * @param id - 사용자 ID
   * @returns 사용자 프로필 정보 (이미지, 닉네임)
   *
   * @example
   * GET /api/auth/123e4567-e89b-12d3-a456-426614174000
   * Authorization: Bearer <JWT_TOKEN>
   */
  @Get('/:id')
  @UseGuards(AuthGuard())
  async userGet(
    @Param('id') id: string,
  ): Promise<{ image: UserImage; nickname: string }> {
    console.log('👤 프로필 정보 조회 요청 - 사용자 ID:', id);
    return await this.authUserService.userGet(id);
  }

  // ═══════════════════════════════════════════════════════════════════════════════════════
  // 📝 사용자 작성 글 조회 (페이지네이션)
  // ═══════════════════════════════════════════════════════════════════════════════════════

  /**
   * 특정 사용자가 작성한 글 목록을 페이지네이션으로 조회합니다.
   *
   * @description
   * - 인증된 사용자만 접근 가능
   * - 페이지네이션 지원 (offset, limit)
   * - 작성일 기준 최신순 정렬
   * - 총 글 개수와 함께 반환
   *
   * @param offset - 시작 위치 (기본값: 0)
   * @param limit - 조회할 개수 (기본값: 10)
   * @param userId - 조회할 사용자 ID
   * @returns 사용자 작성 글 목록과 총 개수
   *
   * @example
   * POST /api/auth/userStoryTableData
   * {
   *   "offset": 0,
   *   "limit": 10,
   *   "userId": "123e4567-e89b-12d3-a456-426614174000"
   * }
   */
  @Post('/userStoryTableData')
  @UseGuards(AuthGuard())
  async getUserPageStory(
    @Body('offset') offset = 0,
    @Body('limit') limit = 10,
    @Body('userId') userId: string,
  ): Promise<{ StoryResults: Partial<Story>[]; StoryTotal: number }> {
    console.log('📝 사용자 작성 글 조회 요청:', { offset, limit, userId });
    return await this.authUserService.userFindStory(offset, limit, userId);
  }

  // ═══════════════════════════════════════════════════════════════════════════════════════
  // 💬 사용자 작성 댓글 조회 (페이지네이션)
  // ═══════════════════════════════════════════════════════════════════════════════════════

  /**
   * 특정 사용자가 작성한 댓글 목록을 페이지네이션으로 조회합니다.
   *
   * @description
   * - 인증된 사용자만 접근 가능
   * - 페이지네이션 지원 (offset, limit)
   * - 작성일 기준 최신순 정렬
   * - 총 댓글 개수와 함께 반환
   *
   * @param offset - 시작 위치 (기본값: 0)
   * @param limit - 조회할 개수 (기본값: 10)
   * @param userId - 조회할 사용자 ID
   * @returns 사용자 작성 댓글 목록과 총 개수
   */
  @Post('/userCommentsTableData')
  @UseGuards(AuthGuard())
  async getUserPageComments(
    @Body('offset') offset = 0,
    @Body('limit') limit = 10,
    @Body('userId') userId: string,
  ): Promise<{ CommentsResults: Partial<any>[]; CommentsTotal: number }> {
    console.log('💬 사용자 작성 댓글 조회 요청:', { offset, limit, userId });
    return await this.authUserService.userFindComments(offset, limit, userId);
  }

  // ═══════════════════════════════════════════════════════════════════════════════════════
  // 👥 다른 사용자 프로필 조회 (공개 정보)
  // ═══════════════════════════════════════════════════════════════════════════════════════

  /**
   * 다른 사용자의 공개 프로필 정보를 조회합니다.
   *
   * @description
   * - 인증 없이 접근 가능한 공개 엔드포인트
   * - 닉네임으로 사용자 검색
   * - 프로필 정보, 작성 글, 댓글 등 공개 정보만 반환
   * - 개인정보는 제외하고 공개 가능한 정보만 제공
   *
   * @param username - 조회할 사용자의 닉네임
   * @returns 사용자 공개 프로필 정보
   *
   * @example
   * GET /api/auth/profile/사용자닉네임
   */
  @Get('/profile/:username')
  async anotherUserGet(@Param('username') username: string): Promise<any> {
    console.log('👥 다른 사용자 프로필 조회 - 닉네임:', username);
    return await this.authUserService.anotherUserGet(username);
  }

  // ═══════════════════════════════════════════════════════════════════════════════════════
  // ✏️ 프로필 업데이트 (이미지 업로드 포함)
  // ═══════════════════════════════════════════════════════════════════════════════════════

  /**
   * 사용자 프로필 정보를 업데이트합니다.
   *
   * @description
   * - 인증된 사용자만 접근 가능
   * - 프로필 이미지 업로드 지원 (Multer 사용)
   * - 닉네임 변경 가능
   * - 이미지 파일 검증 및 저장
   * - 기존 이미지 파일 정리
   *
   * @param userData - 업데이트할 사용자 정보
   * @param profileImage - 업로드할 프로필 이미지 파일
   * @returns 업데이트된 프로필 정보 (이미지 URL, 닉네임)
   *
   * @example
   * POST /api/auth/update
   * Content-Type: multipart/form-data
   * - profileImage: [이미지 파일]
   * - nickname: "새로운닉네임"
   * - id: "123e4567-e89b-12d3-a456-426614174000"
   */
  @Post('update')
  @UseGuards(AuthGuard())
  @UseInterceptors(FileInterceptor('profileImage')) // 'profileImage'는 프론트엔드의 FormData 필드명
  async userUpdate(
    @Body() userData: any,
    @UploadedFile() profileImage: Express.Multer.File,
  ): Promise<any> {
    console.log('✏️ 프로필 업데이트 요청:', {
      userData: userData,
      hasImage: !!profileImage,
      imageSize: profileImage?.size,
    });

    const result = await this.authUserService.userUpdate(
      userData,
      profileImage,
    );

    return {
      image: result.UserImage.link,
      nickname: result.nickname,
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════════════════
  // 🗑️ 프로필 이미지 삭제
  // ═══════════════════════════════════════════════════════════════════════════════════════

  /**
   * 사용자의 프로필 이미지를 삭제합니다.
   *
   * @description
   * - 인증된 사용자만 접근 가능
   * - 현재 프로필 이미지 파일 삭제
   * - 기본 프로필 이미지로 변경
   * - 파일 시스템에서 이미지 파일 제거
   *
   * @param userData - 사용자 정보 (ID 포함)
   * @returns 삭제 완료 응답
   *
   * @example
   * DELETE /api/auth/delete
   * {
   *   "id": "123e4567-e89b-12d3-a456-426614174000"
   * }
   */
  @Delete('delete')
  @UseGuards(AuthGuard())
  async deleteProfilePicture(@Body() userData: any): Promise<void> {
    console.log('🗑️ 프로필 이미지 삭제 요청 - 사용자 ID:', userData.id);
    // 테스트용 에러 발생 코드 (주석 처리됨)
    // throw new InternalServerErrorException('의도한 실패');
    await this.authUserService.deleteProfilePicture(userData.id);
  }

  // ═══════════════════════════════════════════════════════════════════════════════════════
  // 🔒 비밀번호 변경
  // ═══════════════════════════════════════════════════════════════════════════════════════

  /**
   * 사용자의 비밀번호를 변경합니다.
   *
   * @description
   * - 인증된 사용자만 접근 가능
   * - 현재 비밀번호 검증 후 변경
   * - 새 비밀번호 해싱 처리
   * - 보안을 위한 추가 검증 단계
   *
   * @param userData - 비밀번호 변경 정보
   * @returns 변경 완료 응답
   *
   * @example
   * POST /api/auth/password
   * {
   *   "id": "123e4567-e89b-12d3-a456-426614174000",
   *   "currentPassword": "oldPassword123",
   *   "newPassword": "newPassword456"
   * }
   */
  @Post('password')
  @UseGuards(AuthGuard())
  async changePassword(@Body() userData: any): Promise<void> {
    console.log('🔒 비밀번호 변경 요청 - 사용자 ID:', userData.id);
    await this.authUserService.changePassword(userData);
  }

  // ═══════════════════════════════════════════════════════════════════════════════════════
  // 🔍 비밀번호 검증 (변경 전 확인)
  // ═══════════════════════════════════════════════════════════════════════════════════════

  /**
   * 비밀번호 변경 전 현재 비밀번호를 검증합니다.
   *
   * @description
   * - 인증된 사용자만 접근 가능
   * - 현재 비밀번호 정확성 확인
   * - 보안을 위한 사전 검증 단계
   * - 비밀번호 변경 프로세스의 첫 번째 단계
   *
   * @param userData - 사용자 ID와 현재 비밀번호
   * @returns 검증 결과 (true/false)
   *
   * @example
   * POST /api/auth/verifyPassword
   * {
   *   "id": "123e4567-e89b-12d3-a456-426614174000",
   *   "currentPassword": "currentPassword123"
   * }
   */
  @Post('verifyPassword')
  @UseGuards(AuthGuard())
  async verifyUser(
    @Body(ValidationPipe) userData: { id: string; currentPassword: string },
  ): Promise<boolean> {
    console.log('🔍 비밀번호 검증 요청 - 사용자 ID:', userData.id);
    return await this.authUserService.verifyUser(userData);
  }

  // ═══════════════════════════════════════════════════════════════════════════════════════
  // 🔄 토큰 갱신 (Refresh Token)
  // ═══════════════════════════════════════════════════════════════════════════════════════

  /**
   * Refresh Token을 사용하여 새로운 Access Token을 발급받습니다.
   *
   * @description
   * - 만료된 Access Token을 갱신
   * - Refresh Token 유효성 검증
   * - 새로운 Access Token 발급
   * - 보안을 위한 토큰 로테이션
   *
   * @param req - HTTP 요청 객체 (쿠키에서 refresh_token 추출)
   * @param res - HTTP 응답 객체
   * @returns 새로운 Access Token
   *
   * @example
   * POST /api/auth/refresh
   * Cookie: refresh_token=<REFRESH_TOKEN>
   */
  @Post('refresh')
  async refreshToken(@Req() req: Request, @Res() res: Response) {
    console.log('🔄 토큰 갱신 요청 시작');

    // 쿠키에서 리프레시 토큰 추출
    const refreshToken = req.cookies?.refresh_token;
    if (!refreshToken) {
      console.log('🔄 리프레시 토큰이 없음');
      return res.status(401).json({ message: '리프레시 토큰이 없습니다.' });
    }

    try {
      console.log('🔄 리프레시 토큰 검증 시작');
      // 리프레시 토큰 검증 및 payload 추출
      const payload = this.jwtService.verify(refreshToken, { secret: 'park' });
      console.log('🔄 리프레시 토큰 payload:', payload);

      // payload에서 추출한 id로 사용자 조회
      const user = await this.authUserService.findUserById(payload.id);

      if (!user) {
        console.log('🔄 사용자를 찾을 수 없음');
        return res.status(401).json({ message: '사용자를 찾을 수 없습니다.' });
      }

      console.log('🔄 새로운 액세스 토큰 발급');
      // 새로운 액세스 토큰 생성 (id와 user_email 포함)
      const accessToken = this.jwtService.sign(
        { id: user.id, user_email: user.user_email },
        { expiresIn: TOKEN_EXPIRATION_TIME, secret: process.env.SECRET_KEY },
      );

      // 새로운 리프레시 토큰 생성 (id만 포함)
      const newRefreshToken = this.jwtService.sign(
        { id: user.id },
        { expiresIn: '7d', secret: process.env.SECRET_KEY },
      );

      // 새로운 액세스 토큰을 쿠키에 설정
      res.cookie('access_token', accessToken, {
        httpOnly: true, // JavaScript에서 접근 불가
        secure: false,
        sameSite: 'lax',
        // secure: process.env.NODE_ENV === 'production', // HTTPS에서만 전송
        // sameSite: 'strict', // CSRF 방지
      });

      // 새로운 리프레시 토큰을 쿠키에 설정 (7일 유효)
      res.cookie('refresh_token', newRefreshToken, {
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
        // secure: process.env.NODE_ENV === 'production', // HTTPS에서만 전송
        // sameSite: 'strict', // CSRF 방지
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7일
      });

      console.log('🔄 토큰 갱신 완료');
      return res.status(200).json({ message: '토큰이 갱신되었습니다.' });
    } catch (error) {
      // 리프레시 토큰 검증 실패 (만료되었거나 유효하지 않은 경우)
      console.log('🔄 리프레시 토큰 검증 실패:', error);
      return res
        .status(401)
        .json({ message: '유효하지 않은 리프레시 토큰입니다.' });
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════════════════
  // 📋 사용자 프로필 페이지용 - 작성한 글 조회 (페이지네이션)
  // ═══════════════════════════════════════════════════════════════════════════════════════

  /**
   * 사용자 프로필 페이지용 - 작성한 글 조회 (페이지네이션)
   *
   * @description
   * - 인증된 사용자만 접근 가능
   * - 페이지네이션 지원 (offset, limit)
   * - 작성일 기준 최신순 정렬
   * - 총 글 개수와 함께 반환
   *
   * @param offset - 시작 위치 (기본값: 0)
   * @param limit - 조회할 개수 (기본값: 10)
   * @param username - 조회할 사용자의 닉네임
   * @returns 사용자 작성 글 목록과 총 개수
   *
   * @example
   * POST /api/auth/userProfileStoryTableData
   * {
   *   "offset": 0,
   *   "limit": 10,
   *   "username": "사용자닉네임"
   * }
   */
  @Post('/userProfileStoryTableData')
  async getUserProfileStory(
    @Body('offset') offset = 0,
    @Body('limit') limit = 10,
    @Body('username') username: string,
  ): Promise<{ StoryResults: Partial<Story>[]; StoryTotal: number }> {
    console.log('📋 사용자 프로필 스토리 요청 데이터:', {
      offset,
      limit,
      username,
    });
    return await this.authUserService.userProfileFindStory(
      offset,
      limit,
      username,
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════════════════
  // 📝 사용자 프로필 페이지용 - 작성한 댓글 조회 (페이지네이션)
  // ═══════════════════════════════════════════════════════════════════════════════════════

  /**
   * 사용자 프로필 페이지용 - 작성한 댓글 조회 (페이지네이션)
   *
   * @description
   * - 인증된 사용자만 접근 가능
   * - 페이지네이션 지원 (offset, limit)
   * - 작성일 기준 최신순 정렬
   * - 총 댓글 개수와 함께 반환
   *
   * @param offset - 시작 위치 (기본값: 0)
   * @param limit - 조회할 개수 (기본값: 10)
   * @param username - 조회할 사용자의 닉네임
   * @returns 사용자 작성 댓글 목록과 총 개수
   *
   * @example
   * POST /api/auth/userProfileCommentsTableData
   * {
   *   "offset": 0,
   *   "limit": 10,
   *   "username": "사용자닉네임"
   * }
   */
  @Post('/userProfileCommentsTableData')
  async getUserProfileComments(
    @Body('offset') offset = 0,
    @Body('limit') limit = 10,
    @Body('username') username: string,
  ): Promise<{ CommentsResults: Partial<any>[]; CommentsTotal: number }> {
    console.log('📝 사용자 프로필 댓글 요청 데이터:', {
      offset,
      limit,
      username,
    });
    return await this.authUserService.userProfileFindComments(
      offset,
      limit,
      username,
    );
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
