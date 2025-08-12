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
import { Likes } from 'src/entities/Likes.entity';
import * as bcrypt from 'bcryptjs';
import { SigninUserDto } from './dto/signin.user.dto';
import { UserImage } from 'src/entities/UserImage.entity';
import { Comments } from 'src/entities/Comments.entity';
import { Story } from 'src/entities/Story.entity';

/**
 * 🔐 사용자 인증 서비스
 *
 * 사용자 회원가입, 로그인, 프로필 관리 등 인증과 관련된 모든 비즈니스 로직을 담당합니다.
 * bcrypt를 사용한 안전한 비밀번호 암호화와 세션 기반 인증을 제공합니다.
 *
 * @features
 * - 회원가입/로그인 (bcrypt 암호화)
 * - 사용자 프로필 관리 (이미지 업로드 포함)
 * - 비밀번호 변경 및 검증
 * - 사용자 작성 콘텐츠 조회 (게시글, 댓글)
 * - 다른 사용자 프로필 조회
 *
 * @security
 * - bcrypt: 비밀번호 해시화 (salt 포함)
 * - 입력값 검증: DTO를 통한 데이터 유효성 검사
 * - 에러 처리: 적절한 HTTP 상태코드와 메시지 반환
 */
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
    @InjectRepository(Likes)
    private readonly likesRepository: Repository<Likes>,
    // private readonly jwtService: JwtService, // JWT 사용 시 주석 해제
  ) {}

  /**
   * 🏷️ 닉네임 중복 확인
   *
   * 입력받은 닉네임이 이미 사용 중인지 확인합니다.
   *
   * @param nickname - 확인할 닉네임
   * @returns 중복 여부 정보 { isAvailable: boolean, message: string }
   */
  async checkNicknameAvailability(nickname: string): Promise<{
    isAvailable: boolean;
    message: string;
  }> {
    const existUser = await this.userRepository.findOne({
      where: { nickname },
    });

    if (existUser) {
      console.log('🚫 닉네임 중복:', nickname);
      return {
        isAvailable: false,
        message: '이미 사용 중인 닉네임입니다.',
      };
    }

    console.log('✅ 닉네임 사용 가능:', nickname);
    return {
      isAvailable: true,
      message: '사용 가능한 닉네임입니다.',
    };
  }

  /**
   * 👤 사용자 회원가입
   *
   * 새로운 사용자를 등록합니다. 이메일과 닉네임 중복 검사와 비밀번호 암호화를 수행합니다.
   *
   * @param userData - 회원가입 정보 (이메일, 비밀번호, 닉네임)
   * @throws ConflictException - 이메일 또는 닉네임이 이미 존재하는 경우
   * @throws InternalServerErrorException - 데이터베이스 저장 실패 시
   *
   * @process
   * 1. 이메일 중복 검사
   * 2. 닉네임 중복 검사
   * 3. bcrypt로 비밀번호 해시화 (salt 생성)
   * 4. 사용자 엔티티 생성 및 저장
   * 5. 에러 처리 (중복 이메일/닉네임, 저장 실패)
   */
  async signUp(userData: SignupUserDto): Promise<void> {
    const { user_email, password, nickname } = userData;

    // 📧 이메일 중복 검사
    const existUserByEmail = await this.userRepository.findOne({
      where: { user_email },
    });
    if (existUserByEmail) {
      console.log(
        '🚫 회원가입 실패 - 이메일 중복:',
        existUserByEmail.user_email,
      );
      throw new ConflictException('이메일이 이미 존재합니다.');
    }

    // 🏷️ 닉네임 중복 검사
    const existUserByNickname = await this.userRepository.findOne({
      where: { nickname },
    });
    if (existUserByNickname) {
      console.log(
        '🚫 회원가입 실패 - 닉네임 중복:',
        existUserByNickname.nickname,
      );
      throw new ConflictException('닉네임이 이미 존재합니다.');
    }

    // 🔒 비밀번호 암호화 (bcrypt + salt)
    const salt = await bcrypt.genSalt(); // 랜덤 salt 생성
    const hashedPassword = await bcrypt.hash(password, salt); // 비밀번호 해시화

    // 👤 사용자 엔티티 생성
    const user = this.userRepository.create({
      user_email,
      password: hashedPassword,
      nickname,
    });

    try {
      await this.userRepository.save(user);
      console.log('✅ 회원가입 성공:', { email: user_email, nickname });
    } catch (error) {
      if (error.code === '23505') {
        // PostgreSQL 중복 키 에러
        throw new ConflictException('이메일이 이미 존재합니다.');
      } else {
        console.error('❌ 회원가입 저장 실패:', error);
        throw new InternalServerErrorException(
          '회원가입 처리 중 오류가 발생했습니다.',
        );
      }
    }
  }

  /**
   * 🔑 사용자 로그인
   *
   * 이메일과 비밀번호를 검증하여 로그인을 처리합니다.
   * 성공 시 사용자 정보(비밀번호 제외)와 프로필 이미지를 반환합니다.
   *
   * @param userData - 로그인 정보 (이메일, 비밀번호)
   * @returns 사용자 정보 (id, email, nickname, image, is_super_admin) 또는 null
   * @throws ConflictException - 이메일이 존재하지 않거나 비밀번호가 틀린 경우
   *
   * @process
   * 1. 이메일로 사용자 조회 (프로필 이미지 관계 포함)
   * 2. bcrypt로 비밀번호 검증
   * 3. 민감한 정보 제외하고 사용자 정보 반환
   */
  async signIn(userData: SigninUserDto): Promise<{
    id: string;
    user_email: string;
    nickname: string;
    image: string;
    is_super_admin: boolean;
  } | null> {
    const { user_email, password } = userData;

    // 📧 이메일로 사용자 조회 (프로필 이미지 관계 포함)
    const user = await this.userRepository.findOne({
      where: { user_email },
      relations: ['UserImage'], // 프로필 이미지 정보도 함께 조회
    });

    if (!user) {
      console.log('🚫 로그인 실패 - 존재하지 않는 이메일:', user_email);
      throw new ConflictException('이메일이 존재하지 않습니다.');
    }

    // 🔒 비밀번호 검증 (평문 vs 해시)
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log('🚫 로그인 실패 - 비밀번호 불일치:', user_email);
      throw new ConflictException('비밀번호가 일치하지 않습니다.');
    }

    // 🖼️ 프로필 이미지 처리 (없으면 null)
    const imageLink = user.UserImage?.link ?? null;

    console.log('✅ 로그인 성공:', {
      email: user_email,
      nickname: user.nickname,
    });

    // 🔐 민감한 정보(비밀번호) 제외하고 반환
    return {
      id: user.id,
      user_email: user.user_email,
      nickname: user.nickname,
      image: imageLink,
      is_super_admin: user.is_super_admin,
    };
  }

  /**
   * 📝 로그인 사용자의 작성 게시글 조회
   *
   * 현재 로그인한 사용자가 작성한 게시글 목록을 페이지네이션으로 조회합니다.
   *
   * @param offset - 건너뛸 게시글 수 (페이지네이션)
   * @param limit - 가져올 게시글 수 (기본: 10개)
   * @param userId - 조회할 사용자 ID
   * @returns 게시글 목록과 총 개수
   *
   * @features
   * - 페이지네이션 지원 (offset, limit)
   * - 최신순 정렬 (id DESC)
   * - 채널 정보 포함 (채널명, 슬러그)
   * - 필요한 필드만 선별 반환 (성능 최적화)
   */
  async userFindStory(
    offset = 0,
    limit = 10,
    userId: string,
  ): Promise<{ StoryResults: Partial<Story>[]; StoryTotal: number }> {
    // 📊 병렬 처리로 성능 최적화 (데이터 조회 + 총 개수)
    const [rawStories, StoryTotal] = await Promise.all([
      this.storyRepository.find({
        relations: ['User', 'Channel'], // 사용자, 채널 정보 포함
        order: { id: 'DESC' }, // 최신순 정렬
        skip: offset, // 페이지네이션: 건너뛸 개수
        take: limit, // 페이지네이션: 가져올 개수
        where: { User: { id: userId } }, // 특정 사용자의 게시글만
      }),
      this.storyRepository.count({ where: { User: { id: userId } } }), // 총 게시글 수
    ]);

    // 🎯 필요한 필드만 추출하여 응답 크기 최적화
    const StoryResults = rawStories.map((story) => ({
      id: story.id,
      title: story.title,
      category: story.category,
      created_at: story.created_at,
      channelName: story.Channel?.channel_name, // 채널명 (없으면 undefined)
      channelSlug: story.Channel?.slug, // 채널 슬러그 (URL용)
    }));

    console.log(
      `📝 사용자 ${userId}의 게시글 조회: ${StoryResults.length}/${StoryTotal}개`,
    );
    return { StoryResults, StoryTotal };
  }

  /**
   * 💬 로그인 사용자의 작성 댓글 조회
   *
   * 현재 로그인한 사용자가 작성한 댓글 목록을 페이지네이션으로 조회합니다.
   * 삭제된 댓글은 제외하고 조회합니다.
   *
   * @param offset - 건너뛸 댓글 수 (페이지네이션)
   * @param limit - 가져올 댓글 수 (기본: 10개)
   * @param userId - 조회할 사용자 ID
   * @returns 댓글 목록과 총 개수
   *
   * @features
   * - 소프트 삭제 처리 (deleted_at이 NULL인 것만)
   * - 게시글 정보 포함 (제목, 채널 정보)
   * - 최신순 정렬
   */
  async userFindComments(
    offset = 0,
    limit = 10,
    userId: string,
  ): Promise<{ CommentsResults: Partial<any>[]; CommentsTotal: number }> {
    // 📊 병렬 처리로 성능 최적화
    const [rawComments, CommentsTotal] = await Promise.all([
      this.commentRepository.find({
        relations: ['Story', 'Story.Channel'], // 게시글과 채널 정보 포함
        order: { id: 'DESC' }, // 최신순 정렬
        skip: offset,
        take: limit,
        where: {
          User: { id: userId },
          deleted_at: IsNull(), // 🗑️ 삭제되지 않은 댓글만 (소프트 삭제)
        },
      }),
      this.commentRepository.count({
        where: {
          User: { id: userId },
          deleted_at: IsNull(), // 삭제되지 않은 댓글 수만 카운트
        },
      }),
    ]);

    // 🎯 필요한 필드만 추출
    const CommentsResults = rawComments.map((comment) => ({
      id: comment.id,
      content: comment.content,
      updated_at: comment.updated_at,
      storyId: comment.Story?.id, // 댓글이 달린 게시글 ID
      storyTitle: comment.Story?.title, // 게시글 제목
      channelName: comment.Story?.Channel?.channel_name, // 채널명
      channelSlug: comment.Story?.Channel?.slug, // 채널 슬러그
    }));

    console.log(
      `💬 사용자 ${userId}의 댓글 조회: ${CommentsResults.length}/${CommentsTotal}개`,
    );
    return { CommentsResults, CommentsTotal };
  }

  /**
   * 👤 다른 사용자 프로필 정보 조회
   *
   * 특정 사용자의 기본 정보(닉네임, 프로필 이미지)를 조회합니다.
   * 비밀번호 등 민감한 정보는 제외합니다.
   *
   * @param id - 조회할 사용자 ID
   * @returns 사용자 프로필 정보 (닉네임, 이미지)
   *
   * @security 비밀번호 등 민감한 정보는 반환하지 않음
   */
  async userGet(id: string): Promise<{ image: UserImage; nickname: string }> {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['UserImage'], // 프로필 이미지 포함
    });

    // TODO: 비밀번호가 응답에 포함되지 않도록 추가 검증 필요
    console.log('👤 사용자 프로필 조회:', { id, nickname: user?.nickname });
    return { image: user.UserImage, nickname: user.nickname };
  }

  /**
   * 🔍 다른 사용자 상세 정보 조회 (닉네임 기반)
   *
   * 닉네임으로 사용자를 찾아 프로필 정보와 최근 활동(게시글, 댓글)을 조회합니다.
   * 공개 프로필 페이지에서 사용됩니다.
   *
   * @param username - 조회할 사용자 닉네임
   * @returns 사용자 정보, 최근 게시글 10개, 최근 댓글 10개
   * @throws ConflictException - 사용자를 찾을 수 없는 경우
   *
   * @features
   * - 닉네임 기반 검색
   * - 최근 게시글 10개 (최신순)
   * - 최근 댓글 10개 (삭제되지 않은 것만)
   * - 게시글 연관 정보 포함
   */
  async anotherUserGet(username: string): Promise<any> {
    // 1️⃣ 사용자 기본 정보 조회
    const user = await this.userRepository.findOne({
      where: { nickname: username },
      relations: ['UserImage'], // 프로필 이미지 포함
    });

    if (!user) {
      console.log('🚫 사용자 조회 실패 - 존재하지 않는 닉네임:', username);
      throw new ConflictException('사용자를 찾을 수 없습니다.');
    }

    // 2️⃣ 사용자 최근 게시글 10개 조회
    const posts = await this.storyRepository.find({
      where: { User: { id: user.id } },
      order: { created_at: 'DESC' }, // 최신순 정렬
      take: 10, // 최대 10개
    });

    // 3️⃣ 사용자 최근 댓글 10개 조회 (삭제되지 않은 것만)
    const comments = await this.commentRepository.find({
      where: { User: { id: user.id }, deleted_at: IsNull() },
      relations: ['Story'], // 댓글이 달린 게시글 정보 포함
      order: { created_at: 'DESC' },
      take: 10,
    });

    console.log(
      `🔍 사용자 ${username} 프로필 조회 완료: 게시글 ${posts.length}개, 댓글 ${comments.length}개`,
    );

    return {
      user: {
        nickname: user.nickname,
        image: user.UserImage,
        level: user.level,
        experience_points: user.experience_points,
      },
      posts: posts.map((post) => ({
        id: post.id,
        title: post.title,
        content: post.content,
      })),
      comments: comments.map((comment) => ({
        id: comment.id,
        content: comment.content,
        created_at: comment.created_at,
        updated_at: comment.updated_at,
        storyId: comment.Story?.id, // 댓글이 달린 게시글 ID
      })),
    };
  }

  /**
   * 🏅 사용자 활동 합계 + 레벨 정보 (닉네임 기준)
   * - 총 글 수, 총 댓글 수, 받은 추천 수(해당 사용자의 글에 달린 like 수) 집계
   * - 레벨/칭호 계산을 프론트와 동일한 기준으로 제공 (임계값은 프론트와 맞춤)
   * - 향후 배지 이미지 확장을 위해 badgeKey/badgeImage 필드 포함
   */
  async getUserLevelByNickname(username: string): Promise<{
    user: { nickname: string };
    totals: {
      totalPosts: number;
      totalComments: number;
      totalReceivedRecommends: number;
    };
    level: {
      level: number;
      title: string;
      score: number;
      nextLevelScore?: number;
      badgeKey: string;
      badgeImage?: string;
    };
  }> {
    const user = await this.userRepository.findOne({
      where: { nickname: username },
    });
    if (!user) {
      throw new ConflictException('사용자를 찾을 수 없습니다.');
    }

    // 총 글 수
    const totalPosts = await this.storyRepository.count({
      where: { User: { id: user.id } },
    });
    // 총 댓글 수 (삭제되지 않은 것만 집계)
    const totalComments = await this.commentRepository.count({
      where: { User: { id: user.id }, deleted_at: IsNull() },
    });
    // 받은 추천 수: 해당 사용자의 글에 대해 vote = 'like'
    const receivedLikes = await this.likesRepository
      .createQueryBuilder('likes')
      .leftJoin('likes.Story', 'story')
      .leftJoin('story.User', 'author')
      .where('author.id = :userId', { userId: user.id })
      .andWhere('likes.vote = :vote', { vote: 'like' })
      .getCount();

    // 점수 및 레벨 계산 (프론트 level.ts와 동일한 가중치/임계값)
    const score = totalPosts * 5 + totalComments * 2 + receivedLikes * 1;
    const levels = [
      { threshold: 0, title: '새싹', key: 'seed' },
      { threshold: 20, title: '초심자', key: 'beginner' },
      { threshold: 60, title: '입문', key: 'novice' },
      { threshold: 120, title: '견습', key: 'apprentice' },
      { threshold: 250, title: '숙련', key: 'skilled' },
      { threshold: 500, title: '고수', key: 'expert' },
      { threshold: 1000, title: '마스터', key: 'master' },
    ];
    let idx = 0;
    for (let i = levels.length - 1; i >= 0; i -= 1) {
      if (score >= levels[i].threshold) {
        idx = i;
        break;
      }
    }
    const current = levels[idx];
    const next = levels[idx + 1];

    return {
      user: { nickname: user.nickname },
      totals: {
        totalPosts,
        totalComments,
        totalReceivedRecommends: receivedLikes,
      },
      level: {
        level: idx + 1,
        title: current.title,
        score,
        nextLevelScore: next?.threshold,
        badgeKey: current.key,
        // 배지 이미지는 향후 CDN 경로 저장 시 채워 넣을 수 있도록 비워둠
        badgeImage: undefined,
      },
    };
  }

  /**
   * ✏️ 사용자 프로필 업데이트
   *
   * 사용자의 닉네임과 프로필 이미지를 업데이트합니다.
   * 기존 프로필 이미지가 있으면 삭제하고 새 이미지로 교체합니다.
   *
   * @param userData - 업데이트할 사용자 정보 (id, nickname)
   * @param profileImage - 새 프로필 이미지 파일 (선택사항)
   * @returns 업데이트된 사용자 정보
   *
   * @process
   * 1. 사용자 조회 (기존 이미지 포함)
   * 2. 새 이미지가 있으면 기존 이미지 삭제
   * 3. 새 이미지 엔티티 생성 및 저장
   * 4. 사용자 정보 업데이트
   *
   * @features
   * - 프로필 이미지 교체 (기존 이미지 자동 삭제)
   * - 닉네임 변경
   * - 선택적 이미지 업로드 (이미지 없이도 닉네임만 변경 가능)
   */
  async userUpdate(
    userData: User,
    profileImage: Express.Multer.File | null, // 프로필 이미지는 선택사항
  ): Promise<User> {
    const { id, nickname } = userData;

    // 🔍 기존 사용자 정보 조회 (프로필 이미지 포함)
    const user: User = await this.userRepository.findOne({
      where: { id },
      relations: ['UserImage'], // 기존 프로필 이미지 관계 포함
    });

    // 🖼️ 새 프로필 이미지 처리
    if (profileImage && profileImage.filename) {
      // 기존 이미지가 있으면 삭제
      if (user.UserImage) {
        console.log('🗑️ 기존 프로필 이미지 삭제:', user.UserImage.image_name);
        await this.userImageRepository.remove(user.UserImage);
      }

      // 새 이미지 엔티티 생성
      const newUserImage = new UserImage();
      newUserImage.image_name = profileImage.filename;
      newUserImage.link = `/userUpload/${profileImage.filename}`;
      newUserImage.User = user; // 사용자와 관계 설정

      // 새 이미지 저장 및 사용자에 할당
      console.log('📷 새 프로필 이미지 저장:', newUserImage.image_name);
      user.UserImage = newUserImage;
      await this.userImageRepository.save(newUserImage);
    }

    // 👤 닉네임 업데이트
    user.nickname = nickname;

    // 💾 사용자 정보 저장
    await this.userRepository.save(user);

    console.log('✅ 프로필 업데이트 완료:', {
      id,
      nickname,
      hasImage: !!profileImage,
    });
    return user;
  }

  /**
   * 🗑️ 프로필 이미지 삭제
   *
   * 사용자의 프로필 이미지를 삭제합니다.
   *
   * @param id - 사용자 ID
   *
   * @note 현재는 UserImage 엔티티만 삭제하고 실제 파일은 삭제하지 않음
   * TODO: 실제 파일 시스템에서도 이미지 파일 삭제 필요
   */
  async deleteProfilePicture(id: string): Promise<void> {
    console.log('🗑️ 프로필 이미지 삭제 요청:', id);
    await this.userImageRepository.delete({ User: { id } });
    console.log('✅ 프로필 이미지 삭제 완료');
  }

  /**
   * 🔐 비밀번호 변경 전 현재 비밀번호 검증
   *
   * 비밀번호 변경 시 보안을 위해 현재 비밀번호를 먼저 확인합니다.
   *
   * @param userData - 사용자 ID와 현재 비밀번호
   * @returns 검증 성공 여부 (true)
   * @throws ConflictException - 비밀번호가 틀리거나 사용자가 없는 경우
   *
   * @security
   * - 현재 비밀번호 확인 필수
   * - bcrypt를 사용한 안전한 비밀번호 비교
   * - 상세한 에러 메시지로 디버깅 지원
   */
  async verifyUser(userData: {
    id: string;
    currentPassword: string;
  }): Promise<boolean> {
    const { id, currentPassword } = userData;

    // 📝 입력값 검증
    if (!currentPassword) {
      throw new ConflictException('비밀번호가 제공되지 않았습니다.');
    }

    // 👤 사용자 조회
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      console.log('🚫 비밀번호 검증 실패 - 존재하지 않는 사용자:', id);
      throw new ConflictException('유저가 존재하지 않습니다.');
    }

    // 🔒 사용자 비밀번호 존재 확인
    if (!user.password) {
      console.log('🚫 비밀번호 검증 실패 - 비밀번호 정보 없음:', id);
      throw new ConflictException('사용자 비밀번호 정보가 없습니다.');
    }

    // 🔐 비밀번호 검증 (평문 vs 해시)
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      console.log('🚫 비밀번호 검증 실패 - 비밀번호 불일치:', id);
      throw new ConflictException('비밀번호가 일치하지 않습니다.');
    }

    console.log('✅ 비밀번호 검증 성공:', id);
    return true;
  }

  /**
   * 🔄 비밀번호 변경
   *
   * 사용자의 비밀번호를 새로운 비밀번호로 변경합니다.
   * 새 비밀번호는 bcrypt로 암호화되어 저장됩니다.
   *
   * @param userData - 사용자 ID와 새 비밀번호
   *
   * @process
   * 1. 사용자 조회
   * 2. 새 비밀번호 해시화 (새로운 salt 생성)
   * 3. 데이터베이스 업데이트
   *
   * @security
   * - 새로운 salt로 비밀번호 재암호화
   * - 기존 세션 무효화는 별도 처리 필요
   */
  async changePassword(userData: any): Promise<void> {
    const { id, password } = userData;

    // 👤 사용자 조회
    const user: User = await this.userRepository.findOne({
      where: { id },
    });

    // 🔒 새 비밀번호 암호화 (새로운 salt 생성)
    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(password, salt);

    // 💾 비밀번호 업데이트
    user.password = hashedPassword;
    await this.userRepository.save(user);

    console.log('✅ 비밀번호 변경 완료:', id);
  }

  /**
   * 🔍 사용자 ID로 조회
   *
   * 사용자 ID로 사용자 정보를 조회합니다.
   * 주로 인증 미들웨어에서 사용됩니다.
   *
   * @param id - 사용자 ID
   * @returns 사용자 엔티티 또는 null
   */
  async findUserById(id: string): Promise<User | null> {
    return await this.userRepository.findOne({ where: { id } });
  }

  /**
   * 📝 사용자 프로필 페이지용 게시글 조회
   *
   * 공개 프로필 페이지에서 특정 사용자의 게시글을 조회합니다.
   * 닉네임 기반으로 조회하며 페이지네이션을 지원합니다.
   *
   * @param offset - 건너뛸 게시글 수
   * @param limit - 가져올 게시글 수
   * @param username - 사용자 닉네임
   * @returns 게시글 목록과 총 개수
   * @throws ConflictException - 사용자를 찾을 수 없는 경우
   */
  async userProfileFindStory(
    offset = 0,
    limit = 10,
    username: string,
  ): Promise<{ StoryResults: Partial<Story>[]; StoryTotal: number }> {
    // 👤 사용자 존재 확인
    const user = await this.userRepository.findOne({
      where: { nickname: username },
    });

    if (!user) {
      throw new ConflictException('사용자를 찾을 수 없습니다.');
    }

    // 📊 게시글 조회 (병렬 처리)
    const [rawStories, StoryTotal] = await Promise.all([
      this.storyRepository.find({
        relations: ['User', 'Channel'],
        order: { id: 'DESC' },
        skip: offset,
        take: limit,
        where: {
          User: { id: user.id },
        },
      }),
      this.storyRepository.count({
        where: {
          User: { id: user.id },
        },
      }),
    ]);

    // 🎯 필요한 필드만 추출
    const StoryResults = rawStories.map((story) => ({
      id: story.id,
      title: story.title,
      category: story.category,
      created_at: story.created_at,
      channelName: story.Channel?.channel_name,
      channelSlug: story.Channel?.slug,
    }));

    return { StoryResults, StoryTotal };
  }

  /**
   * 💬 사용자 프로필 페이지용 댓글 조회
   *
   * 공개 프로필 페이지에서 특정 사용자의 댓글을 조회합니다.
   * 닉네임 기반으로 조회하며 삭제되지 않은 댓글만 반환합니다.
   *
   * @param offset - 건너뛸 댓글 수
   * @param limit - 가져올 댓글 수
   * @param username - 사용자 닉네임
   * @returns 댓글 목록과 총 개수
   * @throws ConflictException - 사용자를 찾을 수 없는 경우
   */
  async userProfileFindComments(
    offset = 0,
    limit = 10,
    username: string,
  ): Promise<{ CommentsResults: Partial<any>[]; CommentsTotal: number }> {
    // 👤 사용자 존재 확인
    const user = await this.userRepository.findOne({
      where: { nickname: username },
    });

    if (!user) {
      throw new ConflictException('사용자를 찾을 수 없습니다.');
    }

    // 💬 댓글 조회 (병렬 처리, 삭제되지 않은 것만)
    const [rawComments, CommentsTotal] = await Promise.all([
      this.commentRepository.find({
        relations: ['Story', 'Story.Channel'],
        order: { id: 'DESC' },
        skip: offset,
        take: limit,
        where: {
          User: { id: user.id },
          deleted_at: IsNull(), // 삭제되지 않은 댓글만
        },
      }),
      this.commentRepository.count({
        where: {
          User: { id: user.id },
          deleted_at: IsNull(),
        },
      }),
    ]);

    // 🎯 필요한 필드만 추출
    const CommentsResults = rawComments.map((comment) => ({
      id: comment.id,
      content: comment.content,
      updated_at: comment.updated_at,
      storyId: comment.Story?.id,
      storyTitle: comment.Story?.title,
      channelName: comment.Story?.Channel?.channel_name,
      channelSlug: comment.Story?.Channel?.slug,
    }));

    return { CommentsResults, CommentsTotal };
  }
}
