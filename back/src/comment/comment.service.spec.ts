import { Test, TestingModule } from '@nestjs/testing';
import { CommentService } from './comment.service';
import { getRepositoryToken, getDataSourceToken } from '@nestjs/typeorm';
import { Comments } from '../entities/Comments.entity';
import { Story } from '../entities/Story.entity';
import { User } from '../entities/User.entity';
import { Notification } from '../entities/Notification.entity';
import { NotFoundException, ForbiddenException } from '@nestjs/common';

const mockCommentRepository = {
  create: jest.fn(),
  save: jest.fn(),
  findOne: jest.fn(),
  decrement: jest.fn(),
};

const mockStoryRepository = {
  findOne: jest.fn(),
  decrement: jest.fn(),
};

const mockUserRepository = {
  findOne: jest.fn(),
};

const mockNotificationRepository = {
  create: jest.fn(),
};

const mockEntityManager = {
  save: jest.fn(),
  increment: jest.fn(),
  decrement: jest.fn(),
  getRepository: jest.fn((entity) => {
    if (entity === User) return { findOne: jest.fn(), save: jest.fn() };
    if (entity === Comments) return mockCommentRepository;
    if (entity === Story) return mockStoryRepository;
    return {};
  }),
};

const mockDataSource = {
  transaction: jest.fn((cb) => cb(mockEntityManager)),
};

describe('CommentService', () => {
  let service: CommentService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CommentService,
        { provide: getDataSourceToken(), useValue: mockDataSource },
        { provide: getRepositoryToken(Comments), useValue: mockCommentRepository },
        { provide: getRepositoryToken(Story), useValue: mockStoryRepository },
        { provide: getRepositoryToken(User), useValue: mockUserRepository },
        { provide: getRepositoryToken(Notification), useValue: mockNotificationRepository },
      ],
    }).compile();

    service = module.get<CommentService>(CommentService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createComment', () => {
    it('정상적으로 댓글이 생성되어야 함', async () => {
      mockStoryRepository.findOne.mockResolvedValue({ id: 1, User: { id: 'author' } });
      mockUserRepository.findOne.mockResolvedValue({ id: 'user', experience_points: 0 });
      mockCommentRepository.create.mockReturnValue({ id: 10, content: 'test' });
      mockEntityManager.save.mockResolvedValue({ id: 10 });

      const result = await service.createComment({
        storyId: '1',
        content: 'test',
        authorId: 'user',
      });

      expect(result).toEqual({ commentId: 10 });
      expect(mockDataSource.transaction).toHaveBeenCalled();
    });

    it('존재하지 않는 글에 댓글 작성 시 NotFoundException 발생', async () => {
      mockStoryRepository.findOne.mockResolvedValue(null);

      await expect(
        service.createComment({ storyId: '999', content: 'test', authorId: 'user' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('deleteComment', () => {
    it('글 작성자 본인이면 댓글이 소프트 삭제되어야 함', async () => {
      const mockUser = { id: 'user', is_super_admin: false } as any;
      mockCommentRepository.findOne.mockResolvedValue({ id: 1, User: { id: 'user' } });
      mockStoryRepository.findOne.mockResolvedValue({ id: 1 });
      
      await service.deleteComment(1, { storyId: '1' }, mockUser);
      
      expect(mockCommentRepository.save).toHaveBeenCalled();
      // 삭제 처리 시 deleted_at이 세팅되는지 간접 확인 (save 인자로 넘어감)
    });

    it('권한 없는 사용자가 삭제 시도하면 ForbiddenException 발생', async () => {
      const mockUser = { id: 'stranger', is_super_admin: false } as any;
      mockCommentRepository.findOne.mockResolvedValue({ id: 1, User: { id: 'user' } });
      
      await expect(
        service.deleteComment(1, { storyId: '1' }, mockUser),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
