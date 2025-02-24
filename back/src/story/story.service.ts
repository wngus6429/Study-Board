import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, In, LessThan, Repository } from 'typeorm';
import { CreateStoryDto } from './dto/create-story.dto';
import { User } from 'src/entities/User.entity';
import { Story } from 'src/entities/Story.entity';
import { StoryImage } from 'src/entities/StoryImage.entity';
import * as fs from 'fs';
import * as path from 'path';
import { UpdateStoryDto } from './dto/update-story.dto';
import { Comments } from 'src/entities/Comments.entity';
import { Likes } from 'src/entities/Likes.entity';

@Injectable()
export class StoryService {
  constructor(
    @InjectRepository(Story)
    private storyRepository: Repository<Story>,
    @InjectRepository(StoryImage)
    private readonly imageRepository: Repository<StoryImage>,
    @InjectRepository(User) private userRepository: Repository<User>,
    @InjectRepository(Comments) private commentRepository: Repository<Comments>,
    @InjectRepository(Likes) private likeRepository: Repository<Likes>,
  ) {}
  //! ㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡ
  async findStory(
    offset = 0,
    limit = 10,
    category?: string, // ✅ category 추가
  ): Promise<{
    results: Partial<Story & { recommendationCount: number }>[];
    total: number;
  }> {
    const whereCondition = category && category !== 'all' ? { category } : {}; // ✅ 전체가 아닐 때만 where 적용

    const [results, total] = await Promise.all([
      this.storyRepository.find({
        relations: ['User', 'Likes', 'StoryImage'],
        where: whereCondition, // ✅ 카테고리 필터 추가
        order: { id: 'DESC' },
        skip: offset,
        take: limit,
      }),
      this.storyRepository.count({ where: whereCondition }), // ✅ 카운트에도 동일한 조건 적용
    ]);

    console.log('ggresult', results);

    const modifiedResults = results.map((story) => {
      const recommend_Count = story.Likes.reduce((acc, curr) => {
        if (curr.vote === 'like') return acc + 1;
        if (curr.vote === 'dislike') return acc - 1;
        return acc;
      }, 0);
      let imageFlag: boolean = false;
      if (story.StoryImage.length > 0) {
        imageFlag = true;
      }
      // Likes, StoryImage, User를 분리한 후 User 대신 nickname을 최상위 속성으로 반환
      const { Likes, StoryImage, User, ...rest } = story;
      return { ...rest, recommend_Count, imageFlag, nickname: User.nickname };
    });

    console.log('쿼리 결과:', modifiedResults, total);
    return { results: modifiedResults, total };
  }
  //! ㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡ
  // 검색 기능 API
  async searchStory(
    offset = 0,
    limit = 10,
    type: string = 'all',
    query: string,
    category?: string, // 카테고리 필터 (전체 검색이 아닐 경우)
  ): Promise<{
    results: (Partial<Story> & {
      nickname: string;
      recommend_Count: number;
      imageFlag: boolean;
    })[];
    total: number;
  }> {
    // 검색어에 대한 like 패턴 생성
    const likeQuery = `%${query}%`;

    // 검색 옵션에 따른 기본 조건 구성 (카테고리 조건은 나중에 병합)
    let baseConditions: any;
    if (type === 'title_content' || type === 'all') {
      // 제목 OR 내용 검색 조건
      baseConditions = [
        { title: ILike(likeQuery) },
        { content: ILike(likeQuery) },
      ];
    } else if (type === 'title') {
      // 제목 검색 조건
      baseConditions = { title: ILike(likeQuery) };
    } else if (type === 'content') {
      // 내용 검색 조건
      baseConditions = { content: ILike(likeQuery) };
    } else if (type === 'author') {
      // 작성자(User.name) 검색 조건
      baseConditions = { User: { name: ILike(likeQuery) } };
    } else if (type === 'comment') {
      // 댓글 검색은 기본 find 옵션으로는 처리하기 어려움
      throw new Error('댓글 검색은 QueryBuilder를 사용해야 합니다.');
    } else {
      // 정의되지 않은 타입의 경우 기본적으로 제목과 내용 조건 사용
      baseConditions = [
        { title: ILike(likeQuery) },
        { content: ILike(likeQuery) },
      ];
    }

    // 카테고리 필터 병합: category 값이 있고 'all'이 아닐 경우 조건에 추가
    if (category && category !== 'all') {
      if (Array.isArray(baseConditions)) {
        // 배열인 경우, 각 조건에 category 필드 추가
        baseConditions = baseConditions.map((condition) => ({
          ...condition,
          category,
        }));
      } else {
        // 단일 객체인 경우
        baseConditions = { ...baseConditions, category };
      }
    }

    // 조건에 따른 데이터와 총 개수 조회 (동일 조건 적용)
    const [resultsTemp, total] = await Promise.all([
      this.storyRepository.find({
        relations: ['User', 'Likes', 'StoryImage'],
        where: baseConditions,
        order: { id: 'DESC' },
        skip: offset,
        take: limit,
      }),
      this.storyRepository.count({
        where: baseConditions,
      }),
    ]);

    const results = resultsTemp.map((story) => {
      const recommend_Count = story.Likes.reduce((acc, curr) => {
        if (curr.vote === 'like') return acc + 1;
        if (curr.vote === 'dislike') return acc - 1;
        return acc;
      }, 0);

      const imageFlag = story.StoryImage.length > 0;

      // Likes, StoryImage, User를 분리한 후 User 대신 nickname을 최상위 속성으로 반환
      const { Likes, StoryImage, User, ...rest } = story;
      return { ...rest, recommend_Count, imageFlag, nickname: User.nickname };
    });

    console.log('ddd', results, total);

    return { results, total };
  }

