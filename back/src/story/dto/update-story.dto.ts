import {
  IsArray,
  IsOptional,
  IsString,
  IsNotEmpty,
  IsNumber,
} from 'class-validator';

export class UpdateStoryDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  content: string;

  @IsString()
  @IsOptional()
  category?: string;

  @IsArray()
  @IsOptional()
  @IsNumber({}, { each: true }) // 배열 내 요소가 숫자인지 검증
  existingImages?: number[]; // 유지할 기존 이미지 ID 배열

  @IsArray()
  @IsOptional()
  @IsNumber({}, { each: true }) // 배열 내 요소가 숫자인지 검증
  deletedImages?: number[]; // 삭제할 이미지 ID 배열
}
