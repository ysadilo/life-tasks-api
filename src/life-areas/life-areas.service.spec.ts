import { LifeAreasService } from './life-areas.service';
import { PrismaService } from '../prisma/prisma.service';

function mockPrisma(fallback: { id: string } | null) {
  return {
    lifeArea: {
      findUnique: jest.fn().mockResolvedValue({ id: 'a1', boardId: 'b1' }),
      findFirst: jest.fn().mockResolvedValue(fallback),
      delete: jest.fn().mockResolvedValue({}),
    },
    task: { updateMany: jest.fn().mockResolvedValue({ count: 0 }) },
  } as unknown as PrismaService;
}

describe('LifeAreasService.remove', () => {
  it('reassigns tasks to the next-lowest-order area when one remains', async () => {
    const prisma = mockPrisma({ id: 'fallback' });
    await new LifeAreasService(prisma).remove('a1', 'b1');

    expect(prisma.task.updateMany).toHaveBeenCalledWith({
      where: { areaId: 'a1' },
      data: { areaId: 'fallback' },
    });
    expect(prisma.lifeArea.delete).toHaveBeenCalledWith({ where: { id: 'a1' } });
  });

  it('clears the area on tasks when it was the last one on the board', async () => {
    const prisma = mockPrisma(null);
    await new LifeAreasService(prisma).remove('a1', 'b1');

    expect(prisma.task.updateMany).toHaveBeenCalledWith({
      where: { areaId: 'a1' },
      data: { areaId: null },
    });
  });
});
