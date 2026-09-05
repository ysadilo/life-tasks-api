import { Recurrence, TaskStatus } from '@prisma/client';
import { TasksService } from './tasks.service';
import { PrismaService } from '../prisma/prisma.service';

const prisma = {
  task: {
    findUnique: jest.fn(),
    update: jest.fn((args) => args.data),
    create: jest.fn((args) => args.data),
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

describe('TasksService recurring series', () => {
  it('keeps a recurring series off the boards (forced to backlog on create)', () => {
    service.create('b1', {
      title: 'Water plants',
      recurrence: Recurrence.daily,
      dueDate: '2026-09-01',
      status: TaskStatus.today,
    });
    const data = (prisma.task.create as jest.Mock).mock.calls[0][0].data;
    expect(data.status).toBe(TaskStatus.backlog);
    expect(data.todayDate).toBeNull();
  });

  it('ticks an occurrence day into completedDates', async () => {
    (prisma.task.findUnique as jest.Mock).mockResolvedValue({ id: '1', completedDates: [] });
    await service.update('1', { occurrenceDate: '2026-09-03', occurrenceDone: true });
    const data = (prisma.task.update as jest.Mock).mock.calls.at(-1)[0].data;
    expect(data.completedDates).toHaveLength(1);
    expect(data.completedDates[0].toISOString()).toBe('2026-09-03T00:00:00.000Z');
  });

  it('unticks an occurrence day', async () => {
    (prisma.task.findUnique as jest.Mock).mockResolvedValue({
      id: '1',
      completedDates: [new Date('2026-09-03T00:00:00.000Z'), new Date('2026-09-04T00:00:00.000Z')],
    });
    await service.update('1', { occurrenceDate: '2026-09-03', occurrenceDone: false });
    const data = (prisma.task.update as jest.Mock).mock.calls.at(-1)[0].data;
    expect(data.completedDates.map((d: Date) => d.toISOString())).toEqual(['2026-09-04T00:00:00.000Z']);
  });

  it('does not double-add an already-ticked day', async () => {
    (prisma.task.findUnique as jest.Mock).mockResolvedValue({
      id: '1',
      completedDates: [new Date('2026-09-03T00:00:00.000Z')],
    });
    await service.update('1', { occurrenceDate: '2026-09-03', occurrenceDone: true });
    const data = (prisma.task.update as jest.Mock).mock.calls.at(-1)[0].data;
    expect(data.completedDates).toHaveLength(1);
  });
});

describe('TasksService due-today promotion', () => {
  const todayISO = new Date().toISOString().slice(0, 10);

  it('promotes a one-off task due today to Today on create', () => {
    service.create('b1', { title: 'Call bank', dueDate: todayISO, status: TaskStatus.backlog });
    const data = (prisma.task.create as jest.Mock).mock.calls[0][0].data;
    expect(data.status).toBe(TaskStatus.today);
    expect(data.todayDate).toBeInstanceOf(Date);
  });

  it('leaves a future-dated task in the backlog', () => {
    service.create('b1', { title: 'Later', dueDate: '2099-01-01', status: TaskStatus.backlog });
    const data = (prisma.task.create as jest.Mock).mock.calls[0][0].data;
    expect(data.status).toBe(TaskStatus.backlog);
  });

  it('promotes on update when a backlog task is edited to a due date of today', async () => {
    (prisma.task.findUnique as jest.Mock).mockResolvedValue({ id: '1', status: TaskStatus.backlog, dueDate: null });
    const data = await service.update('1', { dueDate: todayISO });
    expect(data.status).toBe(TaskStatus.today);
  });
});

describe('TasksService recurrence needs a start date', () => {
  it('rejects creating a recurring task without a dueDate', () => {
    expect(() => service.create('b1', { title: 'x', recurrence: Recurrence.daily })).toThrow(/start date/);
  });

  it('rejects adding recurrence to a task that has no dueDate', async () => {
    (prisma.task.findUnique as jest.Mock).mockResolvedValue({ id: '1', status: TaskStatus.backlog, dueDate: null });
    await expect(service.update('1', { recurrence: Recurrence.weekly })).rejects.toThrow(/start date/);
  });

  it('allows recurrence when the task already has a dueDate', async () => {
    (prisma.task.findUnique as jest.Mock).mockResolvedValue({
      id: '1',
      status: TaskStatus.backlog,
      dueDate: new Date('2026-09-01'),
    });
    await expect(service.update('1', { recurrence: Recurrence.weekly })).resolves.toBeDefined();
  });
});

describe('TasksService areaId', () => {
  it('passes areaId through to prisma as a scalar, not a relation connect', () => {
    const data = service.create('b1', { title: 'x', areaId: 'area1' });
    expect(data).toMatchObject({ boardId: 'b1', areaId: 'area1' });
  });
});
