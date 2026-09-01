import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, TaskStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateTaskDto } from './task.dto';

export interface FindTasksFilter {
  boardId: string;
  status?: TaskStatus;
  from?: Date;
  to?: Date;
  /** When true, return recurring series regardless of status; when a status is
   *  given without this flag, recurring series are excluded from that list. */
  recurring?: boolean;
}

function startOfUTCDay(date: Date): Date {
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

@Injectable()
export class TasksService {
  constructor(private readonly prisma: PrismaService) {}

  findMany(filter: FindTasksFilter) {
    const where: Prisma.TaskWhereInput = { boardId: filter.boardId };

    if (filter.recurring) {
      where.recurrence = { not: null };
      return this.prisma.task.findMany({ where, orderBy: { dueDate: 'asc' } });
    }

    // Calendar range: virtual occurrences are expanded client-side, so return the
    // recurring series whose active window overlaps the range, plus one-off tasks
    // matching by due / completion / mounted day.
    if (filter.from || filter.to) {
      const range = {
        ...(filter.from ? { gte: filter.from } : {}),
        ...(filter.to ? { lte: filter.to } : {}),
      };
      where.OR = [
        { recurrence: null, dueDate: range },
        { recurrence: null, completedAt: range },
        { recurrence: null, todayDate: range },
        {
          recurrence: { not: null },
          ...(filter.to ? { dueDate: { lte: filter.to } } : {}),
          ...(filter.from ? { OR: [{ recurrenceEndDate: null }, { recurrenceEndDate: { gte: filter.from } }] } : {}),
        },
      ];
      return this.prisma.task.findMany({ where, orderBy: { dueDate: 'asc' } });
    }

    // Board lists never show recurring series — their occurrences live on the calendar.
    where.recurrence = null;
    if (filter.status) where.status = filter.status;

    return this.prisma.task.findMany({ where, orderBy: { dueDate: 'asc' } });
  }

  async findOne(id: string, boardId?: string) {
    const task = await this.prisma.task.findUnique({ where: { id } });
    if (!task || (boardId && task.boardId !== boardId)) {
      throw new NotFoundException(`Task ${id} not found`);
    }
    return task;
  }

  create(boardId: string, data: Prisma.TaskCreateWithoutBoardInput) {
    if (data.recurrence && !data.dueDate) {
      throw new BadRequestException('A recurring task needs a start date (dueDate).');
    }
    if (data.recurrence) {
      // A recurring series is not a board item; keep it off Today / Done.
      data = { ...data, status: TaskStatus.backlog, todayDate: null };
    } else {
      const promo = this.dueTodayPromotion(data.dueDate, (data.status as TaskStatus) ?? TaskStatus.backlog);
      if (promo) data = { ...data, ...promo };
    }
    return this.prisma.task.create({
      data: { ...data, board: { connect: { id: boardId } } },
    });
  }

  /** A one-off task due today (or earlier) belongs on Today, not the backlog. */
  private dueTodayPromotion(
    dueDate: Prisma.TaskCreateWithoutBoardInput['dueDate'],
    status: TaskStatus
  ): { status: TaskStatus; todayDate: Date } | null {
    if (!dueDate || status !== TaskStatus.backlog) return null;
    const today = startOfUTCDay(new Date());
    if (startOfUTCDay(new Date(dueDate as string)) > today) return null;
    return { status: TaskStatus.today, todayDate: today };
  }

  async update(id: string, dto: UpdateTaskDto, boardId?: string) {
    const current = await this.findOne(id, boardId);

    if (dto.occurrenceDate !== undefined) {
      return this.toggleOccurrence(current.id, dto.occurrenceDate, dto.occurrenceDone ?? true);
    }

    const { occurrenceDone: _od, occurrenceDate: _oda, ...rest } = dto;
    let data: Prisma.TaskUpdateInput = { ...rest };

    const recurrence = 'recurrence' in data ? data.recurrence : current.recurrence;
    const dueDate = 'dueDate' in data ? data.dueDate : current.dueDate;
    if (recurrence && !dueDate) {
      throw new BadRequestException('A recurring task needs a start date (dueDate).');
    }
    if (recurrence) {
      data = { ...data, status: TaskStatus.backlog, todayDate: null };
    } else {
      const promo = this.dueTodayPromotion(
        ('dueDate' in data ? data.dueDate : current.dueDate) as Prisma.TaskCreateWithoutBoardInput['dueDate'],
        (data.status as TaskStatus) ?? current.status
      );
      if (promo) data = { ...data, ...promo };
    }

    if (typeof data.status === 'string' && data.status !== current.status) {
      data.completedAt = data.status === TaskStatus.done ? new Date() : null;
    }
    return this.prisma.task.update({ where: { id }, data });
  }

  private async toggleOccurrence(id: string, isoDate: string, done: boolean) {
    const day = startOfUTCDay(new Date(isoDate));
    const task = await this.prisma.task.findUnique({ where: { id } });
    const others = (task?.completedDates ?? []).filter((d) => startOfUTCDay(d).getTime() !== day.getTime());
    return this.prisma.task.update({
      where: { id },
      data: { completedDates: done ? [...others, day] : others },
    });
  }

  async remove(id: string, boardId?: string) {
    await this.findOne(id, boardId);
    await this.prisma.task.delete({ where: { id } });
  }
}
