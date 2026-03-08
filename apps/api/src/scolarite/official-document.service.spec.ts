import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { OfficialDocumentService } from './official-document.service';
import { OfficialDocument } from './schemas/official-document.schema';
import { DocumentRequest } from './schemas/document-request.schema';
import { SemesterResult } from './schemas/semester-result.schema';
import { StudentProfile } from '../students/student-profile.schema';
import { AuditLogService } from '../audit/audit-log.service';
import { EmailService } from '../common/email.service';

const IDS = {
  actor:    '507f1f77bcf86cd799439001',
  student:  '507f1f77bcf86cd799439002',
  semester: '507f1f77bcf86cd799439003',
  doc:      '507f1f77bcf86cd799439004',
  request:  '507f1f77bcf86cd799439005',
};

const actor = { userId: IDS.actor, role: 'scolarite', email: 'sc@test.ci' };
const student = { _id: IDS.student, firstName: 'Kone', lastName: 'A', email: 'kone@test.ci' };

const makeModel = (data: any = null) => ({
  find: jest.fn().mockReturnValue({
    sort: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    populate: jest.fn().mockReturnThis(),
    lean: jest.fn().mockReturnThis(),
    exec: jest.fn().mockResolvedValue([]),
  }),
  findById: jest.fn().mockReturnValue({
    exec: jest.fn().mockResolvedValue(data),
    lean: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue(data) }),
    populate: jest.fn().mockReturnThis(),
  }),
  findOne: jest.fn().mockReturnValue({
    exec: jest.fn().mockResolvedValue(data),
    lean: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue(data) }),
    populate: jest.fn().mockReturnThis(),
  }),
  findOneAndUpdate: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue(data) }),
  findByIdAndUpdate: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue(data) }),
  countDocuments: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue(0) }),
  create: jest.fn().mockResolvedValue(data),
});

