import { Module } from '@nestjs/common';
import { SuggestionController } from './suggestion.controller';
import { SuggestionService } from './suggestion.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from 'src/auth/auth.module';
import { MulterModule } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import * as path from 'path';
import { Today } from 'src/common/helper/today';
import { User } from 'src/entities/User.entity';
import { Suggestion } from 'src/entities/Suggestion.entity';
import { SuggestionImage } from 'src/entities/SuggestionImage.entity';

@Module({
  imports: [
    MulterModule.register({
      storage: diskStorage({
        destination: './suggestionUpload',
        filename(req, file, done) {
          const ext = path.extname(file.originalname);
          const baseName = Buffer.from(
            path.basename(file.originalname, ext),
            'latin1',
          ).toString('utf8'); // 한글 파일명을 UTF-8로 변환
          done(null, `${baseName}_${Today()}${ext}`);
        },
      }),
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB 제한
      },
      fileFilter: (req, file, cb) => {
        // 이미지 파일만 허용
        if (file.mimetype.startsWith('image/')) {
          cb(null, true);
        } else {
          cb(new Error('이미지 파일만 업로드 가능합니다.'), false);
        }
      },
    }),
    TypeOrmModule.forFeature([Suggestion, SuggestionImage, User]),
    AuthModule,
  ],
  controllers: [SuggestionController],
  providers: [SuggestionService],
})
export class SuggestionModule {}
