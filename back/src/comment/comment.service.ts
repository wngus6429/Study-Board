import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Comments } from 'src/entities/Comments.entity';
import { Story } from 'src/entities/Story.entity';
import { User } from 'src/entities/User.entity';
import { Notification } from 'src/entities/Notification.entity';

@Injectable()
export class CommentService {
  constructor(
    @InjectDataSource()
    private dataSource: DataSource,
    @InjectRepository(Comments) private commentRepository: Repository<Comments>,
    @InjectRepository(Story) private storyRepository: Repository<Story>,
    @InjectRepository(User) private userRepository: Repository<User>,
    @InjectRepository(Notification) private notificationRepository: Repository<Notification>,
  ) {}

  // 댓글 작성
  async createComment(commentData: {
    storyId: string;
    content: string;
    parentId?: number | null;
    authorId: string;
  }): Promise<void> {
    const { storyId, content, parentId, authorId } = commentData;

    // 글 확인
    const story = await this.storyRepository.findOne({
      where: { id: Number(storyId) },
      relations: ['User'], // 글 작성자 정보도 함께 가져옴
    });
    if (!story) {
      throw new NotFoundException('댓글을 작성할 글을 찾을 수 없습니다.');
    }

    // 사용자 확인
    const user = await this.userRepository.findOne({ where: { id: authorId } });
    if (!user) {
      throw new NotFoundException('댓글을 작성할 사용자를 찾을 수 없습니다.');
    }

    // 부모 댓글 확인
    let parentComment = null;
    if (parentId) {
      parentComment = await this.commentRepository.findOne({ 
        where: { id: parentId },
        relations: ['User'] // 부모 댓글 작성자 정보도 함께 가져옴
      });
      
      if (!parentComment) {
        throw new NotFoundException('부모 댓글을 찾을 수 없습니다.');
      }
    }

    // 트랜잭션으로 처리
    await this.dataSource.transaction(async (manager) => {
      // 댓글 생성 및 저장
      const comment = this.commentRepository.create({
        content,
        parent: parentComment,
        Story: story,
        User: user,
      });
      
      await manager.save(comment);

      // 글의 댓글 수 증가
      await manager.increment(
        Story,
        { id: Number(storyId) },
        'comment_count',
        1,
      );

      // 알림 생성
      if (parentComment) {
        // 대댓글인 경우: 원댓글 작성자에게 알림
        // 단, 자기 자신의 댓글에 대댓글 다는 경우는 제외
        if (parentComment.User.id !== authorId) {
          const notification = this.notificationRepository.create({
            recipient: parentComment.User,
            comment: comment,
            type: 'reply',
            isRead: false,
          });
          await manager.save(notification);
        }
      } else {
        // 일반 댓글인 경우: 글 작성자에게 알림
        // 단, 자기 자신의 글에 댓글 다는 경우는 제외
        if (story.User.id !== authorId) {
          const notification = this.notificationRepository.create({
            recipient: story.User,
            comment: comment,
            type: 'comment',
            isRead: false,
          });
          await manager.save(notification);
        }
      }
    });
  }

  // 댓글 삭제
  async deleteComment(
    commentId: number,
    commentData: { storyId: string },
  ): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      const commentRepository = manager.getRepository(Comments);
      const storyRepository = manager.getRepository(Story);

      // 댓글 확인
      const comment = await commentRepository.findOne({
        where: { id: commentId },
      });
      if (!comment) {
        throw new NotFoundException('삭제할 댓글을 찾을 수 없습니다.');
      }

      // 글 확인
      const story = await storyRepository.findOne({
        where: { id: Number(commentData.storyId) },
      });
      if (!story) {
        throw new NotFoundException('댓글이 연결된 글을 찾을 수 없습니다.');
      }

      // 댓글 논리 삭제
      comment.deleted_at = new Date();
      await commentRepository.save(comment);

