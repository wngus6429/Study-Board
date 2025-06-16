import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Story } from './Story.entity';
// import { User } from './User.entity';

@Entity()
export class StoryImage {
  @ApiProperty({
    description: '아이디',
  })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({
    description: '이미지 파일 이름',
  })
  @Column({ nullable: false })
  image_name: string;

  @ApiProperty({
    description: '이미지 파일 링크',
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
    description: '업로드 순서',
  })
  @Column({ type: 'int', default: 0 })
  upload_order: number;

  @ApiProperty({
    description: '작성일',
  })
  @CreateDateColumn()
  created_at: Date;

  @ApiProperty({
    description: '게시글',
  })
  @ManyToOne(() => Story, (story) => story.StoryImage, {
    onDelete: 'CASCADE',
  })
  Story: Story;

  // @ApiProperty({
  //   description: '작성자',
  // })
  // User?: User;
}
