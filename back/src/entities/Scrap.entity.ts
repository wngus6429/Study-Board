import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
} from 'typeorm';
import { User } from './User.entity';
import { Story } from './Story.entity';

@Entity()
export class Scrap {
  @PrimaryGeneratedColumn()
  id: number;

  // 스크랩한 사용자
  @ManyToOne(() => User, (user) => user.Scraps, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn({ name: 'user_id' })
  User: User;

  // 스크랩된 게시물
  @ManyToOne(() => Story, (story) => story.Scraps, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn({ name: 'story_id' })
  Story: Story;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
