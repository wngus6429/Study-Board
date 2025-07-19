import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Channels } from '../entities/Channels.entity';
import { ChannelImage } from '../entities/ChannelImage.entity';
import { Subscription } from '../entities/Subscription.entity';
import { User } from '../entities/User.entity';

@Injectable()
export class ChannelsService {
  constructor(
    @InjectRepository(Channels)
    private channelsRepository: Repository<Channels>,
    @InjectRepository(ChannelImage)
    private channelImageRepository: Repository<ChannelImage>,
    @InjectRepository(Subscription)
    private subscriptionRepository: Repository<Subscription>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  //! ㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡ
  // 모든 채널 조회 (채널 이미지 포함)
  async findAll(): Promise<Channels[]> {
    console.log('모든 채널 데이터 조회');
    return await this.channelsRepository.find({
      order: { id: 'ASC' },
      relations: ['creator', 'ChannelImage'], // 채널 이미지도 함께 조회
    });
  }

  //! ㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡ
  // 특정 채널 조회 (채널 이미지 포함) - Stories 제외로 성능 최적화
  async findOne(id: number): Promise<Channels> {
    console.log('채널 상세 데이터 조회:', id);
    const channel = await this.channelsRepository.findOne({
      where: { id },
      relations: ['subscriptions', 'creator', 'ChannelImage'], // Stories 제거로 성능 최적화
    });

    if (!channel) {
      throw new NotFoundException(
        `ID ${id}에 해당하는 채널을 찾을 수 없습니다.`,
      );
    }

    return channel;
  }

  //! ㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡ
  // 슬러그로 채널 조회 (채널 이미지 포함) - Stories 제외로 성능 최적화
  async findBySlug(slug: string): Promise<Channels> {
    console.log('채널 슬러그 데이터 조회:', slug);
    const channel = await this.channelsRepository.findOne({
      where: { slug },
      relations: ['subscriptions', 'creator', 'ChannelImage'], // Stories 제거로 성능 최적화
    });

    if (!channel) {
      throw new NotFoundException(
        `슬러그 ${slug}에 해당하는 채널을 찾을 수 없습니다.`,
      );
    }

    return channel;
  }

  //! ㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡ
  // 채널 구독
  async subscribe(channelId: number, userId: string): Promise<void> {
    console.log('채널 구독 처리:', { channelId, userId });

    // 채널 존재 확인
    const channel = await this.channelsRepository.findOne({
      where: { id: channelId },
    });
    if (!channel) {
      throw new NotFoundException(
        `ID ${channelId}에 해당하는 채널을 찾을 수 없습니다.`,
      );
    }

    // 사용자 존재 확인
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });
    if (!user) {
      throw new NotFoundException(
        `ID ${userId}에 해당하는 사용자를 찾을 수 없습니다.`,
      );
    }

    // 기존 구독 확인
    const existingSubscription = await this.subscriptionRepository.findOne({
      where: { Channel: { id: channelId }, User: { id: userId } },
    });

    if (existingSubscription) {
      console.log('이미 구독된 채널입니다.');
      return;
    }

    // 새 구독 생성
    const subscription = this.subscriptionRepository.create({
      Channel: channel,
      User: user,
    });

    await this.subscriptionRepository.save(subscription);

    // 채널의 구독자 수 증가
    await this.channelsRepository.increment(
      { id: channelId },
      'subscriber_count',
      1,
    );

