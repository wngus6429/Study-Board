import { Module } from '@nestjs/common';
import { StoryController } from './story.controller';
import { StoryService } from './story.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Story } from '../entities/Story.entity';
import { AuthModule } from 'src/auth/auth.module';
import { MulterModule } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import * as path from 'path';
import { Image } from 'src/entities/Image.entity';
import { Today } from 'src/common/helper/today';
import { UserImage } from 'src/entities/UserImage.entity';

@Module({
  imports: [
    MulterModule.register({
      storage: diskStorage({
        destination: './upload',
        filename(req, file, done) {
          const ext = path.extname(file.originalname);
          done(
            null,
            `${path.basename(file.originalname, ext)}_${Today()}${ext}`,
          );
        },
      }),
    }),
    TypeOrmModule.forFeature([Story, Image, UserImage]),
    AuthModule,
  ],
  controllers: [StoryController],
  providers: [StoryService],
})
export class StoryModule {}
