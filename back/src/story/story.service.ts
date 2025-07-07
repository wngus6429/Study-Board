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
import { StoryVideo } from 'src/entities/StoryVideo.entity';
import * as fs from 'fs';
import * as path from 'path';
import { UpdateStoryDto } from './dto/update-story.dto';
import { Comments } from 'src/entities/Comments.entity';
import { Likes } from 'src/entities/Likes.entity';
import { RecommendRanking } from 'src/entities/RecommendRanking.entity';
import { Channels } from 'src/entities/Channels.entity';
import { Report, ReportStatus } from 'src/entities/Report.entity';
import { CreateReportDto } from './dto/create-report.dto';
import { ReviewReportDto } from './dto/review-report.dto';
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
    @InjectRepository(StoryVideo)
    private readonly videoRepository: Repository<StoryVideo>,
    @InjectRepository(User) private userRepository: Repository<User>,
    @InjectRepository(Comments) private commentRepository: Repository<Comments>,
    @InjectRepository(Likes) private likeRepository: Repository<Likes>,
    @InjectRepository(RecommendRanking)
    private recommendRankingRepository: Repository<RecommendRanking>,
    @InjectRepository(Channels)
    private channelsRepository: Repository<Channels>,
    @InjectRepository(Report)
    private reportRepository: Repository<Report>,
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
        videoFlag: story.videoFlag,
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
        videoFlag: story.videoFlag,
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
   * @param type 검색 타입 (title, content, author, comment)
   * @param query 검색어
   * @param category 카테고리 필터 (선택사항)
   * @param channelId 채널 ID 필터 (선택사항)
   * @returns 검색된 게시글 목록과 총 개수
   */
  async searchStory(
    offset = 0,
    limit = 10,
    type: string = 'title',
    query: string,
    category?: string,
    channelId?: number,
  ): Promise<{
    results: (Partial<Story> & {
      nickname: string;
      recommend_Count: number;
      imageFlag: boolean;
      videoFlag: boolean;
    })[];
    total: number;
  }> {
    // 검색어에 대한 like 패턴 생성
    const likeQuery = `%${query}%`;

    // 검색 타입에 따른 기본 조건 구성
    let baseConditions: any;
    if (type === 'title') {
      // 제목 검색
      baseConditions = { title: ILike(likeQuery), isNotice: false };
    } else if (type === 'content') {
      // 내용 검색
      baseConditions = { content: ILike(likeQuery), isNotice: false };
    } else if (type === 'author') {
      // 작성자 검색 (닉네임으로 검색)
      baseConditions = {
        User: { nickname: ILike(likeQuery) },
        isNotice: false,
      };
    } else if (type === 'comment') {
      // 댓글 검색 - 안전한 방식으로 구현
      console.log('🔍 [searchStory] 댓글 검색 시작:', {
        query,
        likeQuery,
        category,
        channelId,
        offset,
        limit,
      });

      try {
        console.log('📝 [searchStory] 1단계: 댓글에서 스토리 ID 찾기 시작');

        // 먼저 댓글이 있는 스토리 ID들을 찾기
        const storyIdsWithComments = await this.commentRepository
          .createQueryBuilder('comment')
          .select('DISTINCT comment.storyId', 'storyId')
          .where('comment.content LIKE :query', { query: likeQuery })
          .getRawMany();

        console.log(
          '📝 [searchStory] 댓글에서 찾은 스토리 ID들:',
          storyIdsWithComments,
        );

        const storyIds = storyIdsWithComments.map((item) => item.storyId);
        console.log('📝 [searchStory] 변환된 스토리 ID 배열:', storyIds);

        if (storyIds.length === 0) {
          console.log('📝 [searchStory] 댓글 검색 결과 없음 - 빈 배열 반환');
          return { results: [], total: 0 };
        }

        // 기본 조건 설정
        let whereCondition: any = {
          id: In(storyIds),
          isNotice: false,
        };

        // 카테고리 필터 추가
        if (category && category !== 'all') {
          whereCondition.category = category;
          console.log('📝 [searchStory] 카테고리 필터 추가:', category);
        }

        // 채널 필터 추가
        if (channelId) {
          whereCondition.Channel = { id: channelId };
          console.log('📝 [searchStory] 채널 필터 추가:', channelId);
        }

        console.log('📝 [searchStory] 최종 where 조건:', whereCondition);
        console.log('📝 [searchStory] 2단계: 스토리 데이터 조회 시작');

        // 데이터 조회
        const [resultsTemp, total] = await Promise.all([
          this.storyRepository.find({
            relations: channelId
              ? ['User', 'Likes', 'StoryImage', 'Channel']
              : ['User', 'Likes', 'StoryImage'],
            where: whereCondition,
            order: { id: 'DESC' },
            skip: offset,
            take: limit,
          }),
          this.storyRepository.count({
            where: whereCondition,
            relations: channelId ? ['Channel'] : [],
          }),
        ]);

        console.log(
          '📝 [searchStory] 조회된 스토리 개수:',
          resultsTemp.length,
          '전체 개수:',
          total,
        );

        const results = resultsTemp.map((story) => {
          const recommend_Count = story.Likes.reduce((acc, curr) => {
            if (curr.vote === 'like') return acc + 1;
            if (curr.vote === 'dislike') return acc - 1;
            return acc;
          }, 0);

          const imageFlag = story.StoryImage.length > 0;

          const { Likes, StoryImage, User, ...rest } = story;
          return {
            ...rest,
            recommend_Count,
            imageFlag,
            videoFlag: story.videoFlag,
            userId: User.id,
            nickname: User.nickname,
          };
        });

        console.log(
          '📝 [searchStory] 댓글 검색 성공:',
          results.length,
          '개 결과 반환',
        );
        return { results, total };
      } catch (error) {
        console.error('❌ [searchStory] 댓글 검색 에러 상세:', {
          error: error.message,
          stack: error.stack,
          query,
          likeQuery,
          category,
          channelId,
          offset,
          limit,
        });
        throw new Error('댓글 검색 중 오류가 발생했습니다.');
      }
    } else {
      // 정의되지 않은 타입의 경우 기본적으로 제목 검색
      baseConditions = { title: ILike(likeQuery), isNotice: false };
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
        videoFlag: story.videoFlag,
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
   * @param type 검색 타입 (title, content, author, comment)
   * @param query 검색어
   * @param category 카테고리 필터 (선택사항)
   * @param channelId 채널 ID 필터 (선택사항)
   * @returns 검색된 게시글 목록과 총 개수
   */
  async cardSearchStory(
    offset = 0,
    limit = 10,
    type: string = 'title',
    query: string,
    category?: string,
    channelId?: number,
  ): Promise<{
    results: (Partial<Story> & {
      nickname: string;
      recommend_Count: number;
      imageFlag: boolean;
      videoFlag: boolean;
    })[];
    total: number;
  }> {
    // 검색어에 대한 like 패턴 생성
    const likeQuery = `%${query}%`;

    // 검색 옵션에 따른 기본 조건 구성 (카테고리 조건은 나중에 병합)
    let baseConditions: any;
    if (type === 'title') {
      // 제목 검색 조건
      baseConditions = { title: ILike(likeQuery), isNotice: false };
    } else if (type === 'content') {
      // 내용 검색 조건
      baseConditions = { content: ILike(likeQuery), isNotice: false };
    } else if (type === 'author') {
      // 작성자(User.nickname) 검색 조건
      baseConditions = {
        User: { nickname: ILike(likeQuery) },
        isNotice: false,
      };
    } else if (type === 'comment') {
      // 댓글 검색 - 안전한 방식으로 구현
      console.log('🔍 [searchStory] 댓글 검색 시작:', {
        query,
        likeQuery,
        category,
        channelId,
        offset,
        limit,
      });

      try {
        console.log('📝 [searchStory] 1단계: 댓글에서 스토리 ID 찾기 시작');

        // 먼저 댓글이 있는 스토리 ID들을 찾기
        const storyIdsWithComments = await this.commentRepository
          .createQueryBuilder('comment')
          .select('DISTINCT comment.storyId', 'storyId')
          .where('comment.content LIKE :query', { query: likeQuery })
          .getRawMany();

        console.log(
          '📝 [searchStory] 댓글에서 찾은 스토리 ID들:',
          storyIdsWithComments,
        );

        const storyIds = storyIdsWithComments.map((item) => item.storyId);
        console.log('📝 [searchStory] 변환된 스토리 ID 배열:', storyIds);

        if (storyIds.length === 0) {
          console.log('📝 [searchStory] 댓글 검색 결과 없음 - 빈 배열 반환');
          return { results: [], total: 0 };
        }

        // 기본 조건 설정
        let whereCondition: any = {
          id: In(storyIds),
          isNotice: false,
        };

        // 카테고리 필터 추가
        if (category && category !== 'all') {
          whereCondition.category = category;
          console.log('📝 [searchStory] 카테고리 필터 추가:', category);
        }

        // 채널 필터 추가
        if (channelId) {
          whereCondition.Channel = { id: channelId };
          console.log('📝 [searchStory] 채널 필터 추가:', channelId);
        }

        console.log('📝 [searchStory] 최종 where 조건:', whereCondition);
        console.log('📝 [searchStory] 2단계: 스토리 데이터 조회 시작');

        // 데이터 조회
        const [resultsTemp, total] = await Promise.all([
          this.storyRepository.find({
            relations: channelId
              ? ['User', 'Likes', 'StoryImage', 'Channel']
              : ['User', 'Likes', 'StoryImage'],
            where: whereCondition,
            order: { id: 'DESC' },
            skip: offset,
            take: limit,
          }),
          this.storyRepository.count({
            where: whereCondition,
            relations: channelId ? ['Channel'] : [],
          }),
        ]);

        console.log(
          '📝 [searchStory] 조회된 스토리 개수:',
          resultsTemp.length,
          '전체 개수:',
          total,
        );

        const results = resultsTemp.map((story) => {
          const recommend_Count = story.Likes.reduce((acc, curr) => {
            if (curr.vote === 'like') return acc + 1;
            if (curr.vote === 'dislike') return acc - 1;
            return acc;
          }, 0);

          const imageFlag = story.StoryImage.length > 0;

          const { Likes, StoryImage, User, ...rest } = story;
          return {
            ...rest,
            recommend_Count,
            imageFlag,
            videoFlag: story.videoFlag,
            userId: User.id,
            nickname: User.nickname,
          };
        });

        console.log(
          '📝 [searchStory] 댓글 검색 성공:',
          results.length,
          '개 결과 반환',
        );
        return { results, total };
      } catch (error) {
        console.error('❌ [searchStory] 댓글 검색 에러 상세:', {
          error: error.message,
          stack: error.stack,
          query,
          likeQuery,
          category,
          channelId,
          offset,
          limit,
        });
        throw new Error('댓글 검색 중 오류가 발생했습니다.');
      }
    } else {
      // 정의되지 않은 타입의 경우 기본적으로 제목 검색
      baseConditions = { title: ILike(likeQuery), isNotice: false };
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
        videoFlag: story.videoFlag,
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
      relations: ['StoryImage', 'StoryVideo', 'User', 'Channel'],
    });
    if (!findData) {
      throw new NotFoundException(`Story with ID ${id} not found`);
    }
    // 수정 권한 확인
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
          'StoryVideo',
          'User',
          'User.UserImage',
          'Likes',
          'Likes.User', // Likes와 연결된 User 정보 포함
        ],
        order: {
          StoryImage: { created_at: 'ASC' },
          StoryVideo: { created_at: 'ASC' },
        },
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
        relations: ['StoryImage', 'StoryVideo', 'User', 'User.UserImage'],
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

    // 이미지와 동영상 업로드 여부 확인
    const imageFiles = files
      ? files.filter((file) => file.mimetype.startsWith('image/'))
      : [];
    const videoFiles = files
      ? files.filter((file) => file.mimetype.startsWith('video/'))
      : [];
    const imageFlag = imageFiles.length > 0;
    const videoFlag = videoFiles.length > 0;

    // Story 엔티티 생성
    const story = this.storyRepository.create({
      category,
      title,
      content,
      User: userData, // 유저데이터를 통으로 넣음
      imageFlag,
      videoFlag,
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

    console.log('글 작성 파일 업로드', files);

    // 파일 업로드 순서 처리 - 전체 파일 배열에서의 순서를 기준으로 설정
    if (files && files.length > 0) {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        if (file.mimetype.startsWith('image/')) {
          const imageEntity = new StoryImage();
          imageEntity.image_name = file.filename;
          imageEntity.link = (file as any).location;
          imageEntity.file_size = file.size;
          imageEntity.mime_type = file.mimetype;
          // imageEntity.upload_order = i; // 전체 파일 배열에서의 순서 (tiptap 사용으로 불필요)
          imageEntity.Story = savedStory;

          await this.imageRepository.save(imageEntity);
        } else if (file.mimetype.startsWith('video/')) {
          const videoEntity = new StoryVideo();
          videoEntity.video_name = file.filename;
          videoEntity.link = (file as any).location;
          videoEntity.file_size = file.size;
          videoEntity.mime_type = file.mimetype;
          // videoEntity.upload_order = i; // 전체 파일 배열에서의 순서 (tiptap 사용으로 불필요)
          videoEntity.Story = savedStory;

          await this.videoRepository.save(videoEntity);
        }
      }
    }

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
    const { title, content, channelId } = createStoryDto;

    // 채널 ID가 있는 경우 채널 정보 조회 및 권한 확인
    let channel: Channels | null = null;
    if (channelId) {
      channel = await this.channelsRepository.findOne({
        where: { id: Number(channelId) },
        relations: ['creator'],
      });

      if (!channel) {
        throw new NotFoundException(
          `ID ${channelId}에 해당하는 채널을 찾을 수 없습니다.`,
        );
      }

      // 채널 소유자만 공지사항 작성 가능
      if (channel.creator.id !== userData.id) {
        throw new ForbiddenException(
          '해당 채널의 소유자만 공지사항을 작성할 수 있습니다.',
        );
      }
    }
    // 이미지와 동영상 업로드 여부 확인
    const noticeImageFiles = files
      ? files.filter((file) => file.mimetype.startsWith('image/'))
      : [];
    const noticeVideoFiles = files
      ? files.filter((file) => file.mimetype.startsWith('video/'))
      : [];
    const imageFlag = noticeImageFiles.length > 0;
    const videoFlag = noticeVideoFiles.length > 0;

    // Story 엔티티 생성 (공지사항은 category를 "notice"로 고정, isNotice를 true로 설정)
    const story = this.storyRepository.create({
      category: 'notice',
      title,
      content,
      User: userData,
      imageFlag,
      videoFlag,
      isNotice: true, // 공지사항 플래그 설정
      Channel: channel, // 채널 정보 추가
    });

    const savedStory = await this.storyRepository.save(story);

    console.log('공지사항 작성 파일 업로드', files);

    // 이미지 파일 처리
    if (noticeImageFiles.length > 0) {
      const imageEntities = noticeImageFiles.map((file) => {
        const imageEntity = new StoryImage();
        imageEntity.image_name = file.filename;
        imageEntity.link = (file as any).location;
        imageEntity.file_size = file.size;
        imageEntity.mime_type = file.mimetype;
        imageEntity.Story = savedStory;
        return imageEntity;
      });

      console.log('공지사항 작성 저장 전 이미지 엔티티:', imageEntities);
      await this.imageRepository.save(imageEntities);
    }

    // 동영상 파일 처리
    if (noticeVideoFiles.length > 0) {
      const videoEntities = noticeVideoFiles.map((file) => {
        const videoEntity = new StoryVideo();
        videoEntity.video_name = file.filename;
        videoEntity.link = (file as any).location;
        videoEntity.file_size = file.size;
        videoEntity.mime_type = file.mimetype;
        videoEntity.Story = savedStory;
        return videoEntity;
      });

      console.log('공지사항 작성 저장 전 동영상 엔티티:', videoEntities);
      await this.videoRepository.save(videoEntities);
    }

    return savedStory;
  }

  /**
   * 글 수정
   *
   * @description 특정 게시글을 수정합니다.
   * @param storyId 게시글 ID
   * @param updateStoryDto 게시글 수정 정보
   * @param userData 사용자 데이터
   * @param newFiles 새로운 파일 목록 (이미지/동영상)
   * @returns 수정된 게시글 데이터
   */
  async updateStory(
    storyId: number,
    updateStoryDto: any,
    userData: User,
    newFiles: Express.Multer.File[],
  ): Promise<Story> {
    const story = await this.storyRepository.findOne({
      where: { id: storyId },
      relations: ['StoryImage', 'StoryVideo', 'User'],
    });

    if (!story) {
      throw new NotFoundException('수정할 글을 찾을 수 없습니다.');
    }

    // 권한 확인
    if (story.User.id !== userData.id) {
      throw new ForbiddenException('본인의 글만 수정할 수 있습니다.');
    }

    // content에서 실제 사용되는 파일들 분석
    const content = updateStoryDto.content || '';

    console.log('🔍 [updateStory] 분석할 content:', content);
    console.log(
      '🔍 [updateStory] 기존 StoryVideo:',
      story.StoryVideo?.map((v) => v.video_name),
    );

    // content에서 사용되는 이미지 파일명들 추출
    const usedImagePaths = [];
    const imageMatches = content.match(/src="[^"]*\/upload\/([^"]+)"/g);
    if (imageMatches) {
      imageMatches.forEach((match) => {
        const pathMatch = match.match(/\/upload\/([^"]+)/);
        if (pathMatch) {
          usedImagePaths.push(pathMatch[1]);
        }
      });
    }

    // content에서 사용되는 동영상 파일명들 추출
    const usedVideoPaths = [];

    // 1. video 태그의 src 속성에서 동영상 파일 찾기
    const videoMatches = content.match(/src="[^"]*\/videoUpload\/([^"]+)"/g);
    console.log('🔍 [updateStory] video src 매치:', videoMatches);
    if (videoMatches) {
      videoMatches.forEach((match) => {
        const pathMatch = match.match(/\/videoUpload\/([^"]+)/);
        if (pathMatch) {
          usedVideoPaths.push(pathMatch[1]);
        }
      });
    }

    // 2. source 태그의 src 속성에서도 동영상 파일 찾기 (자체 닫는 태그 포함)
    const sourceMatches = content.match(
      /<source[^>]*src="[^"]*\/videoUpload\/([^"]+)"[^>]*\/?>/g,
    );
    console.log('🔍 [updateStory] source src 매치:', sourceMatches);
    if (sourceMatches) {
      sourceMatches.forEach((match) => {
        const pathMatch = match.match(/\/videoUpload\/([^"]+)/);
        if (pathMatch) {
          // 중복 제거
          if (!usedVideoPaths.includes(pathMatch[1])) {
            usedVideoPaths.push(pathMatch[1]);
          }
        }
      });
    }

    // 3. 파일명 직접 언급된 경우도 찾기 (p 태그 내의 파일명)
    if (story.StoryVideo && story.StoryVideo.length > 0) {
      story.StoryVideo.forEach((video) => {
        // content에 파일명이 직접 언급되어 있는지 확인
        if (content.includes(video.video_name)) {
          if (!usedVideoPaths.includes(video.video_name)) {
            usedVideoPaths.push(video.video_name);
            console.log(
              `🔍 [updateStory] 파일명으로 추가된 동영상: ${video.video_name}`,
            );
          }
        }
      });
    }

    console.log('사용되는 이미지 파일들:', usedImagePaths);
    console.log('사용되는 동영상 파일들:', usedVideoPaths);

    // 삭제할 이미지 찾기 (content에서 사용되지 않는 것들)
    const imagesToDelete = story.StoryImage.filter(
      (img) => !usedImagePaths.includes(img.image_name),
    );

    // 삭제할 동영상 찾기 (content에서 사용되지 않는 것들)
    const videosToDelete = story.StoryVideo.filter(
      (video) => !usedVideoPaths.includes(video.video_name),
    );

    console.log(
      '삭제할 이미지들:',
      imagesToDelete.map((img) => img.image_name),
    );
    console.log(
      '삭제할 동영상들:',
      videosToDelete.map((video) => video.video_name),
    );

    // 추가 디버깅: 각 동영상이 왜 삭제 대상이 되는지 확인
    if (story.StoryVideo && story.StoryVideo.length > 0) {
      console.log('=== 동영상 삭제 여부 상세 분석 ===');
      story.StoryVideo.forEach((video) => {
        const isUsed = usedVideoPaths.includes(video.video_name);
        console.log(
          `동영상 "${video.video_name}": ${isUsed ? '사용됨' : '삭제 대상'}`,
        );
        if (!isUsed) {
          console.log(
            `  - content에서 "${video.video_name}" 검색 결과:`,
            content.includes(video.video_name),
          );
          console.log(
            `  - content에서 "/videoUpload/${video.video_name}" 검색 결과:`,
            content.includes(`/videoUpload/${video.video_name}`),
          );
        }
      });
      console.log('=== 동영상 분석 완료 ===');
    }

    // 이미지 파일 삭제
    if (imagesToDelete.length > 0) {
      for (const image of imagesToDelete) {
        // 파일 시스템에서 이미지 파일 삭제
        const filePath = path.join(__dirname, '../../upload', image.image_name);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }
      // 데이터베이스에서 이미지 삭제
      await this.imageRepository.remove(imagesToDelete);
    }

    // 동영상 파일 삭제
    if (videosToDelete.length > 0) {
      for (const video of videosToDelete) {
        // 파일 시스템에서 동영상 파일 삭제
        const filePath = path.join(
          __dirname,
          '../../videoUpload',
          video.video_name,
        );
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }
      // 데이터베이스에서 동영상 삭제
      await this.videoRepository.remove(videosToDelete);
    }

    // 새 파일 추가 및 content 업데이트
    let updatedContent = content;
    if (newFiles && newFiles.length > 0) {
      // 현재 최대 업로드 순서 찾기
      // const remainingImages = story.StoryImage.filter(
      //   (img) => !imagesToDelete.includes(img),
      // );
      // const remainingVideos = story.StoryVideo.filter(
      //   (video) => !videosToDelete.includes(video),
      // );

      // // upload_order 대신 created_at 기반으로 순서 관리 (tiptap 사용으로 불필요)
      // const maxOrder = 0;

      // 파일을 이미지와 동영상으로 분리
      const imageFiles = newFiles.filter((file) =>
        file.mimetype.startsWith('image/'),
      );
      const videoFiles = newFiles.filter((file) =>
        file.mimetype.startsWith('video/'),
      );

      // 이미지 파일 처리
      if (imageFiles.length > 0) {
        const imageEntities = imageFiles.map((file, index) => {
          const imageEntity = new StoryImage();
          imageEntity.image_name = file.filename;
          imageEntity.link = (file as any).location;
          imageEntity.file_size = file.size;
          imageEntity.mime_type = file.mimetype;
          // imageEntity.upload_order = maxOrder + 1 + index; // tiptap 사용으로 불필요
          imageEntity.Story = story;
          return imageEntity;
        });

        await this.imageRepository.save(imageEntities);

        // content에서 빈 src를 새 파일 경로로 교체
        imageFiles.forEach((file) => {
          updatedContent = updatedContent.replace(
            /src=""/,
            `src="/upload/${file.filename}"`,
          );
        });
      }

      // 동영상 파일 처리
      if (videoFiles.length > 0) {
        const videoEntities = videoFiles.map((file, index) => {
          const videoEntity = new StoryVideo();
          videoEntity.video_name = file.filename;
          videoEntity.link = (file as any).location;
          videoEntity.file_size = file.size;
          videoEntity.mime_type = file.mimetype;
          // videoEntity.upload_order = maxOrder + 1 + imageFiles.length + index; // tiptap 사용으로 불필요
          videoEntity.Story = story;
          return videoEntity;
        });

        await this.videoRepository.save(videoEntities);

        // content에서 빈 src를 새 파일 경로로 교체
        videoFiles.forEach((file) => {
          updatedContent = updatedContent.replace(
            /src=""/,
            `src="/videoUpload/${file.filename}"`,
          );
        });
      }
    }

    console.log('최종 업데이트될 컨텐츠:', updatedContent);

    // 제목, 내용, 카테고리 업데이트
    Object.assign(story, {
      title: updateStoryDto.title,
      content: updatedContent, // 새 파일 경로가 반영된 content 사용
      category: updateStoryDto.category,
    });

    // 최신 파일 정보로 관계 업데이트
    const updatedImages = await this.imageRepository.find({
      where: { Story: { id: storyId } },
      order: { created_at: 'ASC' },
    });
    const updatedVideos = await this.videoRepository.find({
      where: { Story: { id: storyId } },
      order: { created_at: 'ASC' },
    });

    story.StoryImage = updatedImages;
    story.StoryVideo = updatedVideos;

    // 플래그 업데이트
    story.imageFlag = updatedImages.length > 0;
    story.videoFlag = updatedVideos.length > 0;

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
      relations: [
        'StoryImage',
        'StoryVideo',
        'User',
        'Channel',
        'Channel.creator',
      ], // 채널과 채널 소유자 정보도 함께 가져오기
    });

    // 글이 존재하지 않으면 에러 발생
    if (!story) {
      throw new NotFoundException('삭제된 글입니다.');
    }

    // 공지사항인 경우 권한 확인
    if (story.isNotice) {
      if (story.Channel) {
        // 채널의 공지사항인 경우: 채널 소유자만 삭제 가능
        if (story.Channel.creator.id !== userData.id) {
          throw new ForbiddenException(
            '채널 소유자만 해당 공지사항을 삭제할 수 있습니다.',
          );
        }
      } else {
        // 전체 사이트 공지사항인 경우: 관리자만 삭제 가능 (필요시 추가 권한 체크)
        if (story.User.id !== userData.id) {
          throw new ForbiddenException('본인의 공지사항만 삭제할 수 있습니다.');
        }
      }
    } else {
      // 일반 게시글인 경우: 작성자만 삭제 가능
      if (story.User.id !== userData.id) {
        throw new ForbiddenException('본인의 글만 삭제할 수 있습니다.');
      }
    }

    // 이미지 파일 삭제
    if (story.StoryImage && story.StoryImage.length > 0) {
      story.StoryImage.forEach((image) => {
        const filePath = path.join(__dirname, '../../upload', image.image_name);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath); // 파일 삭제
        }
      });
    }

    // 동영상 파일 삭제
    if (story.StoryVideo && story.StoryVideo.length > 0) {
      story.StoryVideo.forEach((video) => {
        const filePath = path.join(
          __dirname,
          '../../videoUpload',
          video.video_name,
        );
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath); // 파일 삭제
        }
      });
    }

    // 일반 게시글인 경우만 채널의 스토리 카운트 감소 (공지사항 제외)
    if (story.Channel && !story.isNotice) {
      await this.channelsRepository.decrement(
        { id: story.Channel.id },
        'story_count',
        1,
      );
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
        videoFlag: story.videoFlag,
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
   * @description 공지사항만 가져오기 (isNotice가 true인 것만). 채널별 필터링 지원.
   * @param limit 조회할 게시글 수 (기본값: 10)
   * @param channelId 채널 ID (선택사항) - 특정 채널의 공지사항만 조회
   * @returns 공지사항 목록과 총 개수
   */
  async findNotices(
    limit = 10,
    channelId?: number,
  ): Promise<{
    results: Partial<Story>[];
    total: number;
  }> {
    // where 조건을 동적으로 구성
    const whereCondition: any = { isNotice: true };

    if (channelId) {
      // 특정 채널의 공지사항만 가져오기
      whereCondition.Channel = { id: channelId };
    }

    // 공지사항만 가져오기 (isNotice가 true인 것만)
    const [notices, total] = await this.storyRepository.findAndCount({
      where: whereCondition,
      relations: ['User', 'Channel'],
      order: { id: 'DESC' },
      take: limit,
    });

    console.log(
      `📢 공지사항 조회 - 채널ID: ${channelId}, 총 ${total}개, 결과 ${notices.length}개`,
    );

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

  // ========== 신고 관련 메서드들 ==========

  /**
   * 게시글 신고
   *
   * @description 특정 게시글을 신고합니다. 자신이 작성한 글은 신고할 수 없습니다.
   * @param storyId 신고할 게시글 ID
   * @param reporterUserId 신고자 사용자 ID
   * @param createReportDto 신고 정보 (사유, 기타 내용)
   * @returns 생성된 신고 정보
   */
  async reportStory(
    storyId: number,
    reporterUserIdStr: string,
    createReportDto: CreateReportDto,
  ): Promise<Report> {
    // 게시글 존재 여부 확인
    const story = await this.storyRepository.findOne({
      where: { id: storyId },
      relations: ['User'],
    });

    if (!story) {
      throw new NotFoundException('게시글을 찾을 수 없습니다.');
    }

    // 자신이 작성한 글은 신고할 수 없음
    if (story.User.id === reporterUserIdStr) {
      throw new BadRequestException('자신이 작성한 글은 신고할 수 없습니다.');
    }

    // 이미 신고한 게시글인지 확인
    const existingReport = await this.reportRepository.findOne({
      where: {
        story_id: storyId,
        reporter_id: reporterUserIdStr,
      },
    });

    if (existingReport) {
      throw new BadRequestException('이미 신고한 게시글입니다.');
    }

    // 신고 데이터 생성
    const report = this.reportRepository.create({
      story_id: storyId,
      reporter_id: reporterUserIdStr,
      reason: createReportDto.reason,
      custom_reason: createReportDto.custom_reason,
      status: ReportStatus.PENDING,
    });

    // 신고 저장
    const savedReport = await this.reportRepository.save(report);

    console.log(
      `🚨 신고 접수 - 게시글ID: ${storyId}, 신고자ID: ${reporterUserIdStr}, 사유: ${createReportDto.reason}`,
    );

    return savedReport;
  }

  /**
   * 신고 목록 조회 (관리자용)
   *
   * @description 관리자가 신고 목록을 조회합니다.
   * @param offset 시작 위치 (기본값: 0)
   * @param limit 조회할 신고 수 (기본값: 20)
   * @param status 처리 상태 필터 (선택사항)
   * @returns 신고 목록과 총 개수
   */
  async getReports(
    offset = 0,
    limit = 20,
    status?: ReportStatus,
  ): Promise<{
    reports: any[];
    total: number;
  }> {
    const query = this.reportRepository
      .createQueryBuilder('report')
      .leftJoinAndSelect('report.story', 'story')
      .leftJoinAndSelect('story.User', 'storyUser')
      .leftJoinAndSelect('report.reporter', 'reporter')
      .leftJoinAndSelect('report.reviewer', 'reviewer')
      .orderBy('report.created_at', 'DESC')
      .skip(offset)
      .take(limit);

    // 상태 필터 적용
    if (status) {
      query.andWhere('report.status = :status', { status });
    }

    const [reports, total] = await query.getManyAndCount();

    // 결과 데이터 가공
    const results = reports.map((report) => ({
      id: report.id,
      reason: report.reason,
      custom_reason: report.custom_reason,
      status: report.status,
      admin_comment: report.admin_comment,
      created_at: report.created_at,
      reviewed_at: report.reviewed_at,
      story: {
        id: report.story.id,
        title: report.story.title,
        content: report.story.content.substring(0, 100) + '...',
        category: report.story.category,
        created_at: report.story.created_at,
        author: report.story.User?.nickname,
      },
      reporter: {
        id: report.reporter.id,
        nickname: report.reporter.nickname,
      },
      reviewer: report.reviewer
        ? {
            id: report.reviewer.id,
            nickname: report.reviewer.nickname,
          }
        : null,
    }));

    console.log('🔥 신고 목록 조회 결과:', results);

    return { reports: results, total };
  }

  /**
   * 신고 검토 및 처리 (관리자용)
   *
   * @description 관리자가 신고를 검토하고 처리합니다.
   * @param reportId 신고 ID
   * @param reviewerId 검토자(관리자) ID
   * @param reviewReportDto 검토 정보
   * @returns 업데이트된 신고 정보
   */
  async reviewReport(
    reportId: number,
    reviewerIdStr: string,
    reviewReportDto: ReviewReportDto,
  ): Promise<Report> {
    // 신고 존재 여부 확인
    const report = await this.reportRepository.findOne({
      where: { id: reportId },
    });

    if (!report) {
      throw new NotFoundException('신고를 찾을 수 없습니다.');
    }

    // 신고 상태 업데이트
    report.status = reviewReportDto.status;
    report.admin_comment = reviewReportDto.admin_comment;
    report.reviewed_by = reviewerIdStr;
    report.reviewed_at = new Date();

    // 신고가 승인된 경우 해당 게시글을 삭제할지 결정
    if (reviewReportDto.status === ReportStatus.APPROVED) {
      // 여기서 게시글 삭제 로직을 추가할 수 있음
      // 예: await this.deleteStory(report.story_id, adminUser);
      console.log(`⚠️ 신고 승인됨 - 게시글 ID ${report.story_id} 처리 필요`);
    }

    const updatedReport = await this.reportRepository.save(report);

    console.log(
      `✅ 신고 검토 완료 - 신고ID: ${reportId}, 상태: ${reviewReportDto.status}, 검토자ID: ${reviewerIdStr}`,
    );

    return updatedReport;
  }

  /**
   * 특정 게시글의 신고 현황 조회
   *
   * @description 특정 게시글에 대한 신고 현황을 조회합니다.
   * @param storyId 게시글 ID
   * @returns 신고 현황 정보
   */
  async getStoryReports(storyId: number): Promise<{
    total: number;
    pending: number;
    approved: number;
    rejected: number;
    reports: any[];
  }> {
    const reports = await this.reportRepository.find({
      where: { story_id: storyId },
      relations: ['reporter'],
      order: { created_at: 'DESC' },
    });

    const total = reports.length;
    const pending = reports.filter(
      (r) => r.status === ReportStatus.PENDING,
    ).length;
    const approved = reports.filter(
      (r) => r.status === ReportStatus.APPROVED,
    ).length;
    const rejected = reports.filter(
      (r) => r.status === ReportStatus.REJECTED,
    ).length;

    const reportDetails = reports.map((report) => ({
      id: report.id,
      reason: report.reason,
      custom_reason: report.custom_reason,
      status: report.status,
      created_at: report.created_at,
      reporter: {
        id: report.reporter.id,
        nickname: report.reporter.nickname,
      },
    }));

    return {
      total,
      pending,
      approved,
      rejected,
      reports: reportDetails,
    };
  }

  /**
   * 관리자가 신고된 게시글 삭제
   *
   * @description 관리자가 신고를 검토한 후 해당 게시글을 삭제합니다.
   * @param storyId 삭제할 게시글 ID
   * @param adminUserId 관리자 사용자 ID
   * @returns 삭제 성공 여부
   */
  async deleteReportedStory(
    storyId: number,
    adminUserIdStr: string,
  ): Promise<void> {
    // 게시글 존재 여부 확인
    const story = await this.storyRepository.findOne({
      where: { id: storyId },
    });

    if (!story) {
      throw new NotFoundException('게시글을 찾을 수 없습니다.');
    }

    // 관리자 권한 확인 (이메일 기반)
    const adminUser = await this.userRepository.findOne({
      where: { id: adminUserIdStr },
    });

    if (!adminUser || adminUser.user_email !== 'admin@example.com') {
      throw new ForbiddenException('관리자 권한이 필요합니다.');
    }

    // 게시글과 관련된 모든 데이터 삭제 (cascade로 처리됨)
    await this.storyRepository.remove(story);

    // 해당 게시글의 모든 신고를 승인 상태로 변경
    await this.reportRepository.update(
      { story_id: storyId },
      {
        status: ReportStatus.APPROVED,
        reviewed_by: adminUserIdStr,
        reviewed_at: new Date(),
        admin_comment: '신고 검토 후 게시글 삭제됨',
      },
    );

    console.log(
      `🗑️ 신고된 게시글 삭제 완료 - 게시글ID: ${storyId}, 관리자ID: ${adminUserIdStr}`,
    );
  }

  // ========== 관리자 전용 삭제 기능들 ==========

  /**
   * 관리자 권한으로 게시글 강제 삭제 (총 관리자 전용)
   *
   * @description 총 관리자가 모든 게시글을 강제 삭제할 수 있습니다. 작성자 권한 확인 없이 삭제됩니다.
   * @param storyId 삭제할 게시글 ID
   * @param adminUserId 관리자 사용자 ID
   * @returns 삭제 성공 여부
   */
  async forceDeleteStory(
    storyId: number,
    adminUserIdStr: string,
  ): Promise<void> {
    // 게시글 존재 여부 확인
    const story = await this.storyRepository.findOne({
      where: { id: storyId },
      relations: ['User'],
    });

    if (!story) {
      throw new NotFoundException('게시글을 찾을 수 없습니다.');
    }

    // 관리자 권한 확인 (is_super_admin 필드 확인)
    const adminUser = await this.userRepository.findOne({
      where: { id: adminUserIdStr },
      select: ['id', 'user_email', 'is_super_admin'],
    });

    if (!adminUser || !adminUser.is_super_admin) {
      throw new ForbiddenException('총 관리자 권한이 필요합니다.');
    }

    // 게시글과 관련된 모든 데이터 삭제 (cascade로 처리됨)
    await this.storyRepository.remove(story);

    console.log(
      `🛡️ 관리자 강제 삭제 완료 - 게시글ID: ${storyId}, 제목: "${story.title}", 작성자: ${story.User.nickname}, 관리자: ${adminUser.user_email}`,
    );
  }

  /**
   * 채널 관리자 권한으로 게시글 삭제 (채널 관리자 전용)
   *
   * @description 채널 관리자가 본인 채널의 게시글을 삭제할 수 있습니다.
   * @param storyId 삭제할 게시글 ID
   * @param adminUserId 관리자 사용자 ID
   * @returns 삭제 성공 여부
   */
  async channelAdminDeleteStory(
    storyId: number,
    adminUserIdStr: string,
  ): Promise<void> {
    // 게시글 존재 여부 확인 (채널 정보 포함)
    const story = await this.storyRepository.findOne({
      where: { id: storyId },
      relations: ['User', 'Channel', 'Channel.creator'],
    });

    if (!story) {
      throw new NotFoundException('게시글을 찾을 수 없습니다.');
    }

    if (!story.Channel) {
      throw new BadRequestException('채널이 없는 게시글입니다.');
    }

    // 관리자 권한 확인 (총 관리자이거나 해당 채널의 생성자)
    const adminUser = await this.userRepository.findOne({
      where: { id: adminUserIdStr },
      select: ['id', 'user_email', 'is_super_admin'],
    });

    if (!adminUser) {
      throw new ForbiddenException('사용자를 찾을 수 없습니다.');
    }

    // 총 관리자이거나 해당 채널의 생성자인지 확인
    const isChannelCreator = story.Channel.creator.id === adminUserIdStr;
    const isSuperAdmin = adminUser.is_super_admin;

    if (!isChannelCreator && !isSuperAdmin) {
      throw new ForbiddenException(
        '이 채널의 관리자 권한이 필요합니다. 채널 생성자만 삭제할 수 있습니다.',
      );
    }

    // 게시글과 관련된 모든 데이터 삭제 (cascade로 처리됨)
    await this.storyRepository.remove(story);

    console.log(
      `🏗️ 채널 관리자 삭제 완료 - 게시글ID: ${storyId}, 채널: "${story.Channel.channel_name}", 관리자: ${adminUser.user_email}, 권한: ${isSuperAdmin ? '총관리자' : '채널생성자'}`,
    );
  }

  /**
   * 관리자 권한으로 여러 게시글 일괄 삭제 (총 관리자 전용)
   *
   * @description 총 관리자가 여러 게시글을 한 번에 삭제할 수 있습니다.
   * @param storyIds 삭제할 게시글 ID 목록
   * @param adminUserId 관리자 사용자 ID
   * @returns 삭제된 게시글 개수
   */
  async batchDeleteStories(
    storyIds: number[],
    adminUserIdStr: string,
  ): Promise<number> {
    if (!storyIds || storyIds.length === 0) {
      throw new BadRequestException('삭제할 게시글 ID 목록이 비어있습니다.');
    }

    // 관리자 권한 확인 (is_super_admin 필드 확인)
    const adminUser = await this.userRepository.findOne({
      where: { id: adminUserIdStr },
      select: ['id', 'user_email', 'is_super_admin'],
    });

    if (!adminUser || !adminUser.is_super_admin) {
      throw new ForbiddenException('총 관리자 권한이 필요합니다.');
    }

    // 존재하는 게시글들 조회
    const stories = await this.storyRepository.find({
      where: { id: In(storyIds) },
      relations: ['User'],
    });

    if (stories.length === 0) {
      throw new NotFoundException('삭제할 게시글을 찾을 수 없습니다.');
    }

    // 게시글들 일괄 삭제
    await this.storyRepository.remove(stories);

    console.log(
      `🔄 일괄 삭제 완료 - 요청: ${storyIds.length}개, 실제 삭제: ${stories.length}개, 관리자: ${adminUser.user_email}`,
    );

    // 삭제된 게시글 정보 로그
    stories.forEach((story) => {
      console.log(
        `   - 삭제된 게시글: ID ${story.id}, 제목: "${story.title}", 작성자: ${story.User.nickname}`,
      );
    });

    return stories.length;
  }
}
