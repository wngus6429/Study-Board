import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';

const mockAuthService = {
  signUp: jest.fn(),
  signIn: jest.fn(),
};

const mockJwtService = {
  sign: jest.fn(),
  verify: jest.fn(),
};

describe('AuthController', () => {
  let controller: AuthController;
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [PassportModule.register({ defaultStrategy: 'jwt' })],
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    service = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('signup', () => {
    it('회원가입 요청 시 authService.signUp이 호출되어야 함', async () => {
      const dto = { user_email: 'test@test.com', password: 'password', nickname: 'tester', confirmPassword: 'password' };
      const res = { sendStatus: jest.fn() } as any;
      mockAuthService.signUp.mockResolvedValue(undefined);

      await controller.signup(dto as any, res);
      expect(service.signUp).toHaveBeenCalledWith(dto);
    });
  });

  describe('signin', () => {
    it('로그인 성공 시 쿠키를 설정하고 메시지를 반환해야 함', async () => {
      const dto = { user_email: 'test@test.com', password: 'password' };
      const userResult = { id: '1', nickname: 'tester', image: null, is_super_admin: false };

      mockAuthService.signIn.mockResolvedValue(userResult);

      const res = {
        cookie: jest.fn(),
        send: jest.fn(),
        json: jest.fn(),
        status: jest.fn().mockReturnThis(),
      };

      await controller.signin(dto, res as any);
      
      expect(service.signIn).toHaveBeenCalledWith(dto);
      expect(res.cookie).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalled();
    });
  });
});
