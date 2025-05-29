import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChannelsController } from './channels.controller';
import { ChannelsService } from './channels.service';
import { Channels } from '../entities/Channels.entity';
import { Subscription } from '../entities/Subscription.entity';
import { User } from '../entities/User.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Channels, Subscription, User])],
  controllers: [ChannelsController],
  providers: [ChannelsService],
  exports: [ChannelsService],
})
export class ChannelsModule {}
