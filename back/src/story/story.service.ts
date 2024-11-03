import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateStoryDto } from './dto/create-story.dto';
import { User } from 'src/entities/user.entity';
import { Story } from 'src/entities/Story.entity';
import { Image } from 'src/entities/Image.entity';

@Injectable()
export class StoryService {
  constructor(
    @InjectRepository(Story)
    private storyRepository: Repository<Story>,
    @InjectRepository(Image)
    private readonly imageRepository: Repository<Image>,
  ) {}

  // 목록 페이지에 필요한 데이터만 가져오기
  async findStoryAll(): Promise<Partial<Story>[]> {
    // console.log('모든 데이터 취득');
    return this.storyRepository.find();
    // return this.storyRepository.find({
    //   select: [
    //     'id',
    //     'title',
    //     'content',
    //     'creator_email',
    //     'createdAt',
    //     'readCount',
    //     'likeCount',
    //   ],
    // });
  }

  async findStoryOne(id: number): Promise<any> {
    return this.storyRepository.findOne({
      where: { id: id },
      relations: ['Images'],
    });
  }

  async create(
    createStoryDto: CreateStoryDto,
    userData: User,
    files: Express.Multer.File[],
  ): Promise<Story> {
    console.log(
      'createStoryDto:',
      createStoryDto,
      'userData:',
      userData,
      'files:',
      files,
    );
    const { title, content, category } = createStoryDto;
    const { user_email } = userData;

    // Story 엔티티 생성
    const story = this.storyRepository.create({
      category,
      title,
      content,
      nickname: userData.nickname,
      creator_email: user_email,
    });

    const savedStory = await this.storyRepository.save(story);

    // 이미지 파일을 ImageEntity로 변환 후 저장
    const imageEntities = files.map((file) => {
      const image = new Image();
      image.image_name = file.filename;
      image.link = `/upload/${file.filename}`; // 저장 경로 설정
      image.user_id = String(userData.id);
      image.story_id = savedStory.id;
      image.Story = savedStory;
      return image;
    });

    await this.imageRepository.save(imageEntities);

    return savedStory;
  }

  // 상세 페이지에 필요한 전체 데이터 가져오기
  async findOne(id: number): Promise<Story> {
    return this.storyRepository.findOne({ where: { id } });
  }
  // 상세 페이지에서 comments 가져올 때
  // const storyDetail = await storyService.findOne(1);
  // const commentsArray = JSON.parse(storyDetail.comments);

  async deleteStory(storyId: number, userData: User): Promise<void> {
    // 스토리 데이터 가져오기
    const story = await this.storyRepository.findOne({
      where: { id: storyId },
    });

    // 글이 존재하지 않으면 에러 발생
    if (!story) {
      throw new NotFoundException(`스토리 ID ${storyId}를 찾을 수 없습니다.`);
    }

    // 글 작성자와 요청한 사용자의 이메일이 일치하지 않으면 에러 발생
    if (story.creator_email !== userData.user_email) {
      throw new UnauthorizedException('본인의 글만 삭제할 수 있습니다.');
    }

    // 삭제 권한이 있을 경우, 글 삭제 진행
    await this.storyRepository.delete(storyId);
  }
}
