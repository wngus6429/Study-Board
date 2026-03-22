import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateBoardDto {
  @ApiProperty({ description: '수정할 제목', example: '수정된 클린 아키텍처 제목' })
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiProperty({ description: '수정할 내용', example: '내용이 수정되었습니다.' })
  @IsNotEmpty()
  @IsString()
  content: string;
}
