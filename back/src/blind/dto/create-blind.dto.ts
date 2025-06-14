import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateBlindDto {
  @ApiProperty({
    description: '블라인드할 대상 사용자 닉네임',
    example: 'testuser',
  })
  @IsNotEmpty()
  @IsString()
  targetUserNickname: string;
}