  //! 검색 기능 함수 쿼리빌더 사용
  // async searchStory(
  //   offset = 0,
  //   limit = 10,
  //   type: string = 'all',
  //   query: string,
  // ): Promise<{ results: Partial<Story>[]; total: number }> {
  //   // QueryBuilder를 사용하여 동적 검색 조건 생성
  //   const queryBuilder = this.storyRepository
  //     .createQueryBuilder('story')
  //     .leftJoinAndSelect('story.User', 'user')
  //     .orderBy('story.id', 'DESC')
  //     .skip(offset)
  //     .take(limit);

  //   if (query && query.trim() !== '') {
  //     const likeQuery = `%${query}%`;
  //     switch (type) {
  //       case 'title_content':
  //         // 제목 또는 내용에 검색어가 포함된 경우
  //         queryBuilder.andWhere(
  //           '(story.title LIKE :likeQuery OR story.content LIKE :likeQuery)',
  //           { likeQuery },
  //         );
  //         break;
  //       case 'title':
  //         queryBuilder.andWhere('story.title LIKE :likeQuery', { likeQuery });
  //         break;
  //       case 'content':
  //         queryBuilder.andWhere('story.content LIKE :likeQuery', { likeQuery });
  //         break;
  //       case 'author':
  //         // User 테이블과의 조인을 통해 글쓴이 검색
  //         queryBuilder.andWhere('user.name LIKE :likeQuery', { likeQuery });
  //         break;
  //       case 'comment':
  //         // 댓글 검색 시 댓글 테이블과 조인 (댓글 엔티티가 존재한다고 가정)
  //         queryBuilder
  //           .leftJoin('story.comments', 'comment')
  //           .andWhere('comment.text LIKE :likeQuery', { likeQuery });
  //         break;
  //       default: // all 혹은 정의되지 않은 타입인 경우
  //         queryBuilder.andWhere(
  //           '(story.title LIKE :likeQuery OR story.content LIKE :likeQuery)',
  //           { likeQuery },
  //         );
  //         break;
  //     }
  //   }

