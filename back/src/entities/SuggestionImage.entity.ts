import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Suggestion } from './Suggestion.entity';

@Entity()
export class SuggestionImage {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: false })
  image_name: string;

  @Column({ nullable: false })
  link: string;

  @CreateDateColumn()
  created_at: Date;

  // 해당 이미지는 어느 건의사항에 속하는지 연결
  @ManyToOne(() => Suggestion, (suggestion) => suggestion.SuggestionImage, {
    onDelete: 'CASCADE',
  })
  Suggestion: Suggestion;
}
