import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { CreateStoryDto } from './dto/create-story.dto';
import { User } from 'src/entities/User.entity';
import { Story } from 'src/entities/Story.entity';
import { Image } from 'src/entities/Image.entity';
import * as fs from 'fs';
import * as path from 'path';
import { UpdateStoryDto } from './dto/update-story.dto';

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
    return this.storyRepository.find({ relations: ['User'] });
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
    const findData = await this.storyRepository.findOne({
      where: { id },
      relations: ['Image', 'User'], // 'Image'로 수정 (필드 이름과 일치시킴)
    });
    if (!findData) {
      // 데이터가 없을 경우 404 에러 던지기
      throw new NotFoundException(`Story with ID ${id} not found`);
    }
    return findData;
  }

  async create(
    createStoryDto: CreateStoryDto,
    userData: User,
    files: Express.Multer.File[],
  ): Promise<Story> {
    const { title, content, category } = createStoryDto;

    // Story 엔티티 생성
    const story = this.storyRepository.create({
      category,
      title,
      content,
      User: userData, // 유저데이터를 통으로 넣음
    });

    const savedStory = await this.storyRepository.save(story);

    console.log('글 작성 이미지', files);

    // 이미지 파일을 ImageEntity로 변환 후 저장
    const imageEntities = files.map((file) => {
      const image = new Image();
      image.image_name = file.filename;
      image.link = `/upload/${file.filename}`; // 저장 경로 설정
      image.Story = savedStory;
      return image;
    });

    console.log('글작성 저장 전 이미지 엔티티:', imageEntities);
    await this.imageRepository.save(imageEntities);

    return savedStory;
  }

  async updateStory(
    storyId: number,
    updateStoryDto: UpdateStoryDto,
    userData: User,
    newImages: Express.Multer.File[],
  ): Promise<Story> {
    const story = await this.storyRepository.findOne({
      where: { id: storyId },
      relations: ['Image'],
    });

    if (!story) {
      throw new NotFoundException('수정할 글을 찾을 수 없습니다.');
    }

    // if (story.creator_user_id !== userData.id) {
    //   throw new UnauthorizedException('본인의 글만 수정할 수 있습니다.');
    // }

    // 기존 이미지 목록 중에 삭제할 이미지 목록 추출
    const existImages = Array.isArray(updateStoryDto.existImages)
      ? updateStoryDto.existImages
      : updateStoryDto.existImages
        ? [updateStoryDto.existImages]
        : []; // undefined인 경우 빈 배열로 초기화

    let normalizedExistImages: string[] = [];
    if (existImages.length > 0) {
      normalizedExistImages = existImages.map((url) =>
        decodeURIComponent(new URL(url).pathname),
      );
    }

    // 삭제할 이미지 목록 추출
    const imagesToDelete = story.Image.filter(
      (img) => !normalizedExistImages.includes(decodeURIComponent(img.link)),
    );

    if (imagesToDelete.length > 0) {
      const imagesWithRelations = await this.imageRepository.find({
        where: { id: In(imagesToDelete.map((img) => img.id)) },
        relations: ['Story'],
      });

      for (const image of imagesWithRelations) {
        await this.imageRepository.remove(image); // 관계 포함 삭제
      }

      // Story의 Image 관계에서 삭제된 이미지를 제거
      story.Image = story.Image.filter(
        (img) => !imagesToDelete.some((delImg) => delImg.id === img.id),
      );
      await this.storyRepository.save(story); // 관계 동기화
    }

    // 새 이미지 추가
    if (newImages.length > 0) {
      const imageEntities = newImages.map((file) => {
        const image = new Image();
        image.image_name = file.filename;
        image.link = `/upload/${file.filename}`;
        // image.user_id = String(userData.id);
        image.Story = story; // 관계 명확히 설정
        return image;
      });

      await this.imageRepository.save(imageEntities);

      // 관계 업데이트
      const updatedImages = await this.imageRepository.find({
        where: { Story: { id: storyId } },
      });
      story.Image = updatedImages;
      await this.storyRepository.save(story); // 관계 동기화
    }

    Object.assign(story, {
      title: updateStoryDto.title,
      content: updateStoryDto.content,
      category: updateStoryDto.category,
    });

    return await this.storyRepository.save(story);
  }

  async deleteStory(storyId: number, userData: User): Promise<void> {
    // 스토리 데이터 가져오기
    const story: Story = await this.storyRepository.findOne({
      where: { id: storyId },
      relations: ['Image'], // 이미지 관계도 함께 가져오기
    });

    // 글이 존재하지 않으면 에러 발생
    if (!story) {
      throw new NotFoundException('삭제된 글입니다.');
    }

    // 글 작성자와 요청한 사용자의 이메일이 일치하지 않으면 에러 발생
    // if (story.creator_user_id !== userData.id) {
    //   throw new UnauthorizedException('본인의 글만 삭제할 수 있습니다.');
    // }

    // 이미지 파일 삭제
    if (story.Image && story.Image.length > 0) {
      story.Image.forEach((image) => {
        const filePath = path.join(__dirname, '../../upload', image.image_name);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath); // 파일 삭제
        }
      });
    }

    // 삭제 권한이 있을 경우, 글 삭제 진행
    await this.storyRepository.delete(storyId);
  }
}