  //   const [results, total] = await queryBuilder.getManyAndCount();
  //   return { results, total };
  // }
  //! ㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡ
  // 수정 페이지
  async findEditStoryOne(id: number, userId?: string): Promise<any> {
    const findData = await this.storyRepository.findOne({
      where: { id },
      relations: ['StoryImage', 'User'],
    });
    if (!findData) {
      throw new NotFoundException(`Story with ID ${id} not found`);
    }
    // 예를 들어 findData에 작성자 uuid가 authorId로 저장되어 있다고 가정
    if (findData.User.id !== userId) {
      throw new ForbiddenException('수정 권한이 없습니다');
    }
    const { User, ...editData } = findData;
    return editData;
  }
  //! ㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡ
  // 상세 페이지
  async findStoryOne(id: number, userId?: string): Promise<any> {
    const queryRunner =
      this.storyRepository.manager.connection.createQueryRunner();
    await queryRunner.startTransaction();

    try {
      // 데이터 조회
      const findData = await queryRunner.manager.findOne(Story, {
        where: { id },
        relations: [
          'StoryImage',
          'User',
          'User.UserImage',
          'Likes',
          'Likes.User', // Likes와 연결된 User 정보 포함
        ],
      });

      if (!findData) {
        // 데이터가 없을 경우 404 에러 던지기
        throw new NotFoundException(`Story with ID ${id} not found`);
      }

      console.log('Story data:', findData);
      // 조회수 증가
      await queryRunner.manager.increment(Story, { id }, 'read_count', 1);

      // 좋아요 및 싫어요 카운트 계산
      const likeCount = findData.Likes.filter(
        (like) => like.vote === 'like',
      ).length;
      const dislikeCount = findData.Likes.filter(
        (like) => like.vote === 'dislike',
      ).length;

      // Likes 배열 제거 및 필요한 데이터만 반환
      const { Likes, ...filteredData } = findData;
      const result = {
        ...filteredData,
        like_count: likeCount,
        dislike_count: dislikeCount,
      };

      // 트랜잭션 커밋
      await queryRunner.commitTransaction();
      console.log('Story data with counts:', result);
      return result;
    } catch (error) {
      // 트랜잭션 롤백
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      // QueryRunner 해제
      await queryRunner.release();
    }
  }
  //! ㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡ
  // 상세 페이지에서 댓글 데이터를 가져오는 메서드
  async findStoryOneComment(id: number, userData?: any): Promise<any> {
    // Story 데이터를 댓글과 함께 가져옴
    const findData = await this.storyRepository.findOne({
      where: { id },
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
      throw new NotFoundException(`${id}의 댓글 데이터가 없음`);
    }

    // 로그인한 사용자의 정보 가져오기 (선택적)
    const { userId } = userData;
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

      console.log('Comment map:', commentMap);

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
    const processedComments = buildCommentTree(findData.Comments);
    console.log(
      'Processed comment data:',
      JSON.stringify(processedComments, null, 2),
    );

    return { processedComments, loginUser }; // 댓글 데이터와 로그인 사용자 정보 반환
  }
  //! ㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡ
  // 글 작성
  async create(
    createStoryDto: CreateStoryDto,
    userData: User,
    files: Express.Multer.File[],
  ): Promise<Story> {
    const { title, content, category } = createStoryDto;

    // Story 엔티티 생성
    const story = this.storyRepository.create({
      category,
      title,
      content,
      User: userData, // 유저데이터를 통으로 넣음
    });

    const savedStory = await this.storyRepository.save(story);

    console.log('글 작성 이미지', files);

    // 이미지 파일을 ImageEntity로 변환 후 저장
    const imageEntities = files.map((file) => {
      const image = new StoryImage();
      image.image_name = file.filename;
      image.link = `/upload/${file.filename}`; // 저장 경로 설정
      image.Story = savedStory;
      return image;
    });

    console.log('글작성 저장 전 이미지 엔티티:', imageEntities);
    await this.imageRepository.save(imageEntities);

    return savedStory;
  }
  //! ㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡ
  // 글 수정
  async updateStory(
    storyId: number,
    updateStoryDto: UpdateStoryDto,
    userData: User,
    newImages: Express.Multer.File[],
  ): Promise<Story> {
    const story = await this.storyRepository.findOne({
      where: { id: storyId },
      relations: ['StoryImage'],
    });

    if (!story) {
      throw new NotFoundException('수정할 글을 찾을 수 없습니다.');
    }

    // 이거 에러 나던데 확인 해봐야 할듯
    // if (story.User !== userData) {
    //   throw new UnauthorizedException('본인의 글만 수정할 수 있습니다.');
    // }

    // 기존 이미지 목록 중에 삭제할 이미지 목록 추출
    const existImages = Array.isArray(updateStoryDto.existImages)
      ? updateStoryDto.existImages
      : updateStoryDto.existImages
        ? [updateStoryDto.existImages]
        : []; // undefined인 경우 빈 배열로 초기화

    let normalizedExistImages: string[] = [];
    if (existImages.length > 0) {
      normalizedExistImages = existImages.map((url) =>
        decodeURIComponent(new URL(url).pathname),
      );
    }

    // 삭제할 이미지 목록 추출
    const imagesToDelete = story.StoryImage.filter(
      (img) => !normalizedExistImages.includes(decodeURIComponent(img.link)),
    );

    if (imagesToDelete.length > 0) {
      const imagesWithRelations = await this.imageRepository.find({
        where: { id: In(imagesToDelete.map((img) => img.id)) },
        relations: ['Story'],
      });

      for (const image of imagesWithRelations) {
        await this.imageRepository.remove(image); // 관계 포함 삭제
      }

      // Story의 StoryImage 관계에서 삭제된 이미지를 제거
      story.StoryImage = story.StoryImage.filter(
        (img) => !imagesToDelete.some((delImg) => delImg.id === img.id),
      );
      await this.storyRepository.save(story); // 관계 동기화
    }

    // 새 이미지 추가
    if (newImages.length > 0) {
      const imageEntities = newImages.map((file) => {
        const image = new StoryImage();
        image.image_name = file.filename;
        image.link = `/upload/${file.filename}`;
        // image.user_id = String(userData.id);
        image.Story = story; // 관계 명확히 설정
        return image;
      });

      await this.imageRepository.save(imageEntities);

      // 관계 업데이트
      const updatedImages = await this.imageRepository.find({
        where: { Story: { id: storyId } },
      });
      story.StoryImage = updatedImages;
      await this.storyRepository.save(story); // 관계 동기화
    }

    Object.assign(story, {
      title: updateStoryDto.title,
      content: updateStoryDto.content,
      category: updateStoryDto.category,
    });

    return await this.storyRepository.save(story);
  }
  //! ㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡ
  // 글 삭제
  async deleteStory(storyId: number, userData: User): Promise<void> {
    // 스토리 데이터 가져오기
    const story: Story = await this.storyRepository.findOne({
      where: { id: storyId },
      relations: ['StoryImage'], // 이미지 관계도 함께 가져오기
    });

    // 글이 존재하지 않으면 에러 발생
    if (!story) {
      throw new NotFoundException('삭제된 글입니다.');
    }

    // 글 작성자와 요청한 사용자의 이메일이 일치하지 않으면 에러 발생
    // if (story.creator_user_id !== userData.id) {
    //   throw new UnauthorizedException('본인의 글만 삭제할 수 있습니다.');
    // }

    // 이미지 파일 삭제
    if (story.StoryImage && story.StoryImage.length > 0) {
      story.StoryImage.forEach((image) => {
        const filePath = path.join(__dirname, '../../upload', image.image_name);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath); // 파일 삭제
        }
      });
    }

