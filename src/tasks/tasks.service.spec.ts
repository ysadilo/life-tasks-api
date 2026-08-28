import { TaskStatus } from '@prisma/client';
import { TasksService } from './tasks.service';
import { PrismaService } from '../prisma/prisma.service';

const prisma = {
  task: {
    findUnique: jest.fn(),
    update: jest.fn((args) => args.data),
  },
} as unknown as PrismaService;

const service = new TasksService(prisma);

beforeEach(() => jest.clearAllMocks());

describe('TasksService.update completedAt', () => {
  it('stamps completedAt when a task moves to done', async () => {
    (prisma.task.findUnique as jest.Mock).mockResolvedValue({ id: '1', status: TaskStatus.today });
    const data = await service.update('1', { status: TaskStatus.done });
    expect(data.completedAt).toBeInstanceOf(Date);
  });

  it('clears completedAt when a done task moves elsewhere', async () => {
    (prisma.task.findUnique as jest.Mock).mockResolvedValue({ id: '1', status: TaskStatus.done });
    const data = await service.update('1', { status: TaskStatus.today });
    expect(data.completedAt).toBeNull();
  });

  it('leaves completedAt untouched when status does not change', async () => {
    (prisma.task.findUnique as jest.Mock).mockResolvedValue({ id: '1', status: TaskStatus.done });
    const data = await service.update('1', { title: 'renamed' });
    expect('completedAt' in data).toBe(false);
  });
});
