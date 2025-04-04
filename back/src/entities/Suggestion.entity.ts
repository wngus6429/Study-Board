import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from './User.entity';
import { SuggestionImage } from './SuggestionImage.entity';

@Entity()
export class Suggestion {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: false }) // 반드시 값이 있어야 하는 필드
  category: string;

  @Column({ nullable: false })
  title: string;

  @Column({ type: 'text', nullable: false })
  content: string;

  // 유저와의 관계: 한 명의 유저는 여러 건의 건의사항을 남길 수 있음
  @ManyToOne(() => User, (user) => user.Suggestion, {
    nullable: false, // 피드백 글은 반드시 작성자와 연결되어야 함
  })
  User: User;

  // 건의사항에 첨부된 이미지들
  @OneToMany(() => SuggestionImage, (image) => image.Suggestion, {
    cascade: true,
  })
  SuggestionImage: SuggestionImage[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn() // 엔티티 업데이트 시 자동으로 날짜가 갱신됩니다.
  updated_at: Date;

  @Column({ type: 'timestamp', nullable: true, default: null })
  deleted_at: Date | null;
}
