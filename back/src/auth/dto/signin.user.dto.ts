import { IsNotEmpty, Matches, MaxLength, MinLength } from 'class-validator';
import { Entity } from 'typeorm';

// 로그인 데이터 체크
@Entity()
export class SigninUserDto {
  @IsNotEmpty()
  @MinLength(4)
  @MaxLength(30)
  @Matches(/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/, {
    message: '이메일 형식으로 입력해주세요.',
  })
  user_email: string;

  @IsNotEmpty()
  @MinLength(4)
  @MaxLength(20)
  @Matches(/^[A-Za-z0-9!@#$%^&*]*$/, {
    message: '사용 할수 없는 비밀번호 형식입니다.',
  })
  password: string;
}
