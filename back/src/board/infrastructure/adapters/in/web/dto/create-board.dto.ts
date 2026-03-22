import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateBoardDto {
  @ApiProperty({ description: '게시글 제목', example: '클린 아키텍처 예제 글' })
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiProperty({ description: '게시글 내용', example: '이 글은 클린 아키텍처로 작성되었습니다.' })
  @IsNotEmpty()
  @IsString()
  content: string;

  @ApiProperty({ description: '카테고리', example: 'QnA' })
  @IsNotEmpty()
  @IsString()
  category: string;
}
