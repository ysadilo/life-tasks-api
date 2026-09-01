import { TaskStatus } from '@prisma/client';
import { RolloverService } from './rollover.service';
import { PrismaService } from '../prisma/prisma.service';

const prisma = {
  task: { updateMany: jest.fn().mockResolvedValue({ count: 0 }) },
} as unknown as PrismaService;

const service = new RolloverService(prisma);

beforeEach(() => jest.clearAllMocks());

describe('RolloverService.promoteDueTasks', () => {
  it('promotes backlog tasks whose due date has arrived', async () => {
    await service.promoteDueTasks(new Date('2026-09-01T09:00:00Z'));

    expect(prisma.task.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          status: TaskStatus.backlog,
          dueDate: { lte: expect.any(Date) },
        }),
        data: expect.objectContaining({ status: TaskStatus.today }),
      })
    );
    const where = (prisma.task.updateMany as jest.Mock).mock.calls[0][0].where;
    expect(where.recurrence).toBeNull();
  });
});
