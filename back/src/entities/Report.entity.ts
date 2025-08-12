import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from './User.entity';
import { Story } from './Story.entity';

export enum ReportStatus {
  PENDING = 'pending', // 대기중
  REVIEWING = 'reviewing', // 검토중
  APPROVED = 'approved', // 승인됨 (조치 완료)
  REJECTED = 'rejected', // 반려됨 (조치 불필요)
}

export enum ReportReason {
  SPAM = '스팸/도배',
  ABUSE = '욕설/비방',
  ADULT_CONTENT = '음란물/성적 콘텐츠',
  VIOLENCE = '폭력적 콘텐츠',
  FALSE_INFO = '허위 정보',
  COPYRIGHT = '저작권 침해',
  PRIVACY = '개인정보 노출',
  OTHER = '기타',
}

@Entity('reports')
export class Report {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    type: 'enum',
    enum: ReportReason,
    comment: '신고 사유',
  })
  reason: ReportReason;

  @Column({
    type: 'text',
    nullable: true,
    comment: '기타 사유 또는 상세 설명',
  })
  custom_reason: string;

  @Column({
    type: 'enum',
    enum: ReportStatus,
    default: ReportStatus.PENDING,
    comment: '신고 처리 상태',
  })
  status: ReportStatus;

  @Column({
    type: 'text',
    nullable: true,
    comment: '관리자 검토 의견',
  })
  admin_comment: string;

  @Column({
    type: 'varchar',
    nullable: true,
    comment: '검토한 관리자 ID',
  })
  reviewed_by: string;

  @Column({
    type: 'datetime',
    nullable: true,
    comment: '검토 완료 시간',
  })
  reviewed_at: Date;

  @CreateDateColumn({
    comment: '신고 생성 시간',
  })
  created_at: Date;

  @UpdateDateColumn({
    comment: '신고 수정 시간',
  })
  updated_at: Date;

  // 신고한 사용자와의 관계
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'reporter_id' })
  reporter: User;

  @Column({
    type: 'varchar',
    comment: '신고한 사용자 ID',
  })
  @Index()
  reporter_id: string;

  // 신고당한 게시글과의 관계
  @ManyToOne(() => Story, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'story_id' })
  story: Story;

  @Column({
    type: 'int',
    comment: '신고당한 게시글 ID',
  })
  @Index()
  story_id: number;

  // 검토한 관리자와의 관계 (nullable)
  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'reviewed_by' })
  reviewer: User;
}
