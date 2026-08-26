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

    return { movedToTriage: result.count };
  }
}
