import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  ConnectedSocket,
  MessageBody,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { BadRequestException, Logger } from '@nestjs/common';
import { Namespace, Socket } from 'socket.io';
import { ChannelChatService } from './channel-chat.service';
import { SocketAuthService, SocketIdentity } from './socket-auth.service';
import { getCorsOrigins } from '../common/utils/cors-origins';

interface AuthenticatedSocket extends Socket {
  identity?: SocketIdentity;
  channelId?: number;
  expiryTimer?: ReturnType<typeof setTimeout>;
}

@WebSocketGateway({
  namespace: '/',
  pingTimeout: 60000,
  pingInterval: 25000,
  transports: ['polling', 'websocket'],
  allowEIO3: true,
  serveClient: false,
})
export class ChannelChatGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Namespace;

  private readonly logger = new Logger(ChannelChatGateway.name);
  private connectedUsers = new Map<string, AuthenticatedSocket>();

  constructor(
    private readonly channelChatService: ChannelChatService,
    private readonly socketAuthService: SocketAuthService,
  ) {}

  afterInit(server: Namespace) {
    // Verify identity before connection handlers or subscriptions run.
    server.use(async (client: AuthenticatedSocket, next) => {
      const origin = client.handshake.headers.origin;
      if (origin && !getCorsOrigins().includes(origin)) {
        next(
          Object.assign(new Error('허용되지 않은 채팅 출처입니다.'), {
            data: { code: 'FORBIDDEN' },
          }),
        );
        return;
      }
      try {
        client.identity = await this.socketAuthService.authenticate(
          client.handshake.headers.cookie,
        );
        next();
      } catch {
        next(
          Object.assign(new Error('채팅을 사용하려면 다시 로그인해주세요.'), {
            data: { code: 'UNAUTHORIZED' },
          }),
        );
      }
    });
  }

  handleConnection(client: AuthenticatedSocket) {
    if (!this.hasValidIdentity(client)) return;
    this.connectedUsers.set(client.id, client);
    // An open connection must not keep receiving messages after JWT expiry.
    client.expiryTimer = setTimeout(
      () => this.rejectAuthentication(client),
      Math.min(client.identity.expiresAt - Date.now(), 2 ** 31 - 1),
    );
    client.expiryTimer.unref();
    client.emit('connection_ack', {
      type: 'connection_ack',
      message: '웹소켓 연결 성공',
      socketId: client.id,
      timestamp: new Date().toISOString(),
    });
  }

  handleDisconnect(client: AuthenticatedSocket) {
    clearTimeout(client.expiryTimer);
    if (client.channelId && client.identity) {
      this.emitUserLeft(client, client.channelId);
    }
    client.channelId = undefined;
    client.identity = undefined;
    this.connectedUsers.delete(client.id);
  }

  private rejectAuthentication(client: AuthenticatedSocket) {
    client.emit('error', {
      type: 'error',
      code: 'UNAUTHORIZED',
      data: '로그인이 만료되었습니다. 다시 연결해주세요.',
    });
    client.disconnect(true);
  }

  private hasValidIdentity(client: AuthenticatedSocket): boolean {
    if (!client.identity || client.identity.expiresAt <= Date.now()) {
      this.rejectAuthentication(client);
      return false;
    }
    return client.connected;
  }

  private isInChannel(client: AuthenticatedSocket, channelId: number): boolean {
    return (
      this.hasValidIdentity(client) &&
      Number.isSafeInteger(channelId) &&
      channelId > 0 &&
      client.channelId === channelId &&
      client.rooms.has('channel_' + channelId)
    );
  }

  private emitUserLeft(client: AuthenticatedSocket, channelId: number) {
    client.to('channel_' + channelId).emit('user_left', {
      type: 'user_left',
      channel_id: channelId,
      user: { id: client.identity.id, nickname: client.identity.nickname },
    });
  }

  @SubscribeMessage('ping')
  handlePing(@ConnectedSocket() client: AuthenticatedSocket) {
    if (this.hasValidIdentity(client))
      client.emit('pong', { timestamp: Date.now() });
  }

  @SubscribeMessage('join_channel')
  async handleJoinChannel(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { channel_id: number },
  ) {
    if (!this.hasValidIdentity(client)) return;
    try {
      const channelId = data?.channel_id;
      if (!Number.isSafeInteger(channelId) || channelId <= 0) {
        throw new BadRequestException();
      }
      await this.channelChatService.joinChannelChat(
        channelId,
        client.identity.id,
      );
      if (!this.hasValidIdentity(client)) return;
      if (client.channelId && client.channelId !== channelId) {
        this.emitUserLeft(client, client.channelId);
        await client.leave('channel_' + client.channelId);
      }
      await client.join('channel_' + channelId);
      client.channelId = channelId;
      // Identity fields in the client payload are never used.
      client.to('channel_' + channelId).emit('user_joined', {
        type: 'user_joined',
        channel_id: channelId,
        user: { id: client.identity.id, nickname: client.identity.nickname },
      });
      client.emit('connection_ack', {
        type: 'connection_ack',
        channel_id: channelId,
        online_users: this.getChannelOnlineUsers(channelId),
        timestamp: new Date().toISOString(),
      });
    } catch {
      client.emit('error', {
        type: 'error',
        data: '채널 입장에 실패했습니다.',
      });
    }
  }

  @SubscribeMessage('leave_channel')
  async handleLeaveChannel(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { channel_id: number },
  ) {
    if (!this.isInChannel(client, data?.channel_id)) return;
    this.emitUserLeft(client, client.channelId);
    const channelId = client.channelId;
    client.channelId = undefined;
    await client.leave('channel_' + channelId);
  }

  @SubscribeMessage('send_message')
  async handleSendMessage(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { channel_id: number; message: string },
  ) {
    if (!this.isInChannel(client, data?.channel_id)) {
      client.emit('error', {
        type: 'error',
        data: '채널에 먼저 입장해주세요.',
      });
      return;
    }
    if (
      typeof data.message !== 'string' ||
      !data.message.trim() ||
      data.message.length > 1000
    ) {
      client.emit('error', {
        type: 'error',
        data: '메시지는 1~1000자로 입력해주세요.',
      });
      return;
    }
    try {
      const { chatMessage } =
        await this.channelChatService.sendChannelChatMessage(
          data.channel_id,
          client.identity.id,
          data.message,
        );
      // No fabricated fallback broadcast if authentication/storage fails.
      this.server.to('channel_' + data.channel_id).emit('new_message', {
        type: 'new_message',
        channel_id: data.channel_id,
        message: chatMessage,
        timestamp: new Date().toISOString(),
      });
    } catch {
      this.logger.warn('채팅 메시지 저장 실패');
      client.emit('error', {
        type: 'error',
        data: '메시지 전송에 실패했습니다.',
      });
    }
  }

  @SubscribeMessage('typing')
  handleTyping(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { channel_id: number },
  ) {
    if (!this.isInChannel(client, data?.channel_id)) return;
    client.to('channel_' + client.channelId).emit('typing', {
      type: 'typing',
      channel_id: client.channelId,
      user: { id: client.identity.id, nickname: client.identity.nickname },
      timestamp: new Date().toISOString(),
    });
  }

  getChannelOnlineUsers(channelId: number): number {
    return this.server.adapter.rooms.get('channel_' + channelId)?.size ?? 0;
  }

  getChannelOnlineUserList(
    channelId: number,
  ): { id: string; nickname: string }[] {
    const room = this.server.adapter.rooms.get('channel_' + channelId);
    return [...(room ?? [])].flatMap((id) => {
      const identity = this.connectedUsers.get(id)?.identity;
      return identity ? [{ id: identity.id, nickname: identity.nickname }] : [];
    });
  }

  @SubscribeMessage('server_status')
  handleServerStatus(@ConnectedSocket() client: AuthenticatedSocket) {
    if (!this.hasValidIdentity(client)) return;
    client.emit('server_status', {
      total_connections: this.connectedUsers.size,
      channel_users: client.channelId
        ? this.getChannelOnlineUsers(client.channelId)
        : 0,
      your_channel: client.channelId,
      server_time: new Date().toISOString(),
    });
  }

  broadcastToChannel(channelId: number, event: string, data: any) {
    this.server.to('channel_' + channelId).emit(event, data);
  }
}
