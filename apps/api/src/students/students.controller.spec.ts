import { StudentsController } from './students.controller';
import { StudentsService } from './students.service';
import { Types } from 'mongoose';

describe('StudentsController', () => {
  it('updateStudent converts ids', async () => {
    const service = {
      updateStudent: jest.fn().mockResolvedValue({}),
    } as unknown as StudentsService;

    const controller = new StudentsController(service);
    await controller.updateStudent('id', {
      groupId: '507f1f77bcf86cd799439011',
      academicYearId: '507f1f77bcf86cd799439012',
    });

    const payload = (service.updateStudent as jest.Mock).mock.calls[0][1];
    expect(payload.groupId).toBeInstanceOf(Types.ObjectId);
    expect(payload.academicYearId).toBeInstanceOf(Types.ObjectId);
  });

  it('listStudents passes pagination and search', async () => {
    const service = {
      listStudents: jest.fn().mockResolvedValue({ items: [], total: 0 }),
    } as unknown as StudentsService;
    const controller = new StudentsController(service);
    await controller.listStudents('1', '10', 'john');
    expect(service.listStudents).toHaveBeenCalledWith({
      page: 1,
      limit: 10,
      skip: 0,
      q: 'john',
    });
  });

  it('listStudents without search', async () => {
    const service = {
      listStudents: jest.fn().mockResolvedValue({ items: [], total: 0 }),
    } as unknown as StudentsService;
    const controller = new StudentsController(service);
    await controller.listStudents('1', '10');
    expect(service.listStudents).toHaveBeenCalledWith({
      page: 1,
      limit: 10,
      skip: 0,
      q: undefined,
    });
  });

  it('listStudents with whitespace search', async () => {
    const service = {
      listStudents: jest.fn().mockResolvedValue({ items: [], total: 0 }),
    } as unknown as StudentsService;
    const controller = new StudentsController(service);
    await controller.listStudents('1', '10', '   ');
    expect(service.listStudents).toHaveBeenCalledWith({
      page: 1,
      limit: 10,
      skip: 0,
      q: undefined,
    });
  });

  it('deleteEnrollment delegates', async () => {
    const service = {
      deleteEnrollment: jest.fn().mockResolvedValue({}),
    } as unknown as StudentsService;
    const controller = new StudentsController(service);
    await controller.deleteEnrollment('e1');
    expect(service.deleteEnrollment).toHaveBeenCalledWith('e1');
  });

  it('updateEnrollment delegates', async () => {
    const service = {
      updateEnrollment: jest.fn().mockResolvedValue({}),
    } as unknown as StudentsService;
    const controller = new StudentsController(service);
    await controller.updateEnrollment('e1', { status: 'approved' } as any);
    expect(service.updateEnrollment).toHaveBeenCalled();
  });

  it('updateStudent with empty dto', async () => {
    const service = {
      updateStudent: jest.fn().mockResolvedValue({}),
    } as unknown as StudentsService;
    const controller = new StudentsController(service);
    await controller.updateStudent('s1', {});
    expect(service.updateStudent).toHaveBeenCalled();
  });

  it('updateStudent with one id', async () => {
    const service = {
      updateStudent: jest.fn().mockResolvedValue({}),
    } as unknown as StudentsService;
    const controller = new StudentsController(service);
    await controller.updateStudent('s1', {
      groupId: '507f1f77bcf86cd799439011',
    } as any);
    expect(service.updateStudent).toHaveBeenCalled();
  });

  it('updateEnrollment with ids', async () => {
    const service = {
      updateEnrollment: jest.fn().mockResolvedValue({}),
    } as unknown as StudentsService;
    const controller = new StudentsController(service);
    await controller.updateEnrollment('e1', {
      studentId: '507f1f77bcf86cd799439011',
      academicYearId: '507f1f77bcf86cd799439012',
    } as any);
    expect(service.updateEnrollment).toHaveBeenCalled();
  });
});
