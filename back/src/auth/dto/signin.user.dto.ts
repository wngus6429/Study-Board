import { IsNotEmpty, Matches, MaxLength, MinLength } from 'class-validator';
import { Entity } from 'typeorm';

// 로그인 데이터 체크
@Entity()
export class SigninUserDto {
  @IsNotEmpty({ message: '이메일을 입력해주세요.' })
  @MinLength(4, { message: '이메일은 최소 4자 이상 입력해야 합니다.' })
  @MaxLength(30, { message: '이메일은 최대 30자까지 입력 가능합니다.' })
  @Matches(/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/, {
    message: '올바른 이메일 형식이 아닙니다.',
  })
  user_email: string;

  @IsNotEmpty({ message: '비밀번호를 입력해주세요.' })
  @MinLength(4, { message: '비밀번호는 최소 4자 이상 입력해야 합니다.' })
  @MaxLength(20, { message: '비밀번호는 최대 20자까지 입력 가능합니다.' })
  @Matches(/^[A-Za-z0-9!@#$%^&*]*$/, {
    message:
      '비밀번호는 영어 대/소문자, 숫자, 특수문자(!@#$%^&*)만 사용할 수 있습니다.',
  })
  password: string;
}
