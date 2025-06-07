import { Module } from '@nestjs/common';
import { StoryController } from './story.controller';
import { StoryService } from './story.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Story } from '../entities/Story.entity';
import { AuthModule } from 'src/auth/auth.module';
import { MulterModule } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import * as path from 'path';
import { StoryImage } from 'src/entities/StoryImage.entity';
import { Today } from 'src/common/helper/today';
import { UserImage } from 'src/entities/UserImage.entity';
import { User } from 'src/entities/User.entity';
import { Comments } from 'src/entities/Comments.entity';
import { Likes } from 'src/entities/Likes.entity';
import { RecommendRanking } from 'src/entities/RecommendRanking.entity';
import { Channels } from 'src/entities/Channels.entity';

@Module({
  imports: [
    MulterModule.register({
      storage: diskStorage({
        destination: './upload',
        filename(req, file, done) {
          const ext = path.extname(file.originalname);
          const baseName = Buffer.from(
            path.basename(file.originalname, ext),
            'latin1',
          ).toString('utf8'); // 한글 파일명을 UTF-8로 변환
          done(null, `${baseName}_${Today()}${ext}`);
        },
      }),
    }),
    TypeOrmModule.forFeature([
      Story,
      StoryImage,
      UserImage,
      User,
      Comments,
      Likes,
      RecommendRanking,
      Channels,
    ]),
    AuthModule,
  ],
  controllers: [StoryController],
  providers: [StoryService],
})
export class StoryModule {}
