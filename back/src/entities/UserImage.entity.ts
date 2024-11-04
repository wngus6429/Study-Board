import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './User.entity';

@Entity()
export class UserImage {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: false })
  image_name: string;

  @Column({ nullable: false })
  link: string;

  @OneToOne(() => User, (user) => user.image, { onDelete: 'CASCADE' })
  @JoinColumn() // 외래 키가 있는 쪽에 `@JoinColumn`을 사용하여 관계를 명시적으로 설정
  user: User;

  @CreateDateColumn()
  created_at: Date;
}
