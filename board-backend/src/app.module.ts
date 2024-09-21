import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Story } from './entities/Story.entity';

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
      entities: [__dirname + '/**/*.entity{.ts,.js}'], // 엔티티 파일 경로
      synchronize: true, // 애플리케이션 실행 시 데이터베이스 스키마를 자동으로 동기화 (개발 중에만 true로 설정, 운영 환경에서는 false로 설정)
    }),
    TypeOrmModule.forFeature([Story]),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