      // 스토리의 comment_count 감소
      await storyRepository.decrement(
        { id: Number(commentData.storyId) },
        'comment_count',
        1,
      );
    });
  }

  // 댓글 수정
  async editComment(commentId: number, content: string): Promise<void> {
    // 댓글 확인
    const comment = await this.commentRepository.findOne({
      where: { id: commentId },
    });
    
    if (!comment) {
      throw new NotFoundException('수정할 댓글을 찾을 수 없습니다.');
    }

    comment.content = content;
    await this.commentRepository.save(comment);
  }

  // 댓글 조회
  async findStoryComments(
    storyId: number,
    userId?: string,
    page: number = 1,
    limit: number = 10,
  ): Promise<any> {
    // Story 데이터를 댓글과 함께 가져옴
    const findData = await this.storyRepository.findOne({
      where: { id: storyId },
      relations: [
        'Comments', // 댓글 데이터
        'Comments.User', // 댓글 작성자 정보
        'Comments.User.UserImage', // 댓글 작성자의 프로필 이미지
        'Comments.parent', // 부모 댓글 정보
        'Comments.parent.User', // 부모 댓글 작성자 정보
        'Comments.parent.User.UserImage', // 부모 댓글 작성자의 프로필 이미지
        'Comments.children', // 자식 댓글 정보
        'Comments.children.User.UserImage', // 자식 댓글 작성자의 프로필 이미지
      ],
    });

    // 데이터가 없을 경우 예외 처리
    if (!findData) {
      throw new NotFoundException(`게시글 ID ${storyId}의 댓글 데이터가 없음`);
    }

    // 로그인한 사용자의 정보 가져오기 (선택적)
    let loginUser = null;
    if (userId) {
      loginUser = await this.userRepository.findOne({
        where: { id: userId },
        relations: ['UserImage'], // 사용자 프로필 이미지 포함
      });
    }

    // 댓글을 계층 구조로 빌드하는 함수
    function buildCommentTree(comments: any): any[] {
      const commentMap = new Map();
      // 첫 번째 단계: 모든 댓글을 Map에 저장
      comments.forEach((comment) => {
        const isDeleted = !!comment.deleted_at; // 댓글이 삭제되었는지 확인
        const formattedComment = {
          id: comment.id, // 댓글 ID
          content: isDeleted ? '삭제됨' : comment.content, // 삭제된 댓글 처리
          updated_at: comment.updated_at, // 마지막 수정 시간
          nickname: isDeleted ? null : comment.User?.nickname || null, // 댓글 작성자 닉네임
          userId: isDeleted ? null : comment.User?.id, // 댓글 작성자 ID
          link: isDeleted ? null : comment.User?.UserImage?.link || null, // 댓글 작성자 이미지 링크
          parentNickname: comment.parent
            ? comment.parent.User?.nickname || null // 부모 댓글 작성자 닉네임
            : null,
          children: [], // 자식 댓글 리스트
          isDeleted, // 삭제 여부 플래그
        };
        commentMap.set(comment.id, formattedComment); // Map에 저장
      });

      // 두 번째 단계: 트리 구조를 빌드
      const rootComments: any[] = [];
      comments.forEach((comment) => {
        const currentComment = commentMap.get(comment.id);

        if (comment.parent) {
          // 부모 댓글이 있는 경우 부모에 자식 댓글 추가
          const parentComment = commentMap.get(comment.parent.id);
          if (parentComment) {
            parentComment.children.push(currentComment);
          }
        } else {
          // 최상위 댓글인 경우 root에 추가
          rootComments.push(currentComment);
        }
      });

      // 댓글 트리를 처리하는 헬퍼 함수
      function processCommentTree(comments: any[]): any[] {
        return comments.filter((comment) => {
          // 자식 댓글을 먼저 처리
          if (comment.children && comment.children.length > 0) {
            comment.children = processCommentTree(comment.children);

            // 삭제된 댓글이지만 자식이 남아 있는 경우 유지
            if (comment.isDeleted && comment.children.length > 0) {
              return true;
            }
          }

          // 자식 댓글이 없는 삭제된 댓글 제거
          if (
            comment.isDeleted &&
            (!comment.children || comment.children.length === 0)
          ) {
            return false;
          }

          return true; // 유지
        });
      }

      // 전체 트리를 처리
      return processCommentTree(rootComments);
    }

    // 댓글 데이터를 계층 구조로 변환
    const allProcessedComments = buildCommentTree(findData.Comments);

    // 대댓글을 포함한 모든 댓글을 평탄화하는 함수
    function flattenCommentsWithReplies(comments: any[]): any[] {
      let result: any[] = [];

      for (const comment of comments) {
        // 댓글 자체를 결과에 추가
        result.push(comment);

        // 대댓글이 있으면 평탄화하여 결과에 추가
        if (comment.children && comment.children.length > 0) {
          result = result.concat(flattenCommentsWithReplies(comment.children));
        }
      }

      return result;
    }

    // 계층 구조를 평탄화하여 모든 댓글을 하나의 배열로 만듦 (대댓글 포함)
    const allFlattenedComments =
      flattenCommentsWithReplies(allProcessedComments);

    // 전체 댓글 수 계산 (대댓글 포함)
    const totalCount = allFlattenedComments.length;

    // 페이지네이션 적용 (대댓글 포함)
    const startIndex = (page - 1) * limit;
    const paginatedComments = allProcessedComments.slice(
      startIndex,
      startIndex + limit,
    );

    // 현재 페이지의 댓글 수
    const currentPageCount = paginatedComments.length;

    return {
      comments: paginatedComments,
      totalCount,
      currentPageCount,
      page,
      limit,
    };
  }
} 