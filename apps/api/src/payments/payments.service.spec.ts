import { PaymentsService } from './payments.service';

const makeQuery = (result: any) => ({
  sort: () => ({
    exec: jest.fn().mockResolvedValue(result),
  }),
});

const makeLeanQuery = (result: any) => ({
  lean: () => ({
    exec: jest.fn().mockResolvedValue(result),
  }),
});

describe('PaymentsService', () => {
  it('listPlans returns items', async () => {
    const planModel = {
      find: jest.fn().mockReturnValue(makeQuery([{ label: 'Mensuel' }])),
      create: jest.fn(),
    } as any;
    const paymentModel = { find: jest.fn(), create: jest.fn() } as any;
    const studentModel = {} as any;
    const emailService = { sendMail: jest.fn() } as any;

    const service = new PaymentsService(
      planModel,
      paymentModel,
      studentModel,
      emailService,
    );
    const res = await service.listPlans();
    expect(planModel.find).toHaveBeenCalled();
    expect(res).toEqual([{ label: 'Mensuel' }]);
  });

  it('createPlan calls model.create', async () => {
    const planModel = { create: jest.fn().mockResolvedValue({}) } as any;
    const paymentModel = { find: jest.fn(), create: jest.fn() } as any;
    const studentModel = {} as any;
    const emailService = { sendMail: jest.fn() } as any;

    const service = new PaymentsService(
      planModel,
      paymentModel,
      studentModel,
      emailService,
    );
    await service.createPlan({
      studentId: 's1',
      label: 'Mensuel',
      totalAmount: 1000,
      currency: 'XOF',
    });
    expect(planModel.create).toHaveBeenCalled();
  });

  it('createPlan maps installments', async () => {
    const planModel = { create: jest.fn().mockResolvedValue({}) } as any;
    const paymentModel = { find: jest.fn(), create: jest.fn() } as any;
    const studentModel = {} as any;
    const emailService = { sendMail: jest.fn() } as any;

    const service = new PaymentsService(
      planModel,
      paymentModel,
      studentModel,
      emailService,
    );
    await service.createPlan({
      studentId: 's1',
      label: 'Mensuel',
      totalAmount: 1000,
      currency: 'XOF',
      installments: [{ amount: 500, dueDate: '2026-05-01', label: 'E1' }],
    });

    expect(planModel.create).toHaveBeenCalledWith(
      expect.objectContaining({
        installments: [
          expect.objectContaining({
            amount: 500,
            label: 'E1',
            dueDate: expect.any(Date),
          }),
        ],
      }),
    );
  });

  it('listPayments returns items', async () => {
    const planModel = { find: jest.fn(), create: jest.fn() } as any;
    const paymentModel = {
      find: jest.fn().mockReturnValue(makeQuery([{ amount: 1000 }])),
      create: jest.fn(),
    } as any;
    const studentModel = {} as any;
    const emailService = { sendMail: jest.fn() } as any;

    const service = new PaymentsService(
      planModel,
      paymentModel,
      studentModel,
      emailService,
    );
    const res = await service.listPayments();
    expect(paymentModel.find).toHaveBeenCalled();
    expect(res).toEqual([{ amount: 1000 }]);
  });

  it('createPayment calls model.create', async () => {
    const planId = '507f1f77bcf86cd799439011';
    const installmentId = '507f1f77bcf86cd799439012';
    const planModel = {
      find: jest.fn(),
      create: jest.fn(),
      findById: jest.fn().mockReturnValue(
        makeLeanQuery({
          _id: planId,
          installments: [{ _id: installmentId, amount: 1000 }],
        }),
      ),
    } as any;
    const paymentModel = {
      create: jest.fn().mockResolvedValue({}),
      aggregate: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue([{ _id: null, totalPaid: 0 }]),
      }),
    } as any;
    const studentModel = {
      findById: jest.fn().mockReturnValue(
        makeLeanQuery({ id: 's1', email: undefined }),
      ),
    } as any;
    const emailService = { sendMail: jest.fn() } as any;

    const service = new PaymentsService(
      planModel,
      paymentModel,
      studentModel,
      emailService,
    );
    await service.createPayment({
      studentId: 's1',
      planId,
      installmentId,
      amount: 1000,
      currency: 'XOF',
      paidAt: new Date(),
      reference: 'PAY-1',
    });
    expect(paymentModel.create).toHaveBeenCalled();
  });

  it('updatePlan and deletePlan call model', async () => {
    const planModel = {
      findByIdAndUpdate: jest.fn().mockReturnValue({ exec: jest.fn() }),
      findByIdAndDelete: jest.fn().mockReturnValue({ exec: jest.fn() }),
    } as any;
    const paymentModel = {} as any;
    const studentModel = {} as any;
    const emailService = { sendMail: jest.fn() } as any;

    const service = new PaymentsService(
      planModel,
      paymentModel,
      studentModel,
      emailService,
    );
    await service.updatePlan('p1', { label: 'Mensuel' });
    await service.deletePlan('p1');
    expect(planModel.findByIdAndUpdate).toHaveBeenCalledWith(
      'p1',
      { label: 'Mensuel' },
      { returnDocument: 'after' },
    );
    expect(planModel.findByIdAndDelete).toHaveBeenCalledWith('p1');
  });

  it('updatePayment and deletePayment call model', async () => {
    const planModel = {} as any;
    const paymentModel = {
      findByIdAndUpdate: jest.fn().mockReturnValue({ exec: jest.fn() }),
      findByIdAndDelete: jest.fn().mockReturnValue({ exec: jest.fn() }),
    } as any;
    const studentModel = {} as any;
    const emailService = { sendMail: jest.fn() } as any;

    const service = new PaymentsService(
      planModel,
      paymentModel,
      studentModel,
      emailService,
    );
    await service.updatePayment('pay1', { amount: 500 } as any);
    await service.deletePayment('pay1');
    expect(paymentModel.findByIdAndUpdate).toHaveBeenCalledWith(
      'pay1',
      { amount: 500 },
      { returnDocument: 'after' },
    );
    expect(paymentModel.findByIdAndDelete).toHaveBeenCalledWith('pay1');
  });

  it('listUnpaid returns balances for due installments', async () => {
    const planModel = {
      find: jest.fn().mockReturnValue(
        makeLeanQuery([
          {
            _id: 'p1',
            studentId: 's1',
            label: 'Plan A',
            totalAmount: 1000,
            currency: 'XOF',
            installments: [
              { _id: 'i1', amount: 200, dueDate: new Date('2026-02-01') },
              { _id: 'i2', amount: 300, dueDate: new Date('2026-02-15') },
              { _id: 'i3', amount: 500, dueDate: new Date('2026-04-01') },
            ],
          },
        ]),
      ),
    } as any;
    const paymentModel = {
      find: jest.fn().mockReturnValue(
        makeLeanQuery([
          { planId: 'p1', installmentId: 'i1', amount: 100 },
          { planId: 'p1', installmentId: 'i2', amount: 200 },
        ]),
      ),
    } as any;
    const studentModel = {
      find: jest.fn().mockReturnValue(
        makeLeanQuery([
          { _id: 's1', firstName: 'Awa', lastName: 'Traore', studentNumber: 'S001' },
        ]),
      ),
    } as any;
    const emailService = { sendMail: jest.fn() } as any;

    const service = new PaymentsService(
      planModel,
      paymentModel,
      studentModel,
      emailService,
    );
    const res = await service.listUnpaid(new Date('2026-03-01'));
    expect(res).toHaveLength(1);
    expect(res[0]).toMatchObject({
      planId: 'p1',
      studentId: 's1',
      dueAmount: 500,
      totalPaid: 300,
      balanceDue: 200,
      currency: 'XOF',
    });
  });

  it('listUnpaid returns empty when no plans', async () => {
    const planModel = {
      find: jest.fn().mockReturnValue(makeLeanQuery([])),
    } as any;
    const paymentModel = { find: jest.fn() } as any;
    const studentModel = { find: jest.fn() } as any;
    const emailService = { sendMail: jest.fn() } as any;

    const service = new PaymentsService(
      planModel,
      paymentModel,
      studentModel,
      emailService,
    );
    const res = await service.listUnpaid(new Date('2026-03-01'));
    expect(res).toEqual([]);
  });

  it('listUnpaid uses totalAmount when no installments', async () => {
    const planModel = {
      find: jest.fn().mockReturnValue(
        makeLeanQuery([
          {
            _id: 'p1',
            studentId: 's1',
            label: 'Plan B',
            totalAmount: 1000,
            currency: 'XOF',
            installments: [],
          },
        ]),
      ),
    } as any;
    const paymentModel = {
      find: jest.fn().mockReturnValue(
        makeLeanQuery([{ planId: 'p1', amount: 200 }]),
      ),
    } as any;
    const studentModel = {
      find: jest.fn().mockReturnValue(
        makeLeanQuery([
          { _id: 's1', firstName: 'Moussa', lastName: 'Diop', studentNumber: 'S002' },
        ]),
      ),
    } as any;
    const emailService = { sendMail: jest.fn() } as any;

    const service = new PaymentsService(
      planModel,
      paymentModel,
      studentModel,
      emailService,
    );
    const res = await service.listUnpaid(new Date('2026-03-01'));
    expect(res[0].dueAmount).toBe(1000);
    expect(res[0].balanceDue).toBe(800);
  });

  it('listUnpaid sorts by balanceDue', async () => {
    const planModel = {
      find: jest.fn().mockReturnValue(
        makeLeanQuery([
          {
            _id: 'p1',
            studentId: 's1',
            totalAmount: 1000,
            currency: 'XOF',
            installments: [],
          },
          {
            _id: 'p2',
            studentId: 's2',
            totalAmount: 1500,
            currency: 'XOF',
            installments: [],
          },
        ]),
      ),
    } as any;
    const paymentModel = {
      find: jest.fn().mockReturnValue(
        makeLeanQuery([
          { planId: 'p1', amount: 400 },
          { planId: 'p2', amount: 200 },
        ]),
      ),
    } as any;
    const studentModel = {
      find: jest.fn().mockReturnValue(
        makeLeanQuery([
          { _id: 's1', firstName: 'Awa', lastName: 'Traore', studentNumber: 'S001' },
          { _id: 's2', firstName: 'Moussa', lastName: 'Diop', studentNumber: 'S002' },
        ]),
      ),
    } as any;
    const emailService = { sendMail: jest.fn() } as any;

    const service = new PaymentsService(
      planModel,
      paymentModel,
      studentModel,
      emailService,
    );
    const res = await service.listUnpaid(new Date('2026-03-01'));
    expect(res[0].planId).toBe('p2');
    expect(res[1].planId).toBe('p1');
  });

  it('listUnpaid filters fully paid plans', async () => {
    const planModel = {
      find: jest.fn().mockReturnValue(
        makeLeanQuery([
          {
            _id: 'p1',
            studentId: 's1',
            label: 'Plan C',
            totalAmount: 1000,
            currency: 'XOF',
            installments: [],
          },
        ]),
      ),
    } as any;
    const paymentModel = {
      find: jest.fn().mockReturnValue(
        makeLeanQuery([{ planId: 'p1', amount: 1000 }]),
      ),
    } as any;
    const studentModel = {
      find: jest.fn().mockReturnValue(makeLeanQuery([])),
    } as any;
    const emailService = { sendMail: jest.fn() } as any;

    const service = new PaymentsService(
      planModel,
      paymentModel,
      studentModel,
      emailService,
    );
    const res = await service.listUnpaid(new Date('2026-03-01'));
    expect(res).toEqual([]);
  });

  it('buildReceipt returns payment, student, and plan', async () => {
    const planModel = {
      findById: jest.fn().mockReturnValue(
        makeLeanQuery({ _id: 'p1', label: 'Plan A', totalAmount: 1000, currency: 'XOF' }),
      ),
    } as any;
    const paymentModel = {
      findById: jest.fn().mockReturnValue(
        makeLeanQuery({
          _id: 'pay1',
          studentId: 's1',
          planId: 'p1',
          amount: 500,
          currency: 'XOF',
          paidAt: new Date(),
        }),
      ),
    } as any;
    const studentModel = {
      findById: jest.fn().mockReturnValue(
        makeLeanQuery({ _id: 's1', firstName: 'Awa', lastName: 'Traore' }),
      ),
    } as any;
    const emailService = { sendMail: jest.fn() } as any;

    const service = new PaymentsService(
      planModel,
      paymentModel,
      studentModel,
      emailService,
    );
    const res = await service.buildReceipt('pay1');
    expect(res.payment._id).toBe('pay1');
    expect(res.student?._id).toBe('s1');
    expect(res.plan?._id).toBe('p1');
  });

  it('buildReceipt returns null plan when planId missing', async () => {
    const planModel = { findById: jest.fn() } as any;
    const paymentModel = {
      findById: jest.fn().mockReturnValue(
        makeLeanQuery({
          _id: 'pay1',
          studentId: 's1',
          amount: 500,
          currency: 'XOF',
          paidAt: new Date(),
        }),
      ),
    } as any;
    const studentModel = {
      findById: jest.fn().mockReturnValue(
        makeLeanQuery({ _id: 's1', firstName: 'Awa', lastName: 'Traore' }),
      ),
    } as any;
    const emailService = { sendMail: jest.fn() } as any;

    const service = new PaymentsService(
      planModel,
      paymentModel,
      studentModel,
      emailService,
    );
    const res = await service.buildReceipt('pay1');
    expect(res.plan).toBeNull();
  });

  it('buildReceipt throws when payment not found', async () => {
    const planModel = { findById: jest.fn() } as any;
    const paymentModel = {
      findById: jest.fn().mockReturnValue(makeLeanQuery(null)),
    } as any;
    const studentModel = { findById: jest.fn() } as any;
    const emailService = { sendMail: jest.fn() } as any;

    const service = new PaymentsService(
      planModel,
      paymentModel,
      studentModel,
      emailService,
    );

    await expect(service.buildReceipt('missing')).rejects.toThrow(
      'Payment not found',
    );
  });

  it('createPayment triggers email when student has email', async () => {
    const planModel = { find: jest.fn(), create: jest.fn() } as any;
    const paymentModel = {
      create: jest.fn().mockResolvedValue({ id: 'pay1' }),
    } as any;
    const studentModel = {
      findById: jest.fn().mockReturnValue(
        makeLeanQuery({ id: 's1', email: 'student@school.tld' }),
      ),
    } as any;
    const emailService = { sendMail: jest.fn().mockResolvedValue(true) } as any;

    const service = new PaymentsService(
      planModel,
      paymentModel,
      studentModel,
      emailService,
    );
    await service.createPayment({
      studentId: 's1',
      amount: 1000,
      currency: 'XOF',
      paidAt: new Date(),
    });

    await new Promise((resolve) => setImmediate(resolve));
    expect(emailService.sendMail).toHaveBeenCalled();
  });

  it('createPayment ignores email errors', async () => {
    const planModel = { find: jest.fn(), create: jest.fn() } as any;
    const paymentModel = {
      create: jest.fn().mockResolvedValue({ id: 'pay1' }),
    } as any;
    const studentModel = {
      findById: jest.fn().mockReturnValue(
        makeLeanQuery({ id: 's1', email: 'student@school.tld' }),
      ),
    } as any;
    const emailService = { sendMail: jest.fn().mockRejectedValue(new Error('fail')) } as any;

    const service = new PaymentsService(
      planModel,
      paymentModel,
      studentModel,
      emailService,
    );
    await service.createPayment({
      studentId: 's1',
      amount: 1000,
      currency: 'XOF',
      paidAt: new Date(),
    });

    await new Promise((resolve) => setImmediate(resolve));
    expect(emailService.sendMail).toHaveBeenCalled();
  });

  it('listMyPayments returns empty when student missing', async () => {
    const planModel = {} as any;
    const paymentModel = { find: jest.fn() } as any;
    const studentModel = { findOne: jest.fn().mockReturnValue(makeLeanQuery(null)) } as any;
    const emailService = { sendMail: jest.fn() } as any;
    const service = new PaymentsService(planModel, paymentModel, studentModel, emailService);
    const res = await service.listMyPayments('missing@u.c');
    expect(res).toEqual([]);
  });

  it('getMyPlan returns plan and stats', async () => {
    const planModel = {
      findOne: jest.fn().mockReturnValue(
        makeLeanQuery({
          _id: 'p1',
          studentId: 's1',
          label: 'Mensuel',
          totalAmount: 1000,
          currency: 'XOF',
          installments: [{ _id: 'i1', amount: 500 }],
        }),
      ),
    } as any;
    const paymentModel = {
      find: jest.fn().mockReturnValue(makeLeanQuery([{ planId: 'p1', installmentId: 'i1', amount: 200 }])),
    } as any;
    const studentModel = {
      findOne: jest.fn().mockReturnValue(makeLeanQuery({ _id: 's1', firstName: 'A', lastName: 'B', studentNumber: 'S1' })),
    } as any;
    const emailService = { sendMail: jest.fn() } as any;
    const service = new PaymentsService(planModel, paymentModel, studentModel, emailService);
    const res = await service.getMyPlan('s@u.c');
    expect(res?.plan?._id).toBe('p1');
    expect(res?.installmentStats['i1'].paid).toBe(200);
  });
});
