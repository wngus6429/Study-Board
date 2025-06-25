import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

/**
 * Users SQL 서비스 - 순수 SQL 버전
 * TypeORM 대신 순수 SQL을 사용하여 사용자 관련 비즈니스 로직을 처리합니다.
 *
 * @description 기존 users.service.ts와 동일한 기능을 순수 SQL로 구현
 * @author StudyBoard Team
 */
@Injectable()
export class UsersSqlService {
  constructor(
    @InjectDataSource()
    private dataSource: DataSource,
  ) {}

  /**
   * 사용자 닉네임으로 검색 - SQL 버전
   *
   * TypeORM vs SQL 비교:
   * - TypeORM: this.userRepository.find({ where: { nickname: ILike(`%${query}%`) } })
   * - SQL: SELECT * FROM user WHERE nickname ILIKE $1 직접 사용
   *
   * 주요 차이점:
   * 1. TypeORM은 ILike() 함수 사용, SQL은 ILIKE 연산자 직접 사용
   * 2. TypeORM은 select 옵션으로 필드 선택, SQL은 SELECT 절에서 직접 명시
   * 3. TypeORM은 take 옵션으로 제한, SQL은 LIMIT 사용
   */
  async searchUserByNickname(query: string) {
    // 빈 문자열이나 null 체크
    if (!query || query.trim().length === 0) {
      return [];
    }

    // SQL 쿼리 작성
    const searchSql = `
      SELECT 
        u.id,
        u.nickname,
        u.user_email
      FROM user u
      WHERE u.nickname ILIKE $1
      LIMIT 10
    `;

    // 검색어 패턴 생성 (앞뒤로 % 추가)
    const searchPattern = `%${query}%`;

    try {
      // SQL 실행
      const users = await this.dataSource.query(searchSql, [searchPattern]);

      // 결과 매핑 (TypeORM 버전과 동일한 형태로 반환)
      return users.map((user: any) => ({
        id: user.id,
        nickname: user.nickname,
        user_email: user.user_email,
      }));
    } catch (error) {
      console.error('사용자 검색 중 오류 발생:', error);
      throw new Error('사용자 검색에 실패했습니다.');
    }
  }

  /**
   * 사용자 ID로 조회 - SQL 버전 (추가 메서드)
   *
   * TypeORM 버전이라면:
   * async findUserById(id: string) {
   *   return await this.userRepository.findOne({
   *     where: { id },
   *     select: ['id', 'nickname', 'user_email', 'name']
   *   });
   * }
   */
  async findUserById(id: string) {
    const findUserSql = `
      SELECT 
        u.id,
        u.nickname,
        u.user_email,
        u.name,
        u.created_at,
        u.updated_at
      FROM user u
      WHERE u.id = $1
    `;

    try {
      const result = await this.dataSource.query(findUserSql, [id]);

      // 결과가 없으면 null 반환
      if (!result || result.length === 0) {
        return null;
      }

      return {
        id: result[0].id,
        nickname: result[0].nickname,
        user_email: result[0].user_email,
        name: result[0].name,
        created_at: result[0].created_at,
        updated_at: result[0].updated_at,
      };
    } catch (error) {
      console.error('사용자 조회 중 오류 발생:', error);
      throw new Error('사용자 조회에 실패했습니다.');
    }
  }

