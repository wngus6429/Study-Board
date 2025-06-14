import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { ChannelChatService } from './channel-chat.service';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  userNickname?: string;
  channelId?: number;
  lastPingTime?: number;
}

@WebSocketGateway({
  cors: {
    origin: '*', // 개발 환경용, 운영에서는 정확한 도메인 설정
    methods: ['GET', 'POST'],
  },
  namespace: '/',
  // Socket.IO 서버 옵션 추가
  pingTimeout: 60000, // 60초 동안 응답 없으면 연결 종료
  pingInterval: 25000, // 25초마다 ping 전송
})
export class ChannelChatGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(ChannelChatGateway.name);
  private connectedUsers = new Map<string, AuthenticatedSocket>();

  constructor(private channelChatService: ChannelChatService) {}

  // 클라이언트 연결 시
  async handleConnection(client: AuthenticatedSocket) {
    this.logger.log(
      `클라이언트 연결: ${client.id} (IP: ${client.handshake.address})`,
    );

    // 연결 시간 기록
    client.lastPingTime = Date.now();

    // 연결 확인 메시지 전송
    client.emit('connection_ack', {
      type: 'connection_ack',
      message: '웹소켓 연결 성공',
      socketId: client.id,
      timestamp: new Date().toISOString(),
    });

    // 연결된 사용자 목록에 추가
    this.connectedUsers.set(client.id, client);

    this.logger.log(`현재 연결된 사용자 수: ${this.connectedUsers.size}`);
  }

  // 클라이언트 연결 해제 시
  async handleDisconnect(client: AuthenticatedSocket) {
    this.logger.log(
      `클라이언트 연결 해제: ${client.id} (사용자: ${client.userNickname})`,
    );

    if (client.channelId && client.userId && client.userNickname) {
      // 채널에서 사용자 나가기 브로드캐스트
      client.to(`channel_${client.channelId}`).emit('user_left', {
        type: 'user_left',
        channel_id: client.channelId,
        user: {
          id: client.userId,
          nickname: client.userNickname,
        },
      });

      this.logger.log(
        `사용자 ${client.userNickname}이 채널 ${client.channelId}에서 나감`,
      );
    }

    this.connectedUsers.delete(client.id);
    this.logger.log(`현재 연결된 사용자 수: ${this.connectedUsers.size}`);
  }

  // Ping 응답 처리
  @SubscribeMessage('ping')
  async handlePing(@ConnectedSocket() client: AuthenticatedSocket) {
    client.lastPingTime = Date.now();
    client.emit('pong', {
      timestamp: client.lastPingTime,
    });

    // 로그를 너무 많이 남기면 성능에 영향을 주므로 주석 처리
    // this.logger.debug(`Ping 수신 및 Pong 응답: ${client.id}`);
  }

  // 채널 입장
  @SubscribeMessage('join_channel')
  async handleJoinChannel(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody()
    data: { channel_id: number; user_id?: string; user_nickname?: string },
  ) {
    try {
      const { channel_id, user_id, user_nickname } = data;

      this.logger.log(`채널 입장 요청: 채널 ${channel_id}, 사용자 ${user_id}`);

      // 이미 다른 채널에 있다면 먼저 나가기
      if (client.channelId && client.channelId !== channel_id) {
        await client.leave(`channel_${client.channelId}`);
        this.logger.log(
          `사용자 ${client.userNickname}이 채널 ${client.channelId}에서 나감`,
        );
      }

      // 임시로 사용자 정보 설정 (실제로는 JWT 토큰으로 인증해야 함)
      client.userId = user_id || `guest_${Date.now()}`;
      client.userNickname = user_nickname || '게스트';
      client.channelId = channel_id;

      // 채널 룸에 참여
      await client.join(`channel_${channel_id}`);

      // 연결된 사용자 목록 업데이트
      this.connectedUsers.set(client.id, client);

      // 다른 사용자들에게 입장 알림
      client.to(`channel_${channel_id}`).emit('user_joined', {
        type: 'user_joined',
        channel_id,
        user: {
          id: client.userId,
          nickname: client.userNickname,
        },
      });

      // 현재 채널의 온라인 사용자 수 계산
      const onlineUserCount = this.getChannelOnlineUsers(channel_id);

      // 본인에게 입장 확인
      client.emit('connection_ack', {
        type: 'connection_ack',
        message: `채널 ${channel_id}에 입장했습니다.`,
        channel_id,
        online_users: onlineUserCount,
        timestamp: new Date().toISOString(),
      });

      this.logger.log(
        `채널 입장 완료: 채널 ${channel_id}, 사용자 ${client.userNickname} (온라인: ${onlineUserCount}명)`,
      );
    } catch (error) {
      this.logger.error('채널 입장 실패:', error);
      client.emit('error', {
        type: 'error',
        data: '채널 입장에 실패했습니다.',
        error: error.message,
      });
    }
  }

  // 채널 나가기
  @SubscribeMessage('leave_channel')
  async handleLeaveChannel(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { channel_id: number },
  ) {
    try {
      const { channel_id } = data;

      this.logger.log(
        `채널 나가기: 채널 ${channel_id}, 사용자 ${client.userNickname}`,
      );

      // 다른 사용자들에게 나가기 알림
      if (client.userId && client.userNickname) {
        client.to(`channel_${channel_id}`).emit('user_left', {
          type: 'user_left',
          channel_id,
          user: {
            id: client.userId,
            nickname: client.userNickname,
          },
        });
      }

      // 채널 룸에서 나가기
      await client.leave(`channel_${channel_id}`);

      // 클라이언트 정보 초기화
      client.channelId = undefined;

      this.logger.log(`채널 나가기 완료: ${client.userNickname}`);
    } catch (error) {
      this.logger.error('채널 나가기 실패:', error);
      client.emit('error', {
        type: 'error',
        data: '채널 나가기에 실패했습니다.',
        error: error.message,
      });
    }
  }

  // 메시지 전송
  @SubscribeMessage('send_message')
  async handleSendMessage(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { channel_id: number; message: string },
  ) {
    try {
      const { channel_id, message } = data;

      if (!client.userId || !client.userNickname) {
        client.emit('error', {
          type: 'error',
          data: '채널에 먼저 입장해주세요.',
        });
        return;
      }

      // 메시지 길이 제한
      if (message.length > 1000) {
        client.emit('error', {
          type: 'error',
          data: '메시지는 1000자를 초과할 수 없습니다.',
        });
        return;
      }

      this.logger.log(
        `메시지 전송: 채널 ${channel_id}, 사용자 ${client.userNickname}, 길이: ${message.length}자`,
      );

      // 데이터베이스에 메시지 저장 (임시로 guest 사용자는 저장하지 않음)
      let savedMessage = null;
      if (!client.userId.startsWith('guest_')) {
        try {
          const result = await this.channelChatService.sendChannelChatMessage(
            channel_id,
            client.userId,
            message,
          );
          savedMessage = result.chatMessage;
        } catch (error) {
          this.logger.error('메시지 DB 저장 실패:', error);
          // DB 저장 실패해도 실시간 전송은 계속 진행
        }
      }

      // 실시간으로 모든 채널 참여자에게 메시지 브로드캐스트
      const messageData = savedMessage || {
        id: Date.now(), // 임시 ID
        channel_id,
        user_id: client.userId,
        message,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        user: {
          id: client.userId,
          nickname: client.userNickname,
          user_email: '',
          profile_image: null,
        },
      };

      this.server.to(`channel_${channel_id}`).emit('new_message', {
        type: 'new_message',
        channel_id,
        message: messageData,
        timestamp: new Date().toISOString(),
      });

      this.logger.log(`메시지 브로드캐스트 완료: 채널 ${channel_id}`);
    } catch (error) {
      this.logger.error('메시지 전송 실패:', error);
      client.emit('error', {
        type: 'error',
        data: '메시지 전송에 실패했습니다.',
        error: error.message,
      });
    }
  }

  // 타이핑 상태 전송
  @SubscribeMessage('typing')
  async handleTyping(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { channel_id: number },
  ) {
    try {
      const { channel_id } = data;

      if (!client.userId || !client.userNickname) {
        return;
      }

      // 다른 사용자들에게 타이핑 상태 브로드캐스트
      client.to(`channel_${channel_id}`).emit('typing', {
        type: 'typing',
        channel_id,
        user: {
          id: client.userId,
          nickname: client.userNickname,
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      this.logger.error('타이핑 상태 전송 실패:', error);
    }
  }

  // 채널의 온라인 사용자 수 조회
  getChannelOnlineUsers(channelId: number): number {
    const channelRoom = this.server.sockets.adapter.rooms.get(
      `channel_${channelId}`,
    );
    return channelRoom ? channelRoom.size : 0;
  }

  // 채널의 온라인 사용자 목록 조회
  getChannelOnlineUserList(
    channelId: number,
  ): { id: string; nickname: string }[] {
    const channelRoom = this.server.sockets.adapter.rooms.get(
      `channel_${channelId}`,
    );

    if (!channelRoom) return [];

    const users: { id: string; nickname: string }[] = [];

    for (const socketId of channelRoom) {
      const socket = this.connectedUsers.get(socketId);
      if (socket && socket.userId && socket.userNickname) {
        users.push({
          id: socket.userId,
          nickname: socket.userNickname,
        });
      }
    }

    return users;
  }

  // 서버 상태 조회 (디버깅용)
  @SubscribeMessage('server_status')
  async handleServerStatus(@ConnectedSocket() client: AuthenticatedSocket) {
    const totalConnections = this.connectedUsers.size;
    const channelUsers = client.channelId
      ? this.getChannelOnlineUsers(client.channelId)
      : 0;

    client.emit('server_status', {
      total_connections: totalConnections,
      channel_users: channelUsers,
      your_channel: client.channelId,
      server_time: new Date().toISOString(),
    });
  }

  // 모든 연결된 사용자에게 브로드캐스트 (관리용)
  broadcastToChannel(channelId: number, event: string, data: any) {
    this.server.to(`channel_${channelId}`).emit(event, data);
  }

  // 연결 상태 모니터링 (주기적으로 호출되는 메서드)
  monitorConnections() {
    const now = Date.now();
    let staleConnections = 0;

    for (const [socketId, socket] of this.connectedUsers) {
      const timeSinceLastPing = now - (socket.lastPingTime || 0);

      // 2분 이상 ping이 없는 연결은 의심스러운 상태
      if (timeSinceLastPing > 120000) {
        staleConnections++;
        this.logger.warn(
          `의심스러운 연결 감지: ${socketId} (마지막 ping: ${timeSinceLastPing}ms 전)`,
        );
      }
    }

    if (staleConnections > 0) {
      this.logger.warn(
        `총 ${staleConnections}개의 의심스러운 연결이 감지되었습니다.`,
      );
    }
  }
}
