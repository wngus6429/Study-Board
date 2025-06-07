import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { Story } from './Story.entity';
import { Subscription } from './Subscription.entity';
import { User } from './User.entity';

@Entity() // 이 클래스가 데이터베이스의 엔티티임을 선언합니다.
export class Channels {
  @PrimaryGeneratedColumn() // 자동 증가하는 기본 키 컬럼
  id: number;

  @Column() // 채널 이름
  channel_name: string;

  @Column({ unique: true }) // URL에 표시될 영어 슬러그 (유니크)
  slug: string;

  @Column() // 게시글 갯수 카운트 (페이지네이션을 위해)
  story_count: number;

  @Column({ default: 0 }) // 구독자 수
  subscriber_count: number;

  @ManyToOne(() => User, (user) => user.createdChannels, { nullable: false })
  creator: User;

  @OneToMany(() => Story, (story) => story.Channel)
  Stories: Story[];

  @OneToMany(() => Subscription, (subscription) => subscription.Channel)
  subscriptions: Subscription[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
