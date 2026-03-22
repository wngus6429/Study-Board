import { Board } from '../../../domain/board.entity';

// 클라이언트가 서버로 요청할 때 사용하는 입력 데이터 구조
export interface CreateBoardCommand {
  title: string;
  content: string;
  category: string;
  authorId: string;
}

export interface UpdateBoardCommand {
  boardId: number;
  title: string;
  content: string;
  authorId: string;
}

/**
 * [Input Port] 
 * 외부(Controller)에서 내부(Service)를 호출할 때 사용하는 인터페이스.
 * Controller는 이 인터페이스만 바라보고 비즈니스 로직을 호출합니다.
 */
export const BOARD_USE_CASE = Symbol('BOARD_USE_CASE');

export interface BoardUseCase {
  createBoard(command: CreateBoardCommand): Promise<Board>;
  getBoards(offset: number, limit: number): Promise<{ boards: Board[]; total: number }>;
  getBoardById(id: number): Promise<Board | null>;
  updateBoard(command: UpdateBoardCommand): Promise<Board>;
  deleteBoard(id: number, authorId: string): Promise<void>;
}
