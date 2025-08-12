import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChannelChatMessage } from '../entities/ChannelChatMessage.entity';
import { Channels } from '../entities/Channels.entity';
import { User } from '../entities/User.entity';

@Injectable()
export class ChannelChatService {
  constructor(
    @InjectRepository(ChannelChatMessage)
    private channelChatMessageRepository: Repository<ChannelChatMessage>,
    @InjectRepository(Channels)
    private channelsRepository: Repository<Channels>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  // 채널 채팅 메시지 목록 조회
  async getChannelChatMessages(
    channelId: number,
    page: number = 1,
    limit: number = 50,
  ) {
    // 채널 존재 확인
    const channel = await this.channelsRepository.findOne({
      where: { id: channelId },
    });

    if (!channel) {
      throw new NotFoundException('채널을 찾을 수 없습니다.');
    }

    const [messages, total] =
      await this.channelChatMessageRepository.findAndCount({
        where: { channel: { id: channelId } },
        relations: ['user', 'user.UserImage'],
        order: { created_at: 'DESC' },
        skip: (page - 1) * limit,
        take: limit,
      });

    // 최신 메시지가 위로 오도록 다시 정렬
    const sortedMessages = messages.reverse();

    return {
      messages: sortedMessages.map((message) => ({
        id: message.id,
        channel_id: channelId,
        user_id: message.user.id,
        message: message.message,
        created_at: message.created_at,
        updated_at: message.updated_at,
        user: {
          id: message.user.id,
          nickname: message.user.nickname,
          user_email: message.user.user_email,
          profile_image: message.user.UserImage?.link || null,
        },
      })),
      total,
      page,
      limit,
      hasMore: page * limit < total,
    };
  }

  // 채널 채팅 메시지 전송
  async sendChannelChatMessage(
    channelId: number,
    userId: string,
    messageText: string,
  ) {
    // 채널 존재 확인
    const channel = await this.channelsRepository.findOne({
      where: { id: channelId },
    });

    if (!channel) {
      throw new NotFoundException('채널을 찾을 수 없습니다.');
    }

    // 사용자 존재 확인
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['UserImage'],
    });

    if (!user) {
      throw new NotFoundException('사용자를 찾을 수 없습니다.');
    }

    // 메시지 길이 제한
    if (messageText.length > 1000) {
      throw new ForbiddenException('메시지는 1000자를 초과할 수 없습니다.');
    }

    // 메시지 저장
    const chatMessage = this.channelChatMessageRepository.create({
      channel,
      user,
      message: messageText.trim(),
    });

    const savedMessage =
      await this.channelChatMessageRepository.save(chatMessage);

    // 저장된 메시지 반환 (관계 포함)
    const messageWithRelations =
      await this.channelChatMessageRepository.findOne({
        where: { id: savedMessage.id },
        relations: ['user', 'user.UserImage'],
      });

    return {
      message: '메시지가 전송되었습니다.',
      chatMessage: {
        id: messageWithRelations.id,
        channel_id: channelId,
        user_id: messageWithRelations.user.id,
        message: messageWithRelations.message,
        created_at: messageWithRelations.created_at,
        updated_at: messageWithRelations.updated_at,
        user: {
          id: messageWithRelations.user.id,
          nickname: messageWithRelations.user.nickname,
          user_email: messageWithRelations.user.user_email,
          profile_image: messageWithRelations.user.UserImage?.link || null,
        },
      },
    };
  }

  // 채널 채팅 메시지 삭제 (본인 메시지만)
  async deleteChannelChatMessage(
    channelId: number,
    messageId: number,
    userId: string,
  ) {
    const message = await this.channelChatMessageRepository.findOne({
      where: {
        id: messageId,
        channel: { id: channelId },
        user: { id: userId },
      },
    });

    if (!message) {
      throw new NotFoundException(
        '메시지를 찾을 수 없거나 삭제 권한이 없습니다.',
      );
    }

    await this.channelChatMessageRepository.remove(message);

    return { message: '메시지가 삭제되었습니다.' };
  }

  // 채널 입장 (향후 온라인 사용자 관리용)
  async joinChannelChat(channelId: number, userId: string) {
    // 채널 존재 확인
    const channel = await this.channelsRepository.findOne({
      where: { id: channelId },
    });

    if (!channel) {
      throw new NotFoundException('채널을 찾을 수 없습니다.');
    }

    // 사용자 존재 확인
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('사용자를 찾을 수 없습니다.');
    }

    // 향후 온라인 사용자 테이블에 추가하는 로직 구현 가능
    // 현재는 단순히 성공 응답만 반환

    return {
      message: '채널 채팅에 입장했습니다.',
      user: {
        id: user.id,
        nickname: user.nickname,
      },
    };
  }

  // 채널 나가기 (향후 온라인 사용자 관리용)
  async leaveChannelChat(channelId: number, userId: string) {
    // 향후 온라인 사용자 테이블에서 제거하는 로직 구현 가능
    // 현재는 단순히 성공 응답만 반환

    return {
      message: '채널 채팅에서 나갔습니다.',
      user: {
        id: userId,
      },
    };
  }

  // 채널 참여자 목록 조회 (향후 구현)
  async getChannelChatParticipants(channelId: number) {
    // 현재는 빈 배열 반환 (향후 온라인 사용자 관리 기능 추가 시 구현)
    return {
      users: [],
      count: 0,
    };
  }
}
