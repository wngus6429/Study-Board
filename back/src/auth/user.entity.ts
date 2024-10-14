// import { Board } from 'src/boards/board.entity';
import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
@Unique(['user_email', 'nickname'])
export class User extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  user_email: string;

  @Column()
  nickname: string;

  @Column()
  password: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  //   // 아래는 board.entity 에서 user 필드와 매핑,
  //   // eager: true 로 설정하여 user 정보를 함께 가져옴
  //   @OneToMany((type) => Board, (board) => board.user, { eager: true })
  //   boards: Board[];
}
