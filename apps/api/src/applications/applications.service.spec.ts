import { ApplicationsService } from './applications.service';
import { ApplicationStatus } from './application.schema';

const makeLeanQuery = (result: any) => ({
  lean: () => ({ exec: jest.fn().mockResolvedValue(result) }),
});

const makeQuery = (result: any) => ({
  sort: () => ({ exec: jest.fn().mockResolvedValue(result) }),
  exec: jest.fn().mockResolvedValue(result),
});

describe('ApplicationsService', () => {
  it('createPublic creates draft or submitted', async () => {
    const applicationModel = { create: jest.fn().mockResolvedValue({}) } as any;
    const documentModel = {} as any;
    const auditLog = { log: jest.fn() } as any;
    const service = new ApplicationsService(applicationModel, documentModel, auditLog);

    await service.createPublic({
      firstName: 'A',
      lastName: 'B',
      gender: 'male',
      birthDate: '2000-01-01',
      email: 'a@b.c',
      programId: '507f1f77bcf86cd799439011',
      offerId: '507f1f77bcf86cd799439012',
      academicYearId: '507f1f77bcf86cd799439013',
      submit: true,
    });

    expect(applicationModel.create).toHaveBeenCalledWith(
      expect.objectContaining({ status: ApplicationStatus.Submitted }),
    );
  });

  it('updatePublic sets submitted status', async () => {
    const applicationModel = {
      findOne: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue({ _id: 'a1', status: ApplicationStatus.Draft }) }),
      findByIdAndUpdate: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue({ _id: 'a1', status: ApplicationStatus.Submitted }) }),
    } as any;
    const documentModel = {} as any;
    const auditLog = { log: jest.fn() } as any;
    const service = new ApplicationsService(applicationModel, documentModel, auditLog);

    const res = await service.updatePublic('CODE', 'a@b.c', { submit: true });
    expect(applicationModel.findByIdAndUpdate).toHaveBeenCalled();
    expect(res?.status).toBe(ApplicationStatus.Submitted);
  });

  it('getPublic normalizes email', async () => {
    const applicationModel = {
      findOne: jest.fn().mockReturnValue(makeLeanQuery({ _id: 'a1' })),
    } as any;
    const service = new ApplicationsService(applicationModel, {} as any, { log: jest.fn() } as any);
    await service.getPublic('CODE', 'A@B.C');
    expect(applicationModel.findOne).toHaveBeenCalledWith({ trackingCode: 'CODE', email: 'a@b.c' });
  });

  it('listAll uses status filter', async () => {
    const applicationModel = { find: jest.fn().mockReturnValue(makeQuery([])) } as any;
    const service = new ApplicationsService(applicationModel, {} as any, { log: jest.fn() } as any);
    await service.listAll(ApplicationStatus.Submitted);
    expect(applicationModel.find).toHaveBeenCalledWith({ status: ApplicationStatus.Submitted });
  });

  it('updateStatus logs audit', async () => {
    const applicationModel = {
      findByIdAndUpdate: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue({ _id: 'a1' }) }),
    } as any;
    const auditLog = { log: jest.fn() } as any;
    const service = new ApplicationsService(applicationModel, {} as any, auditLog);
    await service.updateStatus('a1', { status: ApplicationStatus.Accepted }, { userId: 'u1' } as any);
    expect(auditLog.log).toHaveBeenCalled();
  });

  it('documents CRUD helpers call model', async () => {
    const documentModel = {
      create: jest.fn().mockResolvedValue({}),
      find: jest.fn().mockReturnValue(makeQuery([])),
      findById: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue({ _id: 'd1' }) }),
    } as any;
    const service = new ApplicationsService({} as any, documentModel, { log: jest.fn() } as any);

    await service.createDocument({
      applicationId: '507f1f77bcf86cd799439011',
      originalName: 'doc.pdf',
      fileName: 'doc.pdf',
      path: '/tmp/doc.pdf',
      mimeType: 'application/pdf',
      size: 10,
    });
    await service.listDocuments('507f1f77bcf86cd799439011');
    await service.getDocument('d1');

    expect(documentModel.create).toHaveBeenCalled();
    expect(documentModel.find).toHaveBeenCalled();
    expect(documentModel.findById).toHaveBeenCalledWith('d1');
  });

  it('listByStudentEmail queries by email', async () => {
    const applicationModel = { find: jest.fn().mockReturnValue(makeQuery([])) } as any;
    const service = new ApplicationsService(applicationModel, {} as any, { log: jest.fn() } as any);
    await service.listByStudentEmail('Student@School.tld');
    expect(applicationModel.find).toHaveBeenCalledWith({ email: 'student@school.tld' });
  });
});
