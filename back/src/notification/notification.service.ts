// import { Injectable } from '@nestjs/common';
// import { InjectRepository } from '@nestjs/typeorm';
// import { Repository } from 'typeorm';
// import { Notification } from '../entities/Notification.entity';
// // import { CommentGateway } from '../comment/comment.gateway';
// import { User } from 'src/entities/User.entity';
// import { Comments } from 'src/entities/Comments.entity';

// @Injectable()
// export class NotificationService {
//   constructor(
//     @InjectRepository(Notification)
//     private readonly repo: Repository<Notification>,
//     // private readonly gateway: CommentGateway,  // WebSocket 게이트웨이
//   ) {}

//   async createForComment(
//     recipient: User,
//     comment: Comments,
//   ): Promise<Notification> {
//     const notif = this.repo.create({
//       recipient,
//       comment,
//       type: 'newComment',
//     });
//     await this.repo.save(notif);
//     // WebSocket으로 실시간 푸시
//     this.gateway.notifyNewComment(recipient.id, {
//       id: notif.id,
//       commentId: comment.id,
//       type: notif.type,
//       createdAt: notif.createdAt,
//     });
//     return notif;
//   }

//   findUnread(userId: string) {
//     return this.repo.find({ where: { recipient: { id: userId }, isRead: false } });
//   }

//   async markAsRead(id: number) {
//     await this.repo.update(id, { isRead: true });
//   }
// }
