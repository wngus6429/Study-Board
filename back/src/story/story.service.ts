import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { ILike, In, LessThan, Repository, DataSource } from 'typeorm';
import { CreateStoryDto } from './dto/create-story.dto';
import { User } from 'src/entities/User.entity';
import { Story } from 'src/entities/Story.entity';
import { StoryImage } from 'src/entities/StoryImage.entity';
import * as fs from 'fs';
import * as path from 'path';
import { UpdateStoryDto } from './dto/update-story.dto';
import { Comments } from 'src/entities/Comments.entity';
import { Likes } from 'src/entities/Likes.entity';
import { RecommendRanking } from 'src/entities/RecommendRanking.entity';
import { MIN_RECOMMEND_COUNT } from 'src/common/constants/app.constants';

@Injectable()
export class StoryService {
  constructor(
    @InjectDataSource()
    private dataSource: DataSource,
    @InjectRepository(Story)
    private storyRepository: Repository<Story>,
    @InjectRepository(StoryImage)
    private readonly imageRepository: Repository<StoryImage>,
    @InjectRepository(User) private userRepository: Repository<User>,
    @InjectRepository(Comments) private commentRepository: Repository<Comments>,
    @InjectRepository(Likes) private likeRepository: Repository<Likes>,
    @InjectRepository(RecommendRanking)
    private recommendRankingRepository: Repository<RecommendRanking>,
  ) {}
  //! ㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡ
  async findStory(
    offset = 0,
    limit = 10,
    category?: string,
  ): Promise<{
    results: Partial<Story & { recommendationCount: number }>[];
    total: number;
  }> {
    // 카테고리 필터 조건 설정 + 공지사항 제외
    const whereCondition: any = { isNotice: false }; // 공지사항이 아닌 것만
    if (category && category !== 'all') {
      whereCondition.category = category;
    }
    const isAllCategory = !category || category === 'all';

    // 전체 게시글 수 조회 (페이지네이션 계산용) - 공지사항 제외
    const regularTotal = await this.storyRepository.count({
      where: whereCondition,
    });

    // 페이지네이션 계산을 위한 로직
    let effectiveOffset = Number(offset);
    let effectiveLimit = Number(limit);

    // 게시글 조회 - 공지사항 제외
    const regularPosts = await this.storyRepository.find({
      relations: ['User'],
      // relations: ['User', 'Likes'],
      where: whereCondition,
      order: { id: 'DESC' },
      skip: Math.max(0, effectiveOffset), // 음수가 되지 않도록 보정
      take: effectiveLimit,
    });

    // 결과 데이터 가공
    const modifiedPosts = regularPosts.map((story) => {
      // const recommend_Count = story.Likes.reduce((acc, curr) => {
      //   if (curr.vote === 'like') return acc + 1;
      //   if (curr.vote === 'dislike') return acc - 1;
      //   return acc;
      // }, 0);

      const { Likes, StoryImage, User, ...rest } = story;
      return {
        ...rest,
        recommend_Count: story.like_count,
        imageFlag: story.imageFlag,
        nickname: User.nickname,
      };
    });

    return {
      results: modifiedPosts,
      total: regularTotal,
    };
  }
  //! ㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡ
  async findCardStory(
    offset = 0,
    limit = 10,
    category?: string,
  ): Promise<{
    results: Partial<Story & { recommendationCount: number }>[];
    total: number;
  }> {
    // 카테고리 필터 조건 설정 + 공지사항 제외
    const whereCondition: any = { isNotice: false }; // 공지사항이 아닌 것만
    if (category && category !== 'all') {
      whereCondition.category = category;
    }

    // # 나중에 데이터 count만 채널이랑 엮어놓은 테이블 만들 예정
    // 2. 전체 일반 게시글 수 조회 (페이지네이션 계산용) - 공지사항 제외
    const regularTotal = await this.storyRepository.count({
      where: whereCondition,
    });

    // // 3. 페이지네이션 정확한 계산을 위한 로직
    let effectiveOffset = Number(offset);
    let effectiveLimit = Number(limit);

    // 4. 일반 게시글 조회 (조정된 offset과 limit 사용) - 공지사항 제외
    const regularPosts = await this.storyRepository.find({
      relations: ['User', 'StoryImage'],
      where: whereCondition,
      order: { id: 'DESC' },
      skip: Math.max(0, effectiveOffset), // 음수가 되지 않도록 보정
      take: effectiveLimit,
    });

    const modifiedPosts = regularPosts.map((story) => {
      const { Likes, StoryImage, User, ...rest } = story;
      return {
        ...rest,
        recommend_Count: story.like_count,
        imageFlag: story.imageFlag,
        nickname: User.nickname,
        firstImage: StoryImage[0],
      };
    });

    return {
      results: modifiedPosts,
      total: regularTotal, // 일반테이블에서 이미 처리함.
    };
  }
  //! ㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡ
  // 새로 추가: 추천 랭킹 모드 적용 시 최소 추천 수 이상의 게시글 조회 (QueryBuilder 사용)
  // 추천 랭킹 모드 적용 시 최소 추천 수 이상의 게시글 조회 (QueryBuilder 미사용)
  async findStoryWithMinRecommend(
    offset = 0,
    limit = 10,
    category?: string,
    minRecommend: number = 0,
  ): Promise<{
    results: Partial<Story>[];
    total: number;
  }> {
    // RecommendRanking 테이블에서 데이터 가져오기
    return this.getRecommendRankings(offset, limit, category);
  }
  //! ㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡ
  // 새로 추가: 추천 랭킹 모드 적용 시 최소 추천 수 이상의 게시글 조회 (QueryBuilder 사용)
  // 추천 랭킹 모드 적용 시 최소 추천 수 이상의 게시글 조회 (QueryBuilder 미사용)
  async findCardStoryWithMinRecommend(
    offset = 0,
    limit = 10,
    category?: string,
    minRecommend: number = 0,
  ): Promise<{
    results: Partial<Story>[];
    total: number;
  }> {
    // RecommendRanking 테이블에서 데이터 가져오기
    return this.getRecommendRankings(offset, limit, category);
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
        { title: ILike(likeQuery), isNotice: false },
        { content: ILike(likeQuery), isNotice: false },
      ];
    } else if (type === 'title') {
      // 제목 검색 조건
      baseConditions = { title: ILike(likeQuery), isNotice: false };
    } else if (type === 'content') {
      // 내용 검색 조건
      baseConditions = { content: ILike(likeQuery), isNotice: false };
    } else if (type === 'author') {
      // 작성자(User.name) 검색 조건
      baseConditions = { User: { name: ILike(likeQuery) }, isNotice: false };
    } else if (type === 'comment') {
      // 댓글 검색은 기본 find 옵션으로는 처리하기 어려움
      throw new Error('댓글 검색은 QueryBuilder를 사용해야 합니다.');
    } else {
      // 정의되지 않은 타입의 경우 기본적으로 제목과 내용 조건 사용
      baseConditions = [
        { title: ILike(likeQuery), isNotice: false },
        { content: ILike(likeQuery), isNotice: false },
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
  // 검색 기능 API
  async cardSearchStory(
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
        { title: ILike(likeQuery), isNotice: false },
        { content: ILike(likeQuery), isNotice: false },
      ];
    } else if (type === 'title') {
      // 제목 검색 조건
      baseConditions = { title: ILike(likeQuery), isNotice: false };
    } else if (type === 'content') {
      // 내용 검색 조건
      baseConditions = { content: ILike(likeQuery), isNotice: false };
    } else if (type === 'author') {
      // 작성자(User.name) 검색 조건
      baseConditions = { User: { name: ILike(likeQuery) }, isNotice: false };
    } else if (type === 'comment') {
      // 댓글 검색은 기본 find 옵션으로는 처리하기 어려움
      throw new Error('댓글 검색은 QueryBuilder를 사용해야 합니다.');
    } else {
      // 정의되지 않은 타입의 경우 기본적으로 제목과 내용 조건 사용
      baseConditions = [
        { title: ILike(likeQuery), isNotice: false },
        { content: ILike(likeQuery), isNotice: false },
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
  async findStoryOne(id: number): Promise<any> {
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
  // 공지 상세 페이지
  async findNoticeOne(id: number, userId?: string): Promise<any> {
    const queryRunner =
      this.storyRepository.manager.connection.createQueryRunner();
    await queryRunner.startTransaction();

    try {
      // 데이터 조회
      const findData = await queryRunner.manager.findOne(Story, {
        where: { id },
        relations: ['StoryImage', 'User', 'User.UserImage'],
      });

      if (!findData) {
        // 데이터가 없을 경우 404 에러 던지기
        throw new NotFoundException(`Story with ID ${id} not found`);
      }

      // 조회수 증가
      await queryRunner.manager.increment(Story, { id }, 'read_count', 1);

      // 트랜잭션 커밋
      await queryRunner.commitTransaction();
      console.log('Story data with counts:', findData);
      return findData;
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
  // 글 작성
  async create(
    createStoryDto: CreateStoryDto,
    userData: User,
    files: Express.Multer.File[],
  ): Promise<Story> {
    const { title, content, category } = createStoryDto;
    // 이미지를 업로드 하는지 확인
    const imageFlag = files && files.length > 0;
    // Story 엔티티 생성
    const story = this.storyRepository.create({
      category,
      title,
      content,
      User: userData, // 유저데이터를 통으로 넣음
      imageFlag,
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
  // 공지사항 작성
  async createNotice(
    createStoryDto: CreateStoryDto,
    userData: User,
    files: Express.Multer.File[],
  ): Promise<Story> {
    const { title, content } = createStoryDto;
    // 이미지를 업로드 하는지 확인
    const imageFlag = files && files.length > 0;
    // Story 엔티티 생성 (공지사항은 category를 "notice"로 고정, isNotice를 true로 설정)
    const story = this.storyRepository.create({
      category: 'notice',
      title,
      content,
      User: userData,
      imageFlag,
      isNotice: true, // 공지사항 플래그 설정
    });

    const savedStory = await this.storyRepository.save(story);

    console.log('공지사항 작성 이미지', files);

    // 이미지 파일을 ImageEntity로 변환 후 저장
    const imageEntities = files.map((file) => {
      const image = new StoryImage();
      image.image_name = file.filename;
      image.link = `/upload/${file.filename}`; // 저장 경로 설정
      image.Story = savedStory;
      return image;
    });

    console.log('공지사항 작성 저장 전 이미지 엔티티:', imageEntities);
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

      // 관계 업데이트: 최신 이미지 목록을 불러와서 할당
      const updatedImages = await this.imageRepository.find({
        where: { Story: { id: storyId } },
      });
      story.StoryImage = updatedImages;
      await this.storyRepository.save(story); // 관계 동기화
    }
    // 제목, 내용, 카테고리 업데이트
    Object.assign(story, {
      title: updateStoryDto.title,
      content: updateStoryDto.content,
      category: updateStoryDto.category,
    });

    // imageFlag 업데이트: 이미지가 하나라도 있으면 true, 없으면 false
    story.imageFlag = story.StoryImage && story.StoryImage.length > 0;

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
  //! 트랜잭션 적용된 버전
  async storyLikeUnLike(
    storyId: number,
    userId: string,
    vote: 'like' | 'dislike',
  ): Promise<{
    action: 'add' | 'remove' | 'change';
    vote: 'like' | 'dislike';
  }> {
    // 전체 작업을 하나의 트랜잭션으로 묶어 원자성을 보장합니다.
    return this.dataSource.transaction(async (manager) => {
      // 트랜잭션 범위 내에서 사용할 Repository 인스턴스를 가져옵니다.
      const storyRepo = manager.getRepository(Story);
      const likeRepo = manager.getRepository(Likes);
      const rankingRepo = manager.getRepository(RecommendRanking);

      // 1) 게시글 조회: storyId로 Story 엔티티를 가져옵니다.
      const story = await storyRepo.findOne({ where: { id: storyId } });
      if (!story) {
        // 게시글이 없으면 404 예외를 던집니다.
        throw new NotFoundException('해당 게시글을 찾을 수 없습니다.');
      }

      // 2) 기존 투표 조회: userId, storyId 조합으로 Likes 레코드 검색
      const existingVote = await likeRepo.findOne({
        where: { User: { id: userId }, Story: { id: storyId } },
      });

      // 반환할 action과 like_count 조정값을 초기화합니다.
      let action: 'add' | 'remove' | 'change' = 'add';
      let likeCountAdjustment = 0;

      console.log('existingVote요', existingVote); // 존재 안하면 null 존재하면
      // Likes { id: 53, vote: 'like', created_at, updated_at }

      if (existingVote) {
        if (existingVote.vote === vote) {
          // 2-a) 동일한 투표인 경우: 투표 취소(remove)
          await likeRepo.remove(existingVote);
          action = 'remove';
          // 좋아요 취소 시 -1, 싫어요 취소 시 +1
          likeCountAdjustment = vote === 'like' ? -1 : 1;
        } else {
          // 2-b) 다른 투표인 경우: 투표 유형 변경(change)
          console.log('엥');
          existingVote.vote = vote;
          await likeRepo.save(existingVote);
          action = 'change';
          // 여기에 투표했던 사람이 좋아요 취소하고 싫어요 하면 like_count 2 단위로 변경
          likeCountAdjustment = vote === 'like' ? 2 : -2;
        }
      } else {
        // 2-c) 신규 투표인 경우: 레코드 생성(add)
        const newVote = likeRepo.create({
          User: { id: userId },
          Story: { id: storyId },
          vote,
        });
        console.log('newVote여', newVote);
        // Likes { vote: 'like', User: User { id: 'c7a' }, Story: Story { id: '37' }
        await likeRepo.save(newVote);
        action = 'add';
        // 신규 좋아요 +1, 신규 싫어요 -1
        likeCountAdjustment = vote === 'like' ? 1 : -1;
      }

      // 3) story의 like_count를 조정합니다.
      if (likeCountAdjustment !== 0) {
        await storyRepo
          .createQueryBuilder()
          .update()
          .set({
            like_count: () => `like_count + ${likeCountAdjustment}`,
          })
          .where('id = :storyId', { storyId })
          .execute();

        // 4) 게시글의 최신 추천 수를 가져옵니다.
        const updatedStory = await storyRepo.findOne({
          where: { id: storyId },
        });

        // 5) 추천 랭킹 테이블 관리
        if (updatedStory.like_count >= MIN_RECOMMEND_COUNT) {
          // 추천 수가 기준치 이상이면 랭킹 테이블에 추가/업데이트
          let rankingEntry = await rankingRepo.findOne({ where: { storyId } });

          if (rankingEntry) {
            // 이미 랭킹 테이블에 있으면 추천 수 업데이트
            rankingEntry.recommendCount = updatedStory.like_count;
            await rankingRepo.save(rankingEntry);
          } else {
            // 랭킹 테이블에 없고 기준치를 넘었으면 새로 추가
            rankingEntry = rankingRepo.create({
              Story: { id: storyId },
              storyId: storyId,
              recommendCount: updatedStory.like_count,
            });
            await rankingRepo.save(rankingEntry);
          }
        } else if (updatedStory.like_count < MIN_RECOMMEND_COUNT) {
          // 추천 수가 기준치 미만이면 랭킹 테이블에서 제거
          const rankingEntry = await rankingRepo.findOne({
            where: { storyId },
          });
          if (rankingEntry) {
            await rankingRepo.remove(rankingEntry);
          }
        }
      }

      // 최종 수행된 action과 vote 유형을 반환합니다.
      return { action, vote };
    });
  }
  //! ㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡ
  // 추천 랭킹 테이블에서 데이터 가져오기
  async getRecommendRankings(
    offset = 0,
    limit = 10,
    category?: string,
  ): Promise<{
    results: Partial<Story>[];
    total: number;
  }> {
    // 1. 추천 랭킹 테이블에서 데이터 조회 (카테고리 필터링 포함)
    const query = this.recommendRankingRepository
      .createQueryBuilder('ranking')
      .leftJoinAndSelect('ranking.Story', 'story')
      .leftJoinAndSelect('story.User', 'user')
      .leftJoinAndSelect('story.StoryImage', 'image')
      .orderBy('ranking.recommendCount', 'DESC')
      .skip(offset)
      .take(limit);

    // 카테고리 필터링 적용
    if (category && category !== 'all') {
      query.andWhere('story.category = :category', { category });
    }

    // 쿼리 실행
    const [rankings, total] = await query.getManyAndCount();

    // 2. 결과 가공
    const results = rankings.map((ranking) => {
      const story = ranking.Story;
      return {
        ...story,
        recommend_Count: ranking.recommendCount,
        nickname: story.User.nickname,
        imageFlag: story.StoryImage && story.StoryImage.length > 0,
        firstImage:
          story.StoryImage && story.StoryImage.length > 0
            ? story.StoryImage[0]
            : null,
      };
    });

    return { results, total };
  }

  //* 이 코드는 추천 랭킹 테이블을 초기화하거나 업데이트할 때 사용되는 함수입니다.
  // 작동 방식:
  // 모든 게시글(스토리)을 데이터베이스에서 가져옵니다.
  // 각 게시글의 좋아요와 싫어요 수를 계산해서 추천 점수를 구합니다.
  // 추천 점수가 설정된 최소값(MIN_RECOMMEND_COUNT) 이상인 게시글만 필터링합니다.
  // 기존 추천 랭킹 테이블을 비웁니다.
  // 조건을 충족하는 게시글들을 추천 랭킹 테이블에 새로 등록합니다.
  // 사용 시기:
  // 시스템 처음 설정 시 - 기존 데이터를 추천 랭킹 테이블에 채울 때
  // 데이터 복구가 필요할 때 - 추천 랭킹 테이블에 문제가 생긴 경우
  // 관리자 작업 수행 시 - 랭킹 데이터를 초기화하고 싶을 때
  // 이 함수는 관리자 권한을 가진 사용자만 API를 통해 실행할 수 있습니다. 일반 사용자는 실행할 수 없으며, 시스템 유지보수용 기능입니다.
  // 기존 스토리 데이터를 RecommendRanking 테이블로 마이그레이션
  async migrateToRecommendRanking(): Promise<number> {
    try {
      // 1. 모든 스토리 가져오기
      const stories = await this.storyRepository.find({
        relations: ['Likes'],
      });

      // 2. 추천 수가 MIN_RECOMMEND_COUNT 이상인 스토리 필터링
      const eligibleStories = stories.filter((story) => {
        // 각 스토리의 추천 수 계산 (좋아요 - 싫어요)
        const recommendCount = story.Likes.reduce((acc, curr) => {
          if (curr.vote === 'like') return acc + 1;
          if (curr.vote === 'dislike') return acc - 1;
          return acc;
        }, 0);

        return recommendCount >= MIN_RECOMMEND_COUNT;
      });

      // 3. 현재 RecommendRanking 테이블 비우기
      await this.recommendRankingRepository.clear();

      // 4. 자격을 갖춘 스토리 추가
      const rankingEntries = eligibleStories.map((story) => {
        const recommendCount = story.Likes.reduce((acc, curr) => {
          if (curr.vote === 'like') return acc + 1;
          if (curr.vote === 'dislike') return acc - 1;
          return acc;
        }, 0);

        return this.recommendRankingRepository.create({
          Story: { id: story.id },
          storyId: story.id,
          recommendCount,
        });
      });

      // 5. 일괄 저장
      await this.recommendRankingRepository.save(rankingEntries);

      return rankingEntries.length;
    } catch (error) {
      console.error('추천 랭킹 마이그레이션 중 오류 발생:', error);
      throw new Error('추천 랭킹 마이그레이션에 실패했습니다.');
    }
  }
  //! ㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡ
  // 공지사항 목록 가져오기
  async findNotices(limit = 10): Promise<{
    results: Partial<Story>[];
    total: number;
  }> {
    // 공지사항만 가져오기 (isNotice가 true인 것만)
    const [notices, total] = await this.storyRepository.findAndCount({
      where: { isNotice: true },
      relations: ['User'],
      order: { id: 'DESC' },
      take: limit,
    });

    // 결과 데이터 가공
    const results = notices.map((notice) => {
      const { User, ...rest } = notice;
      return {
        ...rest,
        nickname: User.nickname,
        created_at: notice.created_at, // created_at 필드 명시적으로 포함
      };
    });

    return { results, total };
  }
}
