import { Injectable } from '@nestjs/common';
import { TaskStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RolloverService {
  constructor(private readonly prisma: PrismaService) {}

  async runRollover(now = new Date()) {
    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);

    const result = await this.prisma.task.updateMany({
      where: {
        status: TaskStatus.today,
        todayDate: { lt: startOfToday },
      },
      data: { status: TaskStatus.needs_triage },
    });

    const promoted = await this.promoteDueTasks(now);

    return { movedToTriage: result.count, promotedToToday: promoted.count };
  }

  /**
   * A one-off backlog task with a due date surfaces on Today once that date
   * arrives (or has passed). Recurring series are left alone — their occurrences
   * are virtual and shown on the calendar / Today directly.
   */
  async promoteDueTasks(now = new Date()) {
    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);

    return this.prisma.task.updateMany({
      where: {
        status: TaskStatus.backlog,
        recurrence: null,
        dueDate: { lte: startOfToday },
      },
      data: { status: TaskStatus.today, todayDate: startOfToday },
    });
  }
}
