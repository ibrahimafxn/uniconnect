import { StudentsController } from './students.controller';
import { StudentsService } from './students.service';

describe('StudentsController extra', () => {
  it('creates student', async () => {
    const service = {
      createStudent: jest.fn().mockResolvedValue({ id: '1' }),
    } as unknown as StudentsService;

    const controller = new StudentsController(service);
    await controller.createStudent({
      firstName: 'John',
      lastName: 'Doe',
      studentNumber: 'S1',
      groupId: '507f1f77bcf86cd799439011',
      academicYearId: '507f1f77bcf86cd799439012',
    });
    expect(service.createStudent).toHaveBeenCalled();
  });

  it('creates enrollment', async () => {
    const service = {
      createEnrollment: jest.fn().mockResolvedValue({ id: '1' }),
    } as unknown as StudentsService;

    const controller = new StudentsController(service);
    await controller.createEnrollment({
      studentId: '507f1f77bcf86cd799439011',
      academicYearId: '507f1f77bcf86cd799439012',
      status: 'pending',
    } as any);
    expect(service.createEnrollment).toHaveBeenCalled();
  });

  it('listEnrollments delegates', async () => {
    const service = {
      listEnrollments: jest.fn().mockResolvedValue({ items: [], total: 0 }),
    } as unknown as StudentsService;
    const controller = new StudentsController(service);
    await controller.listEnrollments('1', '10');
    expect(service.listEnrollments).toHaveBeenCalledWith({
      page: 1,
      limit: 10,
      skip: 0,
    });
  });

  it('deleteStudent delegates', async () => {
    const service = {
      deleteStudent: jest.fn().mockResolvedValue({}),
    } as unknown as StudentsService;
    const controller = new StudentsController(service);
    await controller.deleteStudent('id');
    expect(service.deleteStudent).toHaveBeenCalledWith('id');
  });
});
