import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { UserImage } from './UserImage.entity';
import { Story } from './Story.entity';
import { Comments } from './Comments.entity';
import { Likes } from './Likes.entity';
import { Suggestion } from './Suggestion.entity';
import { Notification } from './Notification.entity';
import { Subscription } from './Subscription.entity';
import { Channels } from './Channels.entity';
import { Message } from './Message.entity';
import { Scrap } from './Scrap.entity';

@Entity()
@Unique(['user_email', 'nickname'])
export class User extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  user_email: string;

  @Column()
  nickname: string;

  @Column('varchar', { name: 'password', length: 100 })
  password: string;

  @OneToOne(() => UserImage, (userImage) => userImage.User, { cascade: true })
  UserImage: UserImage;

  @OneToMany(() => Story, (story) => story.User)
  Story: Story[];

  @OneToMany(() => Comments, (comment) => comment.User)
  Comments: Comments[];

  @OneToMany(() => Notification, (notification) => notification.recipient)
  Notifications: Notification[];

  @OneToMany(() => Suggestion, (suggestion) => suggestion.User)
  Suggestion: Suggestion[];

  // Subscription 엔티티와 1:N 관계 설정
  @OneToMany(() => Subscription, (subscription) => subscription.User)
  Subscriptions: Subscription[];

  // 사용자가 생성한 채널들과의 관계
  @OneToMany(() => Channels, (channel) => channel.creator)
  createdChannels: Channels[];

  // 보낸 쪽지들
  @OneToMany(() => Message, (message) => message.sender)
  sentMessages: Message[];

  // 받은 쪽지들
  @OneToMany(() => Message, (message) => message.receiver)
  receivedMessages: Message[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @Column({ type: 'timestamp', nullable: true, default: null })
  deleted_at: Date | null;

  @OneToMany(() => Likes, (like) => like.User)
  Likes: Likes[];

  @OneToMany(() => Scrap, (scrap) => scrap.User)
  Scraps: Scrap[];
}
