import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, TaskStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export interface FindTasksFilter {
  boardId: string;
  status?: TaskStatus;
  from?: Date;
  to?: Date;
}

@Injectable()
export class TasksService {
  constructor(private readonly prisma: PrismaService) {}

  findMany(filter: FindTasksFilter) {
    const where: Prisma.TaskWhereInput = { boardId: filter.boardId };

    if (filter.status) where.status = filter.status;
    if (filter.from || filter.to) {
      where.dueDate = {
        ...(filter.from ? { gte: filter.from } : {}),
        ...(filter.to ? { lte: filter.to } : {}),
      };
    }

    return this.prisma.task.findMany({ where, orderBy: { dueDate: 'asc' } });
  }

  async findOne(id: string) {
    const task = await this.prisma.task.findUnique({ where: { id } });
    if (!task) throw new NotFoundException(`Task ${id} not found`);
    return task;
  }

  create(boardId: string, data: Prisma.TaskCreateWithoutBoardInput) {
    return this.prisma.task.create({
      data: { ...data, board: { connect: { id: boardId } } },
    });
  }

  async update(id: string, data: Prisma.TaskUpdateInput) {
    await this.findOne(id);
    return this.prisma.task.update({ where: { id }, data });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.task.delete({ where: { id } });
  }
}
