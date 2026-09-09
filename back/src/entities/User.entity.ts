/**
 * 👤 사용자 엔티티 (User Entity)
 *
 * 시스템의 핵심 사용자 정보를 관리하는 메인 엔티티입니다.
 *
 * 주요 기능:
 * - 사용자 기본 정보 관리 (이메일, 닉네임, 비밀번호)
 * - 프로필 이미지 관리
 * - 사용자 활동 추적 (게시글, 댓글, 좋아요 등)
 * - 채널 관리 (생성, 구독)
 * - 쪽지 시스템
 * - 알림 시스템
 * - 블라인드 기능
 * - 소프트 삭제 지원
 *
 * 데이터베이스 제약사항:
 * - 이메일과 닉네임의 조합이 유니크해야 함
 * - UUID 기반 기본키 사용 (보안 강화)
 * - 소프트 삭제 지원 (deleted_at 필드)
 *
 * 관계 매핑:
 * - 1:1 관계: UserImage (프로필 이미지)
 * - 1:N 관계: Story, Comments, Likes, Notification 등
 * - N:M 관계: Channels (구독), Blind (블라인드)
 *
 * @author Study-Board Team
 * @version 1.0.0
 */

import { Exclude } from 'class-transformer';
import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { UserImage } from './UserImage.entity';
import { Story } from './Story.entity';
import { Comments } from './Comments.entity';
import { Likes } from './Likes.entity';
import { Suggestion } from './Suggestion.entity';
import { Notification } from './Notification.entity';
import { Subscription } from './Subscription.entity';
import { Channels } from './Channels.entity';
import { Message } from './Message.entity';
import { Scrap } from './Scrap.entity';
import { Blind } from './Blind.entity';
import { ChannelChatMessage } from './ChannelChatMessage.entity';

@Entity()
@Unique(['user_email', 'nickname'])
export class User extends BaseEntity {
  // ═══════════════════════════════════════════════════════════════════════════════════════
  // 🆔 기본 식별 정보
  // ═══════════════════════════════════════════════════════════════════════════════════════

  /**
   * 사용자 고유 식별자
   *
   * @description
   * - UUID 형식의 고유 식별자
   * - 보안상 순차적 ID 대신 UUID 사용
   * - 모든 관계의 기준점이 되는 기본키
   *
   * @example "123e4567-e89b-12d3-a456-426614174000"
   */
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // ═══════════════════════════════════════════════════════════════════════════════════════
  // 📧 인증 및 식별 정보
  // ═══════════════════════════════════════════════════════════════════════════════════════

  /**
   * 사용자 이메일 주소
   *
   * @description
   * - 로그인 시 사용되는 고유 식별자
   * - 시스템 알림 발송 주소
   * - 닉네임과 함께 유니크 제약 적용
   *
   * @constraints
   * - NOT NULL (필수 입력)
   * - UNIQUE (닉네임과 조합으로 유니크)
   * - 이메일 형식 검증 (DTO에서 처리)
   *
   * @example "user@example.com"
   */
  @Column()
  user_email: string;

  /**
   * 사용자 닉네임 (표시명)
   *
   * @description
   * - 게시글, 댓글 등에 표시되는 공개 이름
   * - 다른 사용자들에게 보여지는 식별자
   * - 이메일과 함께 유니크 제약 적용
   *
   * @constraints
   * - NOT NULL (필수 입력)
   * - UNIQUE (이메일과 조합으로 유니크)
   * - 길이 제한 (DTO에서 처리)
   *
   * @example "홍길동", "개발자123"
   */
  @Column()
  nickname: string;

  /**
   * 사용자 비밀번호 (해시값)
   *
   * @description
   * - bcrypt 등으로 해시 처리된 비밀번호
   * - 평문으로 저장되지 않음
   * - 로그인 시 해시 비교로 인증
   *
   * @security
   * - 반드시 해시 처리 후 저장
   * - 로그에 출력 금지
   * - 정기적인 비밀번호 변경 권장
   *
   * @constraints
   * - VARCHAR(100) 타입
   * - NOT NULL (필수 입력)
   */
  @Exclude({ toPlainOnly: true })
  @Column('varchar', { name: 'password', length: 100, select: false })
  password: string;

  // ═══════════════════════════════════════════════════════════════════════════════════════
  // 👑 관리자 권한 시스템
  // ═══════════════════════════════════════════════════════════════════════════════════════

