import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { Role } from '../common/roles.enum';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

const makeService = (users: Partial<UsersService>) => {
  const jwt = {
    signAsync: jest.fn().mockResolvedValue('token'),
  } as unknown as JwtService;
  return new AuthService(users as UsersService, jwt);
};

describe('AuthService extra', () => {
  it('register throws if email exists', async () => {
    const service = makeService({
      findByEmail: jest.fn().mockResolvedValue({ id: '1' }),
    });
    await expect(
      service.register('a@b.c', 'password123', Role.Admin),
    ).rejects.toBeDefined();
  });

  it('refresh throws if user missing', async () => {
    const service = makeService({
      findById: jest.fn().mockResolvedValue(null),
    });
    await expect(service.refresh('id', 'token')).rejects.toBeDefined();
  });

  it('refresh throws if token mismatch', async () => {
    (bcrypt.compare as jest.Mock).mockResolvedValue(false);
    const service = makeService({
      findById: jest
        .fn()
        .mockResolvedValue({ id: 'u1', refreshTokenHash: 'hash' }),
    });
    await expect(service.refresh('u1', 'token')).rejects.toBeDefined();
  });

  it('refresh returns tokens on success', async () => {
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);
    const service = makeService({
      findById: jest.fn().mockResolvedValue({
        id: 'u1',
        email: 'a@b.c',
        role: Role.Admin,
        refreshTokenHash: 'hash',
      }),
      setRefreshTokenHash: jest.fn().mockResolvedValue({}),
    });

    const res = await service.refresh('u1', 'token');
    expect(res).toEqual({ accessToken: 'token', refreshToken: 'token' });
  });
});
