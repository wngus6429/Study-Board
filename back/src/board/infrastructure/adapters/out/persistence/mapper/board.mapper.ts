import { Board } from '../../../../../core/domain/board.entity';
import { Story } from '../../../../../../entities/Story.entity';
import { User } from '../../../../../../entities/user.entity';

/**
 * [Mapper]
 * 순수 Domain Entity(Board)와 TypeORM Entity(Story) 사이의 변환을 담당합니다.
 * 이를 통해 핵심 비즈니스 로직이 DB 스키마(TypeORM)에 의존하지 않도록 보호합니다.
 */
export class BoardMapper {
  // DB Entity -> Domain Entity
  static toDomain(story: Story): Board {
    if (!story) return null;
    return new Board(
      story.id,
      story.title,
      story.content,
      story.category,
      story.User?.id || null, // 작성자 ID 추출
      story.read_count || 0,
      story.created_at,
      story.updated_at,
    );
  }

  // Domain Entity -> DB Entity (저장용)
  static toPersistence(board: Board): Story {
    const story = new Story();
    if (board.id) {
      story.id = board.id;
    }
    story.title = board.title;
    story.content = board.content;
    story.category = board.category;
    story.read_count = board.viewCount;
    // Note: 작성자(User) 매핑은 Repository 쪽에서 User 엔티티를 조회하여 연결해주거나,
    // ID만 세팅하는 방식으로 처리합니다. (기존 Story 엔티티 구조에 맞게)
    const user = new User();
    user.id = board.authorId;
    story.User = user;

    return story;
  }
}
