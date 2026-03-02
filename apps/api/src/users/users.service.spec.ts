import { UsersService } from './users.service';
import { Role } from '../common/roles.enum';

describe('UsersService', () => {
  it('create calls model.create', async () => {
    const model = {
      create: jest.fn().mockResolvedValue({ id: 'u1' }),
      findOne: jest.fn(),
      findById: jest.fn(),
      findByIdAndUpdate: jest.fn(),
      find: jest.fn(),
    } as any;

    const service = new UsersService(model);
    const user = await service.create('a@b.c', 'hash', Role.Admin);
    expect(model.create).toHaveBeenCalled();
    expect(user).toEqual({ id: 'u1' });
  });

  it('findByEmail calls model.findOne', async () => {
    const model = {
      findOne: jest
        .fn()
        .mockReturnValue({ exec: jest.fn().mockResolvedValue({}) }),
    } as any;
    const service = new UsersService(model);
    await service.findByEmail('a@b.c');
    expect(model.findOne).toHaveBeenCalled();
  });

  it('findAll calls model.find', async () => {
    const model = {
      find: jest.fn().mockReturnValue({
        sort: () => ({ exec: jest.fn().mockResolvedValue([]) }),
      }),
    } as any;
    const service = new UsersService(model);
    await service.findAll();
    expect(model.find).toHaveBeenCalled();
  });

  it('findTeachers calls model.find with teacher roles', async () => {
    const model = {
      find: jest.fn().mockReturnValue({
        sort: () => ({ exec: jest.fn().mockResolvedValue([]) }),
      }),
    } as any;
    const service = new UsersService(model);
    await service.findTeachers();
    expect(model.find).toHaveBeenCalledWith({
      role: { $in: [Role.Teacher, Role.External] },
    });
  });

  it('findById calls model.findById', async () => {
    const model = {
      findById: jest
        .fn()
        .mockReturnValue({ exec: jest.fn().mockResolvedValue({}) }),
    } as any;
    const service = new UsersService(model);
    await service.findById('u1');
    expect(model.findById).toHaveBeenCalledWith('u1');
  });

  it('setRefreshTokenHash updates user', async () => {
    const model = {
      findByIdAndUpdate: jest
        .fn()
        .mockReturnValue({ exec: jest.fn().mockResolvedValue({}) }),
    } as any;
    const service = new UsersService(model);
    await service.setRefreshTokenHash('u1', 'hash');
    expect(model.findByIdAndUpdate).toHaveBeenCalled();
  });
});
