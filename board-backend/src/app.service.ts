import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Story } from './entities/Story.entity';
import { CreateStoryDto } from './dto/create-story.dto';

// 메서드 하나만 있는 기본적인 서비스가 있는 파일
@Injectable()
export class AppService {
  constructor(
    @InjectRepository(Story)
    private storyRepository: Repository<Story>,
  ) {}

  // 목록 페이지에 필요한 데이터만 가져오기
  async findAll(): Promise<Partial<Story>[]> {
    console.log('움직임1');
    return this.storyRepository.find();
    // return this.storyRepository.find({
    //   select: [
    //     'id',
    //     'title',
    //     'content',
    //     'creator',
    //     'createdAt',
    //     'readCount',
    //     'likeCount',
    //   ],
    // });
  }

  async create(createStoryDto: CreateStoryDto): Promise<Story> {
    console.log('Received Data:', createStoryDto);
    return this.storyRepository.save(createStoryDto);
  }

  // 상세 페이지에 필요한 전체 데이터 가져오기
  async findOne(id: number): Promise<Story> {
    return this.storyRepository.findOne({ where: { id } });
  }
  // 상세 페이지에서 comments 가져올 때
  // const storyDetail = await storyService.findOne(1);
  // const commentsArray = JSON.parse(storyDetail.comments);
}