  /**
   * 사용자 목록 조회 (페이지네이션) - SQL 버전 (추가 메서드)
   *
   * TypeORM 버전이라면:
   * async findUsers(offset = 0, limit = 10) {
   *   const [users, total] = await this.userRepository.findAndCount({
   *     select: ['id', 'nickname', 'user_email', 'created_at'],
   *     order: { created_at: 'DESC' },
   *     skip: offset,
   *     take: limit
   *   });
   *   return { users, total };
   * }
   */
  async findUsers(offset = 0, limit = 10) {
    // 전체 사용자 수 조회
    const countSql = `
      SELECT COUNT(*) as total
      FROM user
    `;

    // 사용자 목록 조회
    const listSql = `
      SELECT 
        u.id,
        u.nickname,
        u.user_email,
        u.name,
        u.created_at,
        u.updated_at
      FROM user u
      ORDER BY u.created_at DESC
      LIMIT $1 OFFSET $2
    `;

    try {
      // 병렬로 실행
      const [countResult, listResult] = await Promise.all([
        this.dataSource.query(countSql),
        this.dataSource.query(listSql, [limit, offset]),
      ]);

      const total = parseInt(countResult[0]?.total || '0');

      const users = listResult.map((user: any) => ({
        id: user.id,
        nickname: user.nickname,
        user_email: user.user_email,
        name: user.name,
        created_at: user.created_at,
        updated_at: user.updated_at,
      }));

      return { users, total };
    } catch (error) {
      console.error('사용자 목록 조회 중 오류 발생:', error);
      throw new Error('사용자 목록 조회에 실패했습니다.');
    }
  }

  /**
   * 사용자 이메일로 검색 - SQL 버전 (추가 메서드)
   *
   * TypeORM 버전이라면:
   * async searchUserByEmail(email: string) {
   *   return await this.userRepository.find({
   *     where: { user_email: ILike(`%${email}%`) },
   *     select: ['id', 'nickname', 'user_email'],
   *     take: 10
   *   });
   * }
   */
  async searchUserByEmail(email: string) {
    if (!email || email.trim().length === 0) {
      return [];
    }

    const searchSql = `
      SELECT 
        u.id,
        u.nickname,
        u.user_email
      FROM user u
      WHERE u.user_email ILIKE $1
      LIMIT 10
    `;

    const searchPattern = `%${email}%`;

    try {
      const users = await this.dataSource.query(searchSql, [searchPattern]);

      return users.map((user: any) => ({
        id: user.id,
        nickname: user.nickname,
        user_email: user.user_email,
      }));
    } catch (error) {
      console.error('사용자 이메일 검색 중 오류 발생:', error);
      throw new Error('사용자 이메일 검색에 실패했습니다.');
    }
  }

  /**
   * 사용자 정보 업데이트 - SQL 버전 (추가 메서드)
   *
   * TypeORM 버전이라면:
   * async updateUser(id: string, updateData: Partial<User>) {
   *   const result = await this.userRepository.update(id, updateData);
   *   return result.affected > 0;
   * }
   */
  async updateUser(
    id: string,
    updateData: { nickname?: string; user_email?: string; name?: string },
  ) {
    // 동적으로 UPDATE 쿼리 생성
    const updateFields: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (updateData.nickname !== undefined) {
      updateFields.push(`nickname = $${paramIndex}`);
      params.push(updateData.nickname);
      paramIndex++;
    }

    if (updateData.user_email !== undefined) {
      updateFields.push(`user_email = $${paramIndex}`);
      params.push(updateData.user_email);
      paramIndex++;
    }

    if (updateData.name !== undefined) {
      updateFields.push(`name = $${paramIndex}`);
      params.push(updateData.name);
      paramIndex++;
    }

    // 업데이트할 필드가 없으면 false 반환
    if (updateFields.length === 0) {
      return false;
    }

    // updated_at 필드 추가
    updateFields.push(`updated_at = NOW()`);

    const updateSql = `
      UPDATE user 
      SET ${updateFields.join(', ')}
      WHERE id = $${paramIndex}
    `;

    params.push(id);

    try {
      const result = await this.dataSource.query(updateSql, params);

      // PostgreSQL의 경우 result는 배열이 아니라 객체를 반환할 수 있음
      // 실제 업데이트된 행의 수를 확인
      return result.length > 0 || result.rowCount > 0;
    } catch (error) {
      console.error('사용자 정보 업데이트 중 오류 발생:', error);
      throw new Error('사용자 정보 업데이트에 실패했습니다.');
    }
  }

