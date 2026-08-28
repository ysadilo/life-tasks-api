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

  async findOne(id: string, boardId?: string) {
    const task = await this.prisma.task.findUnique({ where: { id } });
    if (!task || (boardId && task.boardId !== boardId)) {
      throw new NotFoundException(`Task ${id} not found`);
    }
    return task;
  }

  create(boardId: string, data: Prisma.TaskCreateWithoutBoardInput) {
    return this.prisma.task.create({
      data: { ...data, board: { connect: { id: boardId } } },
    });
  }

  async update(id: string, data: Prisma.TaskUpdateInput, boardId?: string) {
    await this.findOne(id, boardId);
    return this.prisma.task.update({ where: { id }, data });
  }

  async remove(id: string, boardId?: string) {
    await this.findOne(id, boardId);
    await this.prisma.task.delete({ where: { id } });
  }
}
