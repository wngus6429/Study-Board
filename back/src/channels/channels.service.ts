import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Channels } from '../entities/Channels.entity';
import { Subscription } from '../entities/Subscription.entity';
import { User } from '../entities/User.entity';

@Injectable()
export class ChannelsService {
  constructor(
    @InjectRepository(Channels)
    private channelsRepository: Repository<Channels>,
    @InjectRepository(Subscription)
    private subscriptionRepository: Repository<Subscription>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  // 모든 채널 조회
  async findAll(): Promise<Channels[]> {
    console.log('얼findAll');
    return this.channelsRepository.find({
      relations: ['Subscriptions'],
    });
  }

  // 특정 채널 조회
  async findOne(id: number): Promise<Channels> {
    const channel = await this.channelsRepository.findOne({
      where: { id },
      relations: ['Subscriptions', 'Stories'],
    });

    if (!channel) {
      throw new NotFoundException(`Channel with ID ${id} not found`);
    }

    return channel;
  }

  // 채널 구독
  async subscribe(channelId: number, userId: string): Promise<void> {
    const channel = await this.findOne(channelId);
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    // 이미 구독했는지 확인
    const existingSubscription = await this.subscriptionRepository.findOne({
      where: { Channel: { id: channelId }, User: { id: userId } },
    });

    if (existingSubscription) {
      return; // 이미 구독 중
    }

    // 구독 생성
    const subscription = this.subscriptionRepository.create({
      Channel: channel,
      User: user,
    });

    await this.subscriptionRepository.save(subscription);

    // 채널 구독자 수 증가
    await this.channelsRepository.update(channelId, {
      SubscriberCount: channel.SubscriberCount + 1,
    });
  }

  // 채널 구독 취소
  async unsubscribe(channelId: number, userId: string): Promise<void> {
    const subscription = await this.subscriptionRepository.findOne({
      where: { Channel: { id: channelId }, User: { id: userId } },
    });

    if (!subscription) {
      return; // 구독하지 않았음
    }

    await this.subscriptionRepository.remove(subscription);

    // 채널 구독자 수 감소
    const channel = await this.findOne(channelId);
    await this.channelsRepository.update(channelId, {
      SubscriberCount: Math.max(0, channel.SubscriberCount - 1),
    });
  }

  // 유저가 구독한 채널 목록
  async getUserSubscriptions(userId: string): Promise<Channels[]> {
    const subscriptions = await this.subscriptionRepository.find({
      where: { User: { id: userId } },
      relations: ['Channel'],
    });

    return subscriptions.map((sub) => sub.Channel);
  }

  // 스토리 카운트 증가
  async incrementStoryCount(channelId: number): Promise<void> {
    await this.channelsRepository.increment({ id: channelId }, 'StoryCount', 1);
  }

  // 스토리 카운트 감소
  async decrementStoryCount(channelId: number): Promise<void> {
    const channel = await this.findOne(channelId);
    await this.channelsRepository.update(channelId, {
      StoryCount: Math.max(0, channel.StoryCount - 1),
    });
  }

  // 초기 데이터 생성
  async createInitialChannels(): Promise<void> {
    const existingChannels = await this.channelsRepository.count();

    if (existingChannels > 0) {
      return; // 이미 데이터가 있으면 생성하지 않음
    }

    const initialChannels = [
      {
        ChannelName: '게임 토론',
        StoryCount: 0,
        SubscriberCount: 0,
      },
      {
        ChannelName: '애니메이션',
        StoryCount: 0,
        SubscriberCount: 0,
      },
      {
        ChannelName: '만화',
        StoryCount: 0,
        SubscriberCount: 0,
      },
      {
        ChannelName: '프로그래밍',
        StoryCount: 0,
        SubscriberCount: 0,
      },
      {
        ChannelName: '요리 레시피',
        StoryCount: 0,
        SubscriberCount: 0,
      },
    ];

    for (const channelData of initialChannels) {
      const channel = this.channelsRepository.create(channelData);
      await this.channelsRepository.save(channel);
    }
  }

  // 새 채널 생성
  async createChannel(channelName: string): Promise<Channels> {
    const channel = this.channelsRepository.create({
      ChannelName: channelName,
      StoryCount: 0,
      SubscriberCount: 0,
    });

    return await this.channelsRepository.save(channel);
  }
}
