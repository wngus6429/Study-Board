/**
 * 🔐 인증 모듈 (Authentication Module)
 *
 * 사용자 인증과 관련된 모든 기능을 통합 관리하는 NestJS 모듈입니다.
 *
 * 주요 구성 요소:
 * - JWT 토큰 기반 인증 시스템
 * - Passport.js 통합 (JWT 전략)
 * - 파일 업로드 처리 (Multer)
 * - 데이터베이스 엔티티 연동 (TypeORM)
 * - 사용자 관리 서비스 및 컨트롤러
 *
 * 보안 설정:
 * - JWT 토큰 만료 시간 설정
 * - 파일 업로드 보안 처리
 * - 한글 파일명 UTF-8 변환
 * - 고유한 파일명 생성 (타임스탬프 추가)
 *
 * @author Study-Board Team
 * @version 1.0.0
 */

import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../entities/User.entity';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from './jwt.strategy';
import { UserImage } from 'src/entities/UserImage.entity';
import { MulterModule } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import * as path from 'path';
import { Today } from 'src/common/helper/today';
import { TOKEN_EXPIRATION_TIME } from 'src/constants/tokenTime';
import { Story } from 'src/entities/Story.entity';
import { Comments } from 'src/entities/Comments.entity';

@Module({
  imports: [
    // ═══════════════════════════════════════════════════════════════════════════════════════
    // 🛡️ Passport.js 인증 모듈 설정
    // ═══════════════════════════════════════════════════════════════════════════════════════

    /**
     * Passport.js 모듈 등록
     *
     * @description
     * - 기본 인증 전략을 JWT로 설정
     * - AuthGuard()에서 자동으로 JWT 전략 사용
     * - 다양한 인증 전략 확장 가능
     */
    PassportModule.register({ defaultStrategy: 'jwt' }),

    // ═══════════════════════════════════════════════════════════════════════════════════════
    // 🔑 JWT 토큰 모듈 설정
    // ═══════════════════════════════════════════════════════════════════════════════════════

    /**
     * JWT 모듈 설정
     *
     * @description
     * - JWT 서명을 위한 시크릿 키 설정 (보안상 환경변수 사용 권장)
     * - 토큰 만료 시간 설정 (상수로 관리)
     * - 토큰 생성 및 검증 기능 제공
     *
     * @security
     * - 프로덕션 환경에서는 복잡한 시크릿 키 사용 필요
     * - 시크릿 키는 환경변수로 관리하는 것이 보안상 안전
     */
    JwtModule.register({
      secret: 'park', // TODO: 환경변수로 변경 권장 (process.env.JWT_SECRET)
      signOptions: { expiresIn: TOKEN_EXPIRATION_TIME }, // 토큰 만료 시간 (1시간)
    }),

    // ═══════════════════════════════════════════════════════════════════════════════════════
    // 🗄️ 데이터베이스 엔티티 연동
    // ═══════════════════════════════════════════════════════════════════════════════════════

    /**
     * TypeORM 엔티티 등록
     *
     * @description
     * - User: 사용자 기본 정보 (이메일, 닉네임, 비밀번호 등)
     * - UserImage: 사용자 프로필 이미지 정보
     * - Story: 사용자가 작성한 글 정보
     * - Comments: 사용자가 작성한 댓글 정보
     *
     * @relations
     * - User ↔ UserImage: 1:1 관계 (프로필 이미지)
     * - User ↔ Story: 1:N 관계 (작성한 글)
     * - User ↔ Comments: 1:N 관계 (작성한 댓글)
     */
    TypeOrmModule.forFeature([User, UserImage, Story, Comments]),

    // ═══════════════════════════════════════════════════════════════════════════════════════
    // 📁 파일 업로드 모듈 설정 (Multer)
    // ═══════════════════════════════════════════════════════════════════════════════════════

    /**
     * Multer 파일 업로드 설정
     *
     * @description
     * - 프로필 이미지 업로드 처리
     * - 디스크 저장소 사용 (./userUpload 디렉토리)
     * - 한글 파일명 UTF-8 변환 지원
     * - 고유한 파일명 생성 (타임스탬프 추가)
     *
     * @security
     * - 파일 확장자 검증 필요 (이미지 파일만 허용)
     * - 파일 크기 제한 설정 권장
     * - 업로드 디렉토리 권한 설정 필요
     *
     * @example
     * // 업로드된 파일명 예시:
     * // 원본: "프로필사진.jpg"
     * // 저장: "프로필사진_20231201_143022.jpg"
     */
    MulterModule.register({
      storage: diskStorage({
        destination: './userUpload', // 파일 저장 경로
        filename(req, file, done) {
          const ext = path.extname(file.originalname); // 파일 확장자 추출

          // 한글 파일명을 UTF-8로 올바르게 변환
          const baseName = Buffer.from(
            path.basename(file.originalname, ext),
            'latin1',
          ).toString('utf8');

          // 고유한 파일명 생성: 원본명_타임스탬프.확장자
          const uniqueFileName = `${baseName}_${Today()}${ext}`;

          console.log('📁 파일 업로드:', {
            original: file.originalname,
            saved: uniqueFileName,
            size: file.size,
          });

          done(null, uniqueFileName);
        },
      }),
      // TODO: 추가 보안 설정 권장
      // limits: {
      //   fileSize: 5 * 1024 * 1024, // 5MB 제한
      // },
      // fileFilter: (req, file, cb) => {
      //   // 이미지 파일만 허용
      //   if (file.mimetype.startsWith('image/')) {
      //     cb(null, true);
      //   } else {
      //     cb(new Error('이미지 파일만 업로드 가능합니다.'), false);
      //   }
      // },
    }),
  ],

  // ═══════════════════════════════════════════════════════════════════════════════════════
  // 🎮 컨트롤러 등록
  // ═══════════════════════════════════════════════════════════════════════════════════════

  /**
   * 인증 관련 HTTP 엔드포인트를 처리하는 컨트롤러
   *
   * @routes
   * - POST /api/auth/signup: 회원가입
   * - POST /api/auth/signin: 로그인
   * - POST /api/auth/logout: 로그아웃
   * - GET /api/auth/:id: 프로필 조회
   * - POST /api/auth/update: 프로필 업데이트
   * - DELETE /api/auth/delete: 프로필 이미지 삭제
   * - POST /api/auth/password: 비밀번호 변경
   * - POST /api/auth/refresh: 토큰 갱신
   */
  controllers: [AuthController],

  // ═══════════════════════════════════════════════════════════════════════════════════════
  // 🔧 서비스 및 전략 등록
  // ═══════════════════════════════════════════════════════════════════════════════════════

  /**
   * 의존성 주입을 위한 프로바이더 등록
   *
   * @providers
   * - AuthService: 인증 비즈니스 로직 처리
   * - JwtStrategy: JWT 토큰 검증 전략
   */
  providers: [AuthService, JwtStrategy],

  // ═══════════════════════════════════════════════════════════════════════════════════════
  // 📤 모듈 내보내기
  // ═══════════════════════════════════════════════════════════════════════════════════════

  /**
   * 다른 모듈에서 사용할 수 있도록 내보내는 요소들
   *
   * @exports
   * - JwtStrategy: 다른 모듈에서 JWT 인증 가드 사용 시 필요
   * - PassportModule: 다른 모듈에서 Passport 기능 사용 시 필요
   *
   * @usage
   * // 다른 모듈에서 JWT 인증이 필요한 경우:
   * // @UseGuards(AuthGuard()) 데코레이터 사용 가능
   */
  exports: [JwtStrategy, PassportModule],
})
export class AuthModule {}
