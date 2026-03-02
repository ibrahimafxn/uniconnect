import { StudentsService } from './students.service';

const mockModel = () => ({
  create: jest.fn().mockResolvedValue({}),
  findByIdAndUpdate: jest
    .fn()
    .mockReturnValue({ exec: jest.fn().mockResolvedValue({}) }),
  findById: jest.fn().mockReturnValue({
    exec: jest.fn().mockResolvedValue({}),
    lean: () => ({ exec: jest.fn().mockResolvedValue({}) }),
  }),
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

  it('updateStudent converts birthDate string', async () => {
    const studentModel = { ...mockModel() } as any;
    const service = new StudentsService(studentModel, {} as any, {} as any);
    await service.updateStudent('id', { birthDate: '2005-01-02' } as any);
    const payload = studentModel.findByIdAndUpdate.mock.calls[0][1];
    expect(payload.birthDate).toBeInstanceOf(Date);
  });

  it('updateStudent validates matricule consistency', async () => {
    const studentModel = {
      ...mockModel(),
      findById: jest.fn().mockReturnValue({
        lean: () =>
          ({
            exec: jest.fn().mockResolvedValue({
              studentNumber: 'ML103DJ2026',
              firstName: 'John',
              lastName: 'Doe',
              gender: 'male',
              birthDate: '2004-03-15',
            }),
          }) as any,
      }),
    } as any;
    const service = new StudentsService(studentModel, {} as any, {} as any);
    await service.updateStudent('id', { email: 'john@u.c' } as any);
    expect(studentModel.findByIdAndUpdate).toHaveBeenCalled();
  });

  it('updateStudent rejects inconsistent matricule', async () => {
    const studentModel = {
      ...mockModel(),
      findById: jest.fn().mockReturnValue({
        lean: () =>
          ({
            exec: jest.fn().mockResolvedValue({
              studentNumber: 'ML103DJ2026',
              firstName: 'John',
              lastName: 'Doe',
              gender: 'male',
              birthDate: '2004-03-15',
            }),
          }) as any,
      }),
    } as any;
    const service = new StudentsService(studentModel, {} as any, {} as any);
    await expect(
      service.updateStudent('id', { lastName: 'Smith' } as any),
    ).rejects.toThrow('Matricule invalide');
  });

  it('createStudent rejects invalid birthDate', async () => {
    const studentModel = { ...mockModel() } as any;
    const service = new StudentsService(studentModel, {} as any, {} as any);
    expect(() =>
      service.createStudent({
        firstName: 'John',
        lastName: 'Doe',
        studentNumber: 'ML103DJ2026',
        gender: 'male' as any,
        birthDate: 'invalid-date',
        groupId: 'g1',
        academicYearId: 'y1',
      }),
    ).toThrow('Date de naissance invalide');
  });

  it('createStudent rejects invalid matricule', async () => {
    const studentModel = { ...mockModel() } as any;
    const service = new StudentsService(studentModel, {} as any, {} as any);
    expect(() =>
      service.createStudent({
        firstName: 'John',
        lastName: 'Doe',
        studentNumber: 'BAD',
        gender: 'male' as any,
        birthDate: '2004-03-15',
        groupId: 'g1',
        academicYearId: 'y1',
      }),
    ).toThrow('Matricule invalide');
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

  it('createStudent accepts matricule suffix', async () => {
    const create = jest.fn().mockResolvedValue({});
    const studentModel = { ...mockModel(), create } as any;
    const service = new StudentsService(studentModel, {} as any, {} as any);
    await service.createStudent({
      firstName: 'John',
      lastName: 'Doe',
      studentNumber: 'ML103DJ20262',
      gender: 'male' as any,
      birthDate: '2004-03-15',
      groupId: 'g1',
      academicYearId: 'y1',
    });
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({ studentNumber: 'ML103DJ20262' }),
    );
  });

  it('listDocuments and document CRUD call model', async () => {
    const documentModel = {
      find: jest.fn().mockReturnValue({
        sort: () => ({
          skip: () => ({
            limit: () => ({
              exec: jest.fn().mockResolvedValue([{ id: 'd1' }]),
            }),
          }),
        }),
      }),
      countDocuments: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue(1) }),
      create: jest.fn().mockResolvedValue({ id: 'd1' }),
      findById: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue({}) }),
      findByIdAndDelete: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue({}) }),
      findByIdAndUpdate: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue({}) }),
    } as any;
    const service = new StudentsService({} as any, {} as any, documentModel);
    const res = await service.listDocuments('s1', { skip: 0, limit: 10 });
    await service.createDocument({
      studentId: 's1',
      label: 'Certificat',
      originalName: 'file.pdf',
      fileName: 'file.pdf',
      path: '/tmp/file.pdf',
      mimeType: 'application/pdf',
      size: 10,
    });
    await service.getDocument('d1');
    await service.updateDocument('d1', { label: 'OK' });
    await service.deleteDocument('d1');
    expect(res.total).toBe(1);
    expect(documentModel.create).toHaveBeenCalled();
    expect(documentModel.findById).toHaveBeenCalledWith('d1');
    expect(documentModel.findByIdAndUpdate).toHaveBeenCalledWith(
      'd1',
      { label: 'OK' },
      { new: true },
    );
    expect(documentModel.findByIdAndDelete).toHaveBeenCalledWith('d1');
  });

  it('resolveStudentNumberOrThrow rejects mismatched suffix', () => {
    const service = new StudentsService({} as any, {} as any, {} as any);
    expect(() =>
      (service as any).resolveStudentNumberOrThrow({
        normalized: 'ML103DJ2026X',
        baseNumber: 'ML103DJ2026',
      }),
    ).toThrow('Matricule invalide');
  });

  it('nextAvailableStudentNumber increments max suffix', async () => {
    const studentModel = {
      find: jest.fn().mockReturnValue({
        select: () => ({
          lean: () => ({
            exec: jest.fn().mockResolvedValue([
              { studentNumber: 'ML103DJ2026' },
              { studentNumber: 'ML103DJ20262' },
              { studentNumber: 'ML103DJ202610' },
            ]),
          }),
        }),
      }),
    } as any;
    const service = new StudentsService(studentModel, {} as any, {} as any);
    const next = await (service as any).nextAvailableStudentNumber('ML103DJ2026');
    expect(next).toBe('ML103DJ202611');
  });
});
