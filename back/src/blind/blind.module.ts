import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BlindController } from './blind.controller';
import { BlindService } from './blind.service';
import { Blind } from '../entities/Blind.entity';
import { User } from '../entities/aUser.entity';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([Blind, User]), AuthModule],
  controllers: [BlindController],
  providers: [BlindService],
  exports: [BlindService],
})
export class BlindModule {}
