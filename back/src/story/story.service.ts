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
import { Channels } from 'src/entities/Channels.entity';
import { ChannelNotificationService } from '../channel-notification/channel-notification.service';
import { NotificationService } from '../notification/notification.service';

/**
 * Story 서비스
 * 게시글 관련 비즈니스 로직을 처리합니다.
 *
 * @description 게시글의 CRUD 작업, 검색, 추천/비추천, 이미지 처리 등을 담당합니다.
 * @author StudyBoard Team
 */
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
    @InjectRepository(Channels)
    private channelsRepository: Repository<Channels>,
    private channelNotificationService: ChannelNotificationService,
    private notificationService: NotificationService,
  ) {}

  /**
   * 테이블 형태 게시글 목록 조회
   *
   * @description 페이지네이션과 필터링을 적용하여 게시글 목록을 조회합니다.
   * @param offset 시작 위치 (기본값: 0)
   * @param limit 조회할 게시글 수 (기본값: 10)
   * @param category 카테고리 필터 (선택사항)
   * @param channelId 채널 ID 필터 (선택사항)
   * @returns 게시글 목록과 총 개수
   */
  async findStory(
    offset = 0,
    limit = 10,
    category?: string,
    channelId?: number,
  ): Promise<{
    results: Partial<Story & { recommendationCount: number }>[];
    total: number;
  }> {
    // 카테고리 필터 조건 설정 (공지사항 제외)
    const whereCondition: any = { isNotice: false };
    if (category && category !== 'all') {
      whereCondition.category = category;
    }

    // 채널 필터 조건 추가
    if (channelId) {
      whereCondition.Channel = { id: Number(channelId) };
    }

    console.log('🔍 findStory whereCondition:', {
      whereCondition,
      channelId: channelId ? Number(channelId) : null,
      typeof_channelId: typeof channelId,
    });

    // 전체 게시글 수 조회 (페이지네이션 계산용)
    const regularTotal = await this.storyRepository.count({
      where: whereCondition,
      relations: channelId ? ['Channel'] : [],
    });

    // 페이지네이션 매개변수 정규화
    let effectiveOffset = Number(offset);
    let effectiveLimit = Number(limit);

    // 게시글 조회 (공지사항 제외)
    const regularPosts = await this.storyRepository.find({
      relations: channelId ? ['User', 'Channel'] : ['User'],
      where: whereCondition,
      order: { id: 'DESC' },
      skip: Math.max(0, effectiveOffset),
      take: effectiveLimit,
    });

    // 응답 데이터 가공
    const modifiedPosts = regularPosts.map((story) => {
      const { Likes, StoryImage, User, Channel, ...rest } = story;
      return {
        ...rest,
        recommend_Count: story.like_count,
        imageFlag: story.imageFlag,
        userId: User.id,
        nickname: User.nickname,
      };
    });

    console.log('modifiedPosts', modifiedPosts, 'regularTotal', regularTotal);

    return {
      results: modifiedPosts,
      total: regularTotal,
    };
  }

  /**
   * 카드 형태 게시글 목록 조회
   *
   * @description 페이지네이션과 필터링을 적용하여 카드 형태의 게시글 목록을 조회합니다.
   * @param offset 시작 위치 (기본값: 0)
   * @param limit 조회할 게시글 수 (기본값: 10)
   * @param category 카테고리 필터 (선택사항)
   * @param channelId 채널 ID 필터 (선택사항)
   * @returns 게시글 목록과 총 개수 (첫 번째 이미지 포함)
   */
  async findCardStory(
    offset = 0,
    limit = 10,
    category?: string,
    channelId?: number,
  ): Promise<{
    results: Partial<Story & { recommendationCount: number }>[];
    total: number;
  }> {
    // 카테고리 필터 조건 설정 (공지사항 제외)
    const whereCondition: any = { isNotice: false };
    if (category && category !== 'all') {
      whereCondition.category = category;
    }

    // 채널 필터 조건 추가
    if (channelId) {
      whereCondition.Channel = { id: Number(channelId) };
    }

    console.log('🔍 findCardStory whereCondition:', {
      whereCondition,
      channelId: channelId ? Number(channelId) : null,
      typeof_channelId: typeof channelId,
    });

    // 전체 일반 게시글 수 조회 (페이지네이션 계산용)
    const regularTotal = await this.storyRepository.count({
      where: whereCondition,
      relations: channelId ? ['Channel'] : [],
    });

    // 페이지네이션 매개변수 정규화
    let effectiveOffset = Number(offset);
    let effectiveLimit = Number(limit);

    // 일반 게시글 조회 (조정된 offset과 limit 사용, 공지사항 제외)
    const regularPosts = await this.storyRepository.find({
      relations: channelId
        ? ['User', 'StoryImage', 'Channel']
        : ['User', 'StoryImage'],
      where: whereCondition,
      order: { id: 'DESC' },
      skip: Math.max(0, effectiveOffset),
      take: effectiveLimit,
    });

    // 응답 데이터 가공 (첫 번째 이미지 포함)
    const modifiedPosts = regularPosts.map((story) => {
      const { Likes, StoryImage, User, Channel, ...rest } = story;
      return {
        ...rest,
        recommend_Count: story.like_count,
        imageFlag: story.imageFlag,
        userId: User.id,
        nickname: User.nickname,
        firstImage: StoryImage[0],
      };
    });

    return {
      results: modifiedPosts,
      total: regularTotal,
    };
  }

  /**
   * 추천 수 기반 게시글 조회 (테이블 형태)
   *
   * @description 최소 추천 수 이상의 게시글을 조회합니다.
   * @param offset 시작 위치 (기본값: 0)
   * @param limit 조회할 게시글 수 (기본값: 10)
   * @param category 카테고리 필터 (선택사항)
   * @param minRecommend 최소 추천 수 (기본값: 0)
   * @param channelId 채널 ID 필터 (선택사항)
   * @returns 추천 랭킹 기반 게시글 목록
   */
  async findStoryWithMinRecommend(
    offset = 0,
    limit = 10,
    category?: string,
    minRecommend: number = 0,
    channelId?: number,
  ): Promise<{
    results: Partial<Story>[];
    total: number;
  }> {
    // RecommendRanking 테이블에서 데이터 가져오기
    return this.getRecommendRankings(offset, limit, category, channelId);
  }

  /**
   * 추천 수 기반 게시글 조회 (카드 형태)
   *
   * @description 최소 추천 수 이상의 게시글을 카드 형태로 조회합니다.
   * @param offset 시작 위치 (기본값: 0)
   * @param limit 조회할 게시글 수 (기본값: 10)
   * @param category 카테고리 필터 (선택사항)
   * @param minRecommend 최소 추천 수 (기본값: 0)
   * @param channelId 채널 ID 필터 (선택사항)
   * @returns 추천 랭킹 기반 게시글 목록
   */
  async findCardStoryWithMinRecommend(
    offset = 0,
    limit = 10,
    category?: string,
    minRecommend: number = 0,
    channelId?: number,
  ): Promise<{
    results: Partial<Story>[];
    total: number;
  }> {
    // RecommendRanking 테이블에서 데이터 가져오기
    return this.getRecommendRankings(offset, limit, category, channelId);
  }

  /**
   * 게시글 검색 (테이블 형태)
   *
   * @description 다양한 검색 타입으로 게시글을 검색합니다.
   * @param offset 시작 위치 (기본값: 0)
   * @param limit 조회할 게시글 수 (기본값: 10)
   * @param type 검색 타입 (all, title_content, title, content, author, comment)
   * @param query 검색어
   * @param category 카테고리 필터 (선택사항)
   * @param channelId 채널 ID 필터 (선택사항)
   * @returns 검색된 게시글 목록과 총 개수
   */
  async searchStory(
    offset = 0,
    limit = 10,
    type: string = 'all',
    query: string,
    category?: string,
    channelId?: number,
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

    // 검색 타입에 따른 기본 조건 구성
    let baseConditions: any;
    if (type === 'title_content' || type === 'all') {
      // 제목 또는 내용 검색
      baseConditions = [
        { title: ILike(likeQuery), isNotice: false },
        { content: ILike(likeQuery), isNotice: false },
      ];
    } else if (type === 'title') {
      // 제목 검색
      baseConditions = { title: ILike(likeQuery), isNotice: false };
    } else if (type === 'content') {
      // 내용 검색
      baseConditions = { content: ILike(likeQuery), isNotice: false };
    } else if (type === 'author') {
      // 작성자 검색
      baseConditions = { User: { name: ILike(likeQuery) }, isNotice: false };
    } else if (type === 'comment') {
      // 댓글 검색은 QueryBuilder 필요
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

    // 채널 필터 병합: channelId 값이 있을 경우 조건에 추가
    if (channelId) {
      if (Array.isArray(baseConditions)) {
        // 배열인 경우, 각 조건에 Channel 필드 추가
        baseConditions = baseConditions.map((condition) => ({
          ...condition,
          Channel: { id: channelId },
        }));
      } else {
        // 단일 객체인 경우
        baseConditions = { ...baseConditions, Channel: { id: channelId } };
      }
    }

    // 조건에 따른 데이터와 총 개수 조회 (동일 조건 적용)
    const [resultsTemp, total] = await Promise.all([
      this.storyRepository.find({
        relations: channelId
          ? ['User', 'Likes', 'StoryImage', 'Channel']
          : ['User', 'Likes', 'StoryImage'],
        where: baseConditions,
        order: { id: 'DESC' },
        skip: offset,
        take: limit,
      }),
      this.storyRepository.count({
        where: baseConditions,
        relations: channelId ? ['Channel'] : [],
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
      return {
        ...rest,
        recommend_Count,
        imageFlag,
        userId: User.id,
        nickname: User.nickname,
      };
    });

    console.log('ddd', results, total);

    return { results, total };
  }

  /**
   * 검색 기능 API
   *
   * @description 검색 기능을 구현합니다.
   * @param offset 시작 위치 (기본값: 0)
   * @param limit 조회할 게시글 수 (기본값: 10)
   * @param type 검색 타입 (all, title_content, title, content, author, comment)
   * @param query 검색어
   * @param category 카테고리 필터 (선택사항)
   * @param channelId 채널 ID 필터 (선택사항)
   * @returns 검색된 게시글 목록과 총 개수
   */
  async cardSearchStory(
    offset = 0,
    limit = 10,
    type: string = 'all',
    query: string,
    category?: string,
    channelId?: number,
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

    // 채널 필터 병합: channelId 값이 있을 경우 조건에 추가
    if (channelId) {
      if (Array.isArray(baseConditions)) {
        // 배열인 경우, 각 조건에 Channel 필드 추가
        baseConditions = baseConditions.map((condition) => ({
          ...condition,
          Channel: { id: channelId },
        }));
      } else {
        // 단일 객체인 경우
        baseConditions = { ...baseConditions, Channel: { id: channelId } };
      }
    }

    // 조건에 따른 데이터와 총 개수 조회 (동일 조건 적용)
    const [resultsTemp, total] = await Promise.all([
      this.storyRepository.find({
        relations: channelId
          ? ['User', 'Likes', 'StoryImage', 'Channel']
          : ['User', 'Likes', 'StoryImage'],
        where: baseConditions,
        order: { id: 'DESC' },
        skip: offset,
        take: limit,
      }),
      this.storyRepository.count({
        where: baseConditions,
        relations: channelId ? ['Channel'] : [],
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
      return {
        ...rest,
        recommend_Count,
        imageFlag,
        userId: User.id,
        nickname: User.nickname,
      };
    });

    console.log('ddd', results, total);

    return { results, total };
  }

  /**
   * 수정 페이지
   *
   * @description 특정 게시글을 수정합니다.
   * @param id 게시글 ID
   * @param userId 사용자 ID
   * @returns 수정된 게시글 데이터
   */
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

  /**
   * 상세 페이지
   *
   * @description 특정 게시글의 상세 정보를 조회합니다.
   * @param id 게시글 ID
   * @returns 게시글 상세 정보
   */
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

  /**
   * 글 작성
   *
   * @description 새로운 게시글을 작성합니다.
   * @param createStoryDto 게시글 작성 정보
   * @param userData 사용자 데이터
   * @param files 이미지 파일 목록
   * @returns 작성된 게시글 데이터
   */
  async create(
    createStoryDto: CreateStoryDto,
    userData: User,
    files: Express.Multer.File[],
  ): Promise<Story> {
    const { title, content, category, channelId } = createStoryDto;

    // 채널 ID가 있는 경우 채널 정보 조회
    let channel: Channels | null = null;
    if (channelId) {
      channel = await this.channelsRepository.findOne({
        where: { id: Number(channelId) },
      });

      if (!channel) {
        throw new NotFoundException(
          `ID ${channelId}에 해당하는 채널을 찾을 수 없습니다.`,
        );
      }
    }

    // 이미지를 업로드 하는지 확인
    const imageFlag = files && files.length > 0;

    // Story 엔티티 생성
    const story = this.storyRepository.create({
      category,
      title,
      content,
      User: userData, // 유저데이터를 통으로 넣음
      imageFlag,
      Channel: channel, // 채널 정보 추가
    });

    const savedStory = await this.storyRepository.save(story);

    // 채널의 스토리 카운트 증가
    if (channel) {
      await this.channelsRepository.increment(
        { id: channel.id },
        'story_count',
        1,
      );
    }

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

    // 채널에 게시글이 작성된 경우 알림 구독자들에게 알림 발송
    if (channel) {
      try {
        // 해당 채널의 알림 구독자들 조회
        const subscribers =
          await this.channelNotificationService.getChannelSubscribers(
            channel.id,
          );

        // 각 구독자에게 알림 생성
        for (const subscriber of subscribers) {
          // 자기 자신이 작성한 글에는 알림 보내지 않음
          if (subscriber.id !== userData.id) {
            await this.notificationService.createForChannelPost(
              subscriber,
              savedStory,
              channel,
              userData,
            );
          }
        }

        console.log(
          `📢 채널 ${channel.channel_name}에 새 게시글 알림 발송 완료: ${subscribers.length}명의 구독자`,
        );
      } catch (error) {
        console.error('채널 알림 발송 중 오류 발생:', error);
        // 알림 발송 실패해도 게시글 작성은 성공 처리
      }
    }

    return savedStory;
  }

  /**
   * 공지사항 작성
   *
   * @description 공지사항을 작성합니다.
   * @param createStoryDto 게시글 작성 정보
   * @param userData 사용자 데이터
   * @param files 이미지 파일 목록
   * @returns 작성된 게시글 데이터
   */
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

  /**
   * 글 수정
   *
   * @description 특정 게시글을 수정합니다.
   * @param storyId 게시글 ID
   * @param updateStoryDto 게시글 수정 정보
   * @param userData 사용자 데이터
   * @param newImages 새로운 이미지 파일 목록
   * @returns 수정된 게시글 데이터
   */
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

  /**
   * 글 삭제
   *
   * @description 특정 게시글을 삭제합니다.
   * @param storyId 게시글 ID
   * @param userData 사용자 데이터
   */
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

  /**
   * 트랜잭션 적용된 버전
   *
   * @description 좋아요/싫어요 투표 작업을 하나의 트랜잭션으로 묶어 원자성을 보장합니다.
   * @param storyId 게시글 ID
   * @param userId 사용자 ID
   * @param vote 투표 유형 ('like' | 'dislike')
   * @param minRecommend 최소 추천 수
   * @returns 수행된 작업과 투표 유형
   */
  async storyLikeUnLike(
    storyId: number,
    userId: string,
    vote: 'like' | 'dislike',
    minRecommend: number,
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
        if (updatedStory.like_count >= minRecommend) {
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
        } else if (updatedStory.like_count < minRecommend) {
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

  /**
   * 추천 랭킹 테이블에서 데이터 가져오기
   *
   * @description 추천 랭킹 테이블에서 데이터를 가져옵니다.
   * @param offset 시작 위치 (기본값: 0)
   * @param limit 조회할 게시글 수 (기본값: 10)
   * @param category 카테고리 필터 (선택사항)
   * @param channelId 채널 ID 필터 (선택사항)
   * @returns 추천 랭킹 기반 게시글 목록
   */
  async getRecommendRankings(
    offset = 0,
    limit = 10,
    category?: string,
    channelId?: number,
  ): Promise<{
    results: Partial<Story>[];
    total: number;
  }> {
    console.log(
      '🔥 getRecommendRankings 호출됨 - channelId:',
      channelId,
      'category:',
      category,
      'offset:',
      offset,
      'limit:',
      limit,
    );

    // 1. 추천 랭킹 테이블에서 데이터 조회 (카테고리 필터링 포함)
    const query = this.recommendRankingRepository
      .createQueryBuilder('ranking')
      .leftJoinAndSelect('ranking.Story', 'story')
      .leftJoinAndSelect('story.User', 'user')
      .leftJoinAndSelect('story.StoryImage', 'image')
      .leftJoinAndSelect('story.Channel', 'channel') // 채널 조인 추가
      .orderBy('ranking.recommendCount', 'DESC')
      .skip(offset)
      .take(limit);

    // 카테고리 필터링 적용
    if (category && category !== 'all') {
      query.andWhere('story.category = :category', { category });
    }

    // 채널 필터 적용 - 수정된 조건
    if (channelId) {
      query.andWhere('story.channelId = :channelId', { channelId });
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

    console.log('🔥 최종 반환할 데이터:', results, total);

    return { results, total };
  }

  /**
   * 기존 데이터를 추천 랭킹 테이블로 마이그레이션
   *
   * @description 모든 게시글의 추천 수를 계산하여 조건을 만족하는 게시글을 추천 랭킹 테이블로 이전합니다.
   *
   * 작동 방식:
   * 1. 모든 게시글을 데이터베이스에서 조회
   * 2. 각 게시글의 좋아요/싫어요 수를 계산하여 추천 점수 산출
   * 3. 추천 점수가 최소값 이상인 게시글만 필터링
   * 4. 기존 추천 랭킹 테이블 초기화
   * 5. 조건을 충족하는 게시글을 추천 랭킹 테이블에 등록
   *
   * @param minRecommend 추천 랭킹 테이블에 포함될 최소 추천 수
   * @returns 마이그레이션된 게시글 수
   *
   * @example
   * // 추천 수 5 이상인 게시글만 랭킹 테이블로 이전
   * const migratedCount = await storyService.migrateToRecommendRanking(5);
   *
   * @note 관리자 권한이 필요한 시스템 유지보수용 기능입니다.
   */
  async migrateToRecommendRanking(minRecommend: number): Promise<number> {
    try {
      // 모든 스토리와 연결된 좋아요 데이터 조회
      const stories = await this.storyRepository.find({
        relations: ['Likes'],
      });

      // 추천 수가 최소 기준치 이상인 스토리 필터링
      const eligibleStories = stories.filter((story) => {
        // 각 스토리의 추천 수 계산 (좋아요 - 싫어요)
        const recommendCount = story.Likes.reduce((acc, curr) => {
          if (curr.vote === 'like') return acc + 1;
          if (curr.vote === 'dislike') return acc - 1;
          return acc;
        }, 0);

        return recommendCount >= minRecommend;
      });

      // 기존 추천 랭킹 테이블 초기화
      await this.recommendRankingRepository.clear();

      // 자격을 갖춘 스토리를 랭킹 엔트리로 변환
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

      // 랭킹 엔트리 일괄 저장
      await this.recommendRankingRepository.save(rankingEntries);

      return rankingEntries.length;
    } catch (error) {
      console.error('추천 랭킹 마이그레이션 중 오류 발생:', error);
      throw new Error('추천 랭킹 마이그레이션에 실패했습니다.');
    }
  }

  /**
   * 공지사항 목록 가져오기
   *
   * @description 공지사항만 가져오기 (isNotice가 true인 것만)
   * @param limit 조회할 게시글 수 (기본값: 10)
   * @returns 공지사항 목록과 총 개수
   */
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