describe('OfficialDocumentService', () => {
  let service: OfficialDocumentService;
  let documentModel: ReturnType<typeof makeModel>;
  let requestModel: ReturnType<typeof makeModel>;
  let resultModel: ReturnType<typeof makeModel>;
  let studentModel: ReturnType<typeof makeModel>;

  beforeEach(async () => {
    documentModel = makeModel({ _id: IDS.doc, type: 'transcript', reference: 'REL-2026-000001', qrCode: 'abc123', status: 'generated' });
    requestModel  = makeModel({ _id: IDS.request, status: 'pending', documentType: 'transcript', studentId: IDS.student, semesterId: IDS.semester });
    resultModel   = makeModel({ _id: '507f1f77bcf86cd799439006', isProvisional: false, semesterAverage: 12 });
    studentModel  = makeModel(student);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OfficialDocumentService,
        { provide: getModelToken(OfficialDocument.name), useValue: documentModel },
        { provide: getModelToken(DocumentRequest.name),  useValue: requestModel },
        { provide: getModelToken(SemesterResult.name),   useValue: resultModel },
        { provide: getModelToken(StudentProfile.name),   useValue: studentModel },
        { provide: AuditLogService, useValue: { log: jest.fn().mockResolvedValue(undefined) } },
        { provide: EmailService,    useValue: { sendMail: jest.fn().mockResolvedValue(true) } },
      ],
    }).compile();

    service = module.get<OfficialDocumentService>(OfficialDocumentService);
  });

  // ─── submitRequest ────────────────────────────────────────────────────────

  describe('submitRequest', () => {
    it('crée une demande de document', async () => {
      studentModel.findById.mockReturnValue({ lean: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue(student) }) });
      requestModel.create.mockResolvedValue({ _id: IDS.request, status: 'pending' });
      const result = await service.submitRequest(
        { studentId: IDS.student, documentType: 'enrollment_certificate' },
        actor,
      );
      expect(requestModel.create).toHaveBeenCalled();
    });

    it('lève NotFoundException si étudiant introuvable', async () => {
      studentModel.findById.mockReturnValue({ lean: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue(null) }) });
      await expect(
        service.submitRequest({ studentId: IDS.student, documentType: 'transcript' }, actor),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ─── processRequest ───────────────────────────────────────────────────────

  describe('processRequest', () => {
    it('refuse le traitement si déjà traité', async () => {
      requestModel.findById.mockReturnValue({ exec: jest.fn().mockResolvedValue({ ...requestModel, status: 'ready' }) });
      await expect(service.processRequest(IDS.request, actor)).rejects.toThrow(BadRequestException);
    });

    it('traite une demande de relevé de notes', async () => {
      requestModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue({ _id: IDS.request, status: 'pending', documentType: 'transcript', studentId: IDS.student, semesterId: IDS.semester }),
      });
      studentModel.findById.mockReturnValue({ lean: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue(student) }) });
      resultModel.findOne.mockReturnValue({ lean: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue({ isProvisional: false }) }) });
      documentModel.countDocuments.mockReturnValue({ exec: jest.fn().mockResolvedValue(0) });
      documentModel.create.mockResolvedValue({ _id: IDS.doc, reference: 'REL-2026-000001' });
      requestModel.findByIdAndUpdate.mockReturnValue({ exec: jest.fn().mockResolvedValue({ status: 'ready' }) });

      await service.processRequest(IDS.request, actor);
      expect(documentModel.create).toHaveBeenCalled();
    });
  });

  // ─── generateTranscript ───────────────────────────────────────────────────

  describe('generateTranscript', () => {
    it('génère un relevé de notes pour des résultats définitifs', async () => {
      studentModel.findById.mockReturnValue({ lean: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue(student) }) });
      resultModel.findOne.mockReturnValue({ lean: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue({ isProvisional: false, semesterAverage: 14 }) }) });
      documentModel.countDocuments.mockReturnValue({ exec: jest.fn().mockResolvedValue(5) });
      documentModel.create.mockResolvedValue({ _id: IDS.doc, reference: 'REL-2026-000006' });

      const result = await service.generateTranscript(IDS.student, IDS.semester, actor);
      expect(documentModel.create).toHaveBeenCalledWith(expect.objectContaining({ type: 'transcript' }));
    });

    it('refuse si les résultats sont encore provisoires', async () => {
      studentModel.findById.mockReturnValue({ lean: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue(student) }) });
      resultModel.findOne.mockReturnValue({ lean: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue(null) }) });

      await expect(
        service.generateTranscript(IDS.student, IDS.semester, actor),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ─── verifyDocument ───────────────────────────────────────────────────────

  describe('verifyDocument', () => {
    it('retourne valid=true pour un QR code connu', async () => {
      documentModel.findOne.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        lean: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue({ reference: 'REL-2026-000001', type: 'transcript', status: 'delivered' }),
      });
      const result = await service.verifyDocument('valid-qr-token');
      expect(result.valid).toBe(true);
    });

    it('retourne valid=false pour un QR code inconnu', async () => {
      documentModel.findOne.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        lean: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(null),
      });
      const result = await service.verifyDocument('fake-qr');
      expect(result.valid).toBe(false);
    });
  });

  // ─── generateReference ────────────────────────────────────────────────────

  describe('generateReference (logique interne)', () => {
    it('génère une référence séquentielle', async () => {
      documentModel.countDocuments.mockReturnValue({ exec: jest.fn().mockResolvedValue(42) });
      const ref = await (service as any).generateReference('REL');
      const year = new Date().getFullYear();
      expect(ref).toBe(`REL-${year}-000043`);
    });
  });

  // ─── getDocumentPrefix ────────────────────────────────────────────────────

  describe('getDocumentPrefix (logique interne)', () => {
    it('retourne les bons préfixes', () => {
      expect((service as any).getDocumentPrefix('transcript')).toBe('REL');
      expect((service as any).getDocumentPrefix('enrollment_certificate')).toBe('ATT');
      expect((service as any).getDocumentPrefix('diploma')).toBe('DIP');
    });
  });
});
