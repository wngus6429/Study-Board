import {ConflictException, Injectable, InternalServerErrorException} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './user.entity';
import { AuthUserDto } from './dto/auth.user.dto';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private userRepository: Repository<User>,
    private jwtService: JwtService,
  ) {}

  async signUp(userData: AuthUserDto): Promise<void> {
    const { user_email, password, nickname } = userData;
    // ToDo 유저가 있는지 확인해야함
    const existUser = await this.userRepository.findOne({ where: { user_email } });
    if (existUser) {
      throw new ConflictException('Username already exists');
    }
    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(password, salt);
    const user = this.userRepository.create({
      user_email,
      password: hashedPassword,
      nickname
    });
    try {
    await this.userRepository.save(user);
    }  catch (error) {
      console.log(error.code);
      if (error.code === '23505') {
        throw new ConflictException('Username already exists');
      } else {
        throw new InternalServerErrorException();
      }
    }
  }
}
