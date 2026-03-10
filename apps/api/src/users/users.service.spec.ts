import { UsersService } from './users.service';
import { Role } from '../common/roles.enum';

const emptyModel = () => ({ create: jest.fn(), findOne: jest.fn(), findById: jest.fn(), findByIdAndUpdate: jest.fn(), find: jest.fn() } as any);

describe('UsersService', () => {
  it('create calls model.create', async () => {
    const model = { ...emptyModel(), create: jest.fn().mockResolvedValue({ _id: 'u1', id: 'u1' }) };
    const service = new UsersService(model, emptyModel(), emptyModel());
    const user = await service.create('a@b.c', 'hash', Role.Admin);
    expect(model.create).toHaveBeenCalled();
    expect(user).toEqual({ _id: 'u1', id: 'u1' });
  });

  it('findByEmail calls model.findOne', async () => {
    const model = { ...emptyModel(), findOne: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue({}) }) };
    const service = new UsersService(model, emptyModel(), emptyModel());
    await service.findByEmail('a@b.c');
    expect(model.findOne).toHaveBeenCalled();
  });

  it('findAll calls model.find', async () => {
    const model = { ...emptyModel(), find: jest.fn().mockReturnValue({ sort: () => ({ exec: jest.fn().mockResolvedValue([]) }) }) };
    const service = new UsersService(model, emptyModel(), emptyModel());
    await service.findAll();
    expect(model.find).toHaveBeenCalled();
  });

  it('findTeachers calls model.find with teacher roles', async () => {
    const model = { ...emptyModel(), find: jest.fn().mockReturnValue({ sort: () => ({ exec: jest.fn().mockResolvedValue([]) }) }) };
    const service = new UsersService(model, emptyModel(), emptyModel());
    await service.findTeachers();
    expect(model.find).toHaveBeenCalledWith({ role: { $in: [Role.Teacher, Role.External] } });
  });

  it('findById calls model.findById', async () => {
    const model = { ...emptyModel(), findById: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue({}) }) };
    const service = new UsersService(model, emptyModel(), emptyModel());
    await service.findById('u1');
    expect(model.findById).toHaveBeenCalledWith('u1');
  });

  it('setRefreshTokenHash updates user', async () => {
    const model = { ...emptyModel(), findByIdAndUpdate: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue({}) }) };
    const service = new UsersService(model, emptyModel(), emptyModel());
    await service.setRefreshTokenHash('u1', 'hash');
    expect(model.findByIdAndUpdate).toHaveBeenCalled();
  });

  it('listUnlinkedStudents queries without userId', async () => {
    const studentModel = { ...emptyModel(), find: jest.fn().mockReturnValue({ select: jest.fn().mockReturnThis(), limit: jest.fn().mockReturnThis(), lean: jest.fn().mockReturnThis(), exec: jest.fn().mockResolvedValue([]) }) };
    const service = new UsersService(emptyModel(), studentModel, emptyModel());
    await service.listUnlinkedStudents();
    expect(studentModel.find).toHaveBeenCalledWith({ userId: { $exists: false } });
  });

  it('listUnlinkedTeachers queries without userId', async () => {
    const teacherModel = { ...emptyModel(), find: jest.fn().mockReturnValue({ select: jest.fn().mockReturnThis(), limit: jest.fn().mockReturnThis(), lean: jest.fn().mockReturnThis(), exec: jest.fn().mockResolvedValue([]) }) };
    const service = new UsersService(emptyModel(), emptyModel(), teacherModel);
    await service.listUnlinkedTeachers();
    expect(teacherModel.find).toHaveBeenCalledWith({ userId: { $exists: false } });
  });
});
