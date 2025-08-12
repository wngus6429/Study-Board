import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChannelNotificationController } from './channel-notification.controller';
import { ChannelNotificationService } from './channel-notification.service';
import { ChannelNotificationSubscription } from '../entities/ChannelNotificationSubscription.entity';
import { User } from '../entities/aUser.entity';
import { Channels } from '../entities/Channels.entity';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ChannelNotificationSubscription, User, Channels]),
    AuthModule,
  ],
  controllers: [ChannelNotificationController],
  providers: [ChannelNotificationService],
  exports: [ChannelNotificationService], // 다른 모듈에서 사용할 수 있도록 export
})
export class ChannelNotificationModule {}
