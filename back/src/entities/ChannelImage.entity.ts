import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { Channels } from './Channels.entity';

/**
 * 채널 대표 이미지를 저장하는 엔티티
 * 각 채널은 하나의 대표 이미지를 가질 수 있음 (OneToOne 관계)
 */
@Entity()
export class ChannelImage {
  @PrimaryGeneratedColumn()
  id: number;

  // 업로드된 이미지 파일명 (실제 저장된 파일명)
  @Column({ nullable: false })
  image_name: string;

  // 이미지 접근 경로 (예: /channelUpload/filename.jpg)
  @Column({ nullable: false })
  link: string;

  // 어떤 채널의 이미지인지 연결 (OneToOne 관계)
  // JoinColumn을 통해 이 테이블에 외래키가 생성됨
  @OneToOne(() => Channels, (channel) => channel.ChannelImage, {
    onDelete: 'CASCADE', // 채널 삭제 시 이미지도 함께 삭제
  })
  @JoinColumn() // 외래 키를 이 엔티티에 설정
  Channel: Channels;

  @CreateDateColumn()
  created_at: Date;
}
