import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

/**
 * Scrap SQL 서비스 - 순수 SQL 버전
 * TypeORM 대신 순수 SQL을 사용하여 스크랩 관련 비즈니스 로직을 처리합니다.
 *
 * @description 기존 scrap.service.ts와 동일한 기능을 순수 SQL로 구현
 * @author StudyBoard Team
 */
@Injectable()
export class ScrapSqlService {
  constructor(
    @InjectDataSource()
    private dataSource: DataSource,
  ) {}

  /**
   * 스크랩 추가 - SQL 버전
   *
   * TypeORM vs SQL 비교:
   * - TypeORM: Repository 패턴으로 여러 번의 findOne, create, save 호출
   * - SQL: 단일 트랜잭션 내에서 직접적인 INSERT와 SELECT 사용
   *
   * 주요 차이점:
   * 1. TypeORM: 관계 기반 검색 (User: { id: userId })
   * 2. SQL: JOIN을 통한 직접적인 관계 처리
   * 3. TypeORM: 자동 관계 매핑
   * 4. SQL: 수동 외래키 설정
   */
  async addScrap(userId: string, storyId: number): Promise<any> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. 사용자 존재 확인
      const userCheckSql = `SELECT id FROM user WHERE id = $1`;
      const userResult = await queryRunner.query(userCheckSql, [userId]);

      if (!userResult || userResult.length === 0) {
        throw new NotFoundException('사용자를 찾을 수 없습니다.');
      }

      // 2. 게시물 존재 확인
      const storyCheckSql = `SELECT id FROM story WHERE id = $1`;
      const storyResult = await queryRunner.query(storyCheckSql, [storyId]);

      if (!storyResult || storyResult.length === 0) {
        throw new NotFoundException('게시물을 찾을 수 없습니다.');
      }

      // 3. 중복 스크랩 확인
      const duplicateCheckSql = `
        SELECT id 
        FROM scrap 
        WHERE userId = $1 AND storyId = $2
      `;
      const duplicateResult = await queryRunner.query(duplicateCheckSql, [
        userId,
        storyId,
      ]);

      if (duplicateResult && duplicateResult.length > 0) {
        throw new ConflictException('이미 스크랩한 게시물입니다.');
      }

      // 4. 스크랩 생성
      const insertScrapSql = `
        INSERT INTO scrap (userId, storyId, created_at, updated_at)
        VALUES ($1, $2, NOW(), NOW())
        RETURNING *
      `;
      const [newScrap] = await queryRunner.query(insertScrapSql, [
        userId,
        storyId,
      ]);

      // 5. 생성된 스크랩 정보를 관계 정보와 함께 조회
      const scrapDetailSql = `
        SELECT 
          s.id,
          s.created_at,
          s.updated_at,
          u.id as user_id,
          u.nickname as user_nickname,
          st.id as story_id,
          st.title as story_title
        FROM scrap s
        LEFT JOIN user u ON s.userId = u.id
        LEFT JOIN story st ON s.storyId = st.id
        WHERE s.id = $1
      `;
      const [scrapDetail] = await queryRunner.query(scrapDetailSql, [
        newScrap.id,
      ]);

      await queryRunner.commitTransaction();

