import { Board } from '../../../domain/board.entity';

/**
 * [Output Port]
 * 내부(Service)에서 외부(Repository)를 호출할 때 사용하는 인터페이스.
 * Service는 TypeORM이나 DB 엔진의 존재를 모르고 이 인터페이스만 사용합니다.
 */
export const BOARD_REPOSITORY = Symbol('BOARD_REPOSITORY');

export interface BoardRepositoryPort {
  save(board: Board): Promise<Board>;
  findById(id: number): Promise<Board | null>;
  findAll(offset: number, limit: number): Promise<{ boards: Board[]; total: number }>;
  delete(id: number): Promise<void>;
}
