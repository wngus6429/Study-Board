import {
  IsEnum,
  IsOptional,
  IsString,
  IsNotEmpty,
  MaxLength,
} from 'class-validator';
import { ReportStatus } from '../../entities/Report.entity';

export class ReviewReportDto {
  @IsEnum(ReportStatus, {
    message: '올바른 처리 상태를 선택해주세요.',
  })
  @IsNotEmpty({
    message: '처리 상태는 필수입니다.',
  })
  status: ReportStatus;

  @IsOptional()
  @IsString({
    message: '관리자 의견은 문자열이어야 합니다.',
  })
  @MaxLength(1000, {
    message: '관리자 의견은 1000자를 초과할 수 없습니다.',
  })
  admin_comment?: string;
}
