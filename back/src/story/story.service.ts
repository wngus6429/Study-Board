import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Story } from './Story.entity';
import { CreateStoryDto } from './dto/create-story.dto';
import { User } from 'src/auth/user.entity';

@Injectable()
export class StoryService {
  constructor(
    @InjectRepository(Story)
    private storyRepository: Repository<Story>,
  ) {}

  // 목록 페이지에 필요한 데이터만 가져오기
  async findAll(): Promise<Partial<Story>[]> {
    console.log('모든 데이터 취득');
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

  async create(createStoryDto: CreateStoryDto, userData: User): Promise<Story> {
    // console.log('데이터 생성', createStoryDto, userData);
    const { title, content } = createStoryDto;
    const { nickname } = userData;
    const insertData = this.storyRepository.create({
      title,
      content,
      creator: nickname,
    });
    return this.storyRepository.save(insertData);
  }

  // 상세 페이지에 필요한 전체 데이터 가져오기
  async findOne(id: number): Promise<Story> {
    return this.storyRepository.findOne({ where: { id } });
  }
  // 상세 페이지에서 comments 가져올 때
  // const storyDetail = await storyService.findOne(1);
  // const commentsArray = JSON.parse(storyDetail.comments);

  async deleteStory(storyId: number): Promise<void> {
    await this.storyRepository.delete(storyId);
  }
}
