/**
 * 게시글 생성 DTO
 * 새로운 게시글을 생성할 때 사용되는 데이터 전송 객체입니다.
 *
 * @description 게시글 작성 시 클라이언트로부터 받는 데이터의 구조와 검증 규칙을 정의합니다.
 * @author StudyBoard Team
 */
import {
  IsNotEmpty,
  IsOptional,
  Max,
  MaxLength,
  IsNumberString,
} from 'class-validator';

export class CreateStoryDto {
  /**
   * 게시글 제목
   * @description 게시글의 제목 (필수 입력, 최대 1000자)
   * @example "안녕하세요! 첫 번째 게시글입니다."
   */
  @IsNotEmpty()
  @MaxLength(1000)
  title: string;

  /**
   * 게시글 내용
   * @description 게시글의 본문 내용 (필수 입력, 최대 1000자)
   * @example "이것은 게시글의 내용입니다. 여러분의 의견을 들려주세요!"
   */
  @IsNotEmpty()
  @MaxLength(1000)
  content: string;

  /**
   * 게시글 카테고리
   * @description 게시글이 속할 카테고리 (필수 선택)
   * @example "질문", "정보", "자유게시판" 등
   */
  @IsNotEmpty()
  category: string;

  /**
   * 채널 ID
   * @description 게시글이 속할 채널의 고유 번호 (선택사항, 문자열 형태의 숫자)
   * @example "123"
   */
  @IsOptional()
  @IsNumberString()
  channelId?: string;

  /**
   * 이미지 미리보기 데이터
   * @description 게시글에 첨부할 이미지의 미리보기 정보 (선택사항)
   * @example [{ dataUrl: "data:image/png;base64,iVBOR...", fileName: "image1.png" }]
   */
  @IsOptional()
  preview: { dataUrl: string; fileName: string }[];
}