  /**
   * 총 관리자 권한 플래그
   *
   * @description
   * - 전체 사이트의 최고 관리자 권한
   * - 모든 채널, 게시물, 댓글 삭제 가능
   * - 사용자 관리 및 시스템 설정 권한
   * - 채널 관리자와 별개의 상위 권한
   *
   * @permissions
   * - 모든 게시물 삭제 권한
   * - 모든 댓글 삭제 권한
   * - 모든 채널 관리 권한
   * - 사용자 계정 관리 권한
   * - 시스템 설정 변경 권한
   *
   * @default false (기본값은 일반 사용자)
   * @security 매우 신중하게 부여해야 하는 권한
   *
   * @example
   * - 일반 사용자: false
   * - 총 관리자: true
   */
  @Column({ type: 'boolean', default: false })
  is_super_admin: boolean;

  // ═══════════════════════════════════════════════════════════════════════════════════════
  // 🖼️ 프로필 관리
  // ═══════════════════════════════════════════════════════════════════════════════════════

  /**
   * 사용자 프로필 이미지
   *
   * @description
   * - 1:1 관계로 연결된 프로필 이미지
   * - cascade 옵션으로 함께 저장/삭제
   * - 기본 이미지 또는 사용자 업로드 이미지
   *
   * @relationship OneToOne with UserImage
   * @cascade true (함께 저장/삭제)
   */
  @OneToOne(() => UserImage, (userImage) => userImage.User, { cascade: true })
  UserImage: UserImage;

  // ═══════════════════════════════════════════════════════════════════════════════════════
  // 📝 콘텐츠 관리 (사용자가 생성한 콘텐츠)
  // ═══════════════════════════════════════════════════════════════════════════════════════

  /**
   * 사용자가 작성한 게시글 목록
   *
   * @description
   * - 1:N 관계 (한 사용자가 여러 게시글 작성 가능)
   * - 사용자 삭제 시 게시글 처리 정책 필요
   * - 게시글 통계 및 관리에 사용
   *
   * @relationship OneToMany with Story
   */
  @OneToMany(() => Story, (story) => story.User)
  Story: Story[];

  /**
   * 사용자가 작성한 댓글 목록
   *
   * @description
   * - 1:N 관계 (한 사용자가 여러 댓글 작성 가능)
   * - 대댓글 구조 지원
   * - 댓글 통계 및 관리에 사용
   *
   * @relationship OneToMany with Comments
   */
  @OneToMany(() => Comments, (comment) => comment.User)
  Comments: Comments[];

  /**
   * 사용자가 작성한 건의사항 목록
   *
   * @description
   * - 1:N 관계 (한 사용자가 여러 건의사항 작성 가능)
   * - 시스템 개선 요청 및 버그 리포트
   * - 관리자 검토 대상
   *
   * @relationship OneToMany with Suggestion
   */
  @OneToMany(() => Suggestion, (suggestion) => suggestion.User)
  Suggestion: Suggestion[];

  // ═══════════════════════════════════════════════════════════════════════════════════════
  // 🔔 알림 시스템
  // ═══════════════════════════════════════════════════════════════════════════════════════

  /**
   * 사용자가 받은 알림 목록
   *
   * @description
   * - 1:N 관계 (한 사용자가 여러 알림 수신 가능)
   * - 댓글, 좋아요, 시스템 알림 등
   * - 읽음/안읽음 상태 관리
   *
   * @relationship OneToMany with Notification
   */
  @OneToMany(() => Notification, (notification) => notification.recipient)
  Notifications: Notification[];

  // ═══════════════════════════════════════════════════════════════════════════════════════
  // 📺 채널 관리
  // ═══════════════════════════════════════════════════════════════════════════════════════

  /**
   * 사용자가 구독한 채널 목록
   *
   * @description
   * - 1:N 관계 (한 사용자가 여러 채널 구독 가능)
   * - 구독 날짜 및 상태 관리
   * - 구독 채널의 새 게시글 알림
   *
   * @relationship OneToMany with Subscription
   */
  @OneToMany(() => Subscription, (subscription) => subscription.User)
  Subscriptions: Subscription[];

  /**
   * 사용자가 생성한 채널 목록
   *
   * @description
   * - 1:N 관계 (한 사용자가 여러 채널 생성 가능)
   * - 채널 관리자 권한 보유
   * - 채널 설정 및 운영 책임
   *
   * @relationship OneToMany with Channels
   */
  @OneToMany(() => Channels, (channel) => channel.creator)
  createdChannels: Channels[];

  // 채널 알림 구독 목록 (기능 제거됨)

  // ═══════════════════════════════════════════════════════════════════════════════════════
  // 💬 메시징 시스템
  // ═══════════════════════════════════════════════════════════════════════════════════════

  /**
   * 사용자가 보낸 쪽지 목록
   *
   * @description
   * - 1:N 관계 (한 사용자가 여러 쪽지 발송 가능)
   * - 개인간 메시징 시스템
   * - 발송 이력 관리
   *
   * @relationship OneToMany with Message (as sender)
   */
  @OneToMany(() => Message, (message) => message.sender)
  sentMessages: Message[];

