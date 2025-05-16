import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
} from 'typeorm';
import { Story } from './Story.entity';

// 추천 랭킹 테이블: 일정 추천 수 이상인 스토리를 관리하는 엔티티
@Entity()
export class RecommendRanking {
  @PrimaryGeneratedColumn()
  id: number;

  // Story 엔티티와의 관계 (다대일 관계)
  @ManyToOne(() => Story, { onDelete: 'CASCADE' })
  @JoinColumn()
  Story: Story;

  // 스토리의 ID를 직접 저장 (조회 성능 개선을 위해)
  @Column()
  storyId: number;

  // 해당 게시글의 추천 수 (캐싱)
  @Column({ type: 'int', default: 0 })
  recommendCount: number;

  // 랭킹 테이블에 추가된 시간
  @CreateDateColumn()
  created_at: Date;

  // 랭킹 테이블에서 업데이트된 시간
  @UpdateDateColumn()
  updated_at: Date;
}
