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
  
  @Entity()
  export class Notification {
    @PrimaryGeneratedColumn()
    id: number;
  
    // 알림 수신 대상
    @ManyToOne(() => User, (user) => user.Notifications, { nullable: false })
    recipient: User;
  
    // 어떤 댓글에 대한 알림인지 (선택적)
    @ManyToOne(() => Comments, (comment) => comment.Notifications, { nullable: true })
    comment: Comments | null;
  
    // 알림 종류 구분 (newComment, mention 등)
    @Column({ length: 50 })
    type: string;
  
    // 읽음 여부
    @Column({ default: false })
    isRead: boolean;
  
    @CreateDateColumn()
    createdAt: Date;
  
    @UpdateDateColumn()
    updatedAt: Date;
  }
  