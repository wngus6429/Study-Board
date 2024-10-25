import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './user.entity';
import { SignupUserDto } from './dto/signup.user.dto';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { SigninUserDto } from './dto/signin.user.dto';
import { v4 as uuid } from 'uuid';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private userRepository: Repository<User>,
    private jwtService: JwtService,
  ) {}

  // 회원가입처리
  async signUp(userData: SignupUserDto): Promise<void> {
    const { user_email, password, nickname } = userData;
    // 유저가 이미 존재하는지 확인
    const existUser = await this.userRepository.findOne({
      where: { user_email },
    });
    if (existUser) {
      throw new ConflictException('이메일이 이미 존재합니다.');
    }
    // bcrypt 비밀번호 해쉬처리
    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(password, salt);

    // 사용자 생성
    const user = this.userRepository.create({
      user_email,
      password: hashedPassword,
      nickname,
    });
    try {
      await this.userRepository.save(user);
    } catch (error) {
      if (error.code === '23505') {
        throw new ConflictException('이메일이 이미 존재합니다.');
      } else {
        throw new InternalServerErrorException();
      }
    }
  }

  // 로그인 처리
  async signIn(
    userData: SigninUserDto,
  ): Promise<{ id: number; user_email: string; nickname: string } | null> {
    const { user_email, password } = userData;
    // 이메일로 사용자 조회
    const user = await this.userRepository.findOne({ where: { user_email } });
    if (!user) {
      throw new ConflictException('이메일이 존재하지 않습니다.');
    }
    console.log('비밀번호 확인', password, user.password);
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) throw new ConflictException('비밀번호가 일치하지 않습니다.');
    // 사용자 정보 반환 (민감한 정보 제외)
    return {
      id: user.id,
      user_email: user.user_email,
      nickname: user.nickname,
    };
  }

  // async signUp(userData: SignupUserDto): Promise<void> {
  //   const { user_email, password, nickname } = userData;
  //   // ToDo 유저가 있는지 확인해야함
  //   const existUser = await this.userRepository.findOne({
  //     where: { user_email },
  //   });
  //   if (existUser) {
  //     throw new ConflictException('Username already exists');
  //   }
  //   const salt = await bcrypt.genSalt();
  //   const hashedPassword = await bcrypt.hash(password, salt);
  //   // UUID 직접 생성하여 사용자 ID에 할당
  //   const user = this.userRepository.create({
  //     user_email,
  //     password: hashedPassword,
  //     nickname,
  //   });
  //   console.log('user:', user);
  //   try {
  //     await this.userRepository.save(user);
  //     await this.signIn(user);
  //     // const { accessToken } = await this.signIn({ user_email, password });
  //     // return { accessToken };
  //   } catch (error) {
  //     console.log(error.code);
  //     if (error.code === '23505') {
  //       throw new ConflictException('Username already exists');
  //     } else {
  //       throw new InternalServerErrorException();
  //     }
  //   }
  // }

  // async signIn(userData: SigninUserDto): Promise<{ accessToken: string }> {
  //   const { user_email, password } = userData;
  //   const user = await this.userRepository.findOne({ where: { user_email } });
  //   if (!user) {
  //     throw new ConflictException('이메일이 존재하지 않습니다.');
  //   }
  //   const isMatch = await bcrypt.compare(password, user.password);
  //   if (!isMatch) {
  //     throw new ConflictException('비밀번호가 일치하지 않습니다.');
  //   }
  //   const payload = { user_email };
  //   const accessToken = this.jwtService.sign(payload);
  //   console.log('accessToken:', accessToken);
  //   return { accessToken };
  // }
}
