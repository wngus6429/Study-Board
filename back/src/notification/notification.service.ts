import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from '../entities/Notification.entity';
import { User } from 'src/entities/User.entity';
import { Comments } from 'src/entities/Comments.entity';

@Injectable()
export class NotificationService {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
  ) {}
  //! ㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡ
  // 댓글 작성 시 알림 생성 (comment.service에서 호출됨)
  async createForComment(
    recipient: User,
    comment: Comments,
    type: 'comment' | 'reply',
  ): Promise<Notification> {
    const notif = this.notificationRepository.create({
      recipient,
      comment,
      type,
      message: this.generateNotificationMessage(type, comment),
    });
    return await this.notificationRepository.save(notif);
  }

  //! ㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡ
  // 채널 새 게시글 작성 시 알림 생성 (story.service에서 호출됨)
  async createForChannelPost(
    recipient: User,
    story: any,
    channel: any,
    author: User,
  ): Promise<Notification> {
    const titlePreview =
      story.title.length > 50
        ? story.title.substring(0, 50) + '...'
        : story.title;

    const notif = this.notificationRepository.create({
      recipient,
      post: story,
      type: 'channel_post',
      message: `${channel.channel_name}에 ${author.nickname}님이 새 게시글을 올렸습니다: "${titlePreview}"`,
    });
    return await this.notificationRepository.save(notif);
  }
  //! ㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡ
  // 알림 메시지 생성
  private generateNotificationMessage(
    type: 'comment' | 'reply',
    comment: Comments,
  ): string {
    const contentPreview =
      comment.content.length > 50
        ? comment.content.substring(0, 50) + '...'
        : comment.content;

    if (type === 'comment') {
      return `님이 회원님의 글에 댓글을 남겼습니다: "${contentPreview}"`;
    } else {
      return `님이 회원님의 댓글에 답글을 남겼습니다: "${contentPreview}"`;
    }
  }
  //! ㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡ
  // 읽지 않은 알림 조회
  async findUnread(userId: string) {
    const notifications = await this.notificationRepository.find({
      where: {
        recipient: { id: userId },
        isRead: false,
      },
      relations: [
        'comment',
        'comment.User',
        'comment.Story',
        'comment.Story.Channel',
        'post',
        'post.User',
        'post.Channel',
      ],
      order: {
        createdAt: 'DESC',
      },
    });

    // 응답 형식 가공
    return notifications.map((notif) => ({
      id: notif.id,
      type: notif.type,
      message: notif.message,
      isRead: notif.isRead,
      createdAt: notif.createdAt,
      // 댓글 정보
      comment: notif.comment
        ? {
            id: notif.comment.id,
            content: notif.comment.content,
            author: {
              id: notif.comment.User.id,
              nickname: notif.comment.User.nickname,
            },
            storyId: notif.comment.Story.id,
            channelSlug: notif.comment.Story.Channel?.slug || null,
          }
        : null,
      // 게시글 정보 (채널 새 게시글 알림용)
      post: notif.post
        ? {
            id: notif.post.id,
            title: notif.post.title,
            author: notif.post.User
              ? {
                  id: notif.post.User.id,
                  nickname: notif.post.User.nickname,
                }
              : null,
            channelId: notif.post.Channel?.id || null,
            channelSlug: notif.post.Channel?.slug || null,
            channelName: notif.post.Channel?.channel_name || null,
          }
        : null,
    }));
  }
  //! ㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡ
  // 모든 알림 조회 (페이지네이션)
  async findAll(userId: string, page: number = 1, limit: number = 20) {
    const [notifications, total] =
      await this.notificationRepository.findAndCount({
        where: {
          recipient: { id: userId },
        },
        relations: [
          'comment',
          'comment.User',
          'comment.Story',
          'comment.Story.Channel',
          'post',
          'post.User',
          'post.Channel',
        ],
        order: {
          createdAt: 'DESC',
        },
        skip: (page - 1) * limit,
        take: limit,
      });

    // 응답 형식 가공
    const items = notifications.map((notif) => ({
      id: notif.id,
      type: notif.type,
      message: notif.message,
      isRead: notif.isRead,
      createdAt: notif.createdAt,
      // 댓글 정보
      comment: notif.comment
        ? {
            id: notif.comment.id,
            content: notif.comment.content,
            author: {
              id: notif.comment.User.id,
              nickname: notif.comment.User.nickname,
            },
            storyId: notif.comment.Story.id,
            channelSlug: notif.comment.Story.Channel?.slug || null,
          }
        : null,
      // 게시글 정보 (채널 새 게시글 알림용)
      post: notif.post
        ? {
            id: notif.post.id,
            title: notif.post.title,
            author: notif.post.User
              ? {
                  id: notif.post.User.id,
                  nickname: notif.post.User.nickname,
                }
              : null,
            channelId: notif.post.Channel?.id || null,
            channelSlug: notif.post.Channel?.slug || null,
            channelName: notif.post.Channel?.channel_name || null,
          }
        : null,
    }));

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
  //! ㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡ
  // 알림을 읽음으로 표시
  async markAsRead(id: number, userId: string) {
    const notification = await this.notificationRepository.findOne({
      where: { id },
      relations: ['recipient'],
    });

    if (!notification) {
      throw new NotFoundException('알림을 찾을 수 없습니다.');
    }

    // 권한 확인
    if (notification.recipient.id !== userId) {
      throw new ForbiddenException('이 알림에 접근할 권한이 없습니다.');
    }

    await this.notificationRepository.update(id, { isRead: true });
    return { message: '알림이 읽음으로 표시되었습니다.' };
  }
  //! ㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡ
  // 모든 알림을 읽음으로 표시
  async markAllAsRead(userId: string) {
    await this.notificationRepository.update(
      { recipient: { id: userId }, isRead: false },
      { isRead: true },
    );
    return { message: '모든 알림이 읽음으로 표시되었습니다.' };
  }
  //! ㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡ
  // 알림 삭제
  async deleteNotification(id: number, userId: string) {
    const notification = await this.notificationRepository.findOne({
      where: { id },
      relations: ['recipient'],
    });

    if (!notification) {
      throw new NotFoundException('알림을 찾을 수 없습니다.');
    }

    // 권한 확인
    if (notification.recipient.id !== userId) {
      throw new ForbiddenException('이 알림을 삭제할 권한이 없습니다.');
    }

    await this.notificationRepository.remove(notification);
    return { message: '알림이 삭제되었습니다.' };
  }
  //! ㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡ
  // 읽지 않은 알림 개수 조회
  async getUnreadCount(userId: string): Promise<number> {
    return await this.notificationRepository.count({
      where: {
        recipient: { id: userId },
        isRead: false,
      },
    });
  }
}
