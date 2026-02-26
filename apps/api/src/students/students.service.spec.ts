import { StudentsService } from './students.service';

function makeQuery(result: any) {
  return {
    sort: () => ({
      skip: () => ({
        limit: () => ({ exec: jest.fn().mockResolvedValue(result) }),
      }),
    }),
    exec: jest.fn().mockResolvedValue(result),
  } as any;
}

describe('StudentsService', () => {
  it('listStudents uses search filter', async () => {
    const studentModel = {
      find: jest.fn().mockReturnValue(makeQuery([])),
      countDocuments: jest
        .fn()
        .mockReturnValue({ exec: jest.fn().mockResolvedValue(0) }),
    } as any;

    const service = new StudentsService(studentModel, {} as any);
    await service.listStudents({ skip: 0, limit: 10, q: 'john' });

    expect(studentModel.find).toHaveBeenCalledWith({
      $or: [
        { firstName: { $regex: 'john', $options: 'i' } },
        { lastName: { $regex: 'john', $options: 'i' } },
        { studentNumber: { $regex: 'john', $options: 'i' } },
      ],
    });
  });

  it('listStudents without search', async () => {
    const studentModel = {
      find: jest.fn().mockReturnValue(makeQuery([])),
      countDocuments: jest
        .fn()
        .mockReturnValue({ exec: jest.fn().mockResolvedValue(0) }),
    } as any;

    const service = new StudentsService(studentModel, {} as any);
    await service.listStudents({ skip: 0, limit: 10 });
    expect(studentModel.find).toHaveBeenCalledWith({});
  });

  it('listEnrollments returns items', async () => {
    const enrollmentModel = {
      find: jest.fn().mockReturnValue(makeQuery([])),
      countDocuments: jest
        .fn()
        .mockReturnValue({ exec: jest.fn().mockResolvedValue(0) }),
    } as any;
    const service = new StudentsService({} as any, enrollmentModel);
    const res = await service.listEnrollments({ skip: 0, limit: 10 });
    expect(res.total).toBe(0);
  });
});
