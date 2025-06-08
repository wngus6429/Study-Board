import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from './User.entity';

@Entity()
export class Message {
  @PrimaryGeneratedColumn()
  id: number;

  // 쪽지 보낸 사람
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  sender: User;

  // 쪽지 받는 사람
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  receiver: User;

  // 쪽지 제목
  @Column({ type: 'varchar', length: 255 })
  title: string;

  // 쪽지 내용
  @Column({ type: 'text' })
  content: string;

  // 읽음 여부
  @Column({ default: false })
  isRead: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
