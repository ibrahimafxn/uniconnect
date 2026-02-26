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
});

describe('StudentsService extra', () => {
  it('createEnrollment calls model', async () => {
    const enrollmentModel = { ...mockModel() } as any;
    const service = new StudentsService({} as any, enrollmentModel);
    await service.createEnrollment({ studentId: 's', academicYearId: 'y' });
    expect(enrollmentModel.create).toHaveBeenCalled();
  });

  it('createEnrollment respects provided status', async () => {
    const enrollmentModel = { ...mockModel() } as any;
    const service = new StudentsService({} as any, enrollmentModel);
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
    const service = new StudentsService(studentModel, {} as any);
    await service.createStudent({
      firstName: 'John',
      lastName: 'Doe',
      studentNumber: 'S1',
      groupId: 'g1',
      academicYearId: 'y1',
    });
    await service.getStudent('id');
    expect(studentModel.create).toHaveBeenCalled();
    expect(studentModel.findById).toHaveBeenCalledWith('id');
  });

  it('updateStudent calls model', async () => {
    const studentModel = { ...mockModel() } as any;
    const service = new StudentsService(studentModel, {} as any);
    await service.updateStudent('id', { firstName: 'John' } as any);
    expect(studentModel.findByIdAndUpdate).toHaveBeenCalled();
  });

  it('deleteStudent and deleteEnrollment call model', async () => {
    const studentModel = { ...mockModel() } as any;
    const enrollmentModel = { ...mockModel() } as any;
    const service = new StudentsService(studentModel, enrollmentModel);
    await service.deleteStudent('id');
    await service.deleteEnrollment('id');
    expect(studentModel.findByIdAndDelete).toHaveBeenCalled();
    expect(enrollmentModel.findByIdAndDelete).toHaveBeenCalled();
  });

  it('updateEnrollment calls model', async () => {
    const enrollmentModel = { ...mockModel() } as any;
    const service = new StudentsService({} as any, enrollmentModel);
    await service.updateEnrollment('id', { status: 'approved' } as any);
    expect(enrollmentModel.findByIdAndUpdate).toHaveBeenCalled();
  });
});
