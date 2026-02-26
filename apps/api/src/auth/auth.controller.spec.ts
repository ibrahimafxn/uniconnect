import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import { Role } from '../common/roles.enum';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;
  let jwtService: JwtService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            register: jest.fn(),
            login: jest.fn(),
            refresh: jest.fn(),
            logout: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            verify: jest.fn().mockReturnValue({ sub: 'u1' }),
          },
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
    jwtService = module.get<JwtService>(JwtService);
  });

  it('register delegates to service', async () => {
    (authService.register as jest.Mock).mockResolvedValue({ accessToken: 'a' });
    const result = await controller.register({
      email: 'a@b.c',
      password: 'password123',
      role: Role.Admin,
    });
    expect(authService.register).toHaveBeenCalled();
    expect(result).toEqual({ accessToken: 'a' });
  });

  it('login delegates to service', async () => {
    (authService.login as jest.Mock).mockResolvedValue({ accessToken: 'a' });
    const result = await controller.login({
      email: 'a@b.c',
      password: 'password123',
    });
    expect(authService.login).toHaveBeenCalled();
    expect(result).toEqual({ accessToken: 'a' });
  });

  it('refresh delegates to service', async () => {
    (authService.refresh as jest.Mock).mockResolvedValue({ accessToken: 'a' });
    const result = await controller.refresh({ refreshToken: 'r' });
    expect(authService.refresh).toHaveBeenCalledWith('u1', 'r');
    expect(result).toEqual({ accessToken: 'a' });
  });

  it('refresh throws on invalid token', async () => {
    (jwtService.verify as jest.Mock).mockImplementation(() => {
      throw new Error('bad');
    });
    await expect(
      controller.refresh({ refreshToken: 'bad' }),
    ).rejects.toBeDefined();
  });
});
