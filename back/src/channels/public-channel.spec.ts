import { instanceToPlain } from 'class-transformer';
import { DataSource, getMetadataArgsStorage } from 'typeorm';
import { Channels } from '../entities/Channels.entity';
import { User } from '../entities/User.entity';
import { ChannelsController } from './channels.controller';
import { ChannelsService } from './channels.service';

describe('public user data protection', () => {
  it('omits password from SQL even when a User relation is joined', async () => {
    const entities = getMetadataArgsStorage().tables.map(
      (table) => table.target,
    ) as Function[];
    const db = new DataSource({ type: 'mysql', database: 'test', entities });
    // Build ORM metadata only. No database connection or schema operation.
    await (db as any).buildMetadatas();
    const joinedSql = db
      .getRepository(Channels)
      .createQueryBuilder('channel')
      .leftJoinAndSelect('channel.creator', 'creator')
      .getSql();
    expect(joinedSql).not.toContain('password');
    expect(
      db.getRepository(User).createQueryBuilder('user').getSql(),
    ).not.toContain('password');
    expect(
      db
        .getRepository(User)
        .createQueryBuilder('user')
        .addSelect('user.password')
        .getSql(),
    ).toContain('password');
  });

  it('strips an explicitly loaded hash when serializing nested User entities', () => {
    const user = Object.assign(new User(), {
      id: 'member',
      nickname: 'Member',
      password: 'private-hash',
    });
    const response = instanceToPlain({
      results: [{ creator: user }],
      author: user,
    });
    expect(JSON.stringify(response)).not.toContain('private-hash');
    expect(user.password).toBe('private-hash'); // Authentication can still compare the original entity.
    expect(response.author.nickname).toBe('Member');
  });

  it('allowlists public fields for all unauthenticated channel endpoints, including plain objects', async () => {
    const channel = {
      id: 1,
      channel_name: 'Channel',
      slug: 'channel',
      creator: {
        id: 'member',
        nickname: 'Member',
        password: 'private-hash',
        user_email: 'private@example.invalid',
      },
      ChannelImage: {
        id: 2,
        link: '/channelUpload/a.png',
        Channel: { secret: 'nested-private' },
      },
      subscriptions: [{ private: true }],
    };
    const service = {
      findAll: jest.fn().mockResolvedValue([channel]),
      findOne: jest.fn().mockResolvedValue(channel),
      findBySlug: jest.fn().mockResolvedValue(channel),
    };
    const controller = new ChannelsController(
      service as unknown as ChannelsService,
    );
    for (const response of [
      await controller.findAllChannels(),
      await controller.findOneChannel(1),
      await controller.findChannelBySlug('channel'),
    ]) {
      const json = JSON.stringify(response);
      expect(json).not.toMatch(/password|private|subscriptions|user_email/);
      expect(json).toContain('Member');
      expect(json).toContain('/channelUpload/a.png');
    }
  });
});
