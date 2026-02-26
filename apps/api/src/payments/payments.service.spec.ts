import { PaymentsService } from './payments.service';

const makeQuery = (result: any) => ({
  sort: () => ({
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

    const service = new PaymentsService(planModel, paymentModel);
    const res = await service.listPlans();
    expect(planModel.find).toHaveBeenCalled();
    expect(res).toEqual([{ label: 'Mensuel' }]);
  });

  it('createPlan calls model.create', async () => {
    const planModel = { create: jest.fn().mockResolvedValue({}) } as any;
    const paymentModel = { find: jest.fn(), create: jest.fn() } as any;

    const service = new PaymentsService(planModel, paymentModel);
    await service.createPlan({
      studentId: 's1',
      label: 'Mensuel',
      totalAmount: 1000,
      currency: 'XOF',
    });
    expect(planModel.create).toHaveBeenCalled();
  });

  it('listPayments returns items', async () => {
    const planModel = { find: jest.fn(), create: jest.fn() } as any;
    const paymentModel = {
      find: jest.fn().mockReturnValue(makeQuery([{ amount: 1000 }])),
      create: jest.fn(),
    } as any;

    const service = new PaymentsService(planModel, paymentModel);
    const res = await service.listPayments();
    expect(paymentModel.find).toHaveBeenCalled();
    expect(res).toEqual([{ amount: 1000 }]);
  });

  it('createPayment calls model.create', async () => {
    const planModel = { find: jest.fn(), create: jest.fn() } as any;
    const paymentModel = { create: jest.fn().mockResolvedValue({}) } as any;

    const service = new PaymentsService(planModel, paymentModel);
    await service.createPayment({
      studentId: 's1',
      planId: 'p1',
      amount: 1000,
      currency: 'XOF',
      paidAt: new Date(),
      reference: 'PAY-1',
    });
    expect(paymentModel.create).toHaveBeenCalled();
  });
});
