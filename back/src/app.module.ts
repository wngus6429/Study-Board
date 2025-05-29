import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { StoryModule } from './story/story.module';
import { MulterModule } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import path, { join } from 'path';
import { ServeStaticModule } from '@nestjs/serve-static';
import { Today } from './common/helper/today';
import { SuggestionModule } from './suggestion/suggestion.module';
import { CommentModule } from './comment/comment.module';
import { NotificationModule } from './notification/notification.module';
import { ChannelsModule } from './channels/channels.module';

//어플리케이션의 루트 모듈이 있는 파일
@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'mysql', // 데이터베이스 유형
      host: 'localhost', // 데이터베이스 호스트
      port: 3306, // MySQL 포트
      username: 'root', // MySQL 사용자명
      password: '6429', // MySQL 비밀번호
      database: 'board-study', // 사용할 데이터베이스 이름
      entities: [__dirname + '/entities/*.entity{.ts,.js}'], // 엔티티 파일 경로
      logging: true, // ORM이 쿼리를 보여줌
      synchronize: true, // 애플리케이션 실행 시 데이터베이스 스키마를 자동으로 동기화 (개발 중에만 true로 설정, 운영 환경에서는 false로 설정)
      // 서버가 꺼져도 DB연결을 유지해줌
      keepConnectionAlive: true, // 자꾸 저장하면 서버 재시작하는데 DB 끊기니까 이걸로 연결 유지
      charset: 'utf8mb4_general_ci', // 이모티콘까지 가능
    }),
    // 아무래도 유저 이미지를 저장할 디렉토리
    // MulterModule.register({
    //   storage: diskStorage({
    //     destination: './upload',
    //     filename(req, file, done) {
    //       const ext = path.extname(file.originalname);
    //       done(
    //         null,
    //         `${path.basename(file.originalname, ext)}_${Today()}${ext}`,
    //       );
    //     },
    //   }),
    //   limits: {
    //     fileSize: 50 * 1024 * 1024, // 50MB로 파일 크기 제한 설정
    //   },
    // }),
    ServeStaticModule.forRoot({
      serveRoot: '/upload',
      rootPath: join(__dirname, '..', 'upload'),
    }),
    ServeStaticModule.forRoot({
      serveRoot: '/userUpload',
      rootPath: join(__dirname, '..', 'userUpload'),
    }),
    ServeStaticModule.forRoot({
      serveRoot: '/suggestionUpload',
      rootPath: join(__dirname, '..', 'suggestionUpload'),
    }),
    StoryModule,
    AuthModule,
    SuggestionModule,
    CommentModule,
    NotificationModule,
    ChannelsModule,
  ],
})
export class AppModule {}
