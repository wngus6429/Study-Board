import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { User } from '../entities/User.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  //! ㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡ
  // 사용자 닉네임으로 검색
  async searchUserByNickname(query: string) {
    if (!query || query.trim().length === 0) {
      return [];
    }

    const users = await this.userRepository.find({
      where: { nickname: ILike(`%${query}%`) },
      select: ['id', 'nickname', 'user_email'],
      take: 10,
    });

    return users.map((user) => ({
      id: user.id,
      nickname: user.nickname,
      user_email: user.user_email,
    }));
  }
}
