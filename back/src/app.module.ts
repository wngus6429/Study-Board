import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { StoryModule } from './story/story.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { SuggestionModule } from './suggestion/suggestion.module';
import { CommentModule } from './comment/comment.module';
import { NotificationModule } from './notification/notification.module';
import { ChannelsModule } from './channels/channels.module';
import { MessagesModule } from './messages/messages.module';
import { UsersModule } from './users/users.module';
import { ScrapModule } from './scrap/scrap.module';
import { ChannelNotificationModule } from './channel-notification/channel-notification.module';
import { BlindModule } from './blind/blind.module';
import { ChannelChatModule } from './channel-chat/channel-chat.module';
import { ConfigModule } from '@nestjs/config';

/**
 * 🏗️ 애플리케이션 루트 모듈
 *
 * NestJS 애플리케이션의 최상위 모듈로, 모든 기능 모듈과 설정을 통합 관리합니다.
 * 데이터베이스 연결, 파일 업로드, 정적 파일 서빙 등의 전역 설정을 담당합니다.
 *
 * @architecture
 * - 데이터베이스: MySQL (TypeORM 사용)
 * - 파일 업로드: Multer (로컬 디스크 저장)
 * - 정적 파일: Express Static (이미지 서빙)
 * - 모듈 구조: 기능별 분리된 모듈들을 조합
 *
 * @modules
 * - AuthModule: 사용자 인증/인가 (회원가입, 로그인, 세션)
 * - StoryModule: 게시글 관리 (CRUD, 검색, 추천)
 * - ChannelsModule: 채널 관리 (생성, 구독, 관리)
 * - CommentModule: 댓글 시스템 (작성, 수정, 삭제)
 * - NotificationModule: 알림 시스템 (실시간 알림)
 * - MessagesModule: 쪽지 시스템 (개인 메시지)
 * - ChannelChatModule: 실시간 채팅 (WebSocket)
 * - BlindModule: 블라인드 처리 (신고, 숨김)
 * - ScrapModule: 스크랩 기능 (북마크)
 * - SuggestionModule: 건의사항 (피드백)
 * - UsersModule: 사용자 관리 (프로필, 설정)
 * - ChannelNotificationModule: 채널 알림 (구독 알림)
 */
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // 2. 모든 모듈에서 process.env를 사용할 수 있도록 전역으로 설정
      envFilePath: '.env', // 3. .env 파일 경로 지정
    }),
    /**
     * 🗄️ TypeORM 데이터베이스 설정
     *
     * MySQL 데이터베이스와의 연결 및 ORM 설정을 담당합니다.
     * 개발 환경에서는 synchronize: true로 스키마 자동 동기화를 사용하지만,
     * 운영 환경에서는 반드시 false로 설정하고 마이그레이션을 사용해야 합니다.
     *
     * @config
     * - 데이터베이스: MySQL 8.0+
     * - 호스트: localhost (개발환경)
     * - 포트: 3306 (MySQL 기본 포트)
     * - 문자셋: utf8mb4_general_ci (이모지 지원)
     * - 로깅: 개발 시 쿼리 로그 출력
     * - 연결 유지: 서버 재시작 시에도 DB 연결 유지
     */
    TypeOrmModule.forRoot({
      type: 'mysql', // 데이터베이스 타입: MySQL
      host: 'localhost', // 데이터베이스 호스트 (개발: localhost, 운영: RDS 등)
      port: 3306, // MySQL 기본 포트
      username: 'root', // 데이터베이스 사용자명
      password: '80518812', // 데이터베이스 비밀번호 (환경변수로 관리 권장)
      database: 'board-study', // 사용할 데이터베이스명
      entities: [__dirname + '/entities/*.entity{.ts,.js}'], // 엔티티 파일 경로 패턴
      logging: true, // SQL 쿼리 로그 출력 (개발 시에만 true 권장)
      synchronize: true, // 스키마 자동 동기화 (⚠️ 운영환경에서는 false 필수)
      keepConnectionAlive: true, // 애플리케이션 재시작 시 DB 연결 유지
      charset: 'utf8mb4_general_ci', // 문자셋: 이모지 및 다국어 지원
    }),

    /**
     * 📁 정적 파일 서빙 모듈 설정
     *
     * 업로드된 이미지 파일들을 HTTP 경로로 접근 가능하게 설정합니다.
     * 각 기능별로 별도 디렉토리를 사용하여 파일을 체계적으로 관리합니다.
     *
     * @directories
     * - /upload: 게시글 첨부 이미지
     * - /userUpload: 사용자 프로필 이미지
     * - /suggestionUpload: 건의사항 첨부 이미지
     * - /channelUpload: 채널 대표 이미지 (향후 추가 예정)
     */
    ServeStaticModule.forRoot({
      serveRoot: '/upload', // HTTP 경로: /upload/*
      rootPath: join(__dirname, '..', 'upload'), // 실제 파일 경로
    }),
    ServeStaticModule.forRoot({
      serveRoot: '/userUpload', // HTTP 경로: /userUpload/*
      rootPath: join(__dirname, '..', 'userUpload'), // 사용자 프로필 이미지
    }),
    ServeStaticModule.forRoot({
      serveRoot: '/suggestionUpload', // HTTP 경로: /suggestionUpload/*
      rootPath: join(__dirname, '..', 'suggestionUpload'), // 건의사항 첨부 이미지
    }),

    /**
     * 🔐 인증 및 사용자 관리 모듈
     */
    AuthModule, // 회원가입, 로그인, 세션 관리
    UsersModule, // 사용자 프로필, 설정 관리

    /**
     * 📝 콘텐츠 관리 모듈
     */
    StoryModule, // 게시글 CRUD, 검색, 추천 시스템
    CommentModule, // 댓글 작성, 수정, 삭제, 대댓글
    SuggestionModule, // 건의사항, 피드백 관리

    /**
     * 🏢 채널 및 커뮤니티 모듈
     */
    ChannelsModule, // 채널 생성, 관리, 구독
    ChannelNotificationModule, // 채널 알림 구독 관리
    ChannelChatModule, // 실시간 채널 채팅 (WebSocket)

    /**
     * 💬 커뮤니케이션 모듈
     */
    MessagesModule, // 개인 쪽지 시스템
    NotificationModule, // 실시간 알림 시스템

    /**
     * 🛡️ 콘텐츠 관리 및 보안 모듈
     */
    BlindModule, // 게시글/댓글 신고, 블라인드 처리
    ScrapModule, // 게시글 스크랩, 북마크 기능
  ],
})
export class AppModule {}

