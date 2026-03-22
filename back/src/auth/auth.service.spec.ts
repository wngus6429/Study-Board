import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from '../entities/User.entity';
import { UserImage } from '../entities/UserImage.entity';
import { Comments } from '../entities/Comments.entity';
import { Story } from '../entities/Story.entity';
import { Likes } from '../entities/Likes.entity';
import { ConflictException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';

const mockUserRepository = {
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
};

const mockUserImageRepository = { remove: jest.fn(), save: jest.fn(), delete: jest.fn() };
const mockCommentRepository = { find: jest.fn(), count: jest.fn() };
const mockStoryRepository = { find: jest.fn(), count: jest.fn() };
const mockLikesRepository = {
  createQueryBuilder: jest.fn().mockReturnValue({
    leftJoin: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    getCount: jest.fn(),
  }),
};

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: getRepositoryToken(User), useValue: mockUserRepository },
        { provide: getRepositoryToken(UserImage), useValue: mockUserImageRepository },
        { provide: getRepositoryToken(Comments), useValue: mockCommentRepository },
        { provide: getRepositoryToken(Story), useValue: mockStoryRepository },
        { provide: getRepositoryToken(Likes), useValue: mockLikesRepository },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('signUp', () => {
    it('성공적으로 회원가입되어야 함', async () => {
      const userData = { user_email: 'test@test.com', password: 'password', nickname: 'tester' };
      mockUserRepository.findOne.mockReturnValue(null); // 이메일, 닉네임 중복 없음
      mockUserRepository.create.mockReturnValue(userData);
      
      jest.spyOn(bcrypt, 'genSalt').mockResolvedValue('testSalt' as never);
      jest.spyOn(bcrypt, 'hash').mockResolvedValue('hashedPassword' as never);
      mockUserRepository.save.mockResolvedValue(userData);

      await expect(service.signUp(userData as any)).resolves.not.toThrow();
      expect(mockUserRepository.save).toHaveBeenCalled();
    });

    it('이메일 중복 시 ConflictException 발생', async () => {
      const userData = { user_email: 'test@test.com', password: 'password', nickname: 'tester' };
      mockUserRepository.findOne.mockResolvedValueOnce(userData); // 이메일 중복

      await expect(service.signUp(userData as any)).rejects.toThrow(ConflictException);
    });

    it('닉네임 중복 시 ConflictException 발생', async () => {
      const userData = { user_email: 'test@test.com', password: 'password', nickname: 'tester' };
      mockUserRepository.findOne.mockResolvedValueOnce(null).mockResolvedValueOnce(userData); // 이메일 통과, 닉네임 중복

      await expect(service.signUp(userData as any)).rejects.toThrow(ConflictException);
    });
  });

  describe('signIn', () => {
    it('로그인 성공 시 유저 정보 반환', async () => {
      const userData = { user_email: 'test@test.com', password: 'password' };
      const savedUser = { 
        id: '1', user_email: 'test@test.com', password: 'hashedPassword', nickname: 'tester', is_super_admin: false, UserImage: null 
      };
      
      mockUserRepository.findOne.mockResolvedValue(savedUser);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);

      const result = await service.signIn(userData as any);
      expect(result).toEqual({
        id: '1', user_email: 'test@test.com', nickname: 'tester', image: null, is_super_admin: false
      });
    });

    it('존재하지 않는 사용자면 ConflictException 발생', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(service.signIn({ user_email: 'notfound@test.com', password: 'pw' } as any)).rejects.toThrow(ConflictException);
    });

    it('비밀번호 불일치 시 ConflictException 발생', async () => {
      mockUserRepository.findOne.mockResolvedValue({ password: 'hashedPassword' });
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(false as never);

      await expect(service.signIn({ user_email: 'test@test.com', password: 'wrong' } as any)).rejects.toThrow(ConflictException);
    });
  });

  describe('checkNicknameAvailability', () => {
    it('사용 가능한 닉네임이면 isAvailable: true 반환', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      const result = await service.checkNicknameAvailability('newNickname');
      expect(result.isAvailable).toBe(true);
    });

    it('중복된 닉네임이면 isAvailable: false 반환', async () => {
      mockUserRepository.findOne.mockResolvedValue({ nickname: 'existNickname' });

      const result = await service.checkNicknameAvailability('existNickname');
      expect(result.isAvailable).toBe(false);
    });
  });

  describe('verifyUser', () => {
    it('현재 비밀번호 일치 시 true 반환', async () => {
      mockUserRepository.findOne.mockResolvedValue({ password: 'hashed' });
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);

      const result = await service.verifyUser({ id: '1', currentPassword: 'pwd' });
      expect(result).toBe(true);
    });

    it('비밀번호 불일치 시 ConflictException 발생', async () => {
      mockUserRepository.findOne.mockResolvedValue({ password: 'hashed' });
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(false as never);

      await expect(service.verifyUser({ id: '1', currentPassword: 'wrong' })).rejects.toThrow(ConflictException);
    });
  });
});
