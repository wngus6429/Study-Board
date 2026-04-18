import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, MinLength } from 'class-validator';

/**
 * 📧 비밀번호 찾기 요청 DTO (이메일 확인)
 *
 * @description
 * 사용자가 비밀번호를 잊었을 때 이메일 주소로 계정 확인을 요청하는 DTO입니다.
 *
 * @author Study-Board Team
 * @version 2.0.0
 */
export class ForgotPasswordDto {
  /**
   * 사용자 이메일 주소
   *
   * @description
   * - 비밀번호를 재설정하고자 하는 사용자의 이메일 주소
   * - 시스템에 등록된 이메일이어야 함
   *
   * @example "user@example.com"
   */
  @ApiProperty({
    description: '비밀번호를 재설정할 사용자의 이메일 주소',
    example: 'user@example.com',
    type: 'string',
    format: 'email',
  })
  @IsEmail({}, { message: '올바른 이메일 형식이 아닙니다.' })
  @IsNotEmpty({ message: '이메일을 입력해주세요.' })
  user_email: string;
}

/**
 * 🔄 비밀번호 재설정 요청 DTO
 *
 * @description
 * 이메일 확인 후 새로운 비밀번호를 설정하는 DTO입니다.
 */
export class ResetPasswordDto {
  /**
   * 사용자 이메일 주소
   */
  @ApiProperty({
    description: '비밀번호를 재설정할 사용자의 이메일 주소',
    example: 'user@example.com',
  })
  @IsEmail({}, { message: '올바른 이메일 형식이 아닙니다.' })
  @IsNotEmpty({ message: '이메일을 입력해주세요.' })
  user_email: string;

  /**
   * 비밀번호 재설정 토큰 (forgot-password 단계에서 발급된 일회용 토큰)
   */
  @ApiProperty({
    description:
      'forgot-password 단계에서 발급받은 일회용 토큰 (이메일로 전달되어야 함)',
    example: 'a1b2c3d4e5f6...',
  })
  @IsNotEmpty({ message: '재설정 토큰이 필요합니다.' })
  reset_token: string;

  /**
   * 새로운 비밀번호
   */
  @ApiProperty({
    description: '새로 설정할 비밀번호',
    example: 'newPassword123!',
    minLength: 6,
  })
  @IsNotEmpty({ message: '새 비밀번호를 입력해주세요.' })
  @MinLength(6, { message: '비밀번호는 최소 6자 이상이어야 합니다.' })
  new_password: string;
}

/**
 * 📧 비밀번호 찾기/재설정 응답 DTO
 *
 * @description
 * 비밀번호 찾기 및 재설정 요청에 대한 응답 DTO입니다.
 */
export class ForgotPasswordResponseDto {
  /**
   * 응답 메시지
   */
  @ApiProperty({
    description: '처리 결과 메시지',
    example: '이메일을 확인했습니다. 새로운 비밀번호를 설정해주세요.',
  })
  message: string;

  /**
   * 요청 처리 성공 여부
   */
  @ApiProperty({
    description: '요청 처리 성공 여부',
    example: true,
  })
  success: boolean;

  /**
   * 이메일 존재 여부 (선택적)
   */
  @ApiProperty({
    description: '이메일 존재 여부',
    example: true,
    required: false,
  })
  emailExists?: boolean;

  /**
   * 비밀번호 재설정 토큰 (개발 환경에서만 응답에 포함)
   *
   * ⚠️ 운영 환경에서는 이 필드를 응답으로 내려서는 안 되며,
   * 반드시 이메일로 전달되어야 합니다.
   */
  @ApiProperty({
    description:
      '재설정 토큰 (개발 환경 전용, 운영에서는 이메일로만 전달되어야 함)',
    example: 'a1b2c3d4e5f6...',
    required: false,
  })
  resetToken?: string;
}
