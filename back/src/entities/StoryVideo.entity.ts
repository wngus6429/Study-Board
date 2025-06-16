import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Story } from './Story.entity';

@Entity()
export class StoryVideo {
  @ApiProperty({
    description: '아이디',
  })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({
    description: '동영상 파일 이름',
  })
  @Column({ nullable: false })
  video_name: string;

  @ApiProperty({
    description: '동영상 파일 링크',
  })
  @Column({ nullable: false })
  link: string;

  @ApiProperty({
    description: '파일 크기 (bytes)',
  })
  @Column({ type: 'bigint', nullable: true })
  file_size: number;

  @ApiProperty({
    description: 'MIME 타입',
  })
  @Column({ nullable: true })
  mime_type: string;

  @ApiProperty({
    description: '동영상 길이 (초)',
  })
  @Column({ type: 'int', nullable: true })
  duration: number;

  @ApiProperty({
    description: '작성일',
  })
  @CreateDateColumn()
  created_at: Date;

  @ApiProperty({
    description: '게시글',
  })
  @ManyToOne(() => Story, (story) => story.StoryVideo, {
    onDelete: 'CASCADE',
  })
  Story: Story;
}
