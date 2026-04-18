/**
 * 🔑 비밀번호 재설정 토큰 엔티티 (PasswordResetToken Entity)
 *
 * 비밀번호 찾기 흐름에서 이메일 소유권을 증명하기 위한 일회용 토큰을 저장합니다.
 *
 * 보안 설계:
 * - 토큰은 crypto.randomBytes(32)로 생성 (암호학적 난수, 256비트)
 * - 만료 시간 설정 (기본 30분)
 * - 단일 사용 (used = true 후 재사용 불가)
 * - 사용자 삭제 시 CASCADE 삭제
 *
 * @author Study-Board Team
 */

import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from './User.entity';

@Entity()
export class PasswordResetToken extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * 토큰 문자열 (64자 hex = 32바이트 랜덤)
   * - UNIQUE INDEX 적용 (조회 성능 + 중복 방지)
   */
  @Index({ unique: true })
  @Column({ type: 'varchar', length: 128 })
  token: string;

  /**
   * 토큰 소유 사용자 (CASCADE 삭제)
   */
  @ManyToOne(() => User, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'user_id' })
  User: User;

  /**
   * 토큰 만료 일시
   */
  @Column({ type: 'timestamp' })
  expires_at: Date;

  /**
   * 사용 여부 (true 이면 재사용 불가)
   */
  @Column({ type: 'boolean', default: false })
  used: boolean;

  @CreateDateColumn()
  created_at: Date;
}
