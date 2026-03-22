import { Injectable, Inject, NotFoundException, ForbiddenException } from '@nestjs/common';
import { BoardUseCase, CreateBoardCommand, UpdateBoardCommand } from '../ports/in/board.use-case';
import { BoardRepositoryPort, BOARD_REPOSITORY } from '../ports/out/board.repository.port';
import { Board } from '../../domain/board.entity';

@Injectable()
export class BoardService implements BoardUseCase {
  constructor(
    // ✨ 핵심: TypeORM Repository가 아닌 인터페이스(Port)를 주입받습니다.
    @Inject(BOARD_REPOSITORY)
    private readonly boardRepository: BoardRepositoryPort,
  ) {}

  async createBoard(command: CreateBoardCommand): Promise<Board> {
    // 1. 순수 도메인 엔티티 생성
    // (이 시점에는 DB ID가 없으므로 null을 전달)
    const newBoard = new Board(
      null, 
      command.title,
      command.content,
      command.category,
      command.authorId,
      0, // 초기 조회수
      new Date(), // 생성일
      new Date(), // 수정일
    );

    // 2. Repository 포트를 통해 저장 (TypeORM인지 Prisma인지 Service는 모름!)
    const savedBoard = await this.boardRepository.save(newBoard);
    
    return savedBoard;
  }

  async getBoards(offset: number, limit: number): Promise<{ boards: Board[]; total: number }> {
    return this.boardRepository.findAll(offset, limit);
  }

  async getBoardById(id: number): Promise<Board | null> {
    const board = await this.boardRepository.findById(id);
    if (!board) {
      throw new NotFoundException('게시글을 찾을 수 없습니다.');
    }

    // 도메인 규칙 실행: 조회 시 조회수 증가
    board.incrementViewCount();
    await this.boardRepository.save(board);

    return board;
  }

  async updateBoard(command: UpdateBoardCommand): Promise<Board> {
    const board = await this.boardRepository.findById(command.boardId);
    
    if (!board) {
      throw new NotFoundException('수정할 게시글을 찾을 수 없습니다.');
    }

    // 도메인 규칙: 작성자 본인만 수정 가능
    if (board.authorId !== command.authorId) {
      throw new ForbiddenException('본인의 글만 수정할 수 있습니다.');
    }

    // 도메인 객체 내부의 메서드로 상태 변경 (캡슐화 보장)
    board.updateContent(command.title, command.content);

    // 변경된 도메인 객체 저장
    return this.boardRepository.save(board);
  }

  async deleteBoard(id: number, authorId: string): Promise<void> {
    const board = await this.boardRepository.findById(id);
    
    if (!board) {
      throw new NotFoundException('삭제할 게시글을 찾을 수 없습니다.');
    }

    // 도메인 규칙: 작성자 본인만 삭제 가능
    if (board.authorId !== authorId) {
      throw new ForbiddenException('본인의 글만 삭제할 수 있습니다.');
    }

    await this.boardRepository.delete(id);
  }
}
