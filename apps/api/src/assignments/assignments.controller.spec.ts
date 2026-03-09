import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { AssignmentsController } from './assignments.controller';
import { AssignmentsService } from './assignments.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/roles.guard';
import { Role } from '../common/roles.enum';

const mockService = {
  listAssignments: jest.fn(),
  createAssignment: jest.fn(),
  getAssignment: jest.fn(),
  submitAssignment: jest.fn(),
  listSubmissions: jest.fn(),
  getMySubmission: jest.fn(),
  updateSubmission: jest.fn(),
  getSubmissionById: jest.fn(),
};

const teacherReq = {
  user: { userId: 'uid1', role: Role.Teacher, email: 'teacher@test.com' },
  ip: '127.0.0.1',
  headers: { 'user-agent': 'jest' },
};

const studentReq = {
  user: { email: 'student@test.com', role: Role.Student },
};

const mockFile = {
  originalname: 'devoir.pdf',
  filename: 'devoir_123.pdf',
  path: '/uploads/assignments/devoir_123.pdf',
  mimetype: 'application/pdf',
  size: 256000,
};

describe('AssignmentsController', () => {
  let controller: AssignmentsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AssignmentsController],
      providers: [{ provide: AssignmentsService, useValue: mockService }],
    })
      .overrideGuard(JwtAuthGuard).useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard).useValue({ canActivate: () => true })
      .compile();

    controller = module.get(AssignmentsController);
    jest.clearAllMocks();
  });

  describe('list', () => {
    it('should call service.listAssignments with filters and user', () => {
      mockService.listAssignments.mockResolvedValue([]);
      controller.list(teacherReq as any, 'group1', 'subj1');
      expect(mockService.listAssignments).toHaveBeenCalledWith(
        expect.objectContaining({
          groupId: 'group1',
          subjectId: 'subj1',
          user: expect.objectContaining({ userId: 'uid1', role: Role.Teacher }),
        }),
      );
    });
  });

  describe('create', () => {
    it('should call service.createAssignment with dto, optional file and actor', () => {
      const dto = { title: 'TP1', groupId: 'group1', dueDate: '2026-03-20' } as any;
      mockService.createAssignment.mockResolvedValue({});
      controller.create(dto, mockFile as any, teacherReq as any);
      expect(mockService.createAssignment).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'TP1',
          createdBy: 'uid1',
          originalName: 'devoir.pdf',
          mimeType: 'application/pdf',
        }),
        expect.objectContaining({ userId: 'uid1', role: Role.Teacher }),
      );
    });

    it('should create assignment without file attachment', () => {
      const dto = { title: 'TP2', groupId: 'group1', dueDate: '2026-03-25' } as any;
      mockService.createAssignment.mockResolvedValue({});
      controller.create(dto, undefined, teacherReq as any);
      expect(mockService.createAssignment).toHaveBeenCalledWith(
        expect.objectContaining({ originalName: undefined, fileName: undefined }),
        expect.any(Object),
      );
    });
  });

  describe('submit', () => {
    it('should call service.submitAssignment with assignment id, email and file metadata', () => {
      mockService.submitAssignment.mockResolvedValue({});
      controller.submit('assign1', mockFile as any, 'Voici mon rendu', studentReq as any);
      expect(mockService.submitAssignment).toHaveBeenCalledWith(
        'assign1',
        'student@test.com',
        expect.objectContaining({ comment: 'Voici mon rendu', originalName: 'devoir.pdf' }),
      );
    });

    it('should throw BadRequestException when file is missing', () => {
      expect(() =>
        controller.submit('assign1', undefined as any, undefined, studentReq as any),
      ).toThrow(BadRequestException);
    });
  });

  describe('listSubmissions', () => {
    it('should call service.listSubmissions with assignment id', () => {
      mockService.listSubmissions.mockResolvedValue([]);
      controller.listSubmissions('assign1');
      expect(mockService.listSubmissions).toHaveBeenCalledWith('assign1');
    });
  });

  describe('mySubmission', () => {
    it('should call service.getMySubmission with assignment id and email', () => {
      mockService.getMySubmission.mockResolvedValue(null);
      controller.mySubmission('assign1', studentReq as any);
      expect(mockService.getMySubmission).toHaveBeenCalledWith('assign1', 'student@test.com');
    });
  });

  describe('updateSubmission', () => {
    it('should call service.updateSubmission with submissionId, dto and actor', () => {
      const dto = { score: 15, feedback: 'Bien', status: 'graded' } as any;
      mockService.updateSubmission.mockResolvedValue({});
      controller.updateSubmission('sub1', dto, teacherReq as any);
      expect(mockService.updateSubmission).toHaveBeenCalledWith(
        'sub1',
        dto,
        expect.objectContaining({ userId: 'uid1', role: Role.Teacher }),
      );
    });
  });
});
