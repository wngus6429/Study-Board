import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Comments } from 'src/entities/Comments.entity';
import { Story } from 'src/entities/Story.entity';
import { User } from 'src/entities/aUser.entity';
import { Notification } from 'src/entities/Notification.entity';
import { PassportModule } from '@nestjs/passport';
import { CommentController } from './comment.controller';
import { CommentService } from './comment.service';
import { AdminGuard } from '../auth/admin.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([Comments, Story, User, Notification]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
  ],
  controllers: [CommentController],
  providers: [CommentService, AdminGuard],
  exports: [CommentService],
})
export class CommentModule {}
