import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import * as bcrypt from 'bcrypt';
import { Role } from '../common/roles.enum';

jest.mock('bcrypt');

describe('UsersController', () => {
  it('lists users', async () => {
    const service = {
      findAll: jest.fn().mockResolvedValue([
        {
          id: '1',
          email: 'a@b.c',
          role: Role.Admin,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]),
    } as unknown as UsersService;

    const controller = new UsersController(service);
    const res = await controller.list();
    expect(res.length).toBe(1);
  });

  it('get returns null when not found', async () => {
    const service = {
      findById: jest.fn().mockResolvedValue(null),
    } as unknown as UsersService;

    const controller = new UsersController(service);
    const res = await controller.get('x');
    expect(res).toBeNull();
  });

  it('get returns user when found', async () => {
    const service = {
      findById: jest
        .fn()
        .mockResolvedValue({ id: '1', email: 'a@b.c', role: Role.Admin }),
    } as unknown as UsersService;
    const controller = new UsersController(service);
    const res = await controller.get('1');
    expect(res?.email).toBe('a@b.c');
  });

  it('create hashes password', async () => {
    (bcrypt.hash as jest.Mock).mockResolvedValue('hash');
    const service = {
      create: jest
        .fn()
        .mockResolvedValue({ id: '1', email: 'a@b.c', role: Role.Admin }),
    } as unknown as UsersService;

    const controller = new UsersController(service);
    const res = await controller.create({
      email: 'a@b.c',
      password: 'password123',
      role: Role.Admin,
    });
    expect(service.create).toHaveBeenCalled();
    expect(res.email).toBe('a@b.c');
  });
});
