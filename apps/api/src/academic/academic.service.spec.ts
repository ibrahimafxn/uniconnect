import { AcademicService } from './academic.service';

function makeQuery(result: any) {
  return {
    sort: () => ({
      skip: () => ({
        limit: () => ({ exec: jest.fn().mockResolvedValue(result) }),
      }),
    }),
    exec: jest.fn().mockResolvedValue(result),
  } as any;
}

describe('AcademicService', () => {
  it('listPrograms returns items and total', async () => {
    const programModel = {
      find: jest.fn().mockReturnValue(makeQuery([{ name: 'INFO' }])),
      countDocuments: jest
        .fn()
        .mockReturnValue({ exec: jest.fn().mockResolvedValue(1) }),
    } as any;

    const service = new AcademicService(
      {} as any,
      programModel,
      {} as any,
      {} as any,
    );

    const res = await service.listPrograms({ skip: 0, limit: 10 });
    expect(res.total).toBe(1);
    expect(programModel.find).toHaveBeenCalled();
  });

  it('listAcademicYears returns items and total', async () => {
    const yearModel = {
      find: jest.fn().mockReturnValue(makeQuery([{ name: '2025-2026' }])),
      countDocuments: jest
        .fn()
        .mockReturnValue({ exec: jest.fn().mockResolvedValue(1) }),
    } as any;

    const service = new AcademicService(
      yearModel,
      {} as any,
      {} as any,
      {} as any,
    );

    const res = await service.listAcademicYears({ skip: 0, limit: 10 });
    expect(res.total).toBe(1);
    expect(yearModel.find).toHaveBeenCalled();
  });

  it('createAcademicYear calls create', async () => {
    const yearModel = { create: jest.fn().mockResolvedValue({}) } as any;
    const service = new AcademicService(
      yearModel,
      {} as any,
      {} as any,
      {} as any,
    );
    await service.createAcademicYear({
      name: '2025-2026',
      startDate: new Date(),
      endDate: new Date(),
      isActive: true,
    });
    expect(yearModel.create).toHaveBeenCalled();
  });

  it('listLevels and listGroups return items', async () => {
    const levelModel = {
      find: jest.fn().mockReturnValue(makeQuery([{ name: 'L1' }])),
      countDocuments: jest
        .fn()
        .mockReturnValue({ exec: jest.fn().mockResolvedValue(1) }),
    } as any;
    const groupModel = {
      find: jest.fn().mockReturnValue(makeQuery([{ name: 'G1' }])),
      countDocuments: jest
        .fn()
        .mockReturnValue({ exec: jest.fn().mockResolvedValue(1) }),
    } as any;

    const service = new AcademicService(
      {} as any,
      {} as any,
      levelModel,
      groupModel,
    );

    const levels = await service.listLevels({ skip: 0, limit: 10 });
    const groups = await service.listGroups({ skip: 0, limit: 10 });
    expect(levels.total).toBe(1);
    expect(groups.total).toBe(1);
  });

  it('create/update/delete level and group', async () => {
    const levelModel = {
      create: jest.fn().mockResolvedValue({}),
      findByIdAndUpdate: jest
        .fn()
        .mockReturnValue({ exec: jest.fn().mockResolvedValue({}) }),
      findByIdAndDelete: jest
        .fn()
        .mockReturnValue({ exec: jest.fn().mockResolvedValue({}) }),
    } as any;
    const groupModel = {
      create: jest.fn().mockResolvedValue({}),
      findByIdAndUpdate: jest
        .fn()
        .mockReturnValue({ exec: jest.fn().mockResolvedValue({}) }),
      findByIdAndDelete: jest
        .fn()
        .mockReturnValue({ exec: jest.fn().mockResolvedValue({}) }),
    } as any;

    const service = new AcademicService(
      {} as any,
      {} as any,
      levelModel,
      groupModel,
    );

    await service.createLevel({ name: 'L1', programId: 'p1' });
    await service.updateLevel('id', { name: 'L2' } as any);
    await service.deleteLevel('id');

    await service.createGroup({ name: 'G1', levelId: 'l1' });
    await service.updateGroup('id', { name: 'G2' } as any);
    await service.deleteGroup('id');

    expect(levelModel.create).toHaveBeenCalled();
    expect(groupModel.create).toHaveBeenCalled();
  });
});
