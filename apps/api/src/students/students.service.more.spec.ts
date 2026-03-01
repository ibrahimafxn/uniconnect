import { StudentsService } from './students.service';

const mockModel = () => ({
  create: jest.fn().mockResolvedValue({}),
  findByIdAndUpdate: jest
    .fn()
    .mockReturnValue({ exec: jest.fn().mockResolvedValue({}) }),
  findById: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue({}) }),
  findByIdAndDelete: jest
    .fn()
    .mockReturnValue({ exec: jest.fn().mockResolvedValue({}) }),
  find: jest.fn().mockReturnValue({
    select: () => ({
      lean: () => ({
        exec: jest.fn().mockResolvedValue([]),
      }),
    }),
  }),
});

describe('StudentsService extra', () => {
  it('createEnrollment calls model', async () => {
    const enrollmentModel = { ...mockModel() } as any;
    const service = new StudentsService({} as any, enrollmentModel, {} as any);
    await service.createEnrollment({ studentId: 's', academicYearId: 'y' });
    expect(enrollmentModel.create).toHaveBeenCalled();
  });

  it('createEnrollment respects provided status', async () => {
    const enrollmentModel = { ...mockModel() } as any;
    const service = new StudentsService({} as any, enrollmentModel, {} as any);
    await service.createEnrollment({
      studentId: 's',
      academicYearId: 'y',
      status: 'approved' as any,
    });
    expect(enrollmentModel.create).toHaveBeenCalledWith({
      studentId: 's',
      academicYearId: 'y',
      status: 'approved',
    });
  });

  it('createStudent and getStudent call model', async () => {
    const studentModel = { ...mockModel() } as any;
    const service = new StudentsService(studentModel, {} as any, {} as any);
    const year = new Date().getFullYear();
    await service.createStudent({
      firstName: 'John',
      lastName: 'Doe',
      studentNumber: `ML103DJ${year}`,
      gender: 'male' as any,
      birthDate: '2004-03-15',
      groupId: 'g1',
      academicYearId: 'y1',
    });
    await service.getStudent('id');
    expect(studentModel.create).toHaveBeenCalled();
    expect(studentModel.findById).toHaveBeenCalledWith('id');
  });

  it('updateStudent calls model', async () => {
    const studentModel = { ...mockModel() } as any;
    const service = new StudentsService(studentModel, {} as any, {} as any);
    await service.updateStudent('id', { firstName: 'John' } as any);
    expect(studentModel.findByIdAndUpdate).toHaveBeenCalled();
  });

  it('deleteStudent and deleteEnrollment call model', async () => {
    const studentModel = { ...mockModel() } as any;
    const enrollmentModel = { ...mockModel() } as any;
    const service = new StudentsService(studentModel, enrollmentModel, {} as any);
    await service.deleteStudent('id');
    await service.deleteEnrollment('id');
    expect(studentModel.findByIdAndDelete).toHaveBeenCalled();
    expect(enrollmentModel.findByIdAndDelete).toHaveBeenCalled();
  });

  it('updateEnrollment calls model', async () => {
    const enrollmentModel = { ...mockModel() } as any;
    const service = new StudentsService({} as any, enrollmentModel, {} as any);
    await service.updateEnrollment('id', { status: 'approved' } as any);
    expect(enrollmentModel.findByIdAndUpdate).toHaveBeenCalled();
  });

  it('createStudent increments matricule on duplicate', async () => {
    const create = jest
      .fn()
      .mockRejectedValueOnce({ code: 11000 })
      .mockResolvedValueOnce({});
    const studentModel = {
      ...mockModel(),
      create,
      find: jest.fn().mockReturnValue({
        select: () => ({
          lean: () => ({
            exec: jest.fn().mockResolvedValue([{ studentNumber: 'ML103DJ2026' }]),
          }),
        }),
      }),
    } as any;
    const service = new StudentsService(studentModel, {} as any, {} as any);
    await service.createStudent({
      firstName: 'John',
      lastName: 'Doe',
      studentNumber: 'ML103DJ2026',
      gender: 'male' as any,
      birthDate: '2004-03-15',
      groupId: 'g1',
      academicYearId: 'y1',
    });
    expect(create).toHaveBeenCalledTimes(2);
    expect(create.mock.calls[1][0].studentNumber).toBe('ML103DJ20261');
  });
});
