import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { GlobalConfigService } from './global-config.service';
import { SystemConfig } from './system-config.schema';
import { AuditLogService } from '../audit/audit-log.service';

const makeId = () => new Types.ObjectId().toHexString();
const actor = { userId: makeId(), role: 'superadmin', email: 'super@test.com' };

const defaultConfig = {
  _id: new Types.ObjectId(),
  key: 'default',
  smtp: null,
  emailTemplates: [],
  systemParams: {
    maxStudentsPerGroup: 40,
    paymentGraceDays: 7,
    supportEmail: 'support@uniconnect.local',
    maintenanceMode: false,
    maxUploadSizeMb: 20,
  },
  markModified: jest.fn(),
  save: jest.fn().mockResolvedValue(undefined),
};

describe('GlobalConfigService', () => {
  let service: GlobalConfigService;
  let configModel: any;
  let auditLogService: { log: jest.Mock };

  beforeEach(async () => {
    configModel = {
      findOne: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue(defaultConfig) }),
      create: jest.fn().mockResolvedValue(defaultConfig),
    };
    auditLogService = { log: jest.fn().mockResolvedValue(undefined) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GlobalConfigService,
        { provide: getModelToken(SystemConfig.name), useValue: configModel },
        { provide: AuditLogService, useValue: auditLogService },
      ],
    }).compile();

    service = module.get(GlobalConfigService);
  });

  describe('getSmtpConfig', () => {
    it('should return smtp config (null when not set)', async () => {
      const result = await service.getSmtpConfig();
      expect(result).toBeNull();
    });
  });

  describe('updateSmtpConfig', () => {
    it('should save smtp config and audit log', async () => {
      const smtp = { host: 'smtp.example.com', port: 587, user: 'user@example.com', from: 'no-reply@example.com' };
      const result = await service.updateSmtpConfig(smtp, actor);
      expect(defaultConfig.save).toHaveBeenCalled();
      expect(auditLogService.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'UPDATE_SMTP_CONFIG' }),
      );
      expect(result).toEqual(smtp);
    });
  });

  describe('listEmailTemplates', () => {
    it('should return email templates array', async () => {
      const result = await service.listEmailTemplates();
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('upsertEmailTemplate', () => {
    it('should add a new template when key does not exist', async () => {
      const freshConfig = {
        ...defaultConfig,
        emailTemplates: [],
        markModified: jest.fn(),
        save: jest.fn().mockResolvedValue(undefined),
      };
      configModel.findOne = jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue(freshConfig) });

      await service.upsertEmailTemplate(
        'welcome',
        { subject: 'Bienvenue', body: 'Bonjour {{name}}' },
        actor,
      );

      expect(freshConfig.emailTemplates).toHaveLength(1);
      expect(freshConfig.emailTemplates[0].key).toBe('welcome');
      expect(auditLogService.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'UPSERT_EMAIL_TEMPLATE' }),
      );
    });

    it('should update an existing template when key exists', async () => {
      const freshConfig = {
        ...defaultConfig,
        emailTemplates: [{ key: 'welcome', subject: 'Old', body: 'Old body' }],
        markModified: jest.fn(),
        save: jest.fn().mockResolvedValue(undefined),
      };
      configModel.findOne = jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue(freshConfig) });

      await service.upsertEmailTemplate(
        'welcome',
        { subject: 'Bienvenue', body: 'Nouveau corps' },
        actor,
      );

      expect(freshConfig.emailTemplates).toHaveLength(1);
      expect(freshConfig.emailTemplates[0].subject).toBe('Bienvenue');
    });
  });

  describe('deleteEmailTemplate', () => {
    it('should remove template by key', async () => {
      const freshConfig = {
        ...defaultConfig,
        emailTemplates: [
          { key: 'welcome', subject: 'Bienvenue', body: 'Corps' },
          { key: 'reminder', subject: 'Rappel', body: 'Corps rappel' },
        ],
        markModified: jest.fn(),
        save: jest.fn().mockResolvedValue(undefined),
      };
      configModel.findOne = jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue(freshConfig) });

      const result = await service.deleteEmailTemplate('welcome', actor);

      expect(result.success).toBe(true);
      expect(freshConfig.emailTemplates).toHaveLength(1);
      expect(freshConfig.emailTemplates[0].key).toBe('reminder');
    });
  });

  describe('getSystemParams', () => {
    it('should return system params', async () => {
      const result = await service.getSystemParams();
      expect(result.maxStudentsPerGroup).toBe(40);
      expect(result.maintenanceMode).toBe(false);
    });
  });

  describe('updateSystemParams', () => {
    it('should merge partial params and audit log', async () => {
      const freshConfig = {
        ...defaultConfig,
        systemParams: { ...defaultConfig.systemParams },
        markModified: jest.fn(),
        save: jest.fn().mockResolvedValue(undefined),
      };
      configModel.findOne = jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue(freshConfig) });

      const result = await service.updateSystemParams(
        { maintenanceMode: true, paymentGraceDays: 14 },
        actor,
      );

      expect(result.maintenanceMode).toBe(true);
      expect(result.paymentGraceDays).toBe(14);
      expect(result.maxStudentsPerGroup).toBe(40);
      expect(auditLogService.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'UPDATE_SYSTEM_PARAMS' }),
      );
    });
  });

  describe('getOrCreate — no existing config', () => {
    it('should create config when none exists', async () => {
      configModel.findOne = jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue(null) });
      configModel.create = jest.fn().mockResolvedValue(defaultConfig);

      await service.getSmtpConfig();

      expect(configModel.create).toHaveBeenCalledWith({ key: 'default' });
    });
  });
});
