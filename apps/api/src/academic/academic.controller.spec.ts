import { AcademicController } from './academic.controller';
import { AcademicService } from './academic.service';

describe('AcademicController', () => {
  it('listPrograms passes pagination', async () => {
    const service = {
      listPrograms: jest.fn().mockResolvedValue({ items: [], total: 0 }),
    } as unknown as AcademicService;
    const controller = new AcademicController(service);

    await controller.listPrograms('2', '10');
    expect(service.listPrograms).toHaveBeenCalledWith({
      page: 2,
      limit: 10,
      skip: 10,
    });
  });

  it('createProgram delegates', async () => {
    const service = {
      createProgram: jest.fn().mockResolvedValue({}),
    } as unknown as AcademicService;
    const controller = new AcademicController(service);
    await controller.createProgram({ name: 'INFO', code: 'I' });
    expect(service.createProgram).toHaveBeenCalled();
  });

  it('listAcademicYears passes pagination', async () => {
    const service = {
      listAcademicYears: jest.fn().mockResolvedValue({ items: [], total: 0 }),
    } as unknown as AcademicService;
    const controller = new AcademicController(service);
    await controller.listAcademicYears('1', '5');
    expect(service.listAcademicYears).toHaveBeenCalledWith({
      page: 1,
      limit: 5,
      skip: 0,
    });
  });

  it('updateAcademicYear handles empty dates', async () => {
    const service = {
      updateAcademicYear: jest.fn().mockResolvedValue({}),
    } as unknown as AcademicService;
    const controller = new AcademicController(service);
    await controller.updateAcademicYear('id', {});
    expect(service.updateAcademicYear).toHaveBeenCalled();
  });

  it('listLevels and listGroups pass pagination', async () => {
    const service = {
      listLevels: jest.fn().mockResolvedValue({ items: [], total: 0 }),
      listGroups: jest.fn().mockResolvedValue({ items: [], total: 0 }),
    } as unknown as AcademicService;
    const controller = new AcademicController(service);
    await controller.listLevels('1', '5');
    await controller.listGroups('1', '5');
    expect(service.listLevels).toHaveBeenCalledWith({
      page: 1,
      limit: 5,
      skip: 0,
    });
    expect(service.listGroups).toHaveBeenCalledWith({
      page: 1,
      limit: 5,
      skip: 0,
    });
  });

  it('createGroup and deleteLevel delegate', async () => {
    const service = {
      createGroup: jest.fn().mockResolvedValue({}),
      deleteLevel: jest.fn().mockResolvedValue({}),
    } as unknown as AcademicService;
    const controller = new AcademicController(service);
    await controller.createGroup({ name: 'G1', levelId: 'l1' });
    await controller.deleteLevel('l1');
    expect(service.createGroup).toHaveBeenCalled();
    expect(service.deleteLevel).toHaveBeenCalledWith('l1');
  });
});
