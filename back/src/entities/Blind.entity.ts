import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  Unique,
} from 'typeorm';
import { User } from './aUser.entity';

@Entity()
@Unique(['userId', 'targetUserId'])
export class Blind extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  // 블라인드를 설정한 사용자
  @Column()
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  User: User;

  // 블라인드 당한 사용자
  @Column()
  targetUserId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'targetUserId' })
  targetUser: User;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
