import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { Message } from '../entities/Message.entity';
import { User } from '../entities/User.entity';
import { CreateMessageDto } from './dto/create-message.dto';
import { UpdateMessageDto } from './dto/update-message.dto';

@Injectable()
export class MessagesService {
  constructor(
    @InjectRepository(Message)
    private readonly messageRepository: Repository<Message>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  //! ㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡ
  // 쪽지 보내기
  async sendMessage(createMessageDto: CreateMessageDto, senderId: string) {
    const { receiverNickname, title, content } = createMessageDto;

    // 보내는 사람 확인
    const sender = await this.userRepository.findOne({
      where: { id: senderId },
    });
    if (!sender) {
      throw new NotFoundException('발신자를 찾을 수 없습니다.');
    }

    // 받는 사람 확인
    const receiver = await this.userRepository.findOne({
      where: { nickname: receiverNickname },
    });
    if (!receiver) {
      throw new NotFoundException('해당 닉네임의 사용자를 찾을 수 없습니다.');
    }

    // 자기 자신에게 보내는지 확인
    if (sender.id === receiver.id) {
      throw new ForbiddenException('자기 자신에게는 쪽지를 보낼 수 없습니다.');
    }

    const message = this.messageRepository.create({
      sender,
      receiver,
      title,
      content,
    });

    const savedMessage = await this.messageRepository.save(message);

    return {
      id: savedMessage.id,
      title: savedMessage.title,
      content: savedMessage.content,
      receiver: {
        id: receiver.id,
        nickname: receiver.nickname,
      },
      createdAt: savedMessage.createdAt,
    };
  }

  //! ㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡ
  // 받은 쪽지 목록 조회
  async getReceivedMessages(
    userId: string,
    page: number = 1,
    limit: number = 20,
  ) {
    const [messages, total] = await this.messageRepository.findAndCount({
      where: { receiver: { id: userId } },
      relations: ['sender'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    const items = messages.map((message) => ({
      id: message.id,
      title: message.title,
      content: message.content,
      isRead: message.isRead,
      sender: {
        nickname: message.sender.nickname,
      },
      createdAt: message.createdAt,
    }));

    return {
      messages: items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  //! ㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡ
  // 보낸 쪽지 목록 조회
  async getSentMessages(userId: string, page: number = 1, limit: number = 20) {
    const [messages, total] = await this.messageRepository.findAndCount({
      where: { sender: { id: userId } },
      relations: ['receiver'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    const items = messages.map((message) => ({
      id: message.id,
      title: message.title,
      content: message.content,
      isRead: message.isRead,
      receiver: {
        nickname: message.receiver.nickname,
      },
      createdAt: message.createdAt,
    }));

    return {
      messages: items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  //! ㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡ
  // 쪽지 읽음 처리
  async markAsRead(messageId: number, userId: string) {
    const message = await this.messageRepository.findOne({
      where: { id: messageId },
      relations: ['receiver'],
    });

    if (!message) {
      throw new NotFoundException('쪽지를 찾을 수 없습니다.');
    }

    // 권한 확인 (받는 사람만 읽음 처리 가능)
    if (message.receiver.id !== userId) {
      throw new ForbiddenException('이 쪽지에 접근할 권한이 없습니다.');
    }

    await this.messageRepository.update(messageId, { isRead: true });
    return { message: '쪽지가 읽음으로 표시되었습니다.' };
  }

  //! ㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡ
  // 쪽지 수정
  async updateMessage(
    messageId: number,
    updateMessageDto: UpdateMessageDto,
    userId: string,
  ) {
    const message = await this.messageRepository.findOne({
      where: { id: messageId },
      relations: ['sender'],
    });

    if (!message) {
      throw new NotFoundException('쪽지를 찾을 수 없습니다.');
    }

    // 권한 확인 (보낸 사람만 수정 가능)
    if (message.sender.id !== userId) {
      throw new ForbiddenException('이 쪽지를 수정할 권한이 없습니다.');
    }

    // 읽은 쪽지는 수정 불가
    if (message.isRead) {
      throw new ForbiddenException('이미 읽은 쪽지는 수정할 수 없습니다.');
    }

    const updateData: Partial<Message> = {};
    if (updateMessageDto.title !== undefined) {
      updateData.title = updateMessageDto.title;
    }
    if (updateMessageDto.content !== undefined) {
      updateData.content = updateMessageDto.content;
    }

    await this.messageRepository.update(messageId, updateData);

    const updatedMessage = await this.messageRepository.findOne({
      where: { id: messageId },
      relations: ['sender', 'receiver'],
    });

    return {
      id: updatedMessage.id,
      title: updatedMessage.title,
      content: updatedMessage.content,
      receiver: {
        id: updatedMessage.receiver.id,
        nickname: updatedMessage.receiver.nickname,
        user_email: updatedMessage.receiver.user_email,
      },
      createdAt: updatedMessage.createdAt,
    };
  }

  //! ㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡ
  // 쪽지 삭제
  async deleteMessage(messageId: number, userId: string) {
    const message = await this.messageRepository.findOne({
      where: { id: messageId },
      relations: ['sender', 'receiver'],
    });

    if (!message) {
      throw new NotFoundException('쪽지를 찾을 수 없습니다.');
    }

    // 권한 확인 (보낸 사람 또는 받은 사람만 삭제 가능)
    if (message.sender.id !== userId && message.receiver.id !== userId) {
      throw new ForbiddenException('이 쪽지를 삭제할 권한이 없습니다.');
    }

    await this.messageRepository.remove(message);
    return { message: '쪽지가 삭제되었습니다.' };
  }

  //! ㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡ
  // 사용자 닉네임으로 검색
  async searchUserByNickname(query: string) {
    if (!query || query.trim().length === 0) {
      return [];
    }

    const users = await this.userRepository.find({
      where: { nickname: ILike(`%${query}%`) },
      select: ['id', 'nickname', 'user_email'],
      take: 10,
    });

    return users.map((user) => ({
      id: user.id,
      nickname: user.nickname,
      user_email: user.user_email,
    }));
  }

  //! ㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡ
  // 읽지 않은 쪽지 개수 조회
  async getUnreadCount(userId: string): Promise<number> {
    return await this.messageRepository.count({
      where: {
        receiver: { id: userId },
        isRead: false,
      },
    });
  }
}
