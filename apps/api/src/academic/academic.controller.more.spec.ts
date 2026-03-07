import { AcademicController } from './academic.controller';
import { AcademicService } from './academic.service';

describe('AcademicController extra', () => {
  it('creates academic year', async () => {
    const service = {
      createAcademicYear: jest.fn().mockResolvedValue({ id: '1' }),
    } as unknown as AcademicService;

    const controller = new AcademicController(service);
    await controller.createAcademicYear({
      name: '2025-2026',
      startDate: '2025-09-01',
      endDate: '2026-07-15',
      isActive: true,
    });
    expect(service.createAcademicYear).toHaveBeenCalled();
  });

  it('updates program', async () => {
    const service = {
      updateProgram: jest.fn().mockResolvedValue({ id: '1' }),
    } as unknown as AcademicService;

    const controller = new AcademicController(service);
    await controller.updateProgram('1', { name: 'INFO' });
    expect(service.updateProgram).toHaveBeenCalled();
  });

  it('deleteAcademicYear delegates', async () => {
    const service = {
      deleteAcademicYear: jest.fn().mockResolvedValue({}),
    } as unknown as AcademicService;
    const controller = new AcademicController(service);
    await controller.deleteAcademicYear('id');
    expect(service.deleteAcademicYear).toHaveBeenCalledWith('id');
  });

  it('createLevel and deleteGroup delegate', async () => {
    const service = {
      createLevel: jest.fn().mockResolvedValue({}),
      deleteGroup: jest.fn().mockResolvedValue({}),
    } as unknown as AcademicService;
    const controller = new AcademicController(service);
    await controller.createLevel({ name: 'L1' });
    await controller.deleteGroup('g1');
    expect(service.createLevel).toHaveBeenCalled();
    expect(service.deleteGroup).toHaveBeenCalledWith('g1');
  });

  it('updateLevel and deleteProgram delegate', async () => {
    const service = {
      updateLevel: jest.fn().mockResolvedValue({}),
      deleteProgram: jest.fn().mockResolvedValue({}),
    } as unknown as AcademicService;
    const controller = new AcademicController(service);
    await controller.updateLevel('l1', { name: 'L2' });
    await controller.deleteProgram('p1');
    expect(service.updateLevel).toHaveBeenCalled();
    expect(service.deleteProgram).toHaveBeenCalledWith('p1');
  });

  it('updateGroup with empty dto', async () => {
    const service = {
      updateGroup: jest.fn().mockResolvedValue({}),
    } as unknown as AcademicService;
    const controller = new AcademicController(service);
    await controller.updateGroup('g1', {});
    expect(service.updateGroup).toHaveBeenCalled();
  });

  it('updateAcademicYear with dates', async () => {
    const service = {
      updateAcademicYear: jest.fn().mockResolvedValue({}),
    } as unknown as AcademicService;
    const controller = new AcademicController(service);
    await controller.updateAcademicYear('id', {
      startDate: '2025-01-01',
      endDate: '2025-12-31',
    });
    expect(service.updateAcademicYear).toHaveBeenCalled();
  });

  it('updateAcademicYear with only startDate', async () => {
    const service = {
      updateAcademicYear: jest.fn().mockResolvedValue({}),
    } as unknown as AcademicService;
    const controller = new AcademicController(service);
    await controller.updateAcademicYear('id', { startDate: '2025-01-01' });
    expect(service.updateAcademicYear).toHaveBeenCalled();
  });

  it('updateAcademicYear with only endDate', async () => {
    const service = {
      updateAcademicYear: jest.fn().mockResolvedValue({}),
    } as unknown as AcademicService;
    const controller = new AcademicController(service);
    await controller.updateAcademicYear('id', { endDate: '2025-12-31' });
    expect(service.updateAcademicYear).toHaveBeenCalled();
  });

  it('updateGroup with offerId', async () => {
    const service = {
      updateGroup: jest.fn().mockResolvedValue({}),
    } as unknown as AcademicService;
    const controller = new AcademicController(service);
    await controller.updateGroup('g1', { offerId: '507f1f77bcf86cd799439011' } as any);
    expect(service.updateGroup).toHaveBeenCalled();
  });
});
