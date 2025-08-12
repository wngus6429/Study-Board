import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MulterModule } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import * as path from 'path';
import { ChannelsController } from './channels.controller';
import { ChannelsService } from './channels.service';
import { Channels } from '../entities/Channels.entity';
import { ChannelImage } from '../entities/ChannelImage.entity';
import { Subscription } from '../entities/Subscription.entity';
import { User } from '../entities/User.entity';
import { AuthModule } from 'src/auth/auth.module';
import { Today } from 'src/common/helper/today';

@Module({
  imports: [
    // 채널 이미지 업로드를 위한 Multer 설정
    MulterModule.register({
      storage: diskStorage({
        destination: './channelUpload', // 채널 이미지 저장 폴더
        filename(req, file, done) {
          const ext = path.extname(file.originalname);
          const baseName = Buffer.from(
            path.basename(file.originalname, ext),
            'latin1',
          ).toString('utf8'); // 한글 파일명을 UTF-8로 변환
          done(null, `${baseName}_${Today()}${ext}`); // 파일명_날짜.확장자 형식
        },
      }),
    }),
    TypeOrmModule.forFeature([Channels, ChannelImage, Subscription, User]),
    AuthModule,
  ],
  controllers: [ChannelsController],
  providers: [ChannelsService],
  exports: [ChannelsService],
})
export class ChannelsModule {}
