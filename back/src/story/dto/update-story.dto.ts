/**
 * 게시글 수정 DTO
 * 기존 게시글을 수정할 때 사용되는 데이터 전송 객체입니다.
 *
 * @description 게시글 수정 시 클라이언트로부터 받는 데이터의 구조와 검증 규칙을 정의합니다.
 * @author StudyBoard Team
 */
import {
  IsArray,
  IsOptional,
  IsString,
  IsNotEmpty,
  IsNumber,
} from 'class-validator';

export class UpdateStoryDto {
  /**
   * 게시글 제목
   * @description 수정할 게시글의 제목 (필수 입력, 문자열)
   * @example "수정된 게시글 제목입니다."
   */
  @IsString()
  @IsNotEmpty()
  title: string;

  /**
   * 게시글 내용
   * @description 수정할 게시글의 본문 내용 (필수 입력, 문자열)
   * @example "이것은 수정된 게시글의 내용입니다."
   */
  @IsString()
  @IsNotEmpty()
  content: string;

  /**
   * 게시글 카테고리
   * @description 수정할 게시글의 카테고리 (선택사항)
   * @example "질문", "정보", "자유게시판" 등
   */
  @IsString()
  @IsOptional()
  category?: string;

  /**
   * 유지할 기존 이미지 ID 목록
   * @description 수정 후에도 유지할 기존 이미지들의 ID 배열 (선택사항)
   * @example [1, 3, 5] - ID가 1, 3, 5인 이미지는 유지하고 나머지는 삭제
   */
  @IsArray()
  @IsOptional()
  @IsNumber({}, { each: true }) // 배열 내 요소가 숫자인지 검증
  existImages?: string[]; // 유지할 기존 이미지 ID 배열
}
