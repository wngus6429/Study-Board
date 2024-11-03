import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
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
  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  @ManyToOne(() => Story, (story) => story.comments, {
    onDelete: 'CASCADE',
  })
  story: Story;
}
