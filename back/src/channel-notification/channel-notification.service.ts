import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChannelNotificationSubscription } from '../entities/ChannelNotificationSubscription.entity';
import { User } from '../entities/aUser.entity';
import { Channels } from '../entities/Channels.entity';

@Injectable()
export class ChannelNotificationService {
  constructor(
    @InjectRepository(ChannelNotificationSubscription)
    private readonly subscriptionRepository: Repository<ChannelNotificationSubscription>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Channels)
    private readonly channelsRepository: Repository<Channels>,
  ) {}

  //! ㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡ
  // 채널 알림 구독
  async subscribe(userId: string, channelId: number) {
    // 사용자 확인
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('사용자를 찾을 수 없습니다.');
    }

    // 채널 확인
    const channel = await this.channelsRepository.findOne({
      where: { id: channelId },
    });
    if (!channel) {
      throw new NotFoundException('채널을 찾을 수 없습니다.');
    }

    // 이미 구독했는지 확인
    const existingSubscription = await this.subscriptionRepository.findOne({
      where: { User: { id: userId }, Channel: { id: channelId } },
    });

    if (existingSubscription) {
      throw new ConflictException('이미 해당 채널의 알림을 구독하고 있습니다.');
    }

    // 구독 생성
    const subscription = this.subscriptionRepository.create({
      User: user,
      Channel: channel,
    });

    await this.subscriptionRepository.save(subscription);

    return {
      message: '채널 알림 구독이 완료되었습니다.',
      channelId,
      channelName: channel.channel_name,
    };
  }

  //! ㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡ
  // 채널 알림 구독 해제
  async unsubscribe(userId: string, channelId: number) {
    // 구독 정보 찾기
    const subscription = await this.subscriptionRepository.findOne({
      where: { User: { id: userId }, Channel: { id: channelId } },
      relations: ['Channel'],
    });

    if (!subscription) {
      throw new NotFoundException('해당 채널의 알림을 구독하고 있지 않습니다.');
    }

    await this.subscriptionRepository.remove(subscription);

    return {
      message: '채널 알림 구독이 해제되었습니다.',
      channelId,
      channelName: subscription.Channel.channel_name,
    };
  }

  //! ㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡ
  // 사용자의 채널 알림 구독 목록 조회
  async getUserSubscriptions(userId: string) {
    const subscriptions = await this.subscriptionRepository.find({
      where: { User: { id: userId } },
      relations: ['Channel'],
      order: { created_at: 'DESC' },
    });

    return subscriptions.map((sub) => ({
      id: sub.id,
      channelId: sub.Channel.id,
      channelName: sub.Channel.channel_name,
      channelSlug: sub.Channel.slug,
      subscribedAt: sub.created_at,
    }));
  }

  //! ㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡ
  // 특정 채널의 알림 구독자들 조회 (게시글 작성시 알림 발송용)
  async getChannelSubscribers(channelId: number) {
    const subscriptions = await this.subscriptionRepository.find({
      where: { Channel: { id: channelId } },
      relations: ['User'],
    });

    return subscriptions.map((sub) => sub.User);
  }

  //! ㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡ
  // 사용자가 특정 채널의 알림을 구독하고 있는지 확인
  async isSubscribed(userId: string, channelId: number): Promise<boolean> {
    const subscription = await this.subscriptionRepository.findOne({
      where: { User: { id: userId }, Channel: { id: channelId } },
    });

    return !!subscription;
  }
}
