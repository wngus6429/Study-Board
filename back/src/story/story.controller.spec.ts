/**
 * StoryController 단위 테스트
 * 게시글 컨트롤러의 API 엔드포인트를 테스트합니다.
 *
 * @description StoryController의 각 API 엔드포인트가 올바르게 작동하는지 확인하는 테스트 파일입니다.
 * @author StudyBoard Team
 */
import { Test, TestingModule } from '@nestjs/testing';
import { StoryController } from './story.controller';

describe('StoryController', () => {
  let controller: StoryController;

  /**
   * 각 테스트 실행 전 컨트롤러 인스턴스 초기화
   */
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [StoryController],
    }).compile();

    controller = module.get<StoryController>(StoryController);
  });

  /**
   * 컨트롤러가 정상적으로 정의되는지 확인
   */
  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  // TODO: 추가 테스트 케이스 구현 필요
  // - GET /pageTableData - 테이블 형태 게시글 목록 조회
  // - GET /cardPageTableData - 카드 형태 게시글 목록 조회
  // - GET /search - 게시글 검색
  // - GET /cardSearch - 카드 형태 게시글 검색
  // - GET /detail/:id - 게시글 상세 조회
  // - POST /create - 게시글 생성
  // - POST /update/:id - 게시글 수정
  // - DELETE /:id - 게시글 삭제
  // - PUT /likeOrUnlike/:id - 추천/비추천
});
