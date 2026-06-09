import { Module } from '@nestjs/common';
import { SuggestionController } from './suggestion.controller';
import { SuggestionService } from './suggestion.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from 'src/auth/auth.module';
import { MulterModule } from '@nestjs/platform-express';
import { getMulterOptions } from '../common/utils/multer.options';
import { User } from 'src/entities/User.entity';
import { Suggestion } from 'src/entities/Suggestion.entity';
import { SuggestionImage } from 'src/entities/SuggestionImage.entity';

@Module({
  imports: [
    MulterModule.register(getMulterOptions('suggestionUpload')),
    TypeOrmModule.forFeature([Suggestion, SuggestionImage, User]),
    AuthModule,
  ],
  controllers: [SuggestionController],
  providers: [SuggestionService],
})
export class SuggestionModule {}
