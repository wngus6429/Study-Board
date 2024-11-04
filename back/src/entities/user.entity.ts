import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { UserImage } from './UserImage.entity';

@Entity()
@Unique(['user_email', 'nickname'])
export class User extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: number;

  @Column()
  user_email: string;

  @Column()
  nickname: string;

  @Column()
  password: string;

  @OneToOne(() => UserImage, (userImage) => userImage.user, { cascade: true })
  image: UserImage;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @CreateDateColumn()
  deleted_at: Date;
}
