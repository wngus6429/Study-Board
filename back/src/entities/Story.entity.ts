import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  ManyToOne,
} from 'typeorm';
import { Image } from './Image.entity';
import { ApiProperty } from '@nestjs/swagger';
import { Comments } from './Comments.entity';
import { User } from './User.entity';

@Entity()
export class Story {
  @ApiProperty({
    description: '게시글 ID',
  })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({
    description: '카테고리명',
  })
  @Column({ nullable: false })
  category: string;

  @ApiProperty({
    description: '게시글 제목',
  })
  @Column({ nullable: false })
  title: string;

  @ApiProperty({
    description: '게시글 내용',
  })
  @Column({ type: 'text', nullable: false })
  content: string;

  @ManyToOne(() => User, (user) => user.Story, {
    nullable: false,
  })
  User: User;

  @ApiProperty({
    description: '조회수',
  })
  @Column({ default: 0 })
  read_count: number;

  @ApiProperty({
    description: '추천갯수',
  })
  @Column({ default: 0 })
  like_count: number;

  @ApiProperty({
    description: '댓글',
  })
  @Column({ type: 'text', nullable: true }) // comments를 JSON 문자열로 저장
  comments: Comments[];

  @ApiProperty({
    description: '이미지 배열',
    isArray: true,
  })
  @OneToMany(() => Image, (image) => image.Story, {
    cascade: true, // Story 저장 시 관련 Image도 저장 가능
  })
  Image: Image[];

  @ApiProperty({
    description: '작성일',
  })
  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  @ApiProperty({
    description: '갱신일',
  })
  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  updated_at: Date;
}
