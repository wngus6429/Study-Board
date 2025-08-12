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
@Unique(['User', 'Channel']) // 한 유저가 같은 채널에 중복 알림 구독하지 않도록
export class ChannelNotificationSubscription {
  @PrimaryGeneratedColumn()
  id: number;

  // 알림 구독한 유저
  @ManyToOne(() => User, (user) => user.ChannelNotificationSubscriptions, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  User: User;

  // 알림 구독된 채널
  @ManyToOne(() => Channels, (channel) => channel.NotificationSubscriptions, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  Channel: Channels;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
