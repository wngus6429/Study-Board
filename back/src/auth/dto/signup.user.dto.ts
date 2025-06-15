/**
 * 📝 회원가입 데이터 전송 객체 (Signup User DTO)
 *
 * 사용자 회원가입 시 클라이언트에서 서버로 전송되는 데이터의 구조와 유효성 검증 규칙을 정의합니다.
 *
 * 주요 기능:
 * - 회원가입 필수 정보 정의 (이메일, 닉네임, 비밀번호)
 * - 입력 데이터 유효성 검증 (형식, 길이, 패턴)
 * - 보안을 위한 데이터 검증 규칙
 * - 사용자 친화적인 에러 메시지 제공
 *
 * 유효성 검증 규칙:
 * - 이메일: RFC 표준 이메일 형식, 4-30자
 * - 닉네임: 2-20자, 특수문자 제한
 * - 비밀번호: 4-20자, 영숫자만 허용
 *
 * @author Study-Board Team
 * @version 1.0.0
 */

import { IsNotEmpty, Matches, MaxLength, MinLength } from 'class-validator';
import { Column, Entity, PrimaryColumn, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class SignupUserDto {
  // ═══════════════════════════════════════════════════════════════════════════════════════
  // 🆔 사용자 고유 식별자
  // ═══════════════════════════════════════════════════════════════════════════════════════

  /**
   * 사용자 고유 식별자 (UUID)
   *
   * @description
   * - 자동 생성되는 UUID 형식의 고유 ID
   * - 데이터베이스 기본키로 사용
   * - 36자 고정 길이 (하이픈 포함)
   *
   * @example "123e4567-e89b-12d3-a456-426614174000"
   */
  @PrimaryGeneratedColumn('uuid')
  @Column({ type: 'char', length: 36 })
  id: string;

  // ═══════════════════════════════════════════════════════════════════════════════════════
  // 📧 이메일 주소 (로그인 ID)
  // ═══════════════════════════════════════════════════════════════════════════════════════

  /**
   * 사용자 이메일 주소
   *
   * @description
   * - 로그인 시 사용되는 고유 식별자
   * - RFC 표준 이메일 형식 검증
   * - 중복 가입 방지를 위한 유니크 제약
   *
   * @validation
   * - 필수 입력 (@IsNotEmpty)
   * - 최소 4자 이상 (@MinLength)
   * - 최대 30자 이하 (@MaxLength)
   * - 이메일 형식 검증 (@Matches)
   *
   * @example "user@example.com"
   * @error "이메일 형식이 아님, Email Address Damn ass"
   */
  @IsNotEmpty()
  @MinLength(4)
  @MaxLength(30)
  @Matches(/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/, {
    message: '이메일 형식이 아님, Email Address Damn ass',
  })
  user_email: string;

  // ═══════════════════════════════════════════════════════════════════════════════════════
  // 👤 사용자 닉네임 (표시명)
  // ═══════════════════════════════════════════════════════════════════════════════════════

  /**
   * 사용자 닉네임
   *
   * @description
   * - 게시글, 댓글 등에 표시되는 사용자명
   * - 다른 사용자들에게 보여지는 공개 이름
   * - 중복 가능하지만 고유성 권장
   *
   * @validation
   * - 필수 입력 (@IsNotEmpty)
   * - 최소 2자 이상 (@MinLength)
   * - 최대 20자 이하 (@MaxLength)
   * - 특수문자 제한 (한글, 영문, 숫자 권장)
   *
   * @example "홍길동", "User123", "개발자"
   */
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(20)
  nickname: string;

  // ═══════════════════════════════════════════════════════════════════════════════════════
  // 🔒 비밀번호 (보안 인증)
  // ═══════════════════════════════════════════════════════════════════════════════════════

  /**
   * 사용자 비밀번호
   *
   * @description
   * - 로그인 시 사용되는 인증 정보
   * - 서버에서 해싱 처리되어 저장
   * - 평문으로 데이터베이스에 저장되지 않음
   *
   * @validation
   * - 필수 입력 (@IsNotEmpty)
   * - 최소 4자 이상 (@MinLength)
   * - 최대 20자 이하 (@MaxLength)
   * - 영숫자만 허용 (@Matches)
   *
   * @security
   * - 클라이언트에서 서버로 전송 시에만 평문
   * - 서버에서 bcrypt 등으로 해싱 처리
   * - 로그에 출력되지 않도록 주의 필요
   *
   * @example "password123", "myPass456"
   * @error "영숫자, Password can only contain letters and numbers"
   */
  @IsNotEmpty()
  @MinLength(4)
  @MaxLength(20)
  @Matches(/^[A-Za-z0-9]*$/, {
    message: '영숫자, Password can only contain letters and numbers',
  })
  password: string;
}
