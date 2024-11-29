import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Story } from './Story.entity';
import { ApiProperty } from '@nestjs/swagger';

@Entity()
export class Comments {
  @ApiProperty({
    description: '댓글 ID',
  })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({
    description: '댓글 내용',
  })
  @Column({ type: 'text', nullable: false })
  content: string;

  @ApiProperty({
    description: '댓글 작성자 닉네임',
  })
  @Column({ type: 'text', nullable: false })
  nickname: string;

  @ApiProperty({
    description: '댓글 작성일',
  })
  @CreateDateColumn()
  created_at: Date;

  @ApiProperty({
    description: '갱신일',
  })
  @UpdateDateColumn()
  updated_at: Date;

  @ApiProperty({
    description: '댓글의 부모 댓글 ID (없으면 null)',
  })
  @ManyToOne(() => Comments, (comment) => comment.children, {
    nullable: true,
    onDelete: 'CASCADE',
  })
  parent: Comments | null;

  @ApiProperty({
    description: '댓글의 자식 댓글들',
  })
  @OneToMany(() => Comments, (comment) => comment.parent)
  children: Comments[];

  @ManyToOne(() => Story, (story) => story.Comments, {
    onDelete: 'CASCADE',
  })
  Story: Story;
}
