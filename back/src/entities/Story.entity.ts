import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
// StoryImage 엔티티: 게시글에 첨부된 이미지 정보를 담는 엔티티
import { StoryImage } from './StoryImage.entity';
// Swagger를 이용한 API 문서 자동화를 위한 데코레이터
import { ApiProperty } from '@nestjs/swagger';
// Comments 엔티티: 게시글에 달린 댓글 정보를 담는 엔티티
import { Comments } from './Comments.entity';
// User 엔티티: 게시글 작성자 정보를 담는 엔티티
import { User } from './User.entity';
// Likes 엔티티: 게시글에 달린 추천(또는 비추천) 정보를 담는 엔티티
import { Likes } from './Likes.entity';

@Entity() // 이 클래스가 데이터베이스의 엔티티임을 선언합니다.
export class Story {
  @ApiProperty({
    description: '게시글 ID',
  })
  @PrimaryGeneratedColumn() // 자동 증가하는 기본 키 컬럼
  id: number;

  @ApiProperty({
    description: '카테고리명',
  })
  @Column({ nullable: false }) // 반드시 값이 있어야 하는 필드
  category: string;

  @ApiProperty({
    description: '게시글 제목',
  })
  @Column({ nullable: false })
  title: string;

  // 'text' 타입을 사용하여 길이가 긴 내용을 저장할 수 있습니다.
  @ApiProperty({
    description: '게시글 내용',
  })
  @Column({ type: 'text', nullable: false })
  content: string;

  // 게시글 작성자와의 관계 (다대일 관계)
  // 한 명의 User는 여러 개의 Story를 작성할 수 있습니다.
  @ManyToOne(() => User, (user) => user.Story, {
    nullable: false, // 게시글은 반드시 작성자와 연결되어야 함
  })
  User: User;

  @ApiProperty({
    description: '조회수',
  })
  @Column({ default: 0 })
  read_count: number;

  @ApiProperty({
    description: '댓글수',
  })
  @Column({ default: 0 })
  comment_count: number;

  // 게시글과 댓글 간의 관계 (일대다 관계)
  // 한 개의 Story에 여러 개의 Comments가 연결됩니다.
  @ApiProperty({
    description: '댓글',
  })
  @OneToMany(() => Comments, (comment) => comment.Story)
  Comments: Comments;

  // 게시글과 이미지 간의 관계 (일대다 관계)
  // Story에 첨부된 여러 이미지를 관리합니다.
  // cascade 옵션을 사용하여 Story 저장 시 관련 이미지를 함께 저장할 수 있습니다.
  @ApiProperty({
    description: '이미지 배열',
    isArray: true,
  })
  @OneToMany(() => StoryImage, (image) => image.Story, {
    cascade: true,
  })
  StoryImage: StoryImage[];

  @Column({ default: false })
  imageFlag: boolean; // 이미지 존재 여부 플래그

  // 게시글이 생성될 때 자동으로 날짜를 기록하는 필드입니다.
  @ApiProperty({
    description: '작성일',
  })
  @CreateDateColumn() // 엔티티 생성 시 자동으로 날짜가 입력됩니다.
  created_at: Date;

  // 게시글이 수정될 때 자동으로 날짜를 갱신하는 필드입니다.
  @ApiProperty({
    description: '갱신일',
  })
  @UpdateDateColumn() // 엔티티 업데이트 시 자동으로 날짜가 갱신됩니다.
  updated_at: Date;

  @ApiProperty({ description: '좋아요 수' })
  @Column({ type: 'int', default: 0 })
  like_count: number;

  // 게시글과 추천/비추천(Like) 간의 관계 (일대다 관계)
  // 한 개의 Story에 여러 개의 Likes가 연결됩니다.
  @OneToMany(() => Likes, (like) => like.Story)
  Likes: Likes[];

  //   @ManyToOne(() => Channel, (channel) => channel.Stories)
  // Channel: Channel;
}
