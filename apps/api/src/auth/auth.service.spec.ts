import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { Role } from '../common/roles.enum';

jest.mock('bcrypt', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

describe('AuthService', () => {
  let service: AuthService;
  let usersService: UsersService;
  let jwtService: JwtService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: {
            findByEmail: jest.fn(),
            findById: jest.fn(),
            create: jest.fn(),
            setRefreshTokenHash: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            signAsync: jest.fn().mockResolvedValue('token'),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get<UsersService>(UsersService);
    jwtService = module.get<JwtService>(JwtService);
  });

  it('login returns tokens with valid credentials', async () => {
    const passwordHash = 'hash';
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);
    (usersService.findByEmail as jest.Mock).mockResolvedValue({
      id: 'u1',
      email: 'admin@uniconnect.local',
      role: Role.SuperAdmin,
      passwordHash,
    });

    const result = await service.login('admin@uniconnect.local', 'password123');
    expect(result).toEqual({ accessToken: 'token', refreshToken: 'token' });
  });

  it('login throws on invalid credentials', async () => {
    (usersService.findByEmail as jest.Mock).mockResolvedValue(null);
    await expect(service.login('x@y.z', 'bad')).rejects.toBeDefined();
  });

  it('register creates user', async () => {
    (bcrypt.hash as jest.Mock).mockResolvedValue('hash');
    (usersService.findByEmail as jest.Mock).mockResolvedValue(null);
    (usersService.create as jest.Mock).mockResolvedValue({
      id: 'u1',
      email: 'a@b.c',
      role: Role.Admin,
    });

    const result = await service.register('a@b.c', 'password123', Role.Admin);
    expect(usersService.create).toHaveBeenCalled();
    expect(result).toEqual({ accessToken: 'token', refreshToken: 'token' });
  });

  it('logout clears refresh token', async () => {
    (usersService.setRefreshTokenHash as jest.Mock).mockResolvedValue({});
    const res = await service.logout('u1');
    expect(usersService.setRefreshTokenHash).toHaveBeenCalledWith('u1', null);
    expect(res).toEqual({ success: true });
  });

  it('validateUser returns null on wrong password', async () => {
    (usersService.findByEmail as jest.Mock).mockResolvedValue({
      passwordHash: 'hash',
    });
    (bcrypt.compare as jest.Mock).mockResolvedValue(false);
    const res = await service.validateUser('a@b.c', 'wrong');
    expect(res).toBeNull();
  });
});