      return {
        id: scrapDetail.id,
        created_at: scrapDetail.created_at,
        updated_at: scrapDetail.updated_at,
        User: {
          id: scrapDetail.user_id,
          nickname: scrapDetail.user_nickname,
        },
        Story: {
          id: scrapDetail.story_id,
          title: scrapDetail.story_title,
        },
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * 스크랩 삭제 - SQL 버전
   *
   * TypeORM vs SQL 비교:
   * - TypeORM: findOne으로 존재 확인 후 remove
   * - SQL: DELETE 쿼리로 직접 삭제, 영향받은 행 수로 존재 여부 확인
   */
  async removeScrap(userId: string, storyId: number): Promise<void> {
    const deleteScrapSql = `
      DELETE FROM scrap 
      WHERE userId = $1 AND storyId = $2
    `;

    try {
      const result = await this.dataSource.query(deleteScrapSql, [
        userId,
        storyId,
      ]);

      // PostgreSQL에서는 result.rowCount 또는 result.length로 영향받은 행 수 확인
      const affectedRows = result.rowCount || result.length || 0;

      if (affectedRows === 0) {
        throw new NotFoundException('스크랩을 찾을 수 없습니다.');
      }
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      console.error('스크랩 삭제 중 오류 발생:', error);
      throw new Error('스크랩 삭제에 실패했습니다.');
    }
  }

  /**
   * 사용자의 스크랩 목록 조회 - SQL 버전
   *
   * TypeORM vs SQL 비교:
   * - TypeORM: findAndCount()로 관계 자동 로딩
   * - SQL: JOIN을 통한 명시적 관계 처리, 병렬 쿼리로 카운트와 리스트 동시 조회
   *
   * 복잡한 JOIN 예시:
   * - 스크랩 -> 게시글 -> 작성자, 채널 정보까지 한 번에 조회
   */
  async getUserScraps(userId: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    // 전체 스크랩 수 조회
    const countSql = `
      SELECT COUNT(*) as total
      FROM scrap s
      WHERE s.userId = $1
    `;

    // 스크랩 목록 조회 (복잡한 JOIN 사용)
    const listSql = `
      SELECT 
        s.id as scrap_id,
        s.created_at as scrap_created_at,
        s.updated_at as scrap_updated_at,
        -- 게시글 정보
        st.id as story_id,
        st.title as story_title,
        st.content as story_content,
        st.category as story_category,
        st.like_count as story_like_count,
        st.read_count as story_read_count,
        st.comment_count as story_comment_count,
        st.imageFlag as story_image_flag,
        st.videoFlag as story_video_flag,
        st.created_at as story_created_at,
        -- 게시글 작성자 정보
        author.id as author_id,
        author.nickname as author_nickname,
        author.user_email as author_email,
        -- 채널 정보 (있을 경우)
        ch.id as channel_id,
        ch.channel_name,
        ch.description as channel_description,
        -- 스크랩한 게시글의 첫 번째 이미지
        (
          SELECT json_build_object(
            'id', si.id,
            'image_name', si.image_name,
            'link', si.link
          )
          FROM story_image si 
          WHERE si.storyId = st.id 
          ORDER BY si.created_at ASC 
          LIMIT 1
        ) as first_image
      FROM scrap s
      LEFT JOIN story st ON s.storyId = st.id
      LEFT JOIN user author ON st.userId = author.id
      LEFT JOIN channels ch ON st.channelId = ch.id
      WHERE s.userId = $1
      ORDER BY s.created_at DESC
      LIMIT $2 OFFSET $3
    `;

    try {
      // 병렬로 실행하여 성능 최적화
      const [countResult, listResult] = await Promise.all([
        this.dataSource.query(countSql, [userId]),
        this.dataSource.query(listSql, [userId, limit, skip]),
      ]);

      const total = parseInt(countResult[0]?.total || '0');

      // 결과 매핑 (TypeORM 형태와 유사하게)
      const scraps = listResult.map((row: any) => ({
        id: row.scrap_id,
        created_at: row.scrap_created_at,
        updated_at: row.scrap_updated_at,
        Story: {
          id: row.story_id,
          title: row.story_title,
          content: row.story_content,
          category: row.story_category,
          like_count: row.story_like_count,
          read_count: row.story_read_count,
          comment_count: row.story_comment_count,
          imageFlag: row.story_image_flag,
          videoFlag: row.story_video_flag,
          created_at: row.story_created_at,
          User: {
            id: row.author_id,
            nickname: row.author_nickname,
            user_email: row.author_email,
          },
          Channel: row.channel_id
            ? {
                id: row.channel_id,
                channel_name: row.channel_name,
                description: row.channel_description,
              }
            : null,
          firstImage: row.first_image,
        },
      }));

      return {
        scraps,
        total,
        page,
        totalPages: Math.ceil(total / limit),
      };
    } catch (error) {
      console.error('스크랩 목록 조회 중 오류 발생:', error);
      throw new Error('스크랩 목록 조회에 실패했습니다.');
    }
  }

  /**
   * 특정 게시물의 스크랩 여부 확인 - SQL 버전
   *
   * TypeORM vs SQL 비교:
   * - TypeORM: findOne으로 존재 확인 후 !!연산자로 boolean 변환
   * - SQL: EXISTS 또는 COUNT를 사용하여 직접 boolean 결과 생성
   */
  async isScraped(userId: string, storyId: number): Promise<boolean> {
    // EXISTS를 사용한 방법 (더 효율적)
    const checkScrapSql = `
      SELECT EXISTS(
        SELECT 1 
        FROM scrap 
        WHERE userId = $1 AND storyId = $2
      ) as is_scraped
    `;

    try {
      const result = await this.dataSource.query(checkScrapSql, [
        userId,
        storyId,
      ]);
      return result[0]?.is_scraped || false;
    } catch (error) {
      console.error('스크랩 여부 확인 중 오류 발생:', error);
      return false;
    }
  }

  /**
   * 스크랩 ID로 삭제 - SQL 버전
   *
   * TypeORM vs SQL 비교:
   * - TypeORM: findOne으로 권한 확인 후 remove
   * - SQL: WHERE 절에 조건을 모두 포함하여 한 번에 처리
   */
  async removeScrapById(userId: string, scrapId: number): Promise<void> {
    const deleteScrapSql = `
      DELETE FROM scrap 
      WHERE id = $1 AND userId = $2
    `;

    try {
      const result = await this.dataSource.query(deleteScrapSql, [
        scrapId,
        userId,
      ]);

      const affectedRows = result.rowCount || result.length || 0;

      if (affectedRows === 0) {
        throw new NotFoundException('스크랩을 찾을 수 없습니다.');
      }
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      console.error('스크랩 삭제 중 오류 발생:', error);
      throw new Error('스크랩 삭제에 실패했습니다.');
    }
  }

  /**
   * 사용자별 스크랩 통계 조회 - SQL 버전 (추가 기능)
   *
   * TypeORM으로는 복잡한 집계 쿼리가 어려운 예시
   */
  async getScrapStatistics(userId: string) {
    const statsSql = `
      SELECT 
        COUNT(*) as total_scraps,
        COUNT(CASE WHEN st.category = 'tech' THEN 1 END) as tech_scraps,
        COUNT(CASE WHEN st.category = 'life' THEN 1 END) as life_scraps,
        COUNT(CASE WHEN st.category = 'study' THEN 1 END) as study_scraps,
        COUNT(CASE WHEN st.imageFlag = true THEN 1 END) as image_scraps,
        COUNT(CASE WHEN st.videoFlag = true THEN 1 END) as video_scraps,
        AVG(st.like_count) as avg_like_count,
        MAX(s.created_at) as last_scrap_date,
        MIN(s.created_at) as first_scrap_date
      FROM scrap s
      LEFT JOIN story st ON s.storyId = st.id
      WHERE s.userId = $1
    `;

    try {
      const [stats] = await this.dataSource.query(statsSql, [userId]);

      return {
        totalScraps: parseInt(stats.total_scraps || '0'),
        categoryStats: {
          tech: parseInt(stats.tech_scraps || '0'),
          life: parseInt(stats.life_scraps || '0'),
          study: parseInt(stats.study_scraps || '0'),
        },
        mediaStats: {
          images: parseInt(stats.image_scraps || '0'),
          videos: parseInt(stats.video_scraps || '0'),
        },
        avgLikeCount: parseFloat(stats.avg_like_count || '0'),
        lastScrapDate: stats.last_scrap_date,
        firstScrapDate: stats.first_scrap_date,
      };
    } catch (error) {
      console.error('스크랩 통계 조회 중 오류 발생:', error);
      throw new Error('스크랩 통계 조회에 실패했습니다.');
    }
  }

  /**
   * 인기 스크랩 게시글 조회 - SQL 버전 (추가 기능)
   *
   * 복잡한 집계와 서브쿼리 활용 예시
   */
  async getPopularScrapedStories(limit: number = 10) {
    const popularSql = `
      SELECT 
        st.id,
        st.title,
        st.category,
        st.like_count,
        st.read_count,
        COUNT(s.id) as scrap_count,
        u.nickname as author_nickname,
        -- 최근 스크랩한 사용자들
        STRING_AGG(
          DISTINCT scrapper.nickname, 
          ', ' 
          ORDER BY scrapper.nickname
        ) as recent_scrappers
      FROM story st
      INNER JOIN scrap s ON st.id = s.storyId
      LEFT JOIN user u ON st.userId = u.id
      LEFT JOIN user scrapper ON s.userId = scrapper.id
      WHERE st.created_at >= NOW() - INTERVAL '30 days'
      GROUP BY st.id, st.title, st.category, st.like_count, st.read_count, u.nickname
      HAVING COUNT(s.id) >= 2
      ORDER BY COUNT(s.id) DESC, st.like_count DESC
      LIMIT $1
    `;

    try {
      const result = await this.dataSource.query(popularSql, [limit]);

      return result.map((row: any) => ({
        id: row.id,
        title: row.title,
        category: row.category,
        like_count: row.like_count,
        read_count: row.read_count,
        scrap_count: parseInt(row.scrap_count),
        author_nickname: row.author_nickname,
        recent_scrappers: row.recent_scrappers?.split(', ') || [],
      }));
    } catch (error) {
      console.error('인기 스크랩 게시글 조회 중 오류 발생:', error);
      throw new Error('인기 스크랩 게시글 조회에 실패했습니다.');
    }
  }
}

/*
=== TypeORM vs 순수 SQL 비교 (Scrap 서비스 기준) ===

1. 관계 처리:
   - TypeORM: relations: ['Story', 'Story.User', 'Story.Channel']
   - SQL: 명시적 LEFT JOIN으로 관계 처리

2. 존재 확인:
   - TypeORM: findOne()으로 객체 조회 후 null 체크
   - SQL: EXISTS() 또는 COUNT()로 직접 boolean 반환

3. 중복 체크:
   - TypeORM: findOne()으로 기존 레코드 조회
   - SQL: SELECT로 직접 확인 후 조건 분기

4. 삭제 작업:
   - TypeORM: 조회 후 remove() 메서드
   - SQL: DELETE 쿼리로 직접 삭제, 영향받은 행 수로 결과 확인

5. 복잡한 JOIN:
   - TypeORM: relations 배열로 자동 로딩
   - SQL: 명시적 JOIN 구문으로 세밀한 제어

6. 페이지네이션:
   - TypeORM: skip, take 옵션
   - SQL: OFFSET, LIMIT

7. 집계 쿼리:
   - TypeORM: QueryBuilder 필요하거나 복잡함
   - SQL: GROUP BY, COUNT, AVG 등 직접 사용

8. 서브쿼리:
   - TypeORM: 제한적이고 복잡함
   - SQL: 자유롭게 활용 가능

9. 조건부 집계:
   - TypeORM: 매우 복잡하거나 불가능
   - SQL: CASE WHEN으로 간단히 처리

10. 문자열 집계:
    - TypeORM: 지원하지 않음
    - SQL: STRING_AGG, GROUP_CONCAT 등 활용

성능 차이:
- TypeORM: N+1 문제 발생 가능, 여러 쿼리 실행
- SQL: 필요한 데이터를 한 번에 JOIN으로 가져오기

복잡도:
- TypeORM: 간단한 CRUD에 적합
- SQL: 복잡한 비즈니스 로직과 분석 쿼리에 적합

유지보수성:
- TypeORM: 스키마 변경 시 자동 반영
- SQL: 수동으로 쿼리 수정 필요

각각의 장단점을 파악하고 상황에 맞게 선택하는 것이 중요합니다!
*/
