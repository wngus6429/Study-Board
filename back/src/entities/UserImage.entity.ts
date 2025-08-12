import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './aUser.entity';

@Entity()
export class UserImage {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: false })
  image_name: string;

  @Column({ nullable: false })
  link: string;

  @OneToOne(() => User, (user) => user.UserImage, { onDelete: 'CASCADE' })
  @JoinColumn() // 외래 키를 여기 Entity에 설정, 관계를 명시적으로 설정
  User: User;

  @CreateDateColumn()
  created_at: Date;
}
