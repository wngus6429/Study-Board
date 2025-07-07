import { Module } from '@nestjs/common';
import { StoryController } from './story.controller';
import { StoryService } from './story.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Story } from '../entities/Story.entity';
import { AuthModule } from 'src/auth/auth.module';
import { MulterModule } from '@nestjs/platform-express';
import { createMulterS3Options } from 'src/common/config/multerS3.config';
import { StoryImage } from 'src/entities/StoryImage.entity';
import { StoryVideo } from 'src/entities/StoryVideo.entity';
import { UserImage } from 'src/entities/UserImage.entity';
import { User } from 'src/entities/User.entity';
import { Comments } from 'src/entities/Comments.entity';
import { Likes } from 'src/entities/Likes.entity';
import { RecommendRanking } from 'src/entities/RecommendRanking.entity';
import { Channels } from 'src/entities/Channels.entity';
import { Report } from 'src/entities/Report.entity';
import { ChannelNotificationModule } from '../channel-notification/channel-notification.module';
import { NotificationModule } from '../notification/notification.module';
import { AdminGuard } from '../auth/admin.guard';

/**
 * Story 모듈
 * 게시글 관련 기능을 담당하는 NestJS 모듈입니다.
 *
 * @description 게시글 CRUD, 검색, 추천/비추천, 이미지 업로드 등의 기능을 제공합니다.
 * @author StudyBoard Team
 */
@Module({
  imports: [
    /**
     * Multer 파일 업로드 설정
     * - 게시글 이미지 및 동영상 첨부 기능을 위한 설정
     * - 파일 저장 경로: 이미지는 ./upload, 동영상은 ./videoUpload
     * - 파일명 형식: 원본명_날짜시간.확장자 (한글 파일명 지원)
     * - 지원 파일 타입: 이미지 (jpg, png, gif, webp, svg, bmp), 동영상 (mp4, webm, ogg, avi, mov, wmv, flv, mkv)
     * - 최대 파일 크기: 1000MB
     */
    MulterModule.register(createMulterS3Options('story-assets')),
    /**
     * TypeORM 엔티티 등록
     * - Story: 게시글 메인 테이블
     * - StoryImage: 게시글 이미지 테이블
     * - StoryVideo: 게시글 동영상 테이블
     * - UserImage: 사용자 프로필 이미지 테이블
     * - User: 사용자 정보 테이블
     * - Comments: 댓글 테이블
     * - Likes: 추천/비추천 테이블
     * - RecommendRanking: 추천 랭킹 테이블
     * - Channels: 채널 정보 테이블
     */
    TypeOrmModule.forFeature([
      Story,
      StoryImage,
      StoryVideo,
      UserImage,
      User,
      Comments,
      Likes,
      RecommendRanking,
      Channels,
      Report,
    ]),
    AuthModule, // 인증/인가 모듈
    ChannelNotificationModule, // 채널 알림 모듈
    NotificationModule, // 일반 알림 모듈
  ],
  controllers: [StoryController], // 게시글 관련 API 컨트롤러
  providers: [StoryService, AdminGuard], // 게시글 관련 비즈니스 로직 서비스 및 관리자 가드
})
export class StoryModule {}
