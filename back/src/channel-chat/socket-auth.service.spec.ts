import { JwtService } from '@nestjs/jwt';
import { Repository } from 'typeorm';
import { User } from '../entities/User.entity';
import { SocketAuthService } from './socket-auth.service';

describe('SocketAuthService', () => {
  const jwt = new JwtService({ secret: 'socket-auth-unit-test-secret' });
  const claims = { id: 'member-1', user_email: 'member@example.invalid' };
  let repository: { findOne: jest.Mock };
  let service: SocketAuthService;

  beforeEach(() => {
    repository = {
      findOne: jest
        .fn()
        .mockResolvedValue({ id: 'member-1', nickname: 'DB nickname' }),
    };
    service = new SocketAuthService(
      jwt,
      repository as unknown as Repository<User>,
    );
  });

  it('uses signed access-cookie identity and the current DB nickname', async () => {
    const token = jwt.sign(claims, { expiresIn: '1h' });
    await expect(
      service.authenticate('other=value; access_token=' + token),
    ).resolves.toEqual({
      id: claims.id,
      nickname: 'DB nickname',
      expiresAt: expect.any(Number),
    });
    expect(repository.findOne).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          ...claims,
          deleted_at: expect.anything(),
        }),
        select: ['id', 'nickname'],
      }),
    );
  });

  it.each([
    ['missing', undefined],
    ['malformed cookie', 'access_token=%XX'],
    ['unsigned text', 'access_token=not-a-jwt'],
    ['duplicate cookie', 'access_token=a; access_token=b'],
    [
      'refresh token',
      'access_token=' + jwt.sign({ id: claims.id }, { expiresIn: '7d' }),
    ],
    ['expired token', 'access_token=' + jwt.sign(claims, { expiresIn: -1 })],
    ['no expiry', 'access_token=' + jwt.sign(claims)],
    [
      'wrong signature',
      'access_token=' +
        new JwtService({ secret: 'wrong-secret' }).sign(claims, {
          expiresIn: '1h',
        }),
    ],
  ])('rejects %s before querying a user', async (_name, cookie) => {
    await expect(service.authenticate(cookie)).rejects.toThrow('다시 로그인');
    expect(repository.findOne).not.toHaveBeenCalled();
  });

  it('rejects a missing, deleted, or mismatched user', async () => {
    repository.findOne.mockResolvedValue(null);
    await expect(
      service.authenticate(
        'access_token=' + jwt.sign(claims, { expiresIn: '1h' }),
      ),
    ).rejects.toThrow('다시 로그인');
  });
});
