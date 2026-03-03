import { AuditLogService } from './audit-log.service';

describe('AuditLogService', () => {
  it('log creates entry', async () => {
    const auditModel = { create: jest.fn().mockResolvedValue({ _id: 'a1' }) } as any;
    const service = new AuditLogService(auditModel);
    const res = await service.log({
      action: 'test.action',
      entity: 'entity',
      entityId: 'e1',
      actor: { userId: 'u1', role: 'admin', email: 'a@b.c' },
      metadata: { ok: true },
    });
    expect(res._id).toBe('a1');
    expect(auditModel.create).toHaveBeenCalled();
  });
});
