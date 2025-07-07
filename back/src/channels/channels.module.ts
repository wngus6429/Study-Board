import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MulterModule } from '@nestjs/platform-express';
import { createMulterS3Options } from 'src/common/config/multerS3.config';
import { ChannelsController } from './channels.controller';
import { ChannelsService } from './channels.service';
import { Channels } from '../entities/Channels.entity';
import { ChannelImage } from '../entities/ChannelImage.entity';
import { Subscription } from '../entities/Subscription.entity';
import { User } from '../entities/User.entity';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [
    // 채널 이미지 업로드를 위한 Multer 설정
    MulterModule.register(createMulterS3Options('channel-images')),
    TypeOrmModule.forFeature([Channels, ChannelImage, Subscription, User]),
    AuthModule,
  ],
  controllers: [ChannelsController],
  providers: [ChannelsService],
  exports: [ChannelsService],
})
export class ChannelsModule {}
