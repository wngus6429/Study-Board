import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, In } from 'typeorm';
import { User } from 'src/entities/User.entity';
import { Suggestion } from 'src/entities/Suggestion.entity';
import { SuggestionImage } from 'src/entities/SuggestionImage.entity';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class SuggestionService {
  constructor(
    @InjectDataSource()
    private dataSource: DataSource,
    @InjectRepository(Suggestion)
    private suggestionRepository: Repository<Suggestion>,
    @InjectRepository(SuggestionImage)
    private readonly suggestionImageRepository: Repository<SuggestionImage>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  // 건의사항 목록 조회 (카테고리 필터 적용)
  async findSuggestion(
    offset = 0,
    limit = 10,
    userId: string,
  ): Promise<{
    results: Partial<Suggestion & { nickname: string }>[];
    total: number;
  }> {
    // userId를 기준으로 필터 조건 생성
    const whereCondition = { User: { id: userId } };

    // 해당 유저가 작성한 건의사항 총 개수 조회
    const total = await this.suggestionRepository.count({
      where: whereCondition,
    });

    // 해당 유저가 작성한 건의사항 목록 조회 (작성자 정보 포함)
    const suggestions = await this.suggestionRepository.find({
      relations: ['User'],
      where: whereCondition,
      order: { id: 'DESC' },
      skip: Number(offset),
      take: Number(limit),
    });

    // 결과 데이터 가공: 작성자의 닉네임 포함
    const results = suggestions.map((suggestion) => {
      const { User, ...rest } = suggestion;
      return { ...rest, nickname: User.nickname };
    });

    return { results, total };
  }

  // 건의사항 수정용 데이터 조회
  async findEditSuggestionOne(id: number, userId?: string): Promise<any> {
    const suggestion = await this.suggestionRepository.findOne({
      where: { id },
      relations: ['SuggestionImage', 'User'],
    });
    if (!suggestion) {
      throw new NotFoundException(`Suggestion with ID ${id} not found`);
    }
    if (suggestion.User.id !== userId) {
      throw new ForbiddenException('수정 권한이 없습니다');
    }
    const { User, ...editData } = suggestion;
    return editData;
  }

  // 건의사항 상세 조회
  async findSuggestionOne(id: number): Promise<any> {
    const suggestion = await this.suggestionRepository.findOne({
      where: { id },
      relations: ['SuggestionImage', 'User', 'User.UserImage'],
    });
    if (!suggestion) {
      throw new NotFoundException(`Suggestion with ID ${id} not found`);
    }
    // 조회수 증가 등 추가 로직이 필요하면 여기서 처리 (현재는 생략)
    const { SuggestionImage, User, ...rest } = suggestion;
    const writeUserInfo = {
      nickname: User.nickname,
      id: User.id,
      userImage: User.UserImage?.link || null,
    };
    console.log('씨발');
    console.log('꺼컹ㅋ', { ...rest, SuggestionImage, User: writeUserInfo });
    return { ...rest, SuggestionImage, User: writeUserInfo };
  }

  // 건의사항 작성
  async create(
    createSuggestionDto: any,
    userData: User,
    files: Express.Multer.File[],
  ): Promise<Suggestion> {
    const { title, content, category } = createSuggestionDto;
    const suggestion = this.suggestionRepository.create({
      category,
      title,
      content,
      User: userData,
    });
    const savedSuggestion = await this.suggestionRepository.save(suggestion);

    if (files && files.length > 0) {
      const imageEntities = files.map((file) => {
        const image = new SuggestionImage();
        image.image_name = file.filename;
        image.link = `/suggestionUpload/${file.filename}`;
        image.Suggestion = savedSuggestion;
        return image;
      });
      await this.suggestionImageRepository.save(imageEntities);
      // 최신 이미지 목록 재조회 후 반영
      savedSuggestion.SuggestionImage =
        await this.suggestionImageRepository.find({
          where: { Suggestion: { id: savedSuggestion.id } },
        });
      await this.suggestionRepository.save(savedSuggestion);
    }
    return savedSuggestion;
  }

  // 건의사항 수정
  async updateSuggestion(
    suggestionId: number,
    updateSuggestionDto: any,
    userData: User,
    newImages: Express.Multer.File[],
  ): Promise<Suggestion> {
    const suggestion = await this.suggestionRepository.findOne({
      where: { id: suggestionId },
      relations: ['SuggestionImage', 'User'],
    });
    if (!suggestion) {
      throw new NotFoundException('수정할 건의사항을 찾을 수 없습니다.');
    }
    if (suggestion.User.id !== userData.id) {
      throw new UnauthorizedException('본인의 건의사항만 수정할 수 있습니다.');
    }

    // 기존 이미지 중 클라이언트가 유지하길 원하는 이미지 URL 추출
    const existImages = Array.isArray(updateSuggestionDto.existImages)
      ? updateSuggestionDto.existImages
      : updateSuggestionDto.existImages
        ? [updateSuggestionDto.existImages]
        : [];
    let normalizedExistImages: string[] = [];
    if (existImages.length > 0) {
      normalizedExistImages = existImages.map((url: string) =>
        decodeURIComponent(new URL(url).pathname),
      );
    }

    // 삭제할 이미지 필터링
    const imagesToDelete = suggestion.SuggestionImage.filter(
      (img) => !normalizedExistImages.includes(decodeURIComponent(img.link)),
    );
    if (imagesToDelete.length > 0) {
      const imagesWithRelations = await this.suggestionImageRepository.find({
        where: { id: In(imagesToDelete.map((img) => img.id)) },
      });
      for (const image of imagesWithRelations) {
        await this.suggestionImageRepository.remove(image);
      }
      suggestion.SuggestionImage = suggestion.SuggestionImage.filter(
        (img) => !imagesToDelete.some((delImg) => delImg.id === img.id),
      );
      await this.suggestionRepository.save(suggestion);
    }

    // 새 이미지 추가
    if (newImages && newImages.length > 0) {
      const newImageEntities = newImages.map((file) => {
        const image = new SuggestionImage();
        image.image_name = file.filename;
        image.link = `/upload/${file.filename}`;
        image.Suggestion = suggestion;
        return image;
      });
      await this.suggestionImageRepository.save(newImageEntities);
      const updatedImages = await this.suggestionImageRepository.find({
        where: { Suggestion: { id: suggestionId } },
      });
      suggestion.SuggestionImage = updatedImages;
      await this.suggestionRepository.save(suggestion);
    }

    // 제목, 내용, 카테고리 업데이트
    suggestion.title = updateSuggestionDto.title;
    suggestion.content = updateSuggestionDto.content;
    suggestion.category = updateSuggestionDto.category;
    return await this.suggestionRepository.save(suggestion);
  }

  // 건의사항 삭제
  async deleteSuggestion(suggestionId: number, userData: User): Promise<void> {
    const suggestion = await this.suggestionRepository.findOne({
      where: { id: suggestionId },
      relations: ['SuggestionImage', 'User'],
    });
    if (!suggestion) {
      throw new NotFoundException('삭제할 건의사항이 존재하지 않습니다.');
    }
    if (suggestion.User.id !== userData.id) {
      throw new UnauthorizedException('본인의 건의사항만 삭제할 수 있습니다.');
    }

    // 첨부된 이미지 파일 삭제
    if (suggestion.SuggestionImage && suggestion.SuggestionImage.length > 0) {
      for (const image of suggestion.SuggestionImage) {
        const filePath = path.join(__dirname, '../../upload', image.image_name);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }
    }
    await this.suggestionRepository.delete(suggestionId);
  }
}
