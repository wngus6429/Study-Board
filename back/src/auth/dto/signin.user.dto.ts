import { IsNotEmpty, Matches, MaxLength, MinLength } from 'class-validator';
import { Entity } from 'typeorm';

// 로그인 데이터 체크
@Entity()
export class SigninUserDto {
  @IsNotEmpty()
  @MinLength(4)
  @MaxLength(30)
  @Matches(/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/, {
    message: '이메일 형식이 아님, Email Address Damn ass',
  })
  user_email: string;

  @IsNotEmpty()
  @MinLength(4)
  @MaxLength(20)
  @Matches(/^[A-Za-z0-9]*$/, {
    message: '영숫자, Password can only contain letters and numbers',
  })
  password: string;
}
