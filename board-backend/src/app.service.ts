import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Story } from './entities/Story.entity';

// 메서드 하나만 있는 기본적인 서비스가 있는 파일
@Injectable()
export class AppService {
  constructor(
    @InjectRepository(Story)
    private storyRepository: Repository<Story>,
  ) {}

  // 목록 페이지에 필요한 데이터만 가져오기
  async findAll(): Promise<Partial<Story>[]> {
    return this.storyRepository.find({
      select: ['id', 'title', 'creator', 'createdAt', 'readCount', 'likeCount'],
    });
  }

  // 상세 페이지에 필요한 전체 데이터 가져오기
  async findOne(id: number): Promise<Story> {
    return this.storyRepository.findOne({ where: { id } });
  }
  // 상세 페이지에서 comments 가져올 때
  // const storyDetail = await storyService.findOne(1);
  // const commentsArray = JSON.parse(storyDetail.comments);
}
