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

  @OneToMany(() => Notification, (notification) => notification.recipient)  // ← 추가
  Notifications: Notification[];  // ← 추가

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @Column({ type: 'timestamp', nullable: true, default: null })
  deleted_at: Date | null;

  @OneToMany(() => Likes, (like) => like.User)
  Likes: Likes[]; // 유저가 남긴 추천/비추천

  @OneToMany(() => Suggestion, (suggestion) => suggestion.User)
  Suggestion: Suggestion[]; // 유저가 남긴 추천/비추천
}
