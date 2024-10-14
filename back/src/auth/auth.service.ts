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

  async signUp(userData: SignupUserDto): Promise<void> {
    const { user_email, password, nickname } = userData;
    // ToDo 유저가 있는지 확인해야함
    const existUser = await this.userRepository.findOne({
      where: { user_email },
    });
    if (existUser) {
      throw new ConflictException('Username already exists');
    }
    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(password, salt);
    // UUID 직접 생성하여 사용자 ID에 할당
    const user = this.userRepository.create({
      user_email,
      password: hashedPassword,
      nickname,
    });
    console.log('user:', user);
    try {
      await this.userRepository.save(user);
    } catch (error) {
      console.log(error.code);
      if (error.code === '23505') {
        throw new ConflictException('Username already exists');
      } else {
        throw new InternalServerErrorException();
      }
    }
  }

  async signIn(userData: SigninUserDto): Promise<{ accessToken: string }> {
    const { user_email, password } = userData;
    const user = await this.userRepository.findOne({ where: { user_email } });
    if (!user) {
      throw new ConflictException('이메일이 존재하지 않습니다.');
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw new ConflictException('비밀번호가 일치하지 않습니다.');
    }
    const payload = { user_email };
    const accessToken = this.jwtService.sign(payload);
    console.log('accessToken:', accessToken);
    return { accessToken };
  }
}
