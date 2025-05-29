import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  Unique,
} from 'typeorm';
import { User } from './User.entity';
import { Channels } from './Channels.entity';

@Entity()
@Unique(['User', 'Channel']) // 한 유저가 같은 채널을 중복 구독하지 않도록
export class Subscription {
  @PrimaryGeneratedColumn()
  id: number;

  // 구독한 유저
  @ManyToOne(() => User, (user) => user.Subscriptions, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  User: User;

  // 구독된 채널
  @ManyToOne(() => Channels, (channel) => channel.Subscriptions, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  Channel: Channels;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
