import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from './User.entity';
import { Comments } from './Comments.entity';
import { Story } from './Story.entity';

@Entity()
export class Notification {
  @PrimaryGeneratedColumn()
  id: number;

  // 알림 수신 대상
  @ManyToOne(() => User, (user) => user.Notifications, { onDelete: 'CASCADE' })
  recipient: User;

  // 어떤 글에 대한 알림인지 (선택적)
  @ManyToOne(() => Story, { nullable: true, onDelete: 'CASCADE' })
  post: Story;

  // 어떤 댓글에 대한 알림인지 (선택적)
  @ManyToOne(() => Comments, (comment) => comment.Notifications, {
    nullable: true,
    onDelete: 'CASCADE',
  })
  comment: Comments;

  // 알림 타입 (예: 'comment', 'reply')
  @Column()
  type: string;

  // 알림 메시지
  @Column({ type: 'text', nullable: true })
  message: string;

  // 읽음 여부
  @Column({ default: false })
  isRead: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
