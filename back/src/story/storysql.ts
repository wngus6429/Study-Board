import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { CreateStoryDto } from './dto/create-story.dto';
import { UpdateStoryDto } from './dto/update-story.dto';
import { User } from 'src/entities/aUser.entity';

/**
 * Story SQL 서비스 - 순수 SQL 버전
 * TypeORM 대신 순수 SQL을 사용하여 게시글 관련 비즈니스 로직을 처리합니다.
 *
 * @description 기존 story.service.ts와 동일한 기능을 순수 SQL로 구현
 * @author StudyBoard Team
 */
@Injectable()
export class StorySqlService {
  constructor(
    @InjectDataSource()
    private dataSource: DataSource,
  ) {}

  /**
   * 테이블 형태 게시글 목록 조회 - SQL 버전
   *
   * TypeORM 버전과 비교:
   * - TypeORM: this.storyRepository.find({ relations: ['User'], where: whereCondition })
   * - SQL: JOIN을 사용한 직접적인 테이블 조합
   */
  async findStory(
    offset = 0,
    limit = 10,
    category?: string,
    channelId?: number,
  ): Promise<{
    results: any[];
    total: number;
  }> {
    // WHERE 조건 구성
    let whereClause = `WHERE s.isNotice = false`;
    const params: any[] = [];
    let paramIndex = 1;

    if (category && category !== 'all') {
      whereClause += ` AND s.category = $${paramIndex}`;
      params.push(category);
      paramIndex++;
    }

    if (channelId) {
      whereClause += ` AND s.channelId = $${paramIndex}`;
      params.push(Number(channelId));
      paramIndex++;
    }

    // 전체 개수 조회 SQL
    const countSql = `
      SELECT COUNT(*) as total
      FROM story s
      LEFT JOIN channels c ON s.channelId = c.id
      ${whereClause}
    `;

    // 게시글 목록 조회 SQL
    const listSql = `
      SELECT 
        s.id,
        s.category,
        s.title,
        s.content,
        s.like_count,
        s.read_count,
        s.comment_count,
        s.imageFlag,
        s.videoFlag,
        s.created_at,
        s.updated_at,
        s.isNotice,
        u.id as userId,
        u.nickname,
        c.id as channelId,
        c.channel_name
      FROM story s
      LEFT JOIN user u ON s.userId = u.id
      LEFT JOIN channels c ON s.channelId = c.id
      ${whereClause}
      ORDER BY s.id DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    params.push(limit, offset);

    // SQL 실행
    const [countResult, listResult] = await Promise.all([
      this.dataSource.query(countSql, params.slice(0, -2)), // limit, offset 제외
      this.dataSource.query(listSql, params),
    ]);

    const total = parseInt(countResult[0]?.total || '0');

    // 결과 가공
    const results = listResult.map((row: any) => ({
      id: row.id,
      category: row.category,
      title: row.title,
      content: row.content,
      recommend_Count: row.like_count,
      read_count: row.read_count,
      comment_count: row.comment_count,
      imageFlag: row.imageflag,
      videoFlag: row.videoflag,
      created_at: row.created_at,
      updated_at: row.updated_at,
      isNotice: row.isnotice,
      userId: row.userid,
      nickname: row.nickname,
    }));

    return { results, total };
  }

  /**
   * 카드 형태 게시글 목록 조회 - SQL 버전
   *
   * TypeORM과의 차이점:
   * - TypeORM: relations: ['User', 'StoryImage']로 관계 로딩
   * - SQL: LEFT JOIN으로 첫 번째 이미지만 서브쿼리로 가져오기
   */
  async findCardStory(
    offset = 0,
    limit = 10,
    category?: string,
    channelId?: number,
  ): Promise<{
    results: any[];
    total: number;
  }> {
    let whereClause = `WHERE s.isNotice = false`;
    const params: any[] = [];
    let paramIndex = 1;

    if (category && category !== 'all') {
      whereClause += ` AND s.category = $${paramIndex}`;
      params.push(category);
      paramIndex++;
    }

    if (channelId) {
      whereClause += ` AND s.channelId = $${paramIndex}`;
      params.push(Number(channelId));
      paramIndex++;
    }

    // 전체 개수 조회
    const countSql = `
      SELECT COUNT(*) as total
      FROM story s
      ${whereClause}
    `;

    // 첫 번째 이미지와 함께 게시글 조회
    const listSql = `
      SELECT 
        s.id,
        s.category,
        s.title,
        s.content,
        s.like_count,
        s.read_count,
        s.comment_count,
        s.imageFlag,
        s.videoFlag,
        s.created_at,
        s.updated_at,
        u.id as userId,
        u.nickname,
        -- 첫 번째 이미지 정보 (서브쿼리로 가져오기)
        (
          SELECT json_build_object(
            'id', si.id,
            'image_name', si.image_name,
            'link', si.link,
            'created_at', si.created_at
          )
          FROM story_image si 
          WHERE si.storyId = s.id 
          ORDER BY si.created_at ASC 
          LIMIT 1
        ) as firstImage
      FROM story s
      LEFT JOIN user u ON s.userId = u.id
      ${whereClause}
      ORDER BY s.id DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    params.push(limit, offset);

    const [countResult, listResult] = await Promise.all([
      this.dataSource.query(countSql, params.slice(0, -2)),
      this.dataSource.query(listSql, params),
    ]);

    const total = parseInt(countResult[0]?.total || '0');

    const results = listResult.map((row: any) => ({
      id: row.id,
      category: row.category,
      title: row.title,
      content: row.content,
      recommend_Count: row.like_count,
      read_count: row.read_count,
      comment_count: row.comment_count,
      imageFlag: row.imageflag,
      videoFlag: row.videoflag,
      created_at: row.created_at,
      updated_at: row.updated_at,
      userId: row.userid,
      nickname: row.nickname,
      firstImage: row.firstimage,
    }));

    return { results, total };
  }

