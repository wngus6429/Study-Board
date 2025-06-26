import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { Story } from './Story.entity';
import { Subscription } from './Subscription.entity';
import { User } from './User.entity';
import { ChannelImage } from './ChannelImage.entity';
import { ChannelNotificationSubscription } from './ChannelNotificationSubscription.entity';
import { ChannelChatMessage } from './ChannelChatMessage.entity';
import { Suggestion } from './Suggestion.entity';

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

  // 채널 대표 이미지 (OneToOne 관계)
  @OneToOne(() => ChannelImage, (channelImage) => channelImage.Channel, {
    cascade: true, // 채널 저장 시 이미지도 함께 저장
  })
  ChannelImage: ChannelImage;

  @OneToMany(() => Story, (story) => story.Channel)
  Stories: Story[];

  @OneToMany(() => Subscription, (subscription) => subscription.Channel)
  subscriptions: Subscription[];

  // 채널 건의사항 관계
  @OneToMany(() => Suggestion, (suggestion) => suggestion.Channel)
  Suggestion: Suggestion[];

  // 채널 알림 구독 관계
  @OneToMany(
    () => ChannelNotificationSubscription,
    (notificationSubscription) => notificationSubscription.Channel,
  )
  NotificationSubscriptions: ChannelNotificationSubscription[];

  // 채널 채팅 메시지 관계
  @OneToMany(() => ChannelChatMessage, (chatMessage) => chatMessage.channel)
  ChatMessages: ChannelChatMessage[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
