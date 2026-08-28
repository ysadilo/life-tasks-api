import { Energy, LifeArea, Priority, TaskStatus } from '@prisma/client';

export class CreateTaskDto {
  title!: string;
  description?: string;
  dueDate?: string;
  area?: LifeArea;
  priority?: Priority;
  energy?: Energy;
  estimatedMinutes?: number;
}

export class UpdateTaskDto {
  title?: string;
  description?: string;
  dueDate?: string;
  status?: TaskStatus;
  todayDate?: string;
  area?: LifeArea;
  priority?: Priority;
  energy?: Energy;
  estimatedMinutes?: number;
}
