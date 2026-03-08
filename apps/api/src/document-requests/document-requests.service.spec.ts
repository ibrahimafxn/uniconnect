import { DocumentRequestsService } from './document-requests.service';
import { DocumentRequestStatus, DocumentRequestType } from './document-request.schema';

const makeQuery = (result: any) => ({
  sort: () => ({ exec: jest.fn().mockResolvedValue(result) }),
  exec: jest.fn().mockResolvedValue(result),
});

const makeLeanQuery = (result: any) => ({
  lean: () => ({ exec: jest.fn().mockResolvedValue(result) }),
});

describe('DocumentRequestsService', () => {
  const studentId = '507f1f77bcf86cd799439011';
  const requestId = '507f1f77bcf86cd799439012';
  const documentId = '507f1f77bcf86cd799439013';
  it('createRequest creates item', async () => {
    const requestModel = { create: jest.fn().mockResolvedValue({ _id: 'r1' }) } as any;
    const studentModel = { findOne: jest.fn().mockReturnValue(makeLeanQuery({ _id: studentId })) } as any;
    const service = new DocumentRequestsService(requestModel, studentModel, {} as any, { log: jest.fn() } as any);
    await service.createRequest('s@u.c', DocumentRequestType.EnrollmentCertificate, 'Urgent');
    expect(requestModel.create).toHaveBeenCalled();
  });

  it('listMyRequests returns list', async () => {
    const requestModel = { find: jest.fn().mockReturnValue(makeQuery([{ _id: 'r1' }])) } as any;
    const studentModel = { findOne: jest.fn().mockReturnValue(makeLeanQuery({ _id: studentId })) } as any;
    const service = new DocumentRequestsService(requestModel, studentModel, {} as any, { log: jest.fn() } as any);
    const res = await service.listMyRequests('s@u.c');
    expect(res).toHaveLength(1);
  });

  it('listRequests filters by status', async () => {
    const requestModel = { find: jest.fn().mockReturnValue(makeQuery([])) } as any;
    const service = new DocumentRequestsService(requestModel, {} as any, {} as any, { log: jest.fn() } as any);
    await service.listRequests(DocumentRequestStatus.Processing);
    expect(requestModel.find).toHaveBeenCalledWith({ status: DocumentRequestStatus.Processing });
  });

  it('updateRequest validates document and logs audit', async () => {
    const requestModel = {
      findById: jest.fn().mockReturnValue(makeLeanQuery({ _id: requestId, studentId })),
      findByIdAndUpdate: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue({ _id: requestId }) }),
    } as any;
    const studentDocModel = { findById: jest.fn().mockReturnValue(makeLeanQuery({ _id: documentId, studentId })) } as any;
    const auditLog = { log: jest.fn() } as any;
    const service = new DocumentRequestsService(requestModel, {} as any, studentDocModel, auditLog);

    await service.updateRequest(requestId, { status: DocumentRequestStatus.Available, documentId }, { userId: 'u1' } as any);
    expect(auditLog.log).toHaveBeenCalled();
  });
});