  /**
   * 사용자가 받은 쪽지 목록
   *
   * @description
   * - 1:N 관계 (한 사용자가 여러 쪽지 수신 가능)
   * - 개인간 메시징 시스템
   * - 수신 이력 및 읽음 상태 관리
   *
   * @relationship OneToMany with Message (as receiver)
   */
  @OneToMany(() => Message, (message) => message.receiver)
  receivedMessages: Message[];

  /**
   * 채널 채팅 메시지 목록
   *
   * @description
   * - 1:N 관계 (한 사용자가 여러 채팅 메시지 작성 가능)
   * - 실시간 채널 채팅 시스템
   * - WebSocket 기반 실시간 통신
   *
   * @relationship OneToMany with ChannelChatMessage
   */
  @OneToMany(() => ChannelChatMessage, (chatMessage) => chatMessage.user)
  ChannelChatMessages: ChannelChatMessage[];

  // ═══════════════════════════════════════════════════════════════════════════════════════
  // 👍 사용자 활동 (좋아요, 스크랩)
  // ═══════════════════════════════════════════════════════════════════════════════════════

  /**
   * 사용자가 누른 좋아요 목록
   *
   * @description
   * - 1:N 관계 (한 사용자가 여러 게시글에 좋아요 가능)
   * - 좋아요/싫어요 구분
   * - 중복 방지 로직 필요
   *
   * @relationship OneToMany with Likes
   */
  @OneToMany(() => Likes, (like) => like.User)
  Likes: Likes[];

  /**
   * 사용자가 스크랩한 게시글 목록
   *
   * @description
   * - 1:N 관계 (한 사용자가 여러 게시글 스크랩 가능)
   * - 나중에 읽기 기능
   * - 개인 북마크 시스템
   *
   * @relationship OneToMany with Scrap
   */
  @OneToMany(() => Scrap, (scrap) => scrap.User)
  Scraps: Scrap[];

  // ═══════════════════════════════════════════════════════════════════════════════════════
  // 🚫 블라인드 시스템
  // ═══════════════════════════════════════════════════════════════════════════════════════

  /**
   * 내가 블라인드한 사용자 목록
   *
   * @description
   * - 1:N 관계 (한 사용자가 여러 사용자 블라인드 가능)
   * - 특정 사용자의 게시글/댓글 숨김
   * - 사용자 차단 기능
   *
   * @relationship OneToMany with Blind (as blocker)
   */
  @OneToMany(() => Blind, (blind) => blind.User)
  Blinds: Blind[];

  /**
   * 나를 블라인드한 사용자 목록
   *
   * @description
   * - 1:N 관계 (여러 사용자가 나를 블라인드 가능)
   * - 역방향 블라인드 관계 추적
   * - 통계 및 분석 목적
   *
   * @relationship OneToMany with Blind (as target)
   */
  @OneToMany(() => Blind, (blind) => blind.targetUser)
  BlindedBy: Blind[];

  // ═══════════════════════════════════════════════════════════════════════════════════════
  // 📅 시간 관리 (생성, 수정, 삭제)
  // ═══════════════════════════════════════════════════════════════════════════════════════

  /**
   * 계정 생성 일시
   *
   * @description
   * - 사용자 가입 시점 자동 기록
   * - 통계 및 분석에 활용
   * - 변경 불가능한 고정값
   *
   * @auto_generated 엔티티 생성 시 자동 설정
   */
  @CreateDateColumn()
  created_at: Date;

  /**
   * 계정 정보 최종 수정 일시
   *
   * @description
   * - 프로필 정보 변경 시점 자동 갱신
   * - 보안 감사 및 추적에 활용
   * - 매 업데이트마다 자동 갱신
   *
   * @auto_generated 엔티티 업데이트 시 자동 갱신
   */
  @UpdateDateColumn()
  updated_at: Date;

  /**
   * 계정 삭제 일시 (소프트 삭제)
   *
   * @description
   * - 실제 데이터 삭제 대신 삭제 표시
   * - 데이터 복구 및 감사 추적 가능
   * - null이면 활성 계정, 값이 있으면 삭제된 계정
   *
   * @nullable true (활성 계정은 null)
   * @default null
   *
   * @example
   * - 활성 계정: null
   * - 삭제된 계정: "2023-12-01 10:30:00"
   */
  @Column({ type: 'timestamp', nullable: true, default: null })
  deleted_at: Date | null;

  // ═══════════════════════════════════════════════════════════════════════════════════════
  // 🧪 레벨/경험치 시스템
  // ═══════════════════════════════════════════════════════════════════════════════════════

  /**
   * 누적 경험치
   * @default 0
   */
  @Column({ type: 'float', default: 0 })
  experience_points: number;

  /**
   * 현재 레벨 (경험치로부터 계산되어 저장)
   * @default 1
   */
  @Column({ type: 'int', default: 1 })
  level: number;
}