/**
 * 📋 모듈별 주요 기능 요약
 *
 * @AuthModule
 * - 회원가입/로그인 (bcrypt 암호화)
 * - 세션 기반 인증 (express-session)
 * - 사용자 프로필 관리
 * - 비밀번호 변경, 프로필 이미지 업로드
 *
 * @StoryModule
 * - 게시글 CRUD (생성, 조회, 수정, 삭제)
 * - 다중 이미지 업로드 (Multer)
 * - 검색 기능 (제목, 내용, 작성자)
 * - 추천/비추천 시스템
 * - 카테고리별 분류
 * - 채널별 게시글 필터링
 *
 * @ChannelsModule
 * - 채널 생성 및 관리
 * - 채널 구독/구독취소
 * - 채널별 게시글 통계
 * - 슬러그 기반 URL 라우팅
 *
 * @CommentModule
 * - 댓글 작성/수정/삭제
 * - 대댓글 (계층형 구조)
 * - 소프트 삭제 (deleted_at)
 *
 * @NotificationModule
 * - 실시간 알림 생성/조회
 * - 채널 새 게시글 알림
 * - 댓글 알림
 * - 쪽지 알림
 *
 * @ChannelChatModule
 * - WebSocket 기반 실시간 채팅
 * - 채널별 채팅방
 * - 온라인 사용자 표시
 * - 타이핑 인디케이터
 *
 * @BlindModule
 * - 게시글/댓글 신고 시스템
 * - 관리자 블라인드 처리
 * - 신고 사유 분류
 *
 * @MessagesModule
 * - 1:1 개인 쪽지
 * - 쪽지 읽음 상태 관리
 * - 쪽지함 (받은편지함, 보낸편지함)
 *
 * @ScrapModule
 * - 게시글 스크랩/북마크
 * - 개인 스크랩 목록 관리
 *
 * @SuggestionModule
 * - 사이트 개선 건의사항
 * - 이미지 첨부 지원
 * - 관리자 답변 시스템
 */
