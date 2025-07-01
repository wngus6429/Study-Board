import {
  IsEnum,
  IsOptional,
  IsString,
  IsNotEmpty,
  MaxLength,
} from 'class-validator';
import { ReportReason } from '../../entities/Report.entity';

export class CreateReportDto {
  @IsEnum(ReportReason, {
    message: '올바른 신고 사유를 선택해주세요.',
  })
  @IsNotEmpty({
    message: '신고 사유는 필수입니다.',
  })
  reason: ReportReason;

  @IsOptional()
  @IsString({
    message: '기타 사유는 문자열이어야 합니다.',
  })
  @MaxLength(1000, {
    message: '기타 사유는 1000자를 초과할 수 없습니다.',
  })
  custom_reason?: string;
}
