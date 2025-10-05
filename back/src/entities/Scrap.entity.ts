import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from './User.entity';
import { Story } from './Story.entity';

@Entity()
@Index(['User', 'created_at']) // 사용자별 스크랩 목록 조회 최적화
@Index(['User', 'Story'], { unique: true }) // 중복 스크랩 방지 및 조회 최적화
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