  /**
   * 복합 검색 (닉네임 + 이메일) - SQL 버전 (추가 메서드)
   *
   * TypeORM 버전이라면:
   * async searchUsers(query: string) {
   *   return await this.userRepository.find({
   *     where: [
   *       { nickname: ILike(`%${query}%`) },
   *       { user_email: ILike(`%${query}%`) }
   *     ],
   *     select: ['id', 'nickname', 'user_email'],
   *     take: 20
   *   });
   * }
   */
  async searchUsers(query: string) {
    if (!query || query.trim().length === 0) {
      return [];
    }

    const searchSql = `
      SELECT 
        u.id,
        u.nickname,
        u.user_email,
        u.name,
        -- 검색 결과 정확도를 위한 점수 계산
        CASE 
          WHEN u.nickname ILIKE $1 THEN 3
          WHEN u.nickname ILIKE $2 THEN 2
          WHEN u.user_email ILIKE $2 THEN 1
          ELSE 0
        END as relevance_score
      FROM user u
      WHERE u.nickname ILIKE $2 
         OR u.user_email ILIKE $2
      ORDER BY relevance_score DESC, u.created_at DESC
      LIMIT 20
    `;

    // 정확한 매치와 부분 매치를 위한 패턴
    const exactPattern = query;
    const likePattern = `%${query}%`;

    try {
      const users = await this.dataSource.query(searchSql, [
        exactPattern,
        likePattern,
      ]);

      return users.map((user: any) => ({
        id: user.id,
        nickname: user.nickname,
        user_email: user.user_email,
        name: user.name,
        relevance_score: user.relevance_score,
      }));
    } catch (error) {
      console.error('사용자 복합 검색 중 오류 발생:', error);
      throw new Error('사용자 검색에 실패했습니다.');
    }
  }
}

/*
=== TypeORM vs 순수 SQL 비교 (Users 서비스 기준) ===

1. 기본 검색 쿼리:
   - TypeORM: userRepository.find({ where: { nickname: ILike(`%${query}%`) } })
   - SQL: SELECT * FROM user WHERE nickname ILIKE '%query%'

2. 필드 선택:
   - TypeORM: select: ['id', 'nickname', 'user_email'] 옵션
   - SQL: SELECT id, nickname, user_email FROM user

3. 제한 조건:
   - TypeORM: take: 10 옵션
   - SQL: LIMIT 10

4. 정렬:
   - TypeORM: order: { created_at: 'DESC' } 옵션
   - SQL: ORDER BY created_at DESC

5. 페이지네이션:
   - TypeORM: skip, take 옵션
   - SQL: OFFSET, LIMIT

6. 카운트와 리스트 동시 조회:
   - TypeORM: findAndCount() 메서드
   - SQL: Promise.all()로 병렬 실행

7. 업데이트:
   - TypeORM: userRepository.update(id, data)
   - SQL: UPDATE user SET field = value WHERE id = $1

8. 복합 검색:
   - TypeORM: where: [{ field1: condition }, { field2: condition }]
   - SQL: WHERE field1 LIKE pattern OR field2 LIKE pattern

9. 에러 처리:
   - TypeORM: 자동으로 DB 에러를 TypeORM 에러로 변환
   - SQL: try-catch로 직접 처리 필요

10. 타입 안정성:
    - TypeORM: Entity 기반 타입 체크
    - SQL: 런타임에서 결과 타입 확인 필요

장점:
- TypeORM: 빠른 개발, 타입 안정성, 자동 관계 처리
- SQL: 성능 최적화, 복잡한 쿼리 작성 가능, 세밀한 제어

단점:
- TypeORM: 성능 오버헤드, 복잡한 쿼리 제한
- SQL: 더 많은 코드 작성, 타입 안정성 부족, 수동 에러 처리
*/
