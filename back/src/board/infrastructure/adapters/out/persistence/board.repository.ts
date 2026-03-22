import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BoardRepositoryPort } from '../../../../core/application/ports/out/board.repository.port';
import { Board } from '../../../../core/domain/board.entity';
import { Story } from '../../../../../entities/Story.entity';
import { BoardMapper } from './mapper/board.mapper';

/**
 * [Output Adapter]
 * BoardRepositoryPort(인터페이스)의 실제 구현체입니다.
 * 외부 라이브러리인 TypeORM을 사용하여 DB와 통신합니다.
 */
@Injectable()
export class BoardRepository implements BoardRepositoryPort {
  constructor(
    @InjectRepository(Story)
    private readonly typeOrmRepository: Repository<Story>,
  ) {}

  async save(board: Board): Promise<Board> {
    // 1. Domain Entity -> TypeORM Entity 변환
    const storyEntity = BoardMapper.toPersistence(board);
    
    // 2. DB 저장
    const savedStory = await this.typeOrmRepository.save(storyEntity);
    
    // 3. 다시 TypeORM Entity -> Domain Entity로 변환하여 반환
    return BoardMapper.toDomain(savedStory);
  }

  async findById(id: number): Promise<Board | null> {
    const story = await this.typeOrmRepository.findOne({
      where: { id },
      relations: ['User'], // 작성자 정보가 필요하므로 조인
    });

    if (!story) return null;

    return BoardMapper.toDomain(story);
  }

  async findAll(offset: number, limit: number): Promise<{ boards: Board[]; total: number }> {
    const [stories, total] = await this.typeOrmRepository.findAndCount({
      skip: offset,
      take: limit,
      relations: ['User'],
      order: { created_at: 'DESC' },
    });

    const boards = stories.map((story) => BoardMapper.toDomain(story));

    return { boards, total };
  }

  async delete(id: number): Promise<void> {
    await this.typeOrmRepository.softDelete(id); // 또는 delete(id)
  }
}
