import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PassportModule } from '@nestjs/passport';

import { Story } from '../entities/Story.entity';
import { User } from '../entities/user.entity';
import { AuthModule } from '../auth/auth.module'; // AuthGuard 사용을 위해 필요할 수 있음

import { BoardController } from './infrastructure/adapters/in/web/board.controller';
import { BoardService } from './core/application/services/board.service';
import { BoardRepository } from './infrastructure/adapters/out/persistence/board.repository';
import { BOARD_USE_CASE } from './core/application/ports/in/board.use-case';
import { BOARD_REPOSITORY } from './core/application/ports/out/board.repository.port';

@Module({
  imports: [
    TypeOrmModule.forFeature([Story, User]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    AuthModule, // 기존 Auth 모듈에 의존하는 경우
  ],
  controllers: [BoardController],
  providers: [
    // 1. Repository 의존성 주입 (Port(인터페이스)에 실제 구현체(Adapter)를 매핑)
    {
      provide: BOARD_REPOSITORY,
      useClass: BoardRepository,
    },
    // 2. UseCase 의존성 주입 (Port(인터페이스)에 실제 서비스(Application)를 매핑)
    {
      provide: BOARD_USE_CASE,
      useClass: BoardService,
    },
  ],
})
export class BoardModule {}
