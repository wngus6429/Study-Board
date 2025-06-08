import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateMessageDto {
  @ApiProperty({ description: '받는 사람 닉네임' })
  @IsNotEmpty({ message: '받는 사람 닉네임을 입력해주세요.' })
  @IsString()
  receiverNickname: string;

  @ApiProperty({ description: '쪽지 제목' })
  @IsNotEmpty({ message: '제목을 입력해주세요.' })
  @IsString()
  @MaxLength(255, { message: '제목은 최대 255자까지 입력 가능합니다.' })
  title: string;

  @ApiProperty({ description: '쪽지 내용' })
  @IsNotEmpty({ message: '내용을 입력해주세요.' })
  @IsString()
  content: string;
}