    console.log('채널 구독 완료');
  }

  //! ㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡ
  // 채널 구독 취소
  async unsubscribe(channelId: number, userId: string): Promise<void> {
    console.log('채널 구독 취소 처리:', { channelId, userId });

    const subscription = await this.subscriptionRepository.findOne({
      where: { Channel: { id: channelId }, User: { id: userId } },
    });

    if (!subscription) {
      throw new NotFoundException('구독 정보를 찾을 수 없습니다.');
    }

    await this.subscriptionRepository.remove(subscription);

    // 채널의 구독자 수 감소
    await this.channelsRepository.decrement(
      { id: channelId },
      'subscriber_count',
      1,
    );

    console.log('채널 구독 취소 완료');
  }

  //! ㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡ
  // 사용자 구독 채널 목록
  async getUserSubscriptions(userId: string): Promise<Channels[]> {
    console.log('사용자 구독 채널 목록 조회:', userId);

    const subscriptions = await this.subscriptionRepository.find({
      where: { User: { id: userId } },
      relations: ['Channel'],
    });

    return subscriptions.map((subscription) => subscription.Channel);
  }

  //! ㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡ
  // 새 채널 생성
  async createChannel(
    channelName: string,
    slug: string,
    creatorId: string,
  ): Promise<Channels> {
    console.log('새 채널 생성:', { channelName, slug, creatorId });

    // 생성자 사용자 존재 확인
    const creator = await this.userRepository.findOne({
      where: { id: creatorId },
    });
    if (!creator) {
      throw new NotFoundException(
        `ID ${creatorId}에 해당하는 사용자를 찾을 수 없습니다.`,
      );
    }

    // 슬러그 중복 확인
    const existingChannel = await this.channelsRepository.findOne({
      where: { slug },
    });
    if (existingChannel) {
      throw new NotFoundException(
        `슬러그 "${slug}"는 이미 사용 중입니다. 다른 슬러그를 선택해주세요.`,
      );
    }

    const channel = this.channelsRepository.create({
      channel_name: channelName,
      slug: slug,
      story_count: 0,
      subscriber_count: 0,
      creator: creator,
    });

    const savedChannel = await this.channelsRepository.save(channel);
    console.log('채널 생성 완료:', {
      id: savedChannel.id,
      slug: savedChannel.slug,
      creator: creator.nickname,
    });

    return savedChannel;
  }

  //! ㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡ
  // 채널 이미지 업로드/업데이트
  async uploadChannelImage(
    channelId: number,
    userId: string,
    imageFile: Express.Multer.File,
  ): Promise<ChannelImage> {
    console.log('채널 이미지 업로드:', {
      channelId,
      userId,
      fileName: imageFile.filename,
    });

    // 채널 존재 확인 및 권한 확인
    const channel = await this.channelsRepository.findOne({
      where: { id: channelId },
      relations: ['creator', 'ChannelImage'],
    });

    if (!channel) {
      throw new NotFoundException(
        `ID ${channelId}에 해당하는 채널을 찾을 수 없습니다.`,
      );
    }

    // 채널 소유자만 이미지 업로드 가능
    if (channel.creator.id !== userId) {
      throw new NotFoundException(
        '채널 이미지를 업로드할 권한이 없습니다. 채널 생성자만 가능합니다.',
      );
    }

    // 기존 이미지가 있으면 삭제
    if (channel.ChannelImage) {
      await this.channelImageRepository.remove(channel.ChannelImage);
    }

    // 새 이미지 생성 및 저장
    const newChannelImage = this.channelImageRepository.create({
      image_name: imageFile.filename,
      link: (imageFile as any).location,
      Channel: channel,
    });

    const savedImage = await this.channelImageRepository.save(newChannelImage);

    // 채널에 이미지 연결
    channel.ChannelImage = savedImage;
    await this.channelsRepository.save(channel);

    console.log('채널 이미지 업로드 완료:', {
      channelId,
      imageId: savedImage.id,
      imagePath: savedImage.link,
    });

    return savedImage;
  }

  //! ㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡ
  // 채널 이미지 삭제
  async deleteChannelImage(channelId: number, userId: string): Promise<void> {
    console.log('채널 이미지 삭제:', { channelId, userId });

    // 채널 존재 확인 및 권한 확인
    const channel = await this.channelsRepository.findOne({
      where: { id: channelId },
      relations: ['creator', 'ChannelImage'],
    });

    if (!channel) {
      throw new NotFoundException(
        `ID ${channelId}에 해당하는 채널을 찾을 수 없습니다.`,
      );
    }

    // 채널 소유자만 이미지 삭제 가능
    if (channel.creator.id !== userId) {
      throw new NotFoundException(
        '채널 이미지를 삭제할 권한이 없습니다. 채널 생성자만 가능합니다.',
      );
    }

    // 이미지가 있으면 삭제
    if (channel.ChannelImage) {
      await this.channelImageRepository.remove(channel.ChannelImage);
      console.log('채널 이미지 삭제 완료:', {
        channelId,
        deletedImageId: channel.ChannelImage.id,
      });
    } else {
      console.log('삭제할 채널 이미지가 없습니다.');
    }
  }

  //! ㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡ
  // 채널 스토리 카운트 증가
  async incrementStoryCount(channelId: number): Promise<void> {
    console.log('채널 스토리 카운트 증가:', channelId);
    await this.channelsRepository.increment(
      { id: channelId },
      'story_count',
      1,
    );
  }

  //! ㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡ
  // 채널 스토리 카운트 감소
  async decrementStoryCount(channelId: number): Promise<void> {
    console.log('채널 스토리 카운트 감소:', channelId);
    await this.channelsRepository.decrement(
      { id: channelId },
      'story_count',
      1,
    );
  }

  //! ㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡ
  // 채널 삭제 (생성자만 가능)
  async deleteChannel(channelId: number, userId: string): Promise<void> {
    console.log('채널 삭제 요청:', { channelId, userId });

    // 채널 존재 확인 및 생성자 정보 조회
    const channel = await this.channelsRepository.findOne({
      where: { id: channelId },
      relations: ['creator'],
    });

    if (!channel) {
      throw new NotFoundException(
        `ID ${channelId}에 해당하는 채널을 찾을 수 없습니다.`,
      );
    }

    // 생성자 권한 확인
    if (channel.creator.id !== userId) {
      throw new NotFoundException(
        '채널을 삭제할 권한이 없습니다. 채널 생성자만 삭제할 수 있습니다.',
      );
    }

    // 관련된 구독 정보 먼저 삭제
    await this.subscriptionRepository.delete({ Channel: { id: channelId } });

    // 채널 삭제
    await this.channelsRepository.remove(channel);

    console.log('채널 삭제 완료:', {
      channelId,
      channelName: channel.channel_name,
    });
  }

  // 채널 숨김 처리 (is_hidden = true)
  async hideChannel(channelId: number, userId: string): Promise<void> {
    const channel = await this.channelsRepository.findOne({
      where: { id: channelId },
      relations: ['creator'],
    });
    if (!channel) {
      throw new NotFoundException(
        `ID ${channelId}에 해당하는 채널을 찾을 수 없습니다.`,
      );
    }
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException(
        `ID ${userId}에 해당하는 사용자를 찾을 수 없습니다.`,
      );
    }
    const isSuperAdmin = user.is_super_admin === true;
    const isChannelCreator = channel.creator.id === userId;
    if (!isSuperAdmin && !isChannelCreator) {
      throw new NotFoundException(
        '채널을 숨김 처리할 권한이 없습니다. 총관리자 또는 채널 생성자만 숨김 처리할 수 있습니다.',
      );
    }
    channel.is_hidden = true;
    await this.channelsRepository.save(channel);
  }

  // 채널 표시 처리 (is_hidden = false, 총관리자만 가능)
  async showChannel(channelId: number, userId: string): Promise<void> {
    const channel = await this.channelsRepository.findOne({
      where: { id: channelId },
      relations: ['creator'],
    });
    if (!channel) {
      throw new NotFoundException(
        `ID ${channelId}에 해당하는 채널을 찾을 수 없습니다.`,
      );
    }
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException(
        `ID ${userId}에 해당하는 사용자를 찾을 수 없습니다.`,
      );
    }
    const isSuperAdmin = user.is_super_admin === true;
    if (!isSuperAdmin) {
      throw new NotFoundException(
        '채널을 표시할 권한이 없습니다. 총관리자만 표시할 수 있습니다.',
      );
    }
    channel.is_hidden = false;
    await this.channelsRepository.save(channel);
  }
}
