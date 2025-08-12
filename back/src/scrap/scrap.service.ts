import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Scrap } from '../entities/Scrap.entity';
import { Story } from '../entities/Story.entity';
import { User } from '../entities/User.entity';

@Injectable()
export class ScrapService {
  constructor(
    @InjectRepository(Scrap)
    private scrapRepository: Repository<Scrap>,
    @InjectRepository(Story)
    private storyRepository: Repository<Story>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  // 스크랩 추가
  async addScrap(userId: string, storyId: number): Promise<Scrap> {
    // 사용자 존재 확인
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('사용자를 찾을 수 없습니다.');
    }

    // 게시물 존재 확인
    const story = await this.storyRepository.findOne({
      where: { id: storyId },
    });
    if (!story) {
      throw new NotFoundException('게시물을 찾을 수 없습니다.');
    }

    // 이미 스크랩했는지 확인
    const existingScrap = await this.scrapRepository.findOne({
      where: { User: { id: userId }, Story: { id: storyId } },
    });

    if (existingScrap) {
      throw new ConflictException('이미 스크랩한 게시물입니다.');
    }

    // 스크랩 생성
    const scrap = this.scrapRepository.create({
      User: user,
      Story: story,
    });

    return await this.scrapRepository.save(scrap);
  }

  // 스크랩 삭제
  async removeScrap(userId: string, storyId: number): Promise<void> {
    const scrap = await this.scrapRepository.findOne({
      where: { User: { id: userId }, Story: { id: storyId } },
    });

    if (!scrap) {
      throw new NotFoundException('스크랩을 찾을 수 없습니다.');
    }

    await this.scrapRepository.remove(scrap);
  }

  // 사용자의 스크랩 목록 조회
  async getUserScraps(userId: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const [scraps, total] = await this.scrapRepository.findAndCount({
      where: { User: { id: userId } },
      relations: ['Story', 'Story.User', 'Story.Channel'],
      order: { created_at: 'DESC' },
      skip,
      take: limit,
    });

    return {
      scraps,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  // 특정 게시물의 스크랩 여부 확인
  async isScraped(userId: string, storyId: number): Promise<boolean> {
    const scrap = await this.scrapRepository.findOne({
      where: { User: { id: userId }, Story: { id: storyId } },
    });

    return !!scrap;
  }

  // 스크랩 ID로 삭제 (스크랩 목록에서 삭제할 때 사용)
  async removeScrapById(userId: string, scrapId: number): Promise<void> {
    const scrap = await this.scrapRepository.findOne({
      where: { id: scrapId, User: { id: userId } },
    });

    if (!scrap) {
      throw new NotFoundException('스크랩을 찾을 수 없습니다.');
    }

    await this.scrapRepository.remove(scrap);
  }
}
