import { Module } from '@nestjs/common';
import { SuggestionController } from './suggestion.controller';
import { SuggestionService } from './suggestion.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from 'src/auth/auth.module';
import { MulterModule } from '@nestjs/platform-express';
import { createMulterS3Options } from 'src/common/config/multerS3.config';
import { User } from 'src/entities/User.entity';
import { Suggestion } from 'src/entities/Suggestion.entity';
import { SuggestionImage } from 'src/entities/SuggestionImage.entity';

@Module({
  imports: [
    MulterModule.register(createMulterS3Options('suggestion-images')),
    TypeOrmModule.forFeature([Suggestion, SuggestionImage, User]),
    AuthModule,
  ],
  controllers: [SuggestionController],
  providers: [SuggestionService],
})
export class SuggestionModule {}