  /**
   * 게시글 검색 - SQL 버전
   *
   * TypeORM vs SQL 비교:
   * - TypeORM: ILike(likeQuery) 사용
   * - SQL: ILIKE 연산자 직접 사용
   */
  async searchStory(
    offset = 0,
    limit = 10,
    type: string = 'title',
    query: string,
    category?: string,
    channelId?: number,
  ): Promise<{
    results: any[];
    total: number;
  }> {
    const likeQuery = `%${query}%`;
    let searchCondition = '';
    const params: any[] = [];
    let paramIndex = 1;

    // 검색 타입에 따른 조건 설정
    switch (type) {
      case 'title':
        searchCondition = `s.title ILIKE $${paramIndex}`;
        params.push(likeQuery);
        paramIndex++;
        break;
      case 'content':
        searchCondition = `s.content ILIKE $${paramIndex}`;
        params.push(likeQuery);
        paramIndex++;
        break;
      case 'author':
        searchCondition = `u.name ILIKE $${paramIndex}`;
        params.push(likeQuery);
        paramIndex++;
        break;
      default:
        searchCondition = `s.title ILIKE $${paramIndex}`;
        params.push(likeQuery);
        paramIndex++;
    }

    // 기본 WHERE 조건
    let whereClause = `WHERE s.isNotice = false AND ${searchCondition}`;

    // 카테고리 필터
    if (category && category !== 'all') {
      whereClause += ` AND s.category = $${paramIndex}`;
      params.push(category);
      paramIndex++;
    }

    // 채널 필터
    if (channelId) {
      whereClause += ` AND s.channelId = $${paramIndex}`;
      params.push(channelId);
      paramIndex++;
    }

    const countSql = `
      SELECT COUNT(*) as total
      FROM story s
      LEFT JOIN user u ON s.userId = u.id
      ${whereClause}
    `;

    const listSql = `
      SELECT 
        s.id,
        s.category,
        s.title,
        s.content,
        s.like_count,
        s.read_count,
        s.comment_count,
        s.imageFlag,
        s.videoFlag,
        s.created_at,
        s.updated_at,
        u.id as userId,
        u.nickname
      FROM story s
      LEFT JOIN user u ON s.userId = u.id
      ${whereClause}
      ORDER BY s.id DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    params.push(limit, offset);

    const [countResult, listResult] = await Promise.all([
      this.dataSource.query(countSql, params.slice(0, -2)),
      this.dataSource.query(listSql, params),
    ]);

    const total = parseInt(countResult[0]?.total || '0');

    const results = listResult.map((row: any) => ({
      id: row.id,
      category: row.category,
      title: row.title,
      content: row.content,
      recommend_Count: row.like_count,
      read_count: row.read_count,
      comment_count: row.comment_count,
      imageFlag: row.imageflag,
      videoFlag: row.videoflag,
      created_at: row.created_at,
      updated_at: row.updated_at,
      userId: row.userid,
      nickname: row.nickname,
    }));

    return { results, total };
  }

  /**
   * 게시글 상세 조회 - SQL 버전
   *
   * TypeORM vs SQL:
   * - TypeORM: 트랜잭션 + relations으로 한 번에 조회
   * - SQL: 명시적 트랜잭션 + 복잡한 JOIN 쿼리
   */
  async findStoryOne(id: number): Promise<any> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 게시글 기본 정보 및 좋아요/싫어요 개수 조회
      const storyDetailSql = `
        SELECT 
          s.*,
          u.id as user_id,
          u.nickname,
          u.name as user_name,
          ui.id as user_image_id,
          ui.image_name as user_image_name,
          ui.link as user_image_link,
          -- 좋아요 개수 계산
          COALESCE((
            SELECT COUNT(*) 
            FROM likes l 
            WHERE l.storyId = s.id AND l.vote = 'like'
          ), 0) as like_count_calc,
          -- 싫어요 개수 계산  
          COALESCE((
            SELECT COUNT(*) 
            FROM likes l 
            WHERE l.storyId = s.id AND l.vote = 'dislike'
          ), 0) as dislike_count_calc
        FROM story s
        LEFT JOIN user u ON s.userId = u.id
        LEFT JOIN user_image ui ON u.id = ui.userId
        WHERE s.id = $1
      `;

      // 이미지 목록 조회
      const imagesSql = `
        SELECT *
        FROM story_image
        WHERE storyId = $1
        ORDER BY created_at ASC
      `;

      // 동영상 목록 조회
      const videosSql = `
        SELECT *
        FROM story_video
        WHERE storyId = $1
        ORDER BY created_at ASC
      `;

      // 조회수 증가
      const incrementViewSql = `
        UPDATE story 
        SET read_count = read_count + 1 
        WHERE id = $1
      `;

      // 쿼리 실행
      const [storyResult, imagesResult, videosResult] = await Promise.all([
        queryRunner.query(storyDetailSql, [id]),
        queryRunner.query(imagesSql, [id]),
        queryRunner.query(videosSql, [id]),
        queryRunner.query(incrementViewSql, [id]), // 조회수 증가
      ]);

      if (!storyResult || storyResult.length === 0) {
        throw new NotFoundException(`Story with ID ${id} not found`);
      }

      const story = storyResult[0];

      // 결과 구성
      const result = {
        id: story.id,
        category: story.category,
        title: story.title,
        content: story.content,
        like_count: story.like_count_calc,
        dislike_count: story.dislike_count_calc,
        read_count: story.read_count + 1, // 증가된 조회수 반영
        comment_count: story.comment_count,
        imageFlag: story.imageflag,
        videoFlag: story.videoflag,
        created_at: story.created_at,
        updated_at: story.updated_at,
        isNotice: story.isnotice,
        User: {
          id: story.user_id,
          nickname: story.nickname,
          name: story.user_name,
          UserImage: story.user_image_id
            ? [
                {
                  id: story.user_image_id,
                  image_name: story.user_image_name,
                  link: story.user_image_link,
                },
              ]
            : [],
        },
        StoryImage: imagesResult,
        StoryVideo: videosResult,
      };

      await queryRunner.commitTransaction();
      return result;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * 게시글 작성 - SQL 버전
   *
   * TypeORM vs SQL:
   * - TypeORM: Repository의 create, save 메서드
   * - SQL: INSERT INTO 직접 사용
   */
  async create(
    createStoryDto: CreateStoryDto,
    userData: User,
    files: Express.Multer.File[],
  ): Promise<any> {
    const { title, content, category, channelId } = createStoryDto;

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 채널 존재 확인 (필요시)
      if (channelId) {
        const channelCheckSql = `SELECT id FROM channels WHERE id = $1`;
        const channelResult = await queryRunner.query(channelCheckSql, [
          Number(channelId),
        ]);

        if (!channelResult || channelResult.length === 0) {
          throw new NotFoundException(
            `ID ${channelId}에 해당하는 채널을 찾을 수 없습니다.`,
          );
        }
      }

      // 파일 정보 분석
      const imageFiles = files
        ? files.filter((file) => file.mimetype.startsWith('image/'))
        : [];
      const videoFiles = files
        ? files.filter((file) => file.mimetype.startsWith('video/'))
        : [];
      const imageFlag = imageFiles.length > 0;
      const videoFlag = videoFiles.length > 0;

      // 게시글 INSERT
      const insertStorySql = `
        INSERT INTO story (
          category, title, content, userId, imageFlag, videoFlag, channelId,
          like_count, read_count, comment_count, created_at, updated_at, isNotice
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, 0, 0, 0, NOW(), NOW(), false
        ) RETURNING *
      `;

      const storyParams = [
        category,
        title,
        content,
        userData.id,
        imageFlag,
        videoFlag,
        channelId ? Number(channelId) : null,
      ];

      const [savedStory] = await queryRunner.query(insertStorySql, storyParams);

      // 채널의 스토리 카운트 증가
      if (channelId) {
        const updateChannelCountSql = `
          UPDATE channels 
          SET story_count = story_count + 1 
          WHERE id = $1
        `;
        await queryRunner.query(updateChannelCountSql, [Number(channelId)]);
      }

      // 이미지 파일 저장
      if (imageFiles.length > 0) {
        const insertImageSql = `
          INSERT INTO story_image (image_name, link, file_size, mime_type, storyId, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
        `;

        for (const file of imageFiles) {
          await queryRunner.query(insertImageSql, [
            file.filename,
            `/upload/${file.filename}`,
            file.size,
            file.mimetype,
            savedStory.id,
          ]);
        }
      }

      // 동영상 파일 저장
      if (videoFiles.length > 0) {
        const insertVideoSql = `
          INSERT INTO story_video (video_name, link, file_size, mime_type, storyId, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
        `;

        for (const file of videoFiles) {
          await queryRunner.query(insertVideoSql, [
            file.filename,
            `/videoUpload/${file.filename}`,
            file.size,
            file.mimetype,
            savedStory.id,
          ]);
        }
      }

      await queryRunner.commitTransaction();
      return savedStory;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * 좋아요/싫어요 처리 - SQL 버전
   *
   * TypeORM vs SQL 트랜잭션 비교:
   * - TypeORM: dataSource.transaction()으로 간단한 트랜잭션
   * - SQL: 명시적인 BEGIN, COMMIT, ROLLBACK 제어
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
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. 게시글 존재 확인
      const storyCheckSql = `SELECT id FROM story WHERE id = $1`;
      const storyResult = await queryRunner.query(storyCheckSql, [storyId]);

      if (!storyResult || storyResult.length === 0) {
        throw new NotFoundException('해당 게시글을 찾을 수 없습니다.');
      }

      // 2. 기존 투표 조회
      const existingVoteSql = `
        SELECT id, vote 
        FROM likes 
        WHERE userId = $1 AND storyId = $2
      `;
      const existingVoteResult = await queryRunner.query(existingVoteSql, [
        userId,
        storyId,
      ]);
      const existingVote = existingVoteResult[0];

      let action: 'add' | 'remove' | 'change' = 'add';
      let likeCountAdjustment = 0;

      if (existingVote) {
        if (existingVote.vote === vote) {
          // 같은 투표 -> 취소
          const deleteLikeSql = `DELETE FROM likes WHERE id = $1`;
          await queryRunner.query(deleteLikeSql, [existingVote.id]);

          action = 'remove';
          likeCountAdjustment = vote === 'like' ? -1 : 1;
        } else {
          // 다른 투표 -> 변경
          const updateLikeSql = `UPDATE likes SET vote = $1, updated_at = NOW() WHERE id = $2`;
          await queryRunner.query(updateLikeSql, [vote, existingVote.id]);

          action = 'change';
          likeCountAdjustment = vote === 'like' ? 2 : -2;
        }
      } else {
        // 신규 투표
        const insertLikeSql = `
          INSERT INTO likes (userId, storyId, vote, created_at, updated_at)
          VALUES ($1, $2, $3, NOW(), NOW())
        `;
        await queryRunner.query(insertLikeSql, [userId, storyId, vote]);

        action = 'add';
        likeCountAdjustment = vote === 'like' ? 1 : -1;
      }

      // 3. story의 like_count 업데이트
      if (likeCountAdjustment !== 0) {
        const updateStoryLikeCountSql = `
          UPDATE story 
          SET like_count = like_count + $1 
          WHERE id = $2
        `;
        await queryRunner.query(updateStoryLikeCountSql, [
          likeCountAdjustment,
          storyId,
        ]);

        // 4. 최신 추천 수 조회
        const getUpdatedLikeCountSql = `SELECT like_count FROM story WHERE id = $1`;
        const [updatedStory] = await queryRunner.query(getUpdatedLikeCountSql, [
          storyId,
        ]);

        // 5. 추천 랭킹 테이블 관리
        const currentLikeCount = updatedStory.like_count;

        if (currentLikeCount >= minRecommend) {
          // 랭킹 테이블에 추가/업데이트
          const existingRankingSql = `SELECT id FROM recommend_ranking WHERE storyId = $1`;
          const existingRankingResult = await queryRunner.query(
            existingRankingSql,
            [storyId],
          );

          if (existingRankingResult.length > 0) {
            // 업데이트
            const updateRankingSql = `
              UPDATE recommend_ranking 
              SET recommendCount = $1, updated_at = NOW()
              WHERE storyId = $2
            `;
            await queryRunner.query(updateRankingSql, [
              currentLikeCount,
              storyId,
            ]);
          } else {
            // 신규 추가
            const insertRankingSql = `
              INSERT INTO recommend_ranking (storyId, recommendCount, created_at, updated_at)
              VALUES ($1, $2, NOW(), NOW())
            `;
            await queryRunner.query(insertRankingSql, [
              storyId,
              currentLikeCount,
            ]);
          }
        } else {
          // 랭킹 테이블에서 제거
          const deleteRankingSql = `DELETE FROM recommend_ranking WHERE storyId = $1`;
          await queryRunner.query(deleteRankingSql, [storyId]);
        }
      }

      await queryRunner.commitTransaction();
      return { action, vote };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * 추천 랭킹 조회 - SQL 버전
   *
   * TypeORM vs SQL:
   * - TypeORM: createQueryBuilder()로 복잡한 조인
   * - SQL: 직접적인 JOIN과 서브쿼리 활용
   */
  async getRecommendRankings(
    offset = 0,
    limit = 10,
    category?: string,
    channelId?: number,
  ): Promise<{
    results: any[];
    total: number;
  }> {
    let whereClause = 'WHERE 1=1';
    const params: any[] = [];
    let paramIndex = 1;

    // 카테고리 필터
    if (category && category !== 'all') {
      whereClause += ` AND s.category = $${paramIndex}`;
      params.push(category);
      paramIndex++;
    }

    // 채널 필터
    if (channelId) {
      whereClause += ` AND s.channelId = $${paramIndex}`;
      params.push(channelId);
      paramIndex++;
    }

    // 전체 개수 조회
    const countSql = `
      SELECT COUNT(*) as total
      FROM recommend_ranking rr
      LEFT JOIN story s ON rr.storyId = s.id
      ${whereClause}
    `;

    // 랭킹 목록 조회
    const listSql = `
      SELECT 
        rr.recommendCount,
        s.*,
        u.nickname,
        -- 첫 번째 이미지
        (
          SELECT json_build_object(
            'id', si.id,
            'image_name', si.image_name,
            'link', si.link
          )
          FROM story_image si 
          WHERE si.storyId = s.id 
          ORDER BY si.created_at ASC 
          LIMIT 1
        ) as firstImage
      FROM recommend_ranking rr
      LEFT JOIN story s ON rr.storyId = s.id
      LEFT JOIN user u ON s.userId = u.id
      ${whereClause}
      ORDER BY rr.recommendCount DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    params.push(limit, offset);

    const [countResult, listResult] = await Promise.all([
      this.dataSource.query(countSql, params.slice(0, -2)),
      this.dataSource.query(listSql, params),
    ]);

    const total = parseInt(countResult[0]?.total || '0');

    const results = listResult.map((row: any) => ({
      id: row.id,
      category: row.category,
      title: row.title,
      content: row.content,
      recommend_Count: row.recommendcount,
      read_count: row.read_count,
      comment_count: row.comment_count,
      imageFlag: row.imageflag,
      videoFlag: row.videoflag,
      created_at: row.created_at,
      updated_at: row.updated_at,
      nickname: row.nickname,
      firstImage: row.firstimage,
    }));

    return { results, total };
  }

  /**
   * 게시글 삭제 - SQL 버전
   *
   * TypeORM vs SQL:
   * - TypeORM: relations으로 연관 데이터 자동 로딩
   * - SQL: 여러 테이블을 개별적으로 조회 및 삭제
   */
  async deleteStory(storyId: number, userData: User): Promise<void> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 게시글 정보 조회 (권한 확인용)
      const storyInfoSql = `
        SELECT 
          s.*,
          u.id as author_id,
          c.id as channel_id,
          c.creatorId as channel_creator_id
        FROM story s
        LEFT JOIN user u ON s.userId = u.id
        LEFT JOIN channels c ON s.channelId = c.id
        WHERE s.id = $1
      `;

      const storyResult = await queryRunner.query(storyInfoSql, [storyId]);

      if (!storyResult || storyResult.length === 0) {
        throw new NotFoundException('삭제된 글입니다.');
      }

      const story = storyResult[0];

      // 권한 확인
      if (story.isnotice) {
        // 공지사항인 경우
        if (story.channel_id) {
          // 채널 공지사항 - 채널 소유자만 삭제 가능
          if (story.channel_creator_id !== userData.id) {
            throw new ForbiddenException(
              '채널 소유자만 해당 공지사항을 삭제할 수 있습니다.',
            );
          }
        } else {
          // 전체 공지사항 - 작성자만 삭제 가능
          if (story.author_id !== userData.id) {
            throw new ForbiddenException(
              '본인의 공지사항만 삭제할 수 있습니다.',
            );
          }
        }
      } else {
        // 일반 게시글 - 작성자만 삭제 가능
        if (story.author_id !== userData.id) {
          throw new ForbiddenException('본인의 글만 삭제할 수 있습니다.');
        }
      }

      // 연관된 파일 정보 조회
      const imagesSql = `SELECT image_name FROM story_image WHERE storyId = $1`;
      const videosSql = `SELECT video_name FROM story_video WHERE storyId = $1`;

      const [images, videos] = await Promise.all([
        queryRunner.query(imagesSql, [storyId]),
        queryRunner.query(videosSql, [storyId]),
      ]);

      // 파일 시스템에서 파일 삭제 (실제 구현 시 fs 모듈 사용)
      // images.forEach(img => { /* 파일 삭제 로직 */ });
      // videos.forEach(video => { /* 파일 삭제 로직 */ });

      // 데이터베이스에서 연관 데이터 삭제 (CASCADE로 자동 삭제되지 않는 경우)
      const deleteImagesSql = `DELETE FROM story_image WHERE storyId = $1`;
      const deleteVideosSql = `DELETE FROM story_video WHERE storyId = $1`;
      const deleteLikesSql = `DELETE FROM likes WHERE storyId = $1`;
      const deleteCommentsSql = `DELETE FROM comments WHERE storyId = $1`;
      const deleteRankingSql = `DELETE FROM recommend_ranking WHERE storyId = $1`;

      await Promise.all([
        queryRunner.query(deleteImagesSql, [storyId]),
        queryRunner.query(deleteVideosSql, [storyId]),
        queryRunner.query(deleteLikesSql, [storyId]),
        queryRunner.query(deleteCommentsSql, [storyId]),
        queryRunner.query(deleteRankingSql, [storyId]),
      ]);

      // 일반 게시글이고 채널에 속한 경우 채널 카운트 감소
      if (story.channel_id && !story.isnotice) {
        const decrementChannelCountSql = `
          UPDATE channels 
          SET story_count = story_count - 1 
          WHERE id = $1
        `;
        await queryRunner.query(decrementChannelCountSql, [story.channel_id]);
      }

      // 마지막으로 게시글 삭제
      const deleteStorySql = `DELETE FROM story WHERE id = $1`;
      await queryRunner.query(deleteStorySql, [storyId]);

      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * 공지사항 목록 조회 - SQL 버전
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
    results: any[];
    total: number;
  }> {
    // WHERE 조건 구성
    let whereClause = 'WHERE s.isNotice = true';
    const params: any[] = [];
    let paramIndex = 1;

    if (channelId !== undefined) {
      if (channelId === 0) {
        // channelId가 0이면 전역 공지사항 (채널에 속하지 않은 공지사항)
        whereClause += ' AND s.channelId IS NULL';
      } else {
        // 특정 채널의 공지사항
        whereClause += ` AND s.channelId = $${paramIndex}`;
        params.push(Number(channelId));
        paramIndex++;
      }
    }

    const countSql = `
      SELECT COUNT(*) as total
      FROM story s
      ${whereClause}
    `;

    const listSql = `
      SELECT 
        s.id,
        s.category,
        s.title,
        s.content,
        s.read_count,
        s.created_at,
        s.updated_at,
        s.channelId,
        u.nickname,
        c.channel_name
      FROM story s
      LEFT JOIN user u ON s.userId = u.id
      LEFT JOIN channels c ON s.channelId = c.id
      ${whereClause}
      ORDER BY s.id DESC
      LIMIT $${paramIndex}
    `;

    params.push(limit);

    const [countResult, listResult] = await Promise.all([
      this.dataSource.query(countSql, params.slice(0, -1)), // limit 제외
      this.dataSource.query(listSql, params),
    ]);

    const total = parseInt(countResult[0]?.total || '0');

    const results = listResult.map((row: any) => ({
      id: row.id,
      category: row.category,
      title: row.title,
      content: row.content,
      read_count: row.read_count,
      created_at: row.created_at,
      updated_at: row.updated_at,
      channelId: row.channelid,
      nickname: row.nickname,
      channel_name: row.channel_name,
    }));

    return { results, total };
  }
}

/*
=== TypeORM vs 순수 SQL 비교 요약 ===

1. 쿼리 작성:
   - TypeORM: Repository 패턴, 메서드 체이닝
   - SQL: 직접적인 SQL 문법

2. 관계 처리:
   - TypeORM: relations 옵션으로 자동 JOIN
   - SQL: 명시적 LEFT JOIN, 서브쿼리

3. 트랜잭션:
   - TypeORM: dataSource.transaction()
   - SQL: queryRunner로 수동 제어

4. 타입 안정성:
   - TypeORM: Entity 기반 타입 체크
   - SQL: 런타임 검증 필요

5. 성능:
   - TypeORM: ORM 오버헤드 존재
   - SQL: 직접적인 쿼리로 더 빠름

6. 유지보수:
   - TypeORM: 코드 변경 시 자동 반영
   - SQL: 스키마 변경 시 수동 수정 필요

7. 복잡한 쿼리:
   - TypeORM: QueryBuilder 필요
   - SQL: 직접 작성 가능

각각의 장단점을 이해하고 상황에 맞게 선택하는 것이 중요합니다.
*/
