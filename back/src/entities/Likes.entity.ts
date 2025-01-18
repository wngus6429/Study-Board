import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  Unique,
} from 'typeorm';
import { User } from './User.entity';
import { Story } from './Story.entity';

@Entity() // 테이블 이름 설정
@Unique(['User', 'Story']) // 유저와 게시글의 조합은 유일해야 함
export class Likes {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, (user) => user.Likes, { onDelete: 'CASCADE' })
  User: User; // 추천/비추천을 한 유저

  @ManyToOne(() => Story, (story) => story.Likes, { onDelete: 'CASCADE' })
  Story: Story; // 추천/비추천 대상 게시글

  @Column({
    type: 'enum',
    enum: ['like', 'dislike'],
  })
  vote: 'like' | 'dislike'; // 추천 또는 비추천 여부

  @CreateDateColumn()
  created_at: Date; // 추천/비추천 생성 시간

  @UpdateDateColumn()
  updated_at: Date; // 추천/비추천 수정 시간
}
