import { TaskStatus } from '@prisma/client';

export class CreateTaskDto {
  boardId!: string;
  title!: string;
  description?: string;
  dueDate?: string;
}

export class UpdateTaskDto {
  title?: string;
  description?: string;
  dueDate?: string;
  status?: TaskStatus;
  todayDate?: string;
}
