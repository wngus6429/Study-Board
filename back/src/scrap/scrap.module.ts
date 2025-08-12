import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Scrap } from '../entities/Scrap.entity';
import { Story } from '../entities/Story.entity';
import { User } from '../entities/aUser.entity';
import { ScrapController } from './scrap.controller';
import { ScrapService } from './scrap.service';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([Scrap, Story, User]), AuthModule],
  controllers: [ScrapController],
  providers: [ScrapService],
  exports: [ScrapService],
})
export class ScrapModule {}
