import { MessagesService } from './messages.service';

const makeQuery = (result: any) => ({
  sort: () => ({ exec: jest.fn().mockResolvedValue(result) }),
  skip: () => ({ limit: () => ({ exec: jest.fn().mockResolvedValue(result) }) }),
  limit: () => ({ exec: jest.fn().mockResolvedValue(result) }),
  exec: jest.fn().mockResolvedValue(result),
  lean: () => ({ exec: jest.fn().mockResolvedValue(result) }),
});

describe('MessagesService', () => {
  const oid1 = '507f1f77bcf86cd799439011';
  const oid2 = '507f1f77bcf86cd799439012';
  const oid3 = '507f1f77bcf86cd799439013';
  const actor = { userId: oid1, role: 'admin' } as any;

  it('listConversations returns items', async () => {
    const conversationModel = {
      find: jest.fn().mockReturnValue({ sort: () => ({ exec: jest.fn().mockResolvedValue([{ _id: oid1 }]) }) }),
    } as any;
    const service = new MessagesService(
      conversationModel,
      {} as any,
      {} as any,
      {} as any,
      { log: jest.fn() } as any,
    );
    const res = await service.listConversations(oid1);
    expect(res).toHaveLength(1);
  });

  it('createDirectConversation rejects same user', async () => {
    const service = new MessagesService(
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      { log: jest.fn() } as any,
    );
    await expect(service.createDirectConversation(oid1, actor)).rejects.toThrow('Participant invalide');
  });

  it('createDirectConversation returns existing', async () => {
    const conversationModel = {
      findOne: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue({ _id: 'c1' }) }),
    } as any;
    const userModel = {
      findById: jest.fn().mockReturnValue({ lean: () => ({ exec: jest.fn().mockResolvedValue({ _id: oid1 }) }) }),
    } as any;
    const service = new MessagesService(
      conversationModel,
      {} as any,
      {} as any,
      userModel,
      { log: jest.fn() } as any,
    );
    const res = await service.createDirectConversation(oid2, actor);
    expect(res._id).toBe('c1');
  });

  it('createDirectConversation creates and logs', async () => {
    const conversationModel = {
      findOne: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue(null) }),
      create: jest.fn().mockResolvedValue({ _id: 'c2' }),
    } as any;
    const userModel = {
      findById: jest
        .fn()
        .mockReturnValueOnce({ lean: () => ({ exec: jest.fn().mockResolvedValue({ _id: oid1 }) }) })
        .mockReturnValueOnce({ lean: () => ({ exec: jest.fn().mockResolvedValue({ _id: oid2 }) }) }),
    } as any;
    const auditLog = { log: jest.fn().mockResolvedValue({}) } as any;
    const service = new MessagesService(
      conversationModel,
      {} as any,
      {} as any,
      userModel,
      auditLog,
    );
    const res = await service.createDirectConversation(oid2, actor);
    expect(res._id).toBe('c2');
    expect(auditLog.log).toHaveBeenCalled();
  });

  it('createDirectConversation rejects missing user', async () => {
    const conversationModel = {
      findOne: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue(null) }),
    } as any;
    const userModel = {
      findById: jest
        .fn()
        .mockReturnValueOnce({ lean: () => ({ exec: jest.fn().mockResolvedValue(null) }) })
        .mockReturnValueOnce({ lean: () => ({ exec: jest.fn().mockResolvedValue({ _id: oid2 }) }) }),
    } as any;
    const service = new MessagesService(
      conversationModel,
      {} as any,
      {} as any,
      userModel,
      { log: jest.fn() } as any,
    );
    await expect(service.createDirectConversation(oid2, actor)).rejects.toThrow('Utilisateur introuvable');
  });

  it('createGroupConversation rejects too small', async () => {
    const service = new MessagesService(
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      { log: jest.fn() } as any,
    );
    await expect(service.createGroupConversation('G1', [oid2], actor)).rejects.toThrow('au moins 3');
  });

  it('createGroupConversation rejects invalid users', async () => {
    const userModel = {
      countDocuments: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue(1) }),
    } as any;
    const service = new MessagesService(
      {} as any,
      {} as any,
      {} as any,
      userModel,
      { log: jest.fn() } as any,
    );
    await expect(service.createGroupConversation('G1', [oid2, oid3], actor)).rejects.toThrow('invalides');
  });

  it('createGroupConversation creates and logs', async () => {
    const conversationModel = {
      create: jest.fn().mockResolvedValue({ _id: 'cg1', title: 'G1' }),
    } as any;
    const userModel = {
      countDocuments: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue(3) }),
    } as any;
    const auditLog = { log: jest.fn().mockResolvedValue({}) } as any;
    const service = new MessagesService(
      conversationModel,
      {} as any,
      {} as any,
      userModel,
      auditLog,
    );
    const res = await service.createGroupConversation('G1', [oid2, oid3], actor);
    expect(res._id).toBe('cg1');
    expect(auditLog.log).toHaveBeenCalled();
  });

  it('listMessages returns items and total', async () => {
    const conversationModel = {
      findOne: jest.fn().mockReturnValue({ lean: () => ({ exec: jest.fn().mockResolvedValue({ _id: 'c1' }) }) }),
    } as any;
    const messageModel = {
      find: jest.fn().mockReturnValue({
        sort: () => ({
          skip: () => ({
            limit: () => ({ exec: jest.fn().mockResolvedValue([{ _id: 'm1' }]) }),
          }),
        }),
      }),
      countDocuments: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue(1) }),
    } as any;
    const service = new MessagesService(
      conversationModel,
      messageModel,
      {} as any,
      {} as any,
      { log: jest.fn() } as any,
    );
    const res = await service.listMessages(oid1, oid1, { skip: 0, limit: 20 });
    expect(res.total).toBe(1);
    expect(res.items).toHaveLength(1);
  });

  it('listMessages rejects when not participant', async () => {
    const conversationModel = {
      findOne: jest.fn().mockReturnValue({ lean: () => ({ exec: jest.fn().mockResolvedValue(null) }) }),
    } as any;
    const service = new MessagesService(
      conversationModel,
      {} as any,
      {} as any,
      {} as any,
      { log: jest.fn() } as any,
    );
    await expect(service.listMessages(oid1, oid2, { skip: 0, limit: 20 })).rejects.toThrow('Accès refusé');
  });

  it('createMessage rejects empty payload', async () => {
    const conversationModel = {
      findOne: jest.fn().mockReturnValue({ lean: () => ({ exec: jest.fn().mockResolvedValue({ _id: 'c1' }) }) }),
    } as any;
    const service = new MessagesService(
      conversationModel,
      {} as any,
      {} as any,
      {} as any,
      { log: jest.fn() } as any,
    );
    await expect(service.createMessage(oid1, {}, actor)).rejects.toThrow('Message vide');
  });

  it('createMessage creates and updates conversation', async () => {
    const conversationModel = {
      findOne: jest.fn().mockReturnValue({ lean: () => ({ exec: jest.fn().mockResolvedValue({ _id: 'c1' }) }) }),
      findByIdAndUpdate: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue({}) }),
    } as any;
    const messageModel = {
      create: jest.fn().mockResolvedValue({ _id: 'm1', createdAt: new Date() }),
    } as any;
    const auditLog = { log: jest.fn().mockResolvedValue({}) } as any;
    const service = new MessagesService(
      conversationModel,
      messageModel,
      {} as any,
      {} as any,
      auditLog,
    );
    const res = await service.createMessage(oid1, { body: 'Hello' }, actor);
    expect(res._id).toBe('m1');
    expect(conversationModel.findByIdAndUpdate).toHaveBeenCalled();
    expect(auditLog.log).toHaveBeenCalled();
  });

  it('createMessage rejects invalid attachments', async () => {
    const conversationModel = {
      findOne: jest.fn().mockReturnValue({ lean: () => ({ exec: jest.fn().mockResolvedValue({ _id: 'c1' }) }) }),
    } as any;
    const attachmentModel = {
      find: jest.fn().mockReturnValue({ lean: () => ({ exec: jest.fn().mockResolvedValue([]) }) }),
    } as any;
    const service = new MessagesService(
      conversationModel,
      {} as any,
      attachmentModel,
      {} as any,
      { log: jest.fn() } as any,
    );
    await expect(
      service.createMessage(oid1, { body: 'Hello', attachmentIds: [oid2] }, actor),
    ).rejects.toThrow('Pièces jointes invalides');
  });

  it('createMessage accepts attachments', async () => {
    const conversationModel = {
      findOne: jest.fn().mockReturnValue({ lean: () => ({ exec: jest.fn().mockResolvedValue({ _id: 'c1' }) }) }),
      findByIdAndUpdate: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue({}) }),
    } as any;
    const attachmentModel = {
      find: jest.fn().mockReturnValue({ lean: () => ({ exec: jest.fn().mockResolvedValue([{ _id: oid2 }]) }) }),
    } as any;
    const messageModel = {
      create: jest.fn().mockResolvedValue({ _id: 'm2', createdAt: new Date() }),
    } as any;
    const service = new MessagesService(
      conversationModel,
      messageModel,
      attachmentModel,
      {} as any,
      { log: jest.fn().mockResolvedValue({}) } as any,
    );
    const res = await service.createMessage(oid1, { attachmentIds: [oid2] }, actor);
    expect(res._id).toBe('m2');
  });

  it('createAttachment stores and logs', async () => {
    const conversationModel = {
      findOne: jest.fn().mockReturnValue({ lean: () => ({ exec: jest.fn().mockResolvedValue({ _id: 'c1' }) }) }),
    } as any;
    const attachmentModel = {
      create: jest.fn().mockResolvedValue({ _id: 'a1' }),
    } as any;
    const auditLog = { log: jest.fn().mockResolvedValue({}) } as any;
    const service = new MessagesService(
      conversationModel,
      {} as any,
      attachmentModel,
      {} as any,
      auditLog,
    );
    const res = await service.createAttachment(oid1, {
      originalname: 'f.pdf',
      filename: 'f.pdf',
      path: '/tmp/f.pdf',
      mimetype: 'application/pdf',
      size: 10,
    }, actor);
    expect(res._id).toBe('a1');
    expect(auditLog.log).toHaveBeenCalled();
  });

  it('getAttachment validates access', async () => {
    const conversationModel = {
      findOne: jest.fn().mockReturnValue({ lean: () => ({ exec: jest.fn().mockResolvedValue({ _id: 'c1' }) }) }),
    } as any;
    const attachmentModel = {
      findById: jest.fn().mockReturnValue({ lean: () => ({ exec: jest.fn().mockResolvedValue({ _id: oid1, conversationId: oid1 }) }) }),
    } as any;
    const service = new MessagesService(
      conversationModel,
      {} as any,
      attachmentModel,
      {} as any,
      { log: jest.fn() } as any,
    );
    const res = await service.getAttachment(oid1, actor);
    expect(res._id).toBe(oid1);
  });

  it('getAttachment rejects missing', async () => {
    const attachmentModel = {
      findById: jest.fn().mockReturnValue({ lean: () => ({ exec: jest.fn().mockResolvedValue(null) }) }),
    } as any;
    const service = new MessagesService(
      {} as any,
      {} as any,
      attachmentModel,
      {} as any,
      { log: jest.fn() } as any,
    );
    await expect(service.getAttachment(oid1, actor)).rejects.toThrow('introuvable');
  });
});
