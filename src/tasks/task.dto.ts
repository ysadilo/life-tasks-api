import { Energy, LifeArea, Priority, Recurrence, TaskStatus } from '@prisma/client';

export class CreateTaskDto {
  title!: string;
  description?: string;
  dueDate?: string;
  area?: LifeArea;
  priority?: Priority;
  energy?: Energy;
  estimatedMinutes?: number;
  recurrence?: Recurrence;
  recurrenceEndDate?: string;
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
  recurrence?: Recurrence | null;
  recurrenceEndDate?: string | null;

  // Tick / untick one occurrence day of a recurring task (mutually exclusive with
  // the fields above — this is not a normal edit).
  occurrenceDate?: string;
  occurrenceDone?: boolean;
}