    // 삭제 권한이 있을 경우, 글 삭제 진행
    await this.storyRepository.delete(storyId);
  }
  //! ㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡ
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
    const parentComment = parentId
      ? await this.commentRepository.findOne({ where: { id: parentId } })
      : null;

    console.log('par', parentComment);
    if (parentId && !parentComment)
      throw new NotFoundException('부모 댓글을 찾을 수 없습니다.');

    // 댓글 생성 및 저장
    const comment = await this.commentRepository.create({
      content,
      parent: parentComment,
      Story: story,
      User: user,
    });

    await this.commentRepository.save(comment);
  }
  //! ㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡ
  async deleteComment(commentId: number): Promise<void> {
    // 댓글 확인
    const comment = await this.commentRepository.findOne({
      where: { id: commentId },
    });
    if (!comment) {
      throw new NotFoundException('삭제할 댓글을 찾을 수 없습니다.');
    }

    comment.deleted_at = new Date();
    await this.commentRepository.save(comment);
  }
  //! ㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡ
  async editComment(commentId: number, content: string): Promise<void> {
    // 댓글 확인
    const comment = await this.commentRepository.findOne({
      where: { id: commentId },
    });
    console.log('comment옄', comment);
    if (!comment) {
      throw new NotFoundException('수정할 댓글을 찾을 수 없습니다.');
    }

    comment.content = content;
    await this.commentRepository.save(comment);
  }
  //! ㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡ
  async storyLikeUnLike(
    storyId: number,
    userId: string,
    vote: 'like' | 'dislike',
  ): Promise<{
    action: 'add' | 'remove' | 'change';
    vote: 'like' | 'dislike';
  }> {
    // 1. 게시글 찾기 (기존과 동일)
    const story = await this.storyRepository.findOne({
      where: { id: storyId },
    });
    if (!story) {
      throw new NotFoundException('해당 게시글을 찾을 수 없습니다.');
    }

    // 2. 기존 투표 확인
    const existingVote = await this.likeRepository.findOne({
      where: { User: { id: userId }, Story: { id: storyId } },
    });

    let action: 'add' | 'remove' | 'change' = 'add';

    if (existingVote) {
      if (existingVote.vote === vote) {
        // 같은 투표가 있으면 삭제 (취소)
        await this.likeRepository.remove(existingVote);
        action = 'remove';
      } else {
        // 다른 투표면 변경
        existingVote.vote = vote;
        await this.likeRepository.save(existingVote);
        action = 'change';
      }
    } else {
      // 새로운 투표
      const newVote = this.likeRepository.create({
        User: { id: userId },
        Story: { id: storyId },
        vote,
      });
      await this.likeRepository.save(newVote);
      action = 'add';
    }

    return { action, vote };
  }
}
