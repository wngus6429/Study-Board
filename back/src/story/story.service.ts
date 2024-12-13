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
import { StoryImage } from 'src/entities/StoryImage.entity';
import * as fs from 'fs';
import * as path from 'path';
import { UpdateStoryDto } from './dto/update-story.dto';
import { Comments } from 'src/entities/Comments.entity';

@Injectable()
export class StoryService {
  constructor(
    @InjectRepository(Story)
    private storyRepository: Repository<Story>,
    @InjectRepository(StoryImage)
    private readonly imageRepository: Repository<StoryImage>,
    @InjectRepository(User) private userRepository: Repository<User>,
    @InjectRepository(Comments) private commentRepository: Repository<Comments>,
  ) {}

  // 목록 페이지
  async findStoryAll(): Promise<Partial<Story>[]> {
    return this.storyRepository.find({ relations: ['User'] });
  }

  // 수정 페이지
  async findEditStoryOne(id: number, userId?: string): Promise<any> {
    const findData = await this.storyRepository.findOne({
      where: { id },
      relations: ['StoryImage'],
    });
    if (!findData) {
      throw new NotFoundException(`Story with ID ${id} not found`);
    }

    return findData;
  }

  // 상세 페이지
  async findStoryOne(id: number, userId?: string): Promise<any> {
    const findData = await this.storyRepository.findOne({
      where: { id },
      relations: ['StoryImage', 'User', 'User.UserImage'],
    });
    if (!findData) {
      // 데이터가 없을 경우 404 에러 던지기
      throw new NotFoundException(`Story with ID ${id} not found`);
    }

    // let loginUser;
    // if (userId != null) {
    //   try {
    //     loginUser = await this.userRepository.findOne({
    //       where: { id: userId },
    //       relations: ['UserImage'],
    //     });
    //   } catch (error) {
    //     throw new NotFoundException(`User with ID ${userId} not found`);
    //   }
    // } else {
    //   loginUser = null;
    // }

    // // Comments 필드가 배열인지 확인 후 처리
    // const processedComments = Array.isArray(findData.Comments)
    //   ? findData.Comments.map((comment) => ({
    //       id: comment.id,
    //       content: comment.content,
    //       updated_at: comment.updated_at,
    //       nickname: comment.User.nickname, // User 객체에서 nickname만 남김
    //       link: comment.User.UserImage?.link || null, // UserImage 객체에서 link만 남김
    //     }))
    //   : []; // 배열이 아니면 빈 배열로 처리

    return findData;
  }

  // 상세 페이지, 댓글 데이터 Get
  async findStoryOneComment(id: number, userData?: any): Promise<any> {
    const findData = await this.storyRepository.findOne({
      where: { id },
      relations: ['Comments', 'Comments.User', 'Comments.User.UserImage'],
    });
    if (!findData) {
      throw new NotFoundException(`${id}의 댓글 데이터가 없음 `);
    }
    const { userId } = userData;
    let loginUser;
    if (userId != null) {
      try {
        loginUser = await this.userRepository.findOne({
          where: { id: userId },
          relations: ['UserImage'],
        });
      } catch (error) {
        throw new NotFoundException(`로그인한 유저의 정보를 못 찾음`);
      }
    } else {
      loginUser = null;
    }

    // Comments 필드가 배열인지 확인 후 처리
    const processedComments = Array.isArray(findData.Comments)
      ? findData.Comments.map((comment) => ({
          id: comment.id,
          content: comment.content,
          updated_at: comment.updated_at,
          nickname: comment.User.nickname, // User 객체에서 nickname만 남김
          link: comment.User.UserImage?.link || null, // UserImage 객체에서 link만 남김
        }))
      : []; // 배열이 아니면 빈 배열로 처리

    return { processedComments, loginUser };
  }

  // 글 작성
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
      const image = new StoryImage();
      image.image_name = file.filename;
      image.link = `/upload/${file.filename}`; // 저장 경로 설정
      image.Story = savedStory;
      return image;
    });

    console.log('글작성 저장 전 이미지 엔티티:', imageEntities);
    await this.imageRepository.save(imageEntities);

    return savedStory;
  }

  // 글 수정
  async updateStory(
    storyId: number,
    updateStoryDto: UpdateStoryDto,
    userData: User,
    newImages: Express.Multer.File[],
  ): Promise<Story> {
    const story = await this.storyRepository.findOne({
      where: { id: storyId },
      relations: ['StoryImage'],
    });

    if (!story) {
      throw new NotFoundException('수정할 글을 찾을 수 없습니다.');
    }

    // 이거 에러 나던데 확인 해봐야 할듯
    // if (story.User !== userData) {
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
    const imagesToDelete = story.StoryImage.filter(
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

      // Story의 StoryImage 관계에서 삭제된 이미지를 제거
      story.StoryImage = story.StoryImage.filter(
        (img) => !imagesToDelete.some((delImg) => delImg.id === img.id),
      );
      await this.storyRepository.save(story); // 관계 동기화
    }

    // 새 이미지 추가
    if (newImages.length > 0) {
      const imageEntities = newImages.map((file) => {
        const image = new StoryImage();
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
      story.StoryImage = updatedImages;
      await this.storyRepository.save(story); // 관계 동기화
    }

    Object.assign(story, {
      title: updateStoryDto.title,
      content: updateStoryDto.content,
      category: updateStoryDto.category,
    });

    return await this.storyRepository.save(story);
  }

  // 글 삭제
  async deleteStory(storyId: number, userData: User): Promise<void> {
    // 스토리 데이터 가져오기
    const story: Story = await this.storyRepository.findOne({
      where: { id: storyId },
      relations: ['StoryImage'], // 이미지 관계도 함께 가져오기
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
    if (story.StoryImage && story.StoryImage.length > 0) {
      story.StoryImage.forEach((image) => {
        const filePath = path.join(__dirname, '../../upload', image.image_name);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath); // 파일 삭제
        }
      });
    }

    // 삭제 권한이 있을 경우, 글 삭제 진행
    await this.storyRepository.delete(storyId);
  }

  async createComment(commentData: {
    storyId: string;
    content: string;
    parentId?: number | null;
    authorId: string;
  }): Promise<void> {
    console.log('응userId', commentData);
    const { storyId, content, parentId, authorId } = commentData;

    // 글 확인
    const story = await this.storyRepository.findOne({
      where: { id: Number(storyId) },
    });

    if (!story) {
      throw new NotFoundException('댓글을 작성할 글을 찾을 수 없습니다.');
    }

    const UserData = await this.userRepository.findOne({
      where: { id: authorId },
    });

    if (!UserData) {
      throw new NotFoundException('댓글을 작성할 사용자를 찾을 수 없습니다.');
    }

    // 부모 댓글 확인 (대댓글인 경우)
    let parentComment: Comments | null = null;
    if (parentId) {
      parentComment = await this.commentRepository.findOne({
        where: { id: parentId },
      });

      if (!parentComment) {
        throw new NotFoundException('부모 댓글을 찾을 수 없습니다.');
      }
    }
    console.log('유저', UserData);

    // 댓글 생성
    const comment = this.commentRepository.create({
      content,
      parent: parentComment || null,
      Story: story,
      User: UserData,
    });

    // 댓글 저장
    await this.commentRepository.save(comment);
  }
}
