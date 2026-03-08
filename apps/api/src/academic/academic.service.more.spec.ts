import { AcademicService } from './academic.service';

const mockModel = () => ({
  create: jest.fn().mockResolvedValue({}),
  findByIdAndUpdate: jest
    .fn()
    .mockReturnValue({ exec: jest.fn().mockResolvedValue({}) }),
  findByIdAndDelete: jest
    .fn()
    .mockReturnValue({ exec: jest.fn().mockResolvedValue({}) }),
});

describe('AcademicService extra', () => {
  it('createProgram calls model', async () => {
    const programModel = { ...mockModel() } as any;
    const service = new AcademicService(
      {} as any,
      programModel,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
    );
    await service.createProgram({ name: 'INFO' });
    expect(programModel.create).toHaveBeenCalled();
  });

  it('updateGroup calls model', async () => {
    const groupModel = { ...mockModel() } as any;
    const service = new AcademicService(
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      groupModel,
    );
    await service.updateGroup('id', { name: 'G1' } as any);
    expect(groupModel.findByIdAndUpdate).toHaveBeenCalled();
  });

  it('update/delete academic year and program', async () => {
    const yearModel = { ...mockModel() } as any;
    const programModel = { ...mockModel() } as any;
    const service = new AcademicService(
      yearModel,
      programModel,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
    );

    await service.updateAcademicYear('id', { name: '2025-2026' } as any);
    await service.deleteAcademicYear('id');
    await service.updateProgram('id', { name: 'INFO' } as any);
    await service.deleteProgram('id');

    expect(yearModel.findByIdAndUpdate).toHaveBeenCalled();
    expect(programModel.findByIdAndDelete).toHaveBeenCalled();
  });
});
