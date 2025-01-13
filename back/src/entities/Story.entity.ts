import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { StoryImage } from './StoryImage.entity';
import { ApiProperty } from '@nestjs/swagger';
import { Comments } from './Comments.entity';
import { User } from './User.entity';
import { Likes } from './Like.entity';

@Entity()
export class Story {
  @ApiProperty({
    description: '게시글 ID',
  })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({
    description: '카테고리명',
  })
  @Column({ nullable: false })
  category: string;

  @ApiProperty({
    description: '게시글 제목',
  })
  @Column({ nullable: false })
  title: string;

  @ApiProperty({
    description: '게시글 내용',
  })
  @Column({ type: 'text', nullable: false })
  content: string;

  @ManyToOne(() => User, (user) => user.Story, {
    nullable: false,
  })
  User: User;

  @ApiProperty({
    description: '조회수',
  })
  @Column({ default: 0 })
  read_count: number;

  @ApiProperty({
    description: '댓글',
  })
  @OneToMany(() => Comments, (comment) => comment.Story)
  Comments: Comments;

  @ApiProperty({
    description: '이미지 배열',
    isArray: true,
  })
  @OneToMany(() => StoryImage, (image) => image.Story, {
    cascade: true, // Story 저장 시 관련 Image도 저장 가능
  })
  StoryImage: StoryImage[];

  @ApiProperty({
    description: '작성일',
  })
  @CreateDateColumn()
  created_at: Date;

  @ApiProperty({
    description: '갱신일',
  })
  @UpdateDateColumn()
  updated_at: Date;

  @OneToMany(() => Likes, (like) => like.story)
  Likes: Likes[]; // 게시글에 남겨진 추천/비추천
}
