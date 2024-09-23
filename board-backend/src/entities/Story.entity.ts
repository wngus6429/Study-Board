import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class Story {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: false })
  title: string;

  @Column({ type: 'text', nullable: false })
  content: string;

  @Column({ nullable: false })
  creator: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({ default: 0 })
  readCount: number;

  @Column({ default: 0 })
  likeCount: number;

  @Column({ type: 'text', nullable: true }) // comments를 JSON 문자열로 저장
  comments: string;
}
