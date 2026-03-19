/**
 * 🔐 JWT 인증 전략 (JWT Authentication Strategy)
 *
 * Passport.js와 연동하여 JWT 토큰 기반 인증을 처리하는 전략 클래스입니다.
 *
 * 주요 기능:
 * - HttpOnly 쿠키에서 JWT 토큰 추출
 * - JWT 토큰 유효성 검증
 * - 토큰 payload를 통한 사용자 인증
 * - 인증된 사용자 정보를 Request 객체에 주입
 *
 * 보안 특징:
 * - 쿠키 기반 토큰 추출 (XSS 공격 방지)
 * - 데이터베이스 사용자 검증 (토큰 탈취 시 추가 보안)
 * - 이메일 또는 ID 기반 사용자 조회 지원
 *
 * @author Study-Board Team
 * @version 1.0.0
 */

// auth/jwt.strategy.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/User.entity';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    @InjectRepository(User) private userRepository: Repository<User>,
  ) {
    super({
      // ═══════════════════════════════════════════════════════════════════════════════════════
      // 🍪 쿠키에서 JWT 토큰 추출 설정
      // ═══════════════════════════════════════════════════════════════════════════════════════

      /**
       * JWT 토큰 추출 방식 설정
       *
       * @description
       * - HttpOnly 쿠키에서 'access_token' 추출
       * - XSS 공격 방지를 위해 쿠키 사용
       * - Authorization 헤더 대신 쿠키 우선 사용
       * - 토큰이 없으면 null 반환하여 인증 실패 처리
       */
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: Request) => {
          const token = req.cookies?.access_token;
          if (!token) {
            console.log('🍪 쿠키에서 JWT 토큰을 찾을 수 없음');
            return null;
          }
          // console.log('🍪 쿠키에서 JWT 토큰 추출 성공');
          return token;
        },
      ]),
      secretOrKey: process.env.JWT_SECRET, // JWT 시크릿 키를 환경변수로 통일
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════════════════
  // 🔍 JWT 토큰 검증 및 사용자 인증
  // ═══════════════════════════════════════════════════════════════════════════════════════

  /**
   * JWT 토큰이 유효한 경우 payload를 이용해 사용자 정보를 검증합니다.
   *
   * @description
   * - JWT 토큰의 payload에서 사용자 정보 추출
   * - 데이터베이스에서 실제 사용자 존재 여부 확인
   * - 이메일 또는 ID 기반 사용자 조회 지원
   * - 인증 성공 시 사용자 객체를 Request에 주입
   *
   * @param payload - JWT 토큰에서 추출된 사용자 정보
   * @param payload.id - 사용자 고유 ID (UUID)
   * @param payload.user_email - 사용자 이메일 주소
   * @returns 인증된 사용자 객체 (User 엔티티)
   * @throws UnauthorizedException - 사용자를 찾을 수 없거나 토큰이 유효하지 않은 경우
   *
   * @example
   * // JWT payload 예시:
   * {
   *   "id": "123e4567-e89b-12d3-a456-426614174000",
   *   "user_email": "user@example.com",
   *   "iat": 1640995200,
   *   "exp": 1640998800
   * }
   */
  async validate(payload: any) {
    console.log('🔍 JWT payload 검증 시작:', {
      id: payload.id,
      email: payload.user_email,
      iat: payload.iat,
      exp: payload.exp,
    });

    let user: User | null = null;

    // 이메일 기반 사용자 조회 (우선순위 1)
    if (payload.user_email) {
      console.log('📧 이메일로 사용자 조회:', payload.user_email);
      user = await this.userRepository.findOne({
        where: { user_email: payload.user_email },
      });
    }
    // ID 기반 사용자 조회 (우선순위 2)
    else if (payload.id) {
      console.log('🆔 ID로 사용자 조회:', payload.id);
      user = await this.userRepository.findOne({
        where: { id: payload.id },
      });
    }

    // 사용자를 찾을 수 없는 경우 인증 실패
    if (!user) {
      console.log('❌ 사용자 인증 실패 - 사용자를 찾을 수 없음');
      throw new UnauthorizedException('로그인 만료, 다시 로그인해주세요.');
    }

    console.log('✅ 사용자 인증 성공:', {
      id: user.id,
      email: user.user_email,
      nickname: user.nickname,
    });

    // 인증 성공: 사용자 객체가 Request.user에 자동으로 주입됨
    return user;
  }
}
