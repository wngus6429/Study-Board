import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Story } from './Story.entity';
import { User } from './User.entity';

@Entity()
export class StoryImage {
  @ApiProperty({
    description: '아이디',
  })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({
    description: '이미지 이름',
  })
  @Column({ nullable: false })
  image_name: string;

  @ApiProperty({
    description: '링크',
  })
  @Column({ nullable: false })
  link: string;

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

  @ApiProperty({
    description: '작성자',
  })
  User?: User;
}
