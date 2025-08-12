import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Blind } from '../entities/Blind.entity';
import { User } from '../entities/User.entity';
import { CreateBlindDto } from './dto/create-blind.dto';

@Injectable()
export class BlindService {
  constructor(
    @InjectRepository(Blind)
    private readonly blindRepository: Repository<Blind>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  // 블라인드 추가
  async addBlind(userId: string, createBlindDto: CreateBlindDto) {
    const { targetUserNickname } = createBlindDto;

    // 닉네임으로 대상 사용자 찾기
    const targetUser = await this.userRepository.findOne({
      where: { nickname: targetUserNickname },
    });

    if (!targetUser) {
      throw new NotFoundException('해당 닉네임의 사용자를 찾을 수 없습니다.');
    }

    // 자기 자신을 블라인드할 수 없음
    if (userId === targetUser.id) {
      throw new BadRequestException('자기 자신을 블라인드할 수 없습니다.');
    }

    // 이미 블라인드했는지 확인
    const existingBlind = await this.blindRepository.findOne({
      where: { userId, targetUserId: targetUser.id },
    });

    if (existingBlind) {
      throw new ConflictException('이미 블라인드한 사용자입니다.');
    }

    // 블라인드 생성
    const blind = this.blindRepository.create({
      userId,
      targetUserId: targetUser.id,
    });

    const savedBlind = await this.blindRepository.save(blind);

    // 응답용으로 사용자 정보와 함께 반환
    return await this.blindRepository.findOne({
      where: { id: savedBlind.id },
      relations: ['targetUser'],
    });
  }

  // 블라인드 목록 조회 (페이지네이션)
  async getBlindUsers(userId: string, page: number = 1, limit: number = 20) {
    const [blindUsers, total] = await this.blindRepository.findAndCount({
      where: { userId },
      relations: ['targetUser'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      items: blindUsers,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // 블라인드 해제
  async removeBlind(userId: string, blindId: number) {
    const blind = await this.blindRepository.findOne({
      where: { id: blindId },
    });

    if (!blind) {
      throw new NotFoundException('블라인드를 찾을 수 없습니다.');
    }

    // 권한 확인 - 본인이 설정한 블라인드만 해제 가능
    if (blind.userId !== userId) {
      throw new ForbiddenException('이 블라인드를 해제할 권한이 없습니다.');
    }

    await this.blindRepository.remove(blind);
  }

  // 특정 사용자가 블라인드되어 있는지 확인
  async isUserBlinded(userId: string, targetUserId: string): Promise<boolean> {
    const blind = await this.blindRepository.findOne({
      where: { userId, targetUserId },
    });

    return !!blind;
  }

  // 사용자의 모든 블라인드 목록 가져오기 (빠른 조회용)
  async getUserBlindedUserIds(userId: string): Promise<string[]> {
    const blindUsers = await this.blindRepository.find({
      where: { userId },
      select: ['targetUserId'],
    });

    return blindUsers.map((blind) => blind.targetUserId);
  }
}
