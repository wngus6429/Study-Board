import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { Channels } from './Channels.entity';
import { User } from './aUser.entity';

@Entity()
@Index(['channel', 'created_at']) // 채널별 최신 메시지 조회 최적화
export class ChannelChatMessage {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Channels, (channel) => channel.ChatMessages, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  channel: Channels;

  @ManyToOne(() => User, (user) => user.ChannelChatMessages, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  user: User;

  @Column('text')
  message: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
