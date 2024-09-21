import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class Story {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column('text')
  content: string;

  @Column()
  creator: string;

  @Column({ default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({ default: 0 })
  readCount: number;

  @Column({ default: 0 })
  likeCount: number;

  @Column('text', { nullable: true }) // comments를 JSON 문자열로 저장
  comments: string;
}
