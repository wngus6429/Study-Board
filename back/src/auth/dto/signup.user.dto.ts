import { IsNotEmpty, Matches, MaxLength, MinLength } from 'class-validator';
import { Entity } from 'typeorm';

@Entity()
export class SignupUserDto {
  @IsNotEmpty()
  @MinLength(4)
  @MaxLength(20)
  @Matches(/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/, {
    message: '이메일 형식이 아님, Email Address Damn ass',
  })
  user_email: string;

  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(15)
  nickname: string;

  @IsNotEmpty()
  @MinLength(4)
  @MaxLength(20)
  @Matches(/^[A-Za-z0-9]*$/, {
    message: '영숫자, Password can only contain letters and numbers',
  })
  password: string;
}
