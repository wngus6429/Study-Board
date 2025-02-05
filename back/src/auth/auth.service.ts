import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
// import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../entities/User.entity';
import { SignupUserDto } from './dto/signup.user.dto';
import { IsNull, Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { SigninUserDto } from './dto/signin.user.dto';
import { UserImage } from 'src/entities/UserImage.entity';
import { Comments } from 'src/entities/Comments.entity';
import { Story } from 'src/entities/Story.entity';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    @InjectRepository(UserImage)
    private readonly userImageRepository: Repository<UserImage>,
    @InjectRepository(Comments)
    private readonly commentRepository: Repository<Comments>,
    @InjectRepository(Story)
    private readonly storyRepository: Repository<Story>,
    // private readonly jwtService: JwtService,
  ) {}

  // 회원가입처리
  async signUp(userData: SignupUserDto): Promise<void> {
    const { user_email, password, nickname } = userData;
    // 유저가 이미 존재하는지 확인
    const existUser = await this.userRepository.findOne({
      where: { user_email },
    });
    if (existUser) {
      console.log('여기요', existUser);
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
  ): Promise<{ id: string; user_email: string } | null> {
    const { user_email, password } = userData;
    // 이메일로 사용자 조회
    const user = await this.userRepository.findOne({ where: { user_email } });
    if (!user) {
      throw new ConflictException('이메일이 존재하지 않습니다.');
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) throw new ConflictException('비밀번호가 일치하지 않습니다.');
    // 사용자 정보 반환 (민감한 정보인 패스워드 제외)
    return {
      id: user.id,
      user_email: user.user_email,
    };
  }

  // 로그인 유저 프로필 작성 글 가져오기
  async userFindStory(
    offset = 0,
    limit = 10,
    userId: string,
  ): Promise<{ StoryResults: Partial<Story>[]; StoryTotal: number }> {
    const [StoryResults, StoryTotal] = await Promise.all([
      this.storyRepository.find({
        relations: ['User'],
        order: { id: 'DESC' },
        skip: offset,
        take: limit,
        where: { User: { id: userId } }, // 특정 사용자 조건
      }),
      this.storyRepository.count({ where: { User: { id: userId } } }), // 조건 추가
    ]);
    return { StoryResults, StoryTotal };
  }
  // 로그인 유저 프로필 댓글 가져오기
  async userFindComments(
    offset = 0,
    limit = 10,
    userId: string,
  ): Promise<{ CommentsResults: Partial<any>[]; CommentsTotal: number }> {
    // 전체 댓글 데이터를 가져옵니다.
    const [rawComments, CommentsTotal] = await Promise.all([
      this.commentRepository.find({
        relations: ['Story'],
        order: { id: 'DESC' },
        skip: offset,
        take: limit,
        where: {
          User: { id: userId },
          deleted_at: IsNull(),
        },
      }),
      this.commentRepository.count({
        where: {
          User: { id: userId },
          deleted_at: IsNull(),
        },
      }),
    ]);

    // 필요한 필드만 추출합니다.
    const CommentsResults = rawComments.map((comment) => ({
      id: comment.id,
      content: comment.content,
      updated_at: comment.updated_at,
      storyId: comment.Story?.id, // Story 객체가 존재할 경우 id만 가져옵니다.
    }));

    return { CommentsResults, CommentsTotal };
  }

  // 다른 유저 프로필 정보 가져오기
  async userGet(id: string): Promise<{ image: UserImage; nickname: string }> {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['UserImage'],
    });
    // TODO 비밀번호 안 빠져나가게 해야함
    console.log('user:', user);
    return { image: user.UserImage, nickname: user.nickname };
  }
  // 다른 유저 정보 가져오기
  async anotherUserGet(username: string): Promise<any> {
    // 1. 유저 정보 가져오기
    const user = await this.userRepository.findOne({
      where: { nickname: username },
      relations: ['UserImage'], // 유저 이미지와 관계를 가져옴
    });

    if (!user) {
      throw new ConflictException('사용자를 찾을 수 없습니다.');
    }

    // 2. 유저가 작성한 Story 최신순으로 10개 가져오기
    const posts = await this.storyRepository.find({
      where: { User: { id: user.id } }, // Story 테이블에서 유저 ID를 기준으로 검색
      order: { created_at: 'DESC' }, // 최신순 정렬
      take: 10, // 최대 10개만 가져오기
    });

    // 3. 유저가 작성한 Comments 최신순으로 10개 가져오기
    const comments = await this.commentRepository.find({
      where: { User: { id: user.id } }, // Comments 테이블에서 유저 ID를 기준으로 검색
      order: { created_at: 'DESC' }, // 최신순 정렬
      take: 10, // 최대 10개만 가져오기
    });

    return {
      user: {
        nickname: user.nickname,
        image: user.UserImage,
      },
      posts: posts.map((post) => ({
        id: post.id,
        title: post.title,
        content: post.content,
      })),
      comments: comments.map((comment) => ({
        content: comment.content,
        created_at: comment.created_at,
      })),
    };
  }

  // 유저 정보 업데이트
  async userUpdate(
    userData: User,
    profileImage: Express.Multer.File | null, // profileImage를 선택적으로 받아서 없을 경우를 처리
  ): Promise<User> {
    const { id, nickname } = userData;
    // 사용자 찾기
    const user: User = await this.userRepository.findOne({
      where: { id },
      relations: ['UserImage'], // 기존에 User와 UserImage 관계를 불러오기 위해 relations 사용
    });

    // 새로운 프로필 이미지가 존재하고 파일 이름이 정의되어 있는 경우에만 업데이트
    if (profileImage && profileImage.filename) {
      if (user.UserImage) {
        // 기존 이미지가 존재할 경우 삭제
        await this.userImageRepository.remove(user.UserImage); // 기존 이미지 삭제
      }

      // 새로운 UserImage 생성 및 업데이트
      const newUserImage = new UserImage();
      newUserImage.image_name = profileImage.filename; // 파일 이름이 확실히 할당됨
      newUserImage.link = `/userUpload/${profileImage.filename}`;
      newUserImage.User = user; // 관계 설정

      // 새로운 이미지 할당
      console.log('newUserImage:', newUserImage);
      user.UserImage = newUserImage;
      await this.userImageRepository.save(newUserImage);
    }
    user.nickname = nickname;
    // 사용자 정보 업데이트
    await this.userRepository.save(user);

    // 사용자 정보 및 관계된 이미지 저장
    return user;
  }

  async deleteProfilePicture(id: string): Promise<void> {
    await this.userImageRepository.delete({ User: { id } });
    // 사용자 찾기
    // const user: User = await this.userRepository.findOne({
    //   where: { id },
    //   relations: ['image'],
    // });

    // // 이미지가 존재할 경우 삭제
    // if (user.image) {
    //   await this.userImageRepository.remove(user.image);
    // }
  }

  async changePassword(userData: any): Promise<void> {
    const { id, password } = userData;
    // 사용자 찾기
    const user: User = await this.userRepository.findOne({
      where: { id },
    });

    // 비밀번호 해쉬처리
    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(password, salt);

    // 비밀번호 업데이트
    user.password = hashedPassword;
    await this.userRepository.save(user);
  }
}
