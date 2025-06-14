import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChannelChatService } from './channel-chat.service';
import { ChannelChatController } from './channel-chat.controller';
import { ChannelChatGateway } from './channel-chat.gateway';
import { ChannelChatMessage } from '../entities/ChannelChatMessage.entity';
import { Channels } from '../entities/Channels.entity';
import { User } from '../entities/User.entity';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ChannelChatMessage, Channels, User]),
    AuthModule,
  ],
  controllers: [ChannelChatController],
  providers: [ChannelChatService, ChannelChatGateway],
  exports: [ChannelChatService],
})
export class ChannelChatModule {}
