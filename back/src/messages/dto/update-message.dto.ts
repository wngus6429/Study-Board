import { IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateMessageDto {
  @ApiProperty({ description: '쪽지 제목', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(255, { message: '제목은 최대 255자까지 입력 가능합니다.' })
  title?: string;

  @ApiProperty({ description: '쪽지 내용', required: false })
  @IsOptional()
  @IsString()
  content?: string;
}
